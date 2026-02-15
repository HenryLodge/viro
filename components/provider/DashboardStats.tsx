"use client";

import { cn } from "@/lib/utils";

interface Region {
  case_count: number;
  anomaly_flag: boolean;
}

interface Patient {
  triage_tier: string | null;
  created_at: string;
}

export function DashboardStats({
  regions,
  patients,
}: {
  regions: Region[];
  patients: Patient[];
}) {
  const totalCases = regions.reduce((sum, r) => sum + r.case_count, 0);
  const anomalyCount = regions.filter((r) => r.anomaly_flag).length;

  // Patients triaged today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const triagedToday = patients.filter(
    (p) => new Date(p.created_at) >= today
  ).length;

  const criticalPending = patients.filter(
    (p) => p.triage_tier === "critical"
  ).length;

  const stats = [
    {
      label: "Active Cases",
      value: totalCases.toLocaleString(),
      color: "text-white/90",
    },
    {
      label: "Anomalies",
      value: anomalyCount,
      color: anomalyCount > 0 ? "text-red-400" : "text-emerald-400",
    },
    {
      label: "Triaged Today",
      value: triagedToday,
      color: "text-[hsl(195,65%,55%)]",
    },
    {
      label: "Critical",
      value: criticalPending,
      color: criticalPending > 0 ? "text-red-400" : "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
          <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mt-1">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
