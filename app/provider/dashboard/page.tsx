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
import { NetworkGraph } from "@/components/provider/NetworkGraph";
import type {
  GraphNode,
  GraphEdge,
  Cluster,
  ClusterAlert,
} from "@/lib/network-engine";

/* ── Dynamic import for Globe (client-only, uses Three.js / DOM) ── */
const GlobeVisualization = dynamic(
  () =>
    import("@/components/provider/GlobeVisualization").then(
      (mod) => mod.GlobeVisualization
    ),
  { ssr: false }
);

/* ── Types ── */

type ViewMode = "globe" | "network";

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

  /* ── Network graph state ── */
  const [viewMode, setViewMode] = useState<ViewMode>("globe");
  const [networkNodes, setNetworkNodes] = useState<GraphNode[]>([]);
  const [networkEdges, setNetworkEdges] = useState<GraphEdge[]>([]);
  const [networkClusters, setNetworkClusters] = useState<Cluster[]>([]);
  const [clusterAlerts, setClusterAlerts] = useState<ClusterAlert[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);

  /* ── Fetch network graph data ── */
  const fetchNetworkData = useCallback(async () => {
    setNetworkLoading(true);
    try {
      const res = await fetch("/api/network");
      if (res.ok) {
        const data = await res.json();
        setNetworkNodes(data.nodes ?? []);
        setNetworkEdges(data.edges ?? []);
        setNetworkClusters(data.clusters ?? []);
        setClusterAlerts(data.clusterAlerts ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch network data:", err);
    } finally {
      setNetworkLoading(false);
    }
  }, []);

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
          // Auto-refresh network data when in network view
          if (viewMode === "network") {
            fetchNetworkData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  /* ── Fetch network data when switching to network view ── */
  useEffect(() => {
    if (viewMode === "network") {
      fetchNetworkData();
    }
  }, [viewMode, fetchNetworkData]);

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

      {/* View toggle */}
      <div className="px-4 sm:px-6 pb-2 flex-shrink-0 flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          <button
            onClick={() => setViewMode("globe")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "globe"
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Globe View
          </button>
          <button
            onClick={() => setViewMode("network")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "network"
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Network View
          </button>
        </div>
        {viewMode === "network" && networkLoading && (
          <span className="text-[10px] text-white/30 animate-pulse">
            Computing network...
          </span>
        )}
      </div>

      {/* Main content: Globe/Network + Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 sm:px-6 pb-4 gap-4">
        {/* Visualization (takes up most space) */}
        <div className={`flex-1 min-h-0 overflow-hidden relative ${
          viewMode === "network"
            ? "rounded-xl border border-white/[0.04] bg-[#0a0a0f]"
            : "rounded-2xl border border-white/[0.06] bg-black/40"
        }`}>
          {viewMode === "globe" ? (
            <>
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
                    <span className="text-[10px] text-white/50">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {networkLoading && networkNodes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg
                      className="h-8 w-8 text-[hsl(195,65%,55%)] animate-spin mx-auto mb-3"
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
                    <p className="text-xs text-white/30">
                      Computing symptom network...
                    </p>
                  </div>
                </div>
              ) : (
                <NetworkGraph
                  nodes={networkNodes}
                  edges={networkEdges}
                  clusters={networkClusters}
                />
              )}

              {/* Network overlay label */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] text-white/40 font-medium">
                  Symptom Network Graph
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 overflow-y-auto">
            <AnomalyAlertsSidebar
              regions={regions}
              clusterAlerts={viewMode === "network" ? clusterAlerts : []}
            />
          </div>
          <div className="flex-shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
            <RecentPatientsMini patients={patients} />
          </div>
        </div>
      </div>
    </div>
  );
}
