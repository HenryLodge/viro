"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface PatientRecord {
  id: string;
  full_name: string | null;
  age: number | null;
  symptoms: string[];
  severity_flags: string[];
  risk_factors: string[];
  travel_history: string | null;
  exposure_history: string | null;
  triage_tier: string | null;
  triage_reasoning: string | null;
  risk_flags: string[];
  assigned_hospital_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/* ── Tier config ── */

const TIER_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; ring: string }
> = {
  critical: {
    label: "Critical",
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
    ring: "ring-red-500/30",
  },
  urgent: {
    label: "Urgent",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    dot: "bg-orange-400",
    ring: "ring-orange-500/30",
  },
  routine: {
    label: "Routine",
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
    dot: "bg-yellow-300",
    ring: "ring-yellow-500/30",
  },
  "self-care": {
    label: "Self-Care",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    ring: "ring-emerald-500/30",
  },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-white/40" },
  triaged: { label: "Triaged", color: "text-[hsl(195,65%,55%)]" },
  routed: { label: "Routed", color: "text-blue-400" },
  admitted: { label: "Admitted", color: "text-emerald-400" },
};

/* ── Helpers ── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Component ── */

export function PatientCard({
  patient,
  isNew,
}: {
  patient: PatientRecord;
  isNew?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const tier = TIER_CONFIG[patient.triage_tier ?? ""] ?? null;
  const statusInfo =
    STATUS_LABELS[patient.status] ?? STATUS_LABELS["pending"];

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className={cn(
        "w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/10",
        isNew && "animate-fade-in-up ring-1 ring-[hsl(195,65%,48%)]/30"
      )}
    >
      {/* Top row: name + tier badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white/90 truncate">
              {patient.full_name || "Unknown Patient"}
            </p>
            {patient.age != null && (
              <span className="text-xs text-white/35 flex-shrink-0">
                {patient.age}y
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("text-xs font-medium", statusInfo.color)}>
              {statusInfo.label}
            </span>
            <span className="text-[11px] text-white/25">
              {timeAgo(patient.created_at)}
            </span>
          </div>
        </div>
        {tier && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 flex-shrink-0",
              tier.bg,
              tier.text,
              tier.ring
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", tier.dot)} />
            {tier.label}
          </span>
        )}
      </div>

      {/* Risk flags */}
      {patient.risk_flags && patient.risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {patient.risk_flags.slice(0, 5).map((flag) => (
            <span
              key={flag}
              className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/50 font-medium"
            >
              {flag.replace(/_/g, " ")}
            </span>
          ))}
          {patient.risk_flags.length > 5 && (
            <span className="text-[10px] text-white/30 px-1 py-0.5">
              +{patient.risk_flags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Expanded section: triage reasoning */}
      {expanded && patient.triage_reasoning && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
              AI Triage Reasoning
            </p>
            <p className="text-xs leading-relaxed text-white/60">
              {patient.triage_reasoning}
            </p>
          </div>
          {patient.symptoms && patient.symptoms.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                Symptoms
              </p>
              <p className="text-xs text-white/50">
                {patient.symptoms.join(", ")}
              </p>
            </div>
          )}
          {patient.travel_history && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                Travel
              </p>
              <p className="text-xs text-white/50">{patient.travel_history}</p>
            </div>
          )}
          {patient.exposure_history && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                Exposure
              </p>
              <p className="text-xs text-white/50">
                {patient.exposure_history}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Expand hint */}
      <div className="mt-3 flex items-center gap-1">
        <svg
          className={cn(
            "h-3 w-3 text-white/20 transition-transform",
            expanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
        <span className="text-[10px] text-white/20">
          {expanded ? "Collapse" : "Click for details"}
        </span>
      </div>
    </button>
  );
}
