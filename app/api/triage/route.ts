import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runTriage, type PatientData } from "@/lib/triage";
import { rankHospitals, type Hospital } from "@/lib/hospital-matching";

/**
 * POST /api/triage
 *
 * Accepts { patient_id } in the request body.
 * 1. Fetches the patient record from Supabase (service role for server-side access)
 * 2. Calls OpenAI GPT-4o for AI triage
 * 3. Runs hospital matching algorithm
 * 4. Updates the patient record with triage results + assigned hospital
 * 5. Returns triage result + top 3 hospitals
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id } = body;

    if (!patient_id) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    /* ── Create a Supabase admin client (service role key bypasses RLS) ── */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    /* ── 1. Fetch the patient record ── */
    const { data: patient, error: fetchError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patient_id)
      .single();

    if (fetchError || !patient) {
      return NextResponse.json(
        { error: "Patient not found", details: fetchError?.message },
        { status: 404 }
      );
    }

    // If already triaged, return existing results without re-running
    if (patient.status === "triaged" || patient.status === "routed") {
      const { data: assignedHospital } = patient.assigned_hospital_id
        ? await supabase
            .from("hospitals")
            .select("*")
            .eq("id", patient.assigned_hospital_id)
            .single()
        : { data: null };

      return NextResponse.json({
        triage: {
          tier: patient.triage_tier,
          reasoning: patient.triage_reasoning,
          risk_flags: patient.risk_flags ?? [],
          recommended_action: patient.recommended_action ?? null,
          self_care_instructions: patient.self_care_instructions ?? null,
        },
        assigned_hospital: assignedHospital,
        top_hospitals: assignedHospital ? [assignedHospital] : [],
        already_triaged: true,
      });
    }

    /* ── 2. Run AI triage via OpenAI GPT-4o ── */
    const patientData: PatientData = {
      id: patient.id,
      full_name: patient.full_name,
      age: patient.age,
      symptoms: patient.symptoms ?? [],
      severity_flags: patient.severity_flags ?? [],
      risk_factors: patient.risk_factors ?? [],
      travel_history: patient.travel_history,
      exposure_history: patient.exposure_history,
    };

    const triageResult = await runTriage(patientData);

    /* ── 3. Fetch hospitals and run matching algorithm ── */
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("*");

    if (hospitalsError || !hospitals || hospitals.length === 0) {
      // Triage succeeded but no hospitals — still save triage, skip matching
      await supabase
        .from("patients")
        .update({
          triage_tier: triageResult.tier,
          triage_reasoning: triageResult.reasoning,
          risk_flags: triageResult.risk_flags,
          status: "triaged",
          updated_at: new Date().toISOString(),
        })
        .eq("id", patient_id);

      return NextResponse.json({
        triage: triageResult,
        assigned_hospital: null,
        top_hospitals: [],
        already_triaged: false,
      });
    }

    // Use patient's saved location, fall back to Boston if not provided
    const patientLat = patient.lat ?? 42.3601;
    const patientLng = patient.lng ?? -71.0589;

    const rankedHospitals = rankHospitals(
      hospitals as Hospital[],
      patientLat,
      patientLng,
      triageResult.tier
    );

    const top3 = rankedHospitals.slice(0, 3);
    const assignedHospital = top3[0] ?? null;

    /* ── 4. Update the patient record with triage results ── */
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        triage_tier: triageResult.tier,
        triage_reasoning: triageResult.reasoning,
        risk_flags: triageResult.risk_flags,
        assigned_hospital_id: assignedHospital?.id ?? null,
        status: "triaged",
        updated_at: new Date().toISOString(),
      })
      .eq("id", patient_id);

    if (updateError) {
      console.error("Failed to update patient record:", updateError);
      // Still return the triage result even if update fails
    }

    /* ── 5. Return triage result + top 3 hospitals ── */
    return NextResponse.json({
      triage: triageResult,
      assigned_hospital: assignedHospital,
      top_hospitals: top3.map((h) => ({
        id: h.id,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        available_beds: h.available_beds,
        total_capacity: h.total_capacity,
        specialties: h.specialties,
        wait_time_minutes: h.wait_time_minutes,
        contact_phone: h.contact_phone,
        address: h.address,
        score: h.score,
        distance_km: h.distance_km,
      })),
      already_triaged: false,
    });
  } catch (error) {
    console.error("Triage API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
