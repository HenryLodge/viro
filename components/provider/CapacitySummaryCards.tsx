"use client";

import { cn } from "@/lib/utils";

interface HospitalData {
  id: string;
  name: string;
  total_capacity: number;
  available_beds: number;
  wait_time_minutes: number;
}

export function CapacitySummaryCards({
  hospitals,
}: {
  hospitals: HospitalData[];
}) {
  const totalBeds = hospitals.reduce((sum, h) => sum + h.available_beds, 0);
  const totalCapacity = hospitals.reduce((sum, h) => sum + h.total_capacity, 0);
  const avgWait =
    hospitals.length > 0
      ? Math.round(
          hospitals.reduce((sum, h) => sum + h.wait_time_minutes, 0) /
            hospitals.length
        )
      : 0;
  const atCapacity = hospitals.filter(
    (h) => h.available_beds / h.total_capacity < 0.1
  ).length;
  const utilization =
    totalCapacity > 0
      ? Math.round(((totalCapacity - totalBeds) / totalCapacity) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <SummaryCard label="Total Hospitals" value={hospitals.length} />
      <SummaryCard
        label="Beds Available"
        value={totalBeds}
        subtitle={`of ${totalCapacity}`}
      />
      <SummaryCard
        label="Utilization"
        value={`${utilization}%`}
        valueColor={
          utilization > 85
            ? "text-red-400"
            : utilization > 70
              ? "text-orange-400"
              : "text-emerald-400"
        }
      />
      <SummaryCard label="Avg Wait" value={`${avgWait}m`} />
      <SummaryCard
        label="At Capacity"
        value={atCapacity}
        valueColor={atCapacity > 0 ? "text-red-400" : "text-emerald-400"}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  valueColor = "text-white/90",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className={cn("text-2xl font-bold", valueColor)}>
        {value}
        {subtitle && (
          <span className="text-xs text-white/30 font-normal ml-1">
            {subtitle}
          </span>
        )}
      </p>
      <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
}
