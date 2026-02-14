import { NextResponse } from "next/server";

/**
 * GET /api/hospitals — return hospital list for routing/map.
 * Data will come from Supabase; for now returns empty array.
 */
export async function GET() {
  try {
    // TODO: fetch from Supabase hospitals table
    const hospitals: unknown[] = [];
    return NextResponse.json(hospitals);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch hospitals" },
      { status: 500 }
    );
  }
}
