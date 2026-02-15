"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { DashboardStats } from "@/components/provider/DashboardStats";
import {
  AnomalyAlertsSidebar,
  type RegionData,
} from "@/components/provider/AnomalyAlertsSidebar";
import { RecentPatientsMini } from "@/components/provider/RecentPatientsMini";

/* ── Dynamic import for Globe (client-only, uses Three.js / DOM) ── */
const GlobeVisualization = dynamic(
  () =>
    import("@/components/provider/GlobeVisualization").then(
      (mod) => mod.GlobeVisualization
    ),
  { ssr: false }
);

/* ── Types ── */

interface MiniPatient {
  id: string;
  full_name: string | null;
  age: number | null;
  triage_tier: string | null;
  status: string;
  created_at: string;
}

/* ── Page ── */

export default function ProviderDashboardPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [patients, setPatients] = useState<MiniPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [regionsRes, patientsRes] = await Promise.all([
      supabase
        .from("regions")
        .select("*")
        .order("case_count", { ascending: false }),
      supabase
        .from("patients")
        .select("id, full_name, age, triage_tier, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (regionsRes.data) {
      // Ensure top_symptoms is an array
      const parsed = regionsRes.data.map((r) => ({
        ...r,
        top_symptoms:
          typeof r.top_symptoms === "string"
            ? JSON.parse(r.top_symptoms)
            : Array.isArray(r.top_symptoms)
              ? r.top_symptoms
              : [],
      }));
      setRegions(parsed as RegionData[]);
    }

    if (patientsRes.data) {
      setPatients(patientsRes.data as MiniPatient[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time patient updates for the mini feed
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-patients")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patients" },
        (payload) => {
          const newPatient = payload.new as MiniPatient;
          setPatients((prev) => [newPatient, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <svg
            className="h-10 w-10 text-[hsl(195,65%,55%)] animate-spin mx-auto mb-4"
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
          <p className="text-sm text-white/40">
            Initializing command center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="px-4 sm:px-6 py-4 flex-shrink-0">
        <DashboardStats regions={regions} patients={patients} />
      </div>

      {/* Main content: Globe + Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 sm:px-6 pb-4 gap-4">
        {/* Globe (takes up most space) */}
        <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-black/40 overflow-hidden relative">
          <GlobeVisualization regions={regions} />

          {/* Globe overlay label */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/40 font-medium">
              Global Epidemiological Network
            </span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/[0.06]">
            {[
              { label: "Low", color: "#22c55e" },
              { label: "Moderate", color: "#eab308" },
              { label: "High", color: "#f97316" },
              { label: "Critical", color: "#ef4444" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 overflow-y-auto">
            <AnomalyAlertsSidebar regions={regions} />
          </div>
          <div className="flex-shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
            <RecentPatientsMini patients={patients} />
          </div>
        </div>
      </div>
    </div>
  );
}
