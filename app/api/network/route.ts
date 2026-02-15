import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeGraph, type PatientNode } from "@/lib/network-engine";

/**
 * GET /api/network
 *
 * Returns the computed symptom network graph:
 *   { nodes, edges, clusters, clusterAlerts }
 *
 * Fetches recent triaged patients (last 30 days) and runs the
 * network engine to compute similarity edges, clusters, and alerts.
 */
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse optional query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);
    const lookbackDays = Number(searchParams.get("days")) || 90;

    // Fetch patients with relevant columns
    const cutoff = new Date(
      Date.now() - lookbackDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: patients, error } = await supabase
      .from("patients")
      .select(
        "id, full_name, age, symptoms, severity_flags, risk_factors, travel_history, exposure_history, triage_tier, lat, lng, created_at, status"
      )
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Network API: failed to fetch patients", error);
      return NextResponse.json(
        { error: "Failed to fetch patients", details: error.message },
        { status: 500 }
      );
    }

    // Normalize data — ensure array fields are always arrays
    const normalized: PatientNode[] = (patients ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      age: p.age,
      symptoms: ensureArray(p.symptoms),
      severity_flags: ensureArray(p.severity_flags),
      risk_factors: ensureArray(p.risk_factors),
      travel_history: p.travel_history,
      exposure_history: p.exposure_history,
      triage_tier: p.triage_tier,
      lat: p.lat,
      lng: p.lng,
      created_at: p.created_at,
      status: p.status,
    }));

    const graph = computeGraph(normalized);

    return NextResponse.json(graph);
  } catch (err) {
    console.error("Network API error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ── Helpers ── */

function ensureArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
