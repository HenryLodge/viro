"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardStats } from "@/components/provider/DashboardStats";
import {
  AnomalyAlertsSidebar,
  type RegionData,
} from "@/components/provider/AnomalyAlertsSidebar";
import { NetworkGraph } from "@/components/provider/NetworkGraph";
import {
  NetworkFilterPanel,
  type NetworkFilterState,
  nodeMatchesFilter,
  isFilterActive,
} from "@/components/provider/NetworkFilterPanel";
import { NetworkTimeSlider } from "@/components/provider/NetworkTimeSlider";
import { NetworkDrillDown } from "@/components/provider/NetworkDrillDown";
import { NetworkQueryBar } from "@/components/provider/NetworkQueryBar";
import { exportFilteredCSV } from "@/lib/export-csv";
import type { AiInsight } from "@/lib/ai-patterns";
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
  const router = useRouter();
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

  /* ── Data analysis state ── */
  const [filters, setFilters] = useState<NetworkFilterState | null>(null);
  const [timeSliderDate, setTimeSliderDate] = useState<Date | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    null
  );
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  /* ── AI pattern insights state ── */
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

  /* ── Date range from node data ── */
  const { minDate, maxDate } = useMemo(() => {
    if (networkNodes.length === 0) {
      return { minDate: new Date(), maxDate: new Date() };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const n of networkNodes) {
      if (n.createdAt) {
        const t = new Date(n.createdAt).getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }
    return {
      minDate: new Date(min === Infinity ? Date.now() : min),
      maxDate: new Date(max === -Infinity ? Date.now() : max),
    };
  }, [networkNodes]);

  /* ── Visible node count (after filters + time) ── */
  const visibleNodeCount = useMemo(() => {
    let count = 0;
    for (const n of networkNodes) {
      if (!nodeMatchesFilter(n, filters)) continue;
      if (timeSliderDate && n.createdAt && new Date(n.createdAt) > timeSliderDate) continue;
      count++;
    }
    return count;
  }, [networkNodes, filters, timeSliderDate]);

  /* ── Available symptoms & regions for AI query bar ── */
  const availableSymptoms = useMemo(() => {
    const syms = new Set<string>();
    for (const n of networkNodes) {
      for (const s of n.symptoms) syms.add(s);
    }
    return Array.from(syms).sort();
  }, [networkNodes]);

  const availableRegions = useMemo(() => {
    const regs = new Set<string>();
    for (const n of networkNodes) {
      if (n.location) regs.add(n.location);
    }
    return Array.from(regs).sort();
  }, [networkNodes]);

  /* ── Drill-down active? ── */
  const isDrillDown = selectedNodeId != null || selectedClusterId != null;

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

    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-patients")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patients" },
        (payload) => {
          const newPatient = payload.new as MiniPatient;
          setPatients((prev) => [newPatient, ...prev].slice(0, 20));
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

  /* ── Fetch AI pattern insights when network data loads ── */
  useEffect(() => {
    if (viewMode !== "network" || networkNodes.length < 5) {
      setAiInsights([]);
      setAiInsightsError(null);
      return;
    }

    let cancelled = false;

    const fetchPatterns = async () => {
      setAiInsightsLoading(true);
      setAiInsightsError(null);
      try {
        const res = await fetch("/api/network/patterns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes: networkNodes,
            edges: networkEdges,
            clusters: networkClusters,
            clusterAlerts,
          }),
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setAiInsights(data.insights ?? []);
        } else {
          const data = await res.json().catch(() => ({}));
          setAiInsightsError(
            (data as { error?: string }).error ?? "Failed to detect patterns"
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch AI patterns:", err);
        setAiInsightsError("Failed to analyze patterns");
      } finally {
        if (!cancelled) setAiInsightsLoading(false);
      }
    };

    fetchPatterns();
    return () => {
      cancelled = true;
    };
  }, [viewMode, networkNodes, networkEdges, networkClusters, clusterAlerts]);

  /* ── Clear selections when switching view ── */
  useEffect(() => {
    if (viewMode !== "network") {
      setSelectedNodeId(null);
      setSelectedClusterId(null);
    }
  }, [viewMode]);

  /* ── Export handler ── */
  const handleExport = useCallback(() => {
    // Export the visible (filtered) nodes
    const visible = networkNodes.filter((n) => {
      if (!nodeMatchesFilter(n, filters)) return false;
      if (timeSliderDate && n.createdAt && new Date(n.createdAt) > timeSliderDate) return false;
      return true;
    });
    exportFilteredCSV(visible);
  }, [networkNodes, filters, timeSliderDate]);

  /* ── Close drill-down ── */
  const closeDrillDown = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedClusterId(null);
  }, []);

  /* ── Node select from graph ── */
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedClusterId(null);
    setSelectedNodeId(nodeId);
  }, []);

  /* ── Cluster select from sidebar ── */
  const handleClusterClick = useCallback((clusterId: string) => {
    setSelectedNodeId(null);
    setSelectedClusterId(clusterId);
  }, []);

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

      {/* View toggle + Export */}
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

        {/* AI Query Bar (network view only) */}
        {viewMode === "network" && networkNodes.length > 0 && (
          <NetworkQueryBar
            availableSymptoms={availableSymptoms}
            availableRegions={availableRegions}
            onFiltersApplied={setFilters}
            onTimeConstraint={setTimeSliderDate}
          />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Generate Report button (network view only) */}
        {viewMode === "network" && networkNodes.length > 0 && (
          <button
            onClick={() => router.push("/provider/reports?generate=true")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            Generate Report
          </button>
        )}

        {/* Export CSV button (network view only) */}
        {viewMode === "network" && networkNodes.length > 0 && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export CSV
            {isFilterActive(filters) && (
              <span className="text-[9px] text-cyan-400">
                ({visibleNodeCount})
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main content: Globe/Network + Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 sm:px-6 pb-4 gap-4">
        {/* Filter panel (network view only) */}
        {viewMode === "network" && networkNodes.length > 0 && (
          <NetworkFilterPanel
            nodes={networkNodes}
            filters={filters}
            onChange={setFilters}
            collapsed={filterCollapsed}
            onToggleCollapse={() => setFilterCollapsed((c) => !c)}
          />
        )}

        {/* Center: Visualization + Time Slider */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Visualization */}
          <div
            className={`flex-1 min-h-0 overflow-hidden relative ${
              viewMode === "network"
                ? "rounded-xl border border-white/[0.04] bg-[#0a0a0f]"
                : "rounded-2xl border border-white/[0.06] bg-black/40"
            }`}
          >
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
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5"
                    >
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
                    activeFilters={filters}
                    timeLimit={timeSliderDate}
                    onNodeSelect={handleNodeSelect}
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

          {/* Time slider (network view only) */}
          {viewMode === "network" && networkNodes.length > 0 && (
            <div className="flex-shrink-0 mt-1 rounded-lg border border-white/[0.04] overflow-hidden">
              <NetworkTimeSlider
                minDate={minDate}
                maxDate={maxDate}
                currentDate={timeSliderDate ?? maxDate}
                onChange={setTimeSliderDate}
                totalCount={networkNodes.length}
                visibleCount={visibleNodeCount}
              />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 overflow-y-auto">
            {isDrillDown ? (
              <NetworkDrillDown
                selectedNodeId={selectedNodeId}
                selectedClusterId={selectedClusterId}
                nodes={networkNodes}
                edges={networkEdges}
                clusters={networkClusters}
                onClose={closeDrillDown}
              />
            ) : (
              <AnomalyAlertsSidebar
                regions={regions}
                clusterAlerts={viewMode === "network" ? clusterAlerts : []}
                onClusterClick={
                  viewMode === "network" ? handleClusterClick : undefined
                }
                aiInsights={viewMode === "network" ? aiInsights : []}
                aiInsightsLoading={
                  viewMode === "network" ? aiInsightsLoading : false
                }
                aiInsightsError={
                  viewMode === "network" ? aiInsightsError : null
                }
                onInsightFocus={
                  viewMode === "network" ? setFilters : undefined
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
