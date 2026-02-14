import { NextResponse } from "next/server";

/**
 * Fallback triage API route (primary triage runs in Supabase Edge Function).
 * POST /api/triage — receive patient intake, return triage result.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // TODO: validate body, call Edge Function or OpenAI, return triage result
    return NextResponse.json(
      { message: "Triage endpoint — wire to Edge Function or OpenAI", body },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
