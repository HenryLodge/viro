"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { GraphNode, GraphEdge, Cluster } from "@/lib/network-engine";
import {
  computeDailyCaseCounts,
  type ForecastResult,
  type DailyCaseCount,
} from "@/lib/ai-forecast";

/* ══════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════ */

const TIER_COLORS: Record<string, string> = {
  "self-care": "#6ee7b7",
  routine: "#7dd3fc",
  urgent: "#c084fc",
  critical: "#fb7185",
};

const AGE_BUCKETS = ["0-17", "18-34", "35-49", "50-64", "65+"] as const;

function ageBucket(age: number | null): string {
  if (age == null) return "18-34";
  if (age < 18) return "0-17";
  if (age < 35) return "18-34";
  if (age < 50) return "35-49";
  if (age < 65) return "50-64";
  return "65+";
}

/* ══════════════════════════════════════════════════════════════
   Risk Level Badge
   ══════════════════════════════════════════════════════════════ */

const RISK_COLORS: Record<string, { bg: string; text: string; ring: string }> =
  {
    critical: {
      bg: "bg-red-500/15",
      text: "text-red-400",
      ring: "ring-red-500/30",
    },
    high: {
      bg: "bg-orange-500/15",
      text: "text-orange-400",
      ring: "ring-orange-500/30",
    },
    moderate: {
      bg: "bg-yellow-500/15",
      text: "text-yellow-400",
      ring: "ring-yellow-500/30",
    },
    low: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      ring: "ring-emerald-500/30",
    },
  };

/* ══════════════════════════════════════════════════════════════
   Forecast Section (inside ClusterDrillDown)
   ══════════════════════════════════════════════════════════════ */

function ForecastSection({
  cluster,
  clusterNodes,
}: {
  cluster: Cluster;
  clusterNodes: GraphNode[];
}) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dailyCases = useMemo(
    () => computeDailyCaseCounts(clusterNodes),
    [clusterNodes],
  );

  const fetchForecast = useCallback(async () => {
    if (dailyCases.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/network/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCases,
          clusterMeta: {
            clusterId: cluster.id,
            totalSize: cluster.size,
            sharedSymptoms: cluster.sharedSymptoms,
            geographicSpread: cluster.geographicSpread,
            growthRate:
              cluster.size >= 5
                ? "Rapid"
                : cluster.size >= 3
                  ? "Moderate"
                  : "Emerging",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setForecast(data as ForecastResult);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ?? "Failed to generate forecast",
        );
      }
    } catch (err) {
      console.error("Forecast fetch error:", err);
      setError("Failed to generate forecast");
    } finally {
      setLoading(false);
    }
  }, [dailyCases, cluster]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  /* ── Chart data: merge actual + projected ── */
  const chartData = useMemo(() => {
    if (!forecast) return null;

    const actual: { date: string; actual: number; projected?: number }[] =
      dailyCases.map((d) => ({
        date: d.date.slice(5), // "MM-DD"
        actual: d.cases,
      }));

    // Add the last actual point as the first projected point (for continuity)
    const lastActual = dailyCases[dailyCases.length - 1];
    const projected: {
      date: string;
      actual?: number;
      projected: number;
    }[] = [];

    if (lastActual) {
      projected.push({
        date: lastActual.date.slice(5),
        actual: lastActual.cases,
        projected: lastActual.cases,
      });
    }

    for (const d of forecast.projectedDays) {
      projected.push({
        date: d.date.slice(5),
        projected: d.cases,
      });
    }

    return [...actual.slice(0, -1), ...projected];
  }, [dailyCases, forecast]);

  if (dailyCases.length < 2) {
    return (
      <section>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
          Trend Forecast
        </h4>
        <p className="text-[11px] text-white/30">
          Not enough data points for forecast.
        </p>
      </section>
    );
  }

  const riskStyle = forecast
    ? RISK_COLORS[forecast.riskLevel] ?? RISK_COLORS.moderate
    : null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Trend Forecast
        </h4>
        {forecast && riskStyle && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${riskStyle.bg} ${riskStyle.text} ring-1 ${riskStyle.ring}`}
          >
            {forecast.riskLevel}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <svg
            className="h-4 w-4 text-cyan-400 animate-spin"
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
          <span className="text-[11px] text-white/30">
            Generating forecast...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-[11px] text-red-400">{error}</p>
          <button
            onClick={fetchForecast}
            className="text-[10px] text-red-400/70 hover:text-red-400 underline mt-1"
          >
            Retry
          </button>
        </div>
      )}

      {forecast && chartData && (
        <>
          {/* ── Area Chart ── */}
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient
                    id="actualGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="projectedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <ReferenceLine
                  x={dailyCases[dailyCases.length - 1]?.date.slice(5)}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="3 3"
                  label={{
                    value: "Now",
                    position: "top",
                    fill: "rgba(255,255,255,0.3)",
                    fontSize: 9,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  name="Actual"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#projectedGradient)"
                  name="Projected"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[9px]">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-cyan-400 rounded" />
              <span className="text-white/40">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 7px)",
                }}
              />
              <span className="text-white/40">Projected</span>
            </div>
          </div>

          {/* ── Peak Estimate ── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <p className="text-[11px] text-white/60 font-medium">
              {forecast.peakEstimate}
            </p>
          </div>

          {/* ── Narrative ── */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <p className="text-[11px] text-white/50 leading-relaxed">
              {forecast.narrative}
            </p>
          </div>

          {/* ── Confidence Note ── */}
          <p className="text-[9px] text-white/20 italic">
            {forecast.confidenceNote}
          </p>
        </>
      )}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   Cluster Drill-Down
   ══════════════════════════════════════════════════════════════ */

function ClusterDrillDown({
  cluster,
  clusterNodes,
  onClose,
}: {
  cluster: Cluster;
  clusterNodes: GraphNode[];
  onClose: () => void;
}) {
  /* ── Age distribution ── */
  const ageData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of AGE_BUCKETS) counts.set(b, 0);
    for (const n of clusterNodes) {
      const b = ageBucket(n.age);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return AGE_BUCKETS.map((b) => ({ name: b, count: counts.get(b) ?? 0 }));
  }, [clusterNodes]);

  /* ── Tier breakdown ── */
  const tierData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of clusterNodes) {
      const t = n.tier ?? "unknown";
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [clusterNodes]);

  /* ── Top symptoms ── */
  const symptomData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of clusterNodes) {
      for (const s of n.symptoms) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));
  }, [clusterNodes]);

  /* ── Regions ── */
  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const n of clusterNodes) {
      if (n.location) set.add(n.location);
    }
    return Array.from(set);
  }, [clusterNodes]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white/90">
            Cluster Analysis
          </p>
          <p className="text-[11px] text-white/40 mt-0.5">
            {cluster.size} patients &middot; Score{" "}
            {cluster.score.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cluster.isAlert && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
              Alert
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Age Distribution ── */}
      <section>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
          Age Distribution
        </h4>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ageData}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              />
              <Bar dataKey="count" fill="#22d3ee" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Triage Tier Breakdown ── */}
      <section>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
          Triage Tier Breakdown
        </h4>
        <div className="flex items-center gap-3">
          <div className="h-24 w-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={38}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {tierData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TIER_COLORS[entry.name] ?? "#666"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1">
            {tierData.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: TIER_COLORS[t.name] ?? "#666",
                  }}
                />
                <span className="text-[10px] text-white/50">{t.name}</span>
                <span className="text-[10px] text-white/70 font-medium">
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Symptoms ── */}
      <section>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
          Top Symptoms
        </h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={symptomData}
              layout="vertical"
              margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 8, fill: "rgba(255,255,255,0.4)" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              />
              <Bar dataKey="count" fill="#c084fc" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Geographic Spread ── */}
      {regions.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Geographic Spread
          </h4>
          <div className="flex flex-wrap gap-1">
            {regions.map((r) => (
              <span
                key={r}
                className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/50"
              >
                {r}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Travel Commonalities ── */}
      {cluster.travelCommonalities.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Travel Commonalities
          </h4>
          <div className="flex flex-wrap gap-1">
            {cluster.travelCommonalities.map((t) => (
              <span
                key={t}
                className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/50"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Shared Symptoms ── */}
      {cluster.sharedSymptoms.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Shared Symptoms
          </h4>
          <div className="flex flex-wrap gap-1">
            {cluster.sharedSymptoms.map((s) => (
              <span
                key={s}
                className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-400/70"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Trend Forecast ── */}
      <div className="border-t border-white/[0.06] pt-4">
        <ForecastSection cluster={cluster} clusterNodes={clusterNodes} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Node Drill-Down
   ══════════════════════════════════════════════════════════════ */

function NodeDrillDown({
  node,
  edges,
  allNodes,
  onClose,
}: {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onClose: () => void;
}) {
  /* ── Connected nodes ── */
  const connections = useMemo(() => {
    const result: { node: GraphNode; weight: number; reason: string }[] = [];
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
    for (const e of edges) {
      if (e.source === node.id || e.target === node.id) {
        const otherId = e.source === node.id ? e.target : e.source;
        const other = nodeMap.get(otherId);
        if (other) {
          result.push({ node: other, weight: e.weight, reason: e.reason });
        }
      }
    }
    return result.sort((a, b) => b.weight - a.weight);
  }, [node, edges, allNodes]);

  /* ── Similar cases (same region + tier) ── */
  const similarCount = useMemo(() => {
    if (!node.location || !node.tier) return 0;
    return allNodes.filter(
      (n) =>
        n.id !== node.id &&
        n.location === node.location &&
        n.tier === node.tier,
    ).length;
  }, [node, allNodes]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white/90">{node.label}</p>
          {node.location && (
            <p className="text-[11px] text-white/40 mt-0.5">
              {node.location}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {node.tier && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1"
              style={{
                backgroundColor: (TIER_COLORS[node.tier] ?? "#666") + "20",
                color: TIER_COLORS[node.tier] ?? "#666",
                boxShadow: `inset 0 0 0 1px ${TIER_COLORS[node.tier] ?? "#666"}40`,
              }}
            >
              {node.tier}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Details ── */}
      <section className="space-y-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Details
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-white/30">Age</span>
            <p className="text-white/70 font-medium">
              {node.age ?? "Unknown"}
            </p>
          </div>
          <div>
            <span className="text-white/30">Triage</span>
            <p
              className="font-medium"
              style={{ color: TIER_COLORS[node.tier ?? ""] ?? "#a1a1aa" }}
            >
              {node.tier ?? "Unknown"}
            </p>
          </div>
          <div>
            <span className="text-white/30">Connections</span>
            <p className="text-white/70 font-medium">
              {node.connectionCount}
            </p>
          </div>
          <div>
            <span className="text-white/30">Similar cases</span>
            <p className="text-white/70 font-medium">{similarCount}</p>
          </div>
        </div>
      </section>

      {/* ── Symptoms ── */}
      {node.symptoms.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Symptoms
          </h4>
          <div className="flex flex-wrap gap-1">
            {node.symptoms.map((s) => (
              <span
                key={s}
                className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/50"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Severity Flags ── */}
      {node.severityFlags.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Severity Flags
          </h4>
          <div className="flex flex-wrap gap-1">
            {node.severityFlags.map((s) => (
              <span
                key={s}
                className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400/70"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Risk Factors ── */}
      {node.riskFactors.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Risk Factors
          </h4>
          <div className="flex flex-wrap gap-1">
            {node.riskFactors.map((r) => (
              <span
                key={r}
                className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400/70"
              >
                {r}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Travel History ── */}
      {node.travelHistory && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Travel History
          </h4>
          <p className="text-[11px] text-white/50 leading-relaxed">
            {node.travelHistory}
          </p>
        </section>
      )}

      {/* ── Exposure History ── */}
      {node.exposureHistory && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Exposure History
          </h4>
          <p className="text-[11px] text-white/50 leading-relaxed">
            {node.exposureHistory}
          </p>
        </section>
      )}

      {/* ── Connections ── */}
      {connections.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Connections ({connections.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {connections.slice(0, 10).map(({ node: other, weight, reason }) => (
              <div
                key={other.id}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60 font-medium truncate">
                    {other.label}
                  </span>
                  <span className="text-[9px] text-cyan-400 font-medium flex-shrink-0 ml-2">
                    {Math.round(weight * 100)}%
                  </span>
                </div>
                <p className="text-[9px] text-white/30 mt-0.5 truncate">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Created At ── */}
      {node.createdAt && (
        <p className="text-[9px] text-white/20">
          Checked in{" "}
          {new Date(node.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Drill-Down Container
   ══════════════════════════════════════════════════════════════ */

interface NetworkDrillDownProps {
  selectedNodeId: string | null;
  selectedClusterId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  onClose: () => void;
}

export function NetworkDrillDown({
  selectedNodeId,
  selectedClusterId,
  nodes,
  edges,
  clusters,
  onClose,
}: NetworkDrillDownProps) {
  /* ── Resolve selection ── */
  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null),
    [selectedNodeId, nodes],
  );

  const selectedCluster = useMemo(
    () =>
      selectedClusterId
        ? clusters.find((c) => c.id === selectedClusterId)
        : null,
    [selectedClusterId, clusters],
  );

  const clusterNodes = useMemo(() => {
    if (!selectedCluster) return [];
    const ids = new Set(selectedCluster.patientIds);
    return nodes.filter((n) => ids.has(n.id));
  }, [selectedCluster, nodes]);

  if (selectedCluster) {
    return (
      <ClusterDrillDown
        cluster={selectedCluster}
        clusterNodes={clusterNodes}
        onClose={onClose}
      />
    );
  }

  if (selectedNode) {
    return (
      <NodeDrillDown
        node={selectedNode}
        edges={edges}
        allNodes={nodes}
        onClose={onClose}
      />
    );
  }

  return null;
}
