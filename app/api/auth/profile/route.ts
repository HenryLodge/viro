import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "patient" | "provider";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: "Profile not found", details: profileError.message },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { role?: ProfileRole; full_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const role = body.role;
  if (!role || (role !== "patient" && role !== "provider")) {
    return NextResponse.json(
      { error: "role must be 'patient' or 'provider'" },
      { status: 400 }
    );
  }

  const full_name =
    typeof body.full_name === "string" ? body.full_name : null;
  const email = user.email ?? null;

  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      role,
      full_name,
      email,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save profile", details: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
