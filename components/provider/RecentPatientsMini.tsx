"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface MiniPatient {
  id: string;
  full_name: string | null;
  age: number | null;
  triage_tier: string | null;
  status: string;
  created_at: string;
}

const TIER_COLORS: Record<string, string> = {
  critical: "bg-red-400",
  urgent: "bg-orange-400",
  routine: "bg-yellow-300",
  "self-care": "bg-emerald-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function RecentPatientsMini({
  patients,
}: {
  patients: MiniPatient[];
}) {
  const recent = patients.slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Recent Patients
        </h3>
        <Link
          href="/provider/patients"
          className="text-[11px] text-[hsl(195,65%,55%)] hover:text-[hsl(195,65%,65%)] font-medium transition-colors"
        >
          View all &rarr;
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs text-white/30">No patients yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {recent.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  TIER_COLORS[p.triage_tier ?? ""] ?? "bg-white/20"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80 truncate">
                  {p.full_name ?? "Unknown"}
                </p>
              </div>
              {p.age != null && (
                <span className="text-[10px] text-white/30 flex-shrink-0">
                  {p.age}y
                </span>
              )}
              <span className="text-[10px] text-white/25 flex-shrink-0">
                {timeAgo(p.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
