"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

/* ── Mock hospitals (same list as results page) ── */

const HOSPITALS: Record<string, { name: string; address: string; waitTime: string; phone: string }> = {
  "1": { name: "Massachusetts General Hospital", address: "55 Fruit St, Boston, MA 02114", waitTime: "~20 min", phone: "(617) 726-2000" },
  "2": { name: "Brigham and Women's Hospital", address: "75 Francis St, Boston, MA 02115", waitTime: "~35 min", phone: "(617) 732-5500" },
  "3": { name: "Beth Israel Deaconess Medical Center", address: "330 Brookline Ave, Boston, MA 02215", waitTime: "~15 min", phone: "(617) 667-7000" },
};

const DEFAULT_HOSPITAL = HOSPITALS["1"];

function getStepState(stepKey: string, currentStatus: string) {
  const order = ["pending", "triaged", "routed", "admitted"];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepKey);
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

/* ── Inner component that reads searchParams ── */

function StatusContent() {
  const searchParams = useSearchParams();
  const hospitalId = searchParams.get("hospital") ?? "1";
  const hospital = HOSPITALS[hospitalId] ?? DEFAULT_HOSPITAL;
  const currentStatus = "routed";

  const STEPS = [
    { key: "pending", label: "Intake submitted", description: "Your symptoms have been recorded." },
    { key: "triaged", label: "AI triage complete", description: "Urgency assessment: Urgent." },
    { key: "routed", label: "Routed to facility", description: `You've been routed to ${hospital.name}.` },
    { key: "admitted", label: "Checked in", description: "You have been admitted for evaluation." },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white/90">Your status</h1>
        <p className="mt-2 text-sm text-white/40">
          We&apos;ll keep you updated as things progress.
        </p>
      </div>

      {/* ── Two column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Left: Hospital + stats */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(195,65%,48%)]/10 ring-1 ring-[hsl(195,65%,48%)]/20">
                <svg className="h-6 w-6 text-[hsl(195,65%,55%)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-white/90">{hospital.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{hospital.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-[hsl(195,65%,55%)]">{hospital.waitTime}</p>
                <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mt-1">Estimated wait</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-orange-400">Urgent</p>
                <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mt-1">Urgency tier</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3">
              <svg className="h-4 w-4 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              <span className="text-sm text-white/60">
                Contact: <span className="text-white/80 font-medium">{hospital.phone}</span>
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(195,65%,48%)]/15 bg-[hsl(195,65%,48%)]/5 p-5">
            <p className="text-sm text-[hsl(195,65%,60%)] leading-relaxed">
              <span className="font-semibold">You&apos;re in good hands.</span> Your information
              has been securely shared with the care team at {hospital.name}. They are expecting
              you — when you arrive, let the front desk know you were triaged through VIRO.
            </p>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-6">Progress</h2>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const state = getStepState(step.key, currentStatus);
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                        state === "completed"
                          ? "border-[hsl(195,65%,48%)] bg-[hsl(195,65%,48%)]"
                          : state === "current"
                            ? "border-[hsl(195,65%,48%)] bg-[hsl(195,65%,48%)]/20"
                            : "border-white/10 bg-white/[0.04]"
                      }`}>
                        {state === "completed" ? (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : state === "current" ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(195,65%,48%)] animate-pulse" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-white/20" />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[2.5rem] ${
                          state === "completed" ? "bg-[hsl(195,65%,48%)]" : "bg-white/10"
                        }`} />
                      )}
                    </div>
                    <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                      <p className={`text-sm font-semibold ${state === "upcoming" ? "text-white/30" : "text-white/90"}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${state === "upcoming" ? "text-white/20" : "text-white/50"}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
        <Link
          href="/patient/results"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white transition-all"
        >
          &larr; Change hospital
        </Link>
        <Link
          href="/patient/intake"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white transition-all"
        >
          New intake
        </Link>
      </div>
    </div>
  );
}

/* ── Page wrapper with Suspense for useSearchParams ── */

export default function PatientStatusPage() {
  return (
    <Suspense>
      <StatusContent />
    </Suspense>
  );
}
