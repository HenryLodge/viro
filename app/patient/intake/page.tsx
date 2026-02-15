import { createClient } from "@/lib/supabase/server";
import { IntakeForm } from "@/components/patient/IntakeForm";

export default async function PatientIntakePage() {
  let prefillName = "";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      prefillName = profile?.full_name ?? "";
    }
  } catch {
    /* best-effort */
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      {/* Page header — centered */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white/90">Symptom intake</h1>
        <p className="mt-3 text-sm text-white/40 max-w-md mx-auto leading-relaxed">
          Tell us about your symptoms so we can assess urgency and recommend
          the right care for you.
        </p>
      </div>

      <IntakeForm prefillName={prefillName} />
    </div>
  );
}
