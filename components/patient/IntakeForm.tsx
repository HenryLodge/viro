"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ── Option lists ── */

const SYMPTOM_OPTIONS = [
  "Fever",
  "Cough",
  "Fatigue",
  "Body aches",
  "Sore throat",
  "Shortness of breath",
  "Headache",
  "Nausea / vomiting",
  "Diarrhea",
  "Loss of taste or smell",
] as const;

const SEVERITY_FLAG_OPTIONS = [
  "Difficulty breathing",
  "Chest pain",
  "High fever (>103 °F)",
  "Confusion",
  "Inability to keep fluids down",
] as const;

const RISK_FACTOR_OPTIONS = [
  "Immunocompromised",
  "Diabetes",
  "Heart disease",
  "Age > 65",
  "Pregnancy",
] as const;

const DURATION_OPTIONS = [
  "Less than 24 hours",
  "1–3 days",
  "4–7 days",
  "More than a week",
] as const;

const SEX_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;

/* ── Shared styles ── */

const inputClass =
  "h-11 rounded-lg border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus-visible:ring-[hsl(195,65%,48%)] focus-visible:border-[hsl(195,65%,48%)]";

const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-white/50";

const pillActive =
  "border-[hsl(195,65%,48%)] bg-[hsl(195,65%,48%)]/15 text-[hsl(195,65%,60%)]";

const pillInactive =
  "border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20";

const pillBase = "rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all";

/* ── Component ── */

interface IntakeFormProps {
  prefillName?: string;
}

export function IntakeForm({ prefillName }: IntakeFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(prefillName ?? "");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severityFlags, setSeverityFlags] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [travelHistory, setTravelHistory] = useState("");
  const [hasExposure, setHasExposure] = useState(false);
  const [exposureDetails, setExposureDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (symptoms.length === 0 && !otherSymptoms.trim()) {
      setError("Please select at least one symptom.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const allSymptoms = [
      ...symptoms,
      ...(otherSymptoms.trim() ? [otherSymptoms.trim()] : []),
    ];
    if (duration) allSymptoms.push(`Duration: ${duration}`);

    const { data, error: insertError } = await supabase
      .from("patients")
      .insert({
        user_id: user.id,
        full_name: fullName || null,
        age: age ? parseInt(age, 10) : null,
        symptoms: allSymptoms,
        severity_flags: severityFlags,
        risk_factors: [...riskFactors, ...(sex ? [`Sex: ${sex}`] : [])],
        travel_history: travelHistory || null,
        exposure_history: hasExposure
          ? exposureDetails || "Yes (no details provided)"
          : "No known exposure",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/patient/results?id=${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Card 1: Personal Info ── */}
      <Card>
        <SectionHeading number={1} title="Personal information" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="sm:col-span-1 space-y-1.5">
            <Label htmlFor="fullName" className={labelClass}>Full name</Label>
            <Input id="fullName" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age" className={labelClass}>Age</Label>
            <Input id="age" type="number" placeholder="35" min={0} max={150} value={age} onChange={(e) => setAge(e.target.value)} required disabled={loading} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Sex</Label>
            <div className="flex flex-wrap gap-1.5">
              {SEX_OPTIONS.map((o) => (
                <button key={o} type="button" onClick={() => setSex(o)} disabled={loading} className={cn(pillBase, "px-3 py-1.5 text-xs", sex === o ? pillActive : pillInactive)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Card 2: Symptoms ── */}
      <Card>
        <SectionHeading number={2} title="Symptoms" />
        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label className={labelClass}>Select all that apply</Label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => toggle(symptoms, setSymptoms, s)} disabled={loading} className={cn(pillBase, symptoms.includes(s) ? pillActive : pillInactive)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="otherSymptoms" className={labelClass}>Other symptoms</Label>
            <Input id="otherSymptoms" placeholder="Describe any other symptoms…" value={otherSymptoms} onChange={(e) => setOtherSymptoms(e.target.value)} disabled={loading} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>How long have you had symptoms?</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button key={d} type="button" onClick={() => setDuration(d)} disabled={loading} className={cn(pillBase, duration === d ? pillActive : pillInactive)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Card 3: Severity + Risk side by side ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <SectionHeading number={3} title="Severity flags" />
          <p className="text-xs text-white/35 mt-1 mb-4">Currently experiencing any of these?</p>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_FLAG_OPTIONS.map((f) => (
              <button key={f} type="button" onClick={() => toggle(severityFlags, setSeverityFlags, f)} disabled={loading} className={cn(pillBase, severityFlags.includes(f) ? "border-red-500/60 bg-red-500/15 text-red-400" : pillInactive)}>
                {f}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading number={4} title="Pre-existing conditions" />
          <p className="text-xs text-white/35 mt-1 mb-4">Select any that apply to you.</p>
          <div className="flex flex-wrap gap-2">
            {RISK_FACTOR_OPTIONS.map((f) => (
              <button key={f} type="button" onClick={() => toggle(riskFactors, setRiskFactors, f)} disabled={loading} className={cn(pillBase, riskFactors.includes(f) ? pillActive : pillInactive)}>
                {f}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Card 4: Travel & Exposure ── */}
      <Card>
        <SectionHeading number={5} title="Travel & exposure" />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="travelHistory" className={labelClass}>Recent travel (last 14 days)</Label>
            <textarea
              id="travelHistory"
              placeholder="Locations and dates…"
              value={travelHistory}
              onChange={(e) => setTravelHistory(e.target.value)}
              disabled={loading}
              rows={4}
              className={cn(inputClass, "h-auto w-full resize-none rounded-lg border px-3 py-2.5 text-sm")}
            />
          </div>
          <div className="space-y-3">
            <Label className={labelClass}>Known contact with confirmed cases?</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setHasExposure(true)} disabled={loading} className={cn(pillBase, hasExposure ? pillActive : pillInactive)}>Yes</button>
              <button type="button" onClick={() => { setHasExposure(false); setExposureDetails(""); }} disabled={loading} className={cn(pillBase, !hasExposure ? pillActive : pillInactive)}>No</button>
            </div>
            {hasExposure && (
              <textarea
                placeholder="When, where, and how…"
                value={exposureDetails}
                onChange={(e) => setExposureDetails(e.target.value)}
                disabled={loading}
                rows={3}
                className={cn(inputClass, "h-auto w-full resize-none rounded-lg border px-3 py-2.5 text-sm")}
              />
            )}
          </div>
        </div>
      </Card>

      {/* ── Error + Submit ── */}
      {error && (
        <p className="text-sm text-red-400 font-medium text-center" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[hsl(195,65%,48%)] text-sm font-semibold text-white shadow-lg shadow-[hsl(195,65%,48%)]/25 hover:bg-[hsl(195,65%,42%)] disabled:opacity-50 transition-all"
      >
        {loading ? "Submitting…" : "Submit for triage"}
      </button>
    </form>
  );
}

/* ── Helpers ── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7">
      {children}
    </div>
  );
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(195,65%,48%)]/15 text-xs font-bold text-[hsl(195,65%,55%)]">
        {number}
      </span>
      <h2 className="text-base font-semibold text-white/90">{title}</h2>
    </div>
  );
}
