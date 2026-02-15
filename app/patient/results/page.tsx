"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const HospitalMap = dynamic(
  () =>
    import("@/components/patient/HospitalMap").then((mod) => mod.HospitalMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 flex items-center justify-center">
        <p className="text-xs text-white/25">Loading map...</p>
      </div>
    ),
  }
);

/* ── Types ── */

interface TriageData {
  tier: "critical" | "urgent" | "routine" | "self-care";
  reasoning: string;
  risk_flags: string[];
  recommended_action: string;
  self_care_instructions: string | null;
}

interface HospitalData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  available_beds: number;
  total_capacity: number;
  specialties: string[];
  wait_time_minutes: number;
  contact_phone: string | null;
  address: string | null;
  score?: number;
  distance_km?: number;
}

interface TriageResponse {
  triage: TriageData;
  assigned_hospital: HospitalData | null;
  top_hospitals: HospitalData[];
  already_triaged: boolean;
}

/* ── Tier styling config ── */

const TIER_CONFIG = {
  critical: {
    label: "Critical",
    color: "bg-red-500/15 text-red-400 ring-red-500/30",
    dot: "bg-red-400",
    description: "Life-threatening symptoms — seek emergency care immediately.",
    flagDot: "bg-red-400",
  },
  urgent: {
    label: "Urgent",
    color: "bg-orange-500/15 text-orange-400 ring-orange-500/30",
    dot: "bg-orange-400",
    description: "Serious symptoms detected — same-day evaluation recommended.",
    flagDot: "bg-orange-400",
  },
  routine: {
    label: "Routine",
    color: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
    dot: "bg-yellow-300",
    description:
      "Moderate symptoms — schedule an appointment within 24–48 hours.",
    flagDot: "bg-yellow-300",
  },
  "self-care": {
    label: "Self-Care",
    color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    dot: "bg-emerald-400",
    description:
      "Mild symptoms, low risk — you can safely monitor at home.",
    flagDot: "bg-emerald-400",
  },
};

/* ── Helpers ── */

function formatDistance(km?: number): string {
  if (km == null) return "—";
  const miles = km * 0.621371;
  return `${miles.toFixed(1)} mi`;
}

function formatWaitTime(minutes?: number): string {
  if (minutes == null) return "—";
  return `~${minutes} min`;
}

/* ── Inner component that reads searchParams ── */

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<TriageData | null>(null);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const runTriage = useCallback(async () => {
    if (!patientId) {
      setError("No patient ID provided. Please submit the intake form first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody.error || `Triage request failed (status ${res.status})`
        );
      }

      const data: TriageResponse = await res.json();

      setTriageData(data.triage);
      setHospitals(data.top_hospitals);

      // Auto-select the assigned (top-ranked) hospital
      if (data.assigned_hospital) {
        setSelectedId(data.assigned_hospital.id);
      } else if (data.top_hospitals.length > 0) {
        setSelectedId(data.top_hospitals[0].id);
      }
    } catch (err) {
      console.error("Triage error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong during triage."
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    runTriage();
  }, [runTriage]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[hsl(195,65%,48%)]/10 ring-1 ring-[hsl(195,65%,48%)]/20 mb-6">
            <svg
              className="h-8 w-8 text-[hsl(195,65%,55%)] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white/90 mb-2">
            Analyzing your symptoms
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Our AI is reviewing your intake data using clinical triage guidelines.
            This typically takes a few seconds.
          </p>
          <div className="mt-8 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-[hsl(195,65%,48%)]"
                style={{
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !triageData) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 mb-6">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white/90 mb-2">
            Triage unavailable
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
            {error || "We couldn't complete your triage assessment. Please try again."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => runTriage()}
              className="inline-flex items-center justify-center rounded-xl bg-[hsl(195,65%,48%)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[hsl(195,65%,48%)]/25 hover:bg-[hsl(195,65%,42%)] transition-all"
            >
              Try again
            </button>
            <Link
              href="/patient/intake"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              Start over
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  const tier = TIER_CONFIG[triageData.tier];

  function handleConfirm() {
    if (!selectedId) return;
    const params = new URLSearchParams({
      hospital: selectedId,
      ...(patientId ? { id: patientId } : {}),
    });
    router.push(`/patient/status?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white/90">Your triage result</h1>
        <p className="mt-2 text-sm text-white/40">
          Based on the information you provided, here is our assessment.
        </p>
      </div>

      {/* ── Top row: Tier + Risk Flags ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${tier.color}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${tier.dot} animate-pulse`}
              />
              {tier.label}
            </span>
            <span className="text-xs text-white/30">Assessed just now</span>
          </div>
          <p className="text-sm font-medium text-white/50">
            {tier.description}
          </p>
          <div className="border-t border-white/[0.06]" />
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              What this means
            </h2>
            <p className="text-sm leading-relaxed text-white/75">
              {triageData.reasoning}
            </p>
          </div>

          {/* Recommended action */}
          {triageData.recommended_action && (
            <>
              <div className="border-t border-white/[0.06]" />
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Recommended action
                </h2>
                <p className="text-sm leading-relaxed text-white/75">
                  {triageData.recommended_action}
                </p>
              </div>
            </>
          )}

          {/* Self-care instructions (only for self-care tier) */}
          {triageData.self_care_instructions && (
            <>
              <div className="border-t border-white/[0.06]" />
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Self-care guidance
                </h2>
                <p className="text-sm leading-relaxed text-white/75">
                  {triageData.self_care_instructions}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 flex flex-col">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">
            Key factors
          </h2>
          <div className="flex flex-col gap-2 flex-1">
            {triageData.risk_flags.length > 0 ? (
              triageData.risk_flags.map((flag) => (
                <div
                  key={flag}
                  className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${tier.flagDot} flex-shrink-0`}
                  />
                  <span className="text-sm text-white/70">{flag}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/30">No major risk flags identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Hospital Selection ── */}
      {hospitals.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-white/90">
              Choose a facility
            </h2>
            <span className="text-xs text-white/30">Ranked by best match</span>
          </div>
          <p className="text-xs text-white/40 mb-6">
            Select the hospital you&apos;d like to be routed to.
          </p>

          {/* Hospital map */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] h-52 mb-6 overflow-hidden">
            <HospitalMap
              hospitals={hospitals}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
            />
          </div>

          {/* Hospital cards — clickable */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {hospitals.map((hospital, i) => {
              const isSelected = selectedId === hospital.id;

              return (
                <button
                  key={hospital.id}
                  type="button"
                  onClick={() => setSelectedId(hospital.id)}
                  className={`rounded-xl border-2 p-5 text-left transition-all ${
                    isSelected
                      ? "border-[hsl(195,65%,48%)] bg-[hsl(195,65%,48%)]/[0.06] ring-1 ring-[hsl(195,65%,48%)]/20"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        isSelected
                          ? "bg-[hsl(195,65%,48%)]/20 text-[hsl(195,65%,55%)]"
                          : "bg-white/[0.06] text-white/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-[hsl(195,65%,55%)] uppercase tracking-wider">
                        Selected
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white/90 leading-snug">
                    {hospital.name}
                  </p>
                  <p className="text-[11px] text-white/35 mt-1">
                    {hospital.address ?? "Address unavailable"}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Distance</span>
                      <span className="text-white/70 font-medium">
                        {formatDistance(hospital.distance_km)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Wait time</span>
                      <span className="text-white/70 font-medium">
                        {formatWaitTime(hospital.wait_time_minutes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Beds available</span>
                      <span className="text-white/70 font-medium">
                        {hospital.available_beds}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <div className="flex flex-wrap gap-1.5">
                      {hospital.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="rounded-md bg-[hsl(195,65%,48%)]/10 px-2.5 py-1 text-[10px] font-semibold text-[hsl(195,65%,55%)] uppercase tracking-wider"
                        >
                          {spec.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── No hospitals fallback ── */}
      {hospitals.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 mb-6 text-center">
          <p className="text-sm text-white/40">
            No hospitals are currently available for routing. Please contact
            emergency services if you need immediate care.
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        {hospitals.length > 0 && (
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-[hsl(195,65%,48%)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[hsl(195,65%,48%)]/25 hover:bg-[hsl(195,65%,42%)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {selectedId ? "Confirm & continue" : "Select a hospital"}
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        )}
        <Link
          href="/patient/intake"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white transition-all"
        >
          Start over
        </Link>
      </div>
    </div>
  );
}

/* ── Page wrapper with Suspense for useSearchParams ── */

export default function PatientResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}
