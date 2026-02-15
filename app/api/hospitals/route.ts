import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rankHospitals, type Hospital } from "@/lib/hospital-matching";

/**
 * GET /api/hospitals
 *
 * Fetches all hospitals from the Supabase `hospitals` table.
 *
 * Optional query params:
 *   - lat, lng  — patient location for distance-based ranking
 *   - specialty — filter by specialty (e.g. "infectious_disease")
 *   - tier      — triage tier for specialty matching in ranking
 *   - limit     — max number of results (default: all)
 *
 * If lat/lng are provided, returns hospitals ranked by the weighted scoring algorithm.
 * Otherwise, returns the full unranked list.
 */
export async function GET(request: NextRequest) {
  try {
    /* ── Create Supabase admin client ── */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    /* ── Parse query params ── */
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const specialty = searchParams.get("specialty");
    const tier = searchParams.get("tier");
    const limitParam = searchParams.get("limit");

    /* ── Fetch hospitals ── */
    const { data: hospitals, error: fetchError } = await supabase
      .from("hospitals")
      .select("*");

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch hospitals", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!hospitals || hospitals.length === 0) {
      return NextResponse.json([]);
    }

    /* ── Parse specialties from JSON strings if needed ── */
    let parsedHospitals: Hospital[] = hospitals.map((h) => ({
      ...h,
      specialties:
        typeof h.specialties === "string"
          ? JSON.parse(h.specialties)
          : Array.isArray(h.specialties)
            ? h.specialties
            : [],
    }));

    /* ── Filter by specialty if provided ── */
    if (specialty) {
      parsedHospitals = parsedHospitals.filter((h) =>
        h.specialties.includes(specialty)
      );
    }

    /* ── Rank by location if lat/lng provided ── */
    if (lat && lng) {
      const patientLat = parseFloat(lat);
      const patientLng = parseFloat(lng);

      if (isNaN(patientLat) || isNaN(patientLng)) {
        return NextResponse.json(
          { error: "Invalid lat/lng values" },
          { status: 400 }
        );
      }

      const ranked = rankHospitals(
        parsedHospitals,
        patientLat,
        patientLng,
        tier ?? undefined
      );

      const limit = limitParam ? parseInt(limitParam, 10) : ranked.length;
      return NextResponse.json(ranked.slice(0, limit));
    }

    /* ── Return full list (unranked) ── */
    const limit = limitParam
      ? parseInt(limitParam, 10)
      : parsedHospitals.length;
    return NextResponse.json(parsedHospitals.slice(0, limit));
  } catch (error) {
    console.error("Hospitals API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
