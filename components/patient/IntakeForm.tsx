"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ── Metro area fallback options ── */

const METRO_AREAS = [
  { label: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { label: "New York, NY", lat: 40.7128, lng: -74.006 },
  { label: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { label: "Washington, D.C.", lat: 38.9072, lng: -77.0369 },
  { label: "Baltimore, MD", lat: 39.2904, lng: -76.6122 },
  { label: "Pittsburgh, PA", lat: 40.4406, lng: -79.9959 },
  { label: "Hartford, CT", lat: 41.7658, lng: -72.6734 },
  { label: "Atlanta, GA", lat: 33.749, lng: -84.388 },
  { label: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { label: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { label: "Raleigh, NC", lat: 35.7796, lng: -78.6382 },
  { label: "Tampa, FL", lat: 27.9506, lng: -82.4572 },
  { label: "Orlando, FL", lat: 28.5383, lng: -81.3792 },
  { label: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { label: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { label: "Cleveland, OH", lat: 41.4993, lng: -81.6944 },
  { label: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { label: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
  { label: "St. Louis, MO", lat: 38.627, lng: -90.1994 },
  { label: "Columbus, OH", lat: 39.9612, lng: -82.9988 },
  { label: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { label: "Dallas, TX", lat: 32.7767, lng: -96.797 },
  { label: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  { label: "Phoenix, AZ", lat: 33.4484, lng: -112.074 },
  { label: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { label: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { label: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { label: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { label: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { label: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { label: "Salt Lake City, UT", lat: 40.7608, lng: -111.891 },
  { label: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
  { label: "Honolulu, HI", lat: 21.3069, lng: -157.8583 },
  { label: "Anchorage, AK", lat: 61.2181, lng: -149.9003 },
] as const;

type LocationStatus = "idle" | "detecting" | "acquired" | "denied" | "manual";

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
  const [patientLat, setPatientLat] = useState<number | null>(null);
  const [patientLng, setPatientLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [selectedMetro, setSelectedMetro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPatientLat(position.coords.latitude);
        setPatientLng(position.coords.longitude);
        setLocationStatus("acquired");
        setSelectedMetro("");
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  function handleMetroChange(value: string) {
    setSelectedMetro(value);
    if (value) {
      const metro = METRO_AREAS.find((m) => m.label === value);
      if (metro) {
        setPatientLat(metro.lat);
        setPatientLng(metro.lng);
        setLocationStatus("manual");
      }
    } else {
      setPatientLat(null);
      setPatientLng(null);
      setLocationStatus("idle");
    }
  }

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
        lat: patientLat,
        lng: patientLng,
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

      {/* ── Card 6: Location ── */}
      <Card>
        <SectionHeading number={6} title="Your location" />
        <p className="text-xs text-white/35 mt-1 mb-4">
          We use your location to find the nearest hospitals. You can share your
          browser location or pick the closest metro area.
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Detect button */}
          <button
            type="button"
            onClick={detectLocation}
            disabled={loading || locationStatus === "detecting"}
            className={cn(
              pillBase,
              "flex items-center gap-2",
              locationStatus === "acquired"
                ? pillActive
                : locationStatus === "detecting"
                ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                : pillInactive
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {locationStatus === "detecting"
              ? "Detecting…"
              : locationStatus === "acquired"
              ? "Location acquired"
              : "Use my location"}
          </button>

          {/* Status + fallback */}
          <div className="flex-1 space-y-2">
            {locationStatus === "denied" && (
              <p className="text-xs text-amber-400">
                Location access was denied. Please select your nearest metro
                area below.
              </p>
            )}

            {/* Metro dropdown — always visible as a fallback option */}
            <div className="space-y-1.5">
              <Label className={labelClass}>
                {locationStatus === "acquired"
                  ? "Or override with a metro area"
                  : "Select nearest metro area"}
              </Label>
              <select
                value={selectedMetro}
                onChange={(e) => handleMetroChange(e.target.value)}
                disabled={loading}
                className={cn(
                  inputClass,
                  "h-11 w-full rounded-lg border px-3 text-sm appearance-none"
                )}
              >
                <option value="">— Select a city —</option>
                {METRO_AREAS.map((m) => (
                  <option key={m.label} value={m.label}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Show resolved coordinates for transparency */}
            {patientLat !== null && patientLng !== null && (
              <p className="text-xs text-white/30">
                Coordinates: {patientLat.toFixed(4)}, {patientLng.toFixed(4)}
              </p>
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
