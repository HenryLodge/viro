import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeGraph, type PatientNode } from "@/lib/network-engine";
import {
  aggregateReportData,
  generateReport,
  type ReportAudience,
} from "@/lib/ai-report";

const VALID_AUDIENCES = new Set(["government", "hospital", "technical"]);

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

/**
 * GET /api/reports
 *
 * Returns a list of previously generated reports, sorted by created_at desc.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Reports GET: failed to fetch reports", error);
      return NextResponse.json(
        { error: "Failed to fetch reports", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    console.error("Reports GET error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/reports
 *
 * Generates a new AI-powered report.
 *
 * Request body:
 *   { audience: "government" | "hospital" | "technical", scope?: string }
 *
 * Response:
 *   The full report object (also stored in Supabase).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audience, scope = "full" } = body as {
      audience?: string;
      scope?: string;
    };

    // ── Validate ──────────────────────────────────────────────────

    if (!audience || !VALID_AUDIENCES.has(audience)) {
      return NextResponse.json(
        {
          error: `"audience" must be one of: ${Array.from(VALID_AUDIENCES).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ── Fetch network data ────────────────────────────────────────

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase credentials" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch patients (same approach as /api/network)
    const cutoff = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: patients, error: fetchError } = await supabase
      .from("patients")
      .select(
        "id, full_name, age, symptoms, severity_flags, risk_factors, travel_history, exposure_history, triage_tier, lat, lng, created_at, status",
      )
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(500);

    if (fetchError) {
      console.error("Reports POST: failed to fetch patients", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch patient data" },
        { status: 500 },
      );
    }

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

    // Compute graph
    const graph = computeGraph(normalized);

    // Aggregate data for report
    const dataSummary = aggregateReportData(
      graph.nodes,
      graph.edges,
      graph.clusters,
      graph.clusterAlerts,
    );

    // ── Generate report with GPT-4o ──────────────────────────────

    const reportResult = await generateReport(
      audience as ReportAudience,
      scope,
      dataSummary,
    );

    // ── Store in Supabase ─────────────────────────────────────────

    const reportRow = {
      title: reportResult.title,
      audience,
      scope,
      sections: reportResult.sections,
      summary: reportResult.summary,
      patient_count: dataSummary.totalPatients,
      cluster_count: dataSummary.totalClusters,
      date_range_start: dataSummary.dateRangeStart,
      date_range_end: dataSummary.dateRangeEnd,
    };

    const { data: insertedReport, error: insertError } = await supabase
      .from("reports")
      .insert(reportRow)
      .select()
      .single();

    if (insertError) {
      console.error("Reports POST: failed to store report", insertError);
      // Still return the report even if storage fails
      return NextResponse.json({
        ...reportRow,
        id: "temp-" + Date.now(),
        created_at: new Date().toISOString(),
        _storageError: insertError.message,
      });
    }

    return NextResponse.json(insertedReport);
  } catch (err) {
    console.error("Reports POST error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
