"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface HospitalData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  total_capacity: number;
  available_beds: number;
  specialties: string[];
  wait_time_minutes: number;
  contact_phone: string | null;
  address: string | null;
}

type SortKey = "name" | "available_beds" | "wait_time_minutes";

/* ── Component ── */

export function HospitalCapacityTable({
  hospitals,
}: {
  hospitals: HospitalData[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("available_beds");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key === "name"); // name defaults asc, others desc
    }
  }

  const sorted = [...hospitals].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") {
      cmp = (a.name ?? "").localeCompare(b.name ?? "");
    } else if (sortKey === "available_beds") {
      cmp = a.available_beds - b.available_beds;
    } else if (sortKey === "wait_time_minutes") {
      cmp = a.wait_time_minutes - b.wait_time_minutes;
    }
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
          Sort by
        </span>
        {(
          [
            { key: "available_beds", label: "Beds" },
            { key: "wait_time_minutes", label: "Wait Time" },
            { key: "name", label: "Name" },
          ] as { key: SortKey; label: string }[]
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSort(opt.key)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              sortKey === opt.key
                ? "bg-[hsl(195,65%,48%)]/15 text-[hsl(195,65%,55%)] ring-1 ring-[hsl(195,65%,48%)]/30"
                : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
            )}
          >
            {opt.label}
            {sortKey === opt.key && (
              <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
            )}
          </button>
        ))}
      </div>

      {/* Hospital cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((hospital) => {
          const pct =
            hospital.total_capacity > 0
              ? hospital.available_beds / hospital.total_capacity
              : 0;
          const barColor =
            pct > 0.5
              ? "bg-emerald-500"
              : pct > 0.2
                ? "bg-yellow-500"
                : "bg-red-500";
          const barBg =
            pct > 0.5
              ? "bg-emerald-500/10"
              : pct > 0.2
                ? "bg-yellow-500/10"
                : "bg-red-500/10";

          return (
            <div
              key={hospital.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4"
            >
              {/* Header */}
              <div>
                <p className="text-sm font-semibold text-white/90 leading-snug">
                  {hospital.name}
                </p>
                <p className="text-[11px] text-white/35 mt-0.5">
                  {hospital.address ?? "Address unavailable"}
                </p>
              </div>

              {/* Capacity bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-white/40">Capacity</span>
                  <span className="text-white/70 font-medium">
                    {hospital.available_beds} / {hospital.total_capacity} beds
                  </span>
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full overflow-hidden",
                    barBg
                  )}
                >
                  <div
                    className={cn("h-full rounded-full transition-all", barColor)}
                    style={{ width: `${Math.max(pct * 100, 2)}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium">
                    Wait Time
                  </p>
                  <p className="text-sm font-semibold text-white/80 mt-0.5">
                    ~{hospital.wait_time_minutes} min
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium">
                    Utilization
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold mt-0.5",
                      pct > 0.5
                        ? "text-emerald-400"
                        : pct > 0.2
                          ? "text-yellow-300"
                          : "text-red-400"
                    )}
                  >
                    {Math.round((1 - pct) * 100)}%
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5">
                {hospital.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-md bg-[hsl(195,65%,48%)]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(195,65%,55%)] uppercase tracking-wider"
                  >
                    {spec.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Contact */}
              {hospital.contact_phone && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <svg
                    className="h-3.5 w-3.5 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                    />
                  </svg>
                  <span className="text-xs text-white/50">
                    {hospital.contact_phone}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
