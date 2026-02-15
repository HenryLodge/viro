"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── Mock data ── */

const MOCK_TRIAGE = {
  tier: "urgent" as const,
  reasoning:
    "Based on your symptoms — a persistent high fever for 3 days combined with shortness of breath — and your recent travel to an affected region, we recommend you be seen by a doctor today. Your age and diabetes also put you at higher risk, so getting evaluated quickly is the safest next step.",
  riskFlags: ["High fever", "Shortness of breath", "Diabetes", "Travel exposure"],
};

const TIER_CONFIG = {
  critical: { label: "Critical", color: "bg-red-500/15 text-red-400 ring-red-500/30", dot: "bg-red-400", description: "Life-threatening symptoms — seek emergency care immediately." },
  urgent: { label: "Urgent", color: "bg-orange-500/15 text-orange-400 ring-orange-500/30", dot: "bg-orange-400", description: "Serious symptoms detected — same-day evaluation recommended." },
  routine: { label: "Routine", color: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30", dot: "bg-yellow-300", description: "Moderate symptoms — schedule an appointment within 24–48 hours." },
  "self-care": { label: "Self-Care", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30", dot: "bg-emerald-400", description: "Mild symptoms, low risk — you can safely monitor at home." },
};

const MOCK_HOSPITALS = [
  { id: "1", name: "Massachusetts General Hospital", distance: "1.2 mi", waitTime: "~20 min", beds: 14, specialty: "Infectious Disease", address: "55 Fruit St, Boston, MA 02114", phone: "(617) 726-2000" },
  { id: "2", name: "Brigham and Women's Hospital", distance: "2.8 mi", waitTime: "~35 min", beds: 8, specialty: "Emergency Medicine", address: "75 Francis St, Boston, MA 02115", phone: "(617) 732-5500" },
  { id: "3", name: "Beth Israel Deaconess Medical Center", distance: "3.1 mi", waitTime: "~15 min", beds: 22, specialty: "Internal Medicine", address: "330 Brookline Ave, Boston, MA 02215", phone: "(617) 667-7000" },
];

/* ── Page ── */

export default function PatientResultsPage() {
  const router = useRouter();
  const tier = TIER_CONFIG[MOCK_TRIAGE.tier];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleConfirm() {
    if (!selectedId) return;
    const params = new URLSearchParams({ hospital: selectedId });
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
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${tier.color}`}>
              <span className={`h-2 w-2 rounded-full ${tier.dot} animate-pulse`} />
              {tier.label}
            </span>
            <span className="text-xs text-white/30">Assessed just now</span>
          </div>
          <p className="text-sm font-medium text-white/50">{tier.description}</p>
          <div className="border-t border-white/[0.06]" />
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">What this means</h2>
            <p className="text-sm leading-relaxed text-white/75">{MOCK_TRIAGE.reasoning}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 flex flex-col">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Key factors</h2>
          <div className="flex flex-col gap-2 flex-1">
            {MOCK_TRIAGE.riskFlags.map((flag) => (
              <div key={flag} className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="text-sm text-white/70">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hospital Selection ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-white/90">Choose a facility</h2>
          <span className="text-xs text-white/30">Ranked by best match</span>
        </div>
        <p className="text-xs text-white/40 mb-6">
          Select the hospital you&apos;d like to be routed to.
        </p>

        {/* Map placeholder */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] h-52 flex items-center justify-center mb-6">
          <div className="text-center">
            <svg className="h-8 w-8 text-white/20 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <p className="text-xs text-white/25">Map view coming soon</p>
          </div>
        </div>

        {/* Hospital cards — clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MOCK_HOSPITALS.map((hospital, i) => {
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
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                    isSelected
                      ? "bg-[hsl(195,65%,48%)]/20 text-[hsl(195,65%,55%)]"
                      : "bg-white/[0.06] text-white/40"
                  }`}>
                    {i + 1}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-[hsl(195,65%,55%)] uppercase tracking-wider">
                      Selected
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-white/90 leading-snug">{hospital.name}</p>
                <p className="text-[11px] text-white/35 mt-1">{hospital.address}</p>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Distance</span>
                    <span className="text-white/70 font-medium">{hospital.distance}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Wait time</span>
                    <span className="text-white/70 font-medium">{hospital.waitTime}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Beds available</span>
                    <span className="text-white/70 font-medium">{hospital.beds}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <span className="rounded-md bg-[hsl(195,65%,48%)]/10 px-2.5 py-1 text-[10px] font-semibold text-[hsl(195,65%,55%)] uppercase tracking-wider">
                    {hospital.specialty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <button
          onClick={handleConfirm}
          disabled={!selectedId}
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-[hsl(195,65%,48%)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[hsl(195,65%,48%)]/25 hover:bg-[hsl(195,65%,42%)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {selectedId ? "Confirm & continue" : "Select a hospital"}
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
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
