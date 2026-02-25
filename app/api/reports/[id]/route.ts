import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/reports/[id]
 *
 * Returns a single report by its UUID.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required." },
        { status: 400 },
      );
    }

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
      .eq("id", id)
      .single();

    if (error) {
      // If the reports table doesn't exist yet, give a clear message
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        console.warn("Report GET: reports table not found — run the migration in supabase/migrations/20260215000003_reports.sql");
        return NextResponse.json(
          { error: "Reports table not yet created. The report may be available in your browser session.", _tableNotFound: true },
          { status: 404 },
        );
      }
      console.error("Report GET: failed to fetch report", error);
      return NextResponse.json(
        { error: "Report not found", details: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Report GET error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
