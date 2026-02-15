"use client";

import { cn } from "@/lib/utils";
import type { ClusterAlert } from "@/lib/network-engine";

/* ── Types ── */

export interface RegionData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  case_count: number;
  severity: string;
  anomaly_flag: boolean;
  top_symptoms: string[];
  updated_at: string;
}

/* ── Severity config ── */

const SEVERITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; ring: string }
> = {
  critical: {
    label: "Critical",
    bg: "bg-red-500/15",
    text: "text-red-400",
    ring: "ring-red-500/30",
  },
  high: {
    label: "High",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    ring: "ring-orange-500/30",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
    ring: "ring-yellow-500/30",
  },
  low: {
    label: "Low",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    ring: "ring-emerald-500/30",
  },
};

/* ── Containment suggestions ── */

const CONTAINMENT_ACTIONS: Record<string, string[]> = {
  critical: [
    "Deploy emergency response teams immediately",
    "Activate pop-up testing and triage clinics",
    "Issue public health advisory for affected region",
    "Reallocate ICU staffing from low-severity areas",
  ],
  high: [
    "Increase testing capacity in the region",
    "Deploy mobile vaccination units",
    "Issue targeted messaging to at-risk populations",
    "Begin staffing reallocation planning",
  ],
  moderate: [
    "Monitor symptom trends closely",
    "Prepare contingency staffing plans",
    "Increase public awareness messaging",
  ],
  low: ["Continue routine monitoring", "Maintain standard staffing levels"],
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

export function AnomalyAlertsSidebar({
  regions,
  clusterAlerts = [],
}: {
  regions: RegionData[];
  clusterAlerts?: ClusterAlert[];
}) {
  const anomalies = regions
    .filter((r) => r.anomaly_flag)
    .sort((a, b) => b.case_count - a.case_count);

  const topRegions = regions
    .filter((r) => !r.anomaly_flag)
    .sort((a, b) => b.case_count - a.case_count)
    .slice(0, 5);

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* ── Cluster Alerts (Network View) ── */}
      {clusterAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Cluster Alerts ({clusterAlerts.length})
            </h3>
          </div>
          <div className="space-y-3">
            {clusterAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      {alert.cluster_label}
                    </p>
                    <p className="text-[11px] text-white/35">
                      Updated {timeAgo(alert.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                      alert.growth_rate === "Rapid"
                        ? "bg-red-500/15 text-red-400 ring-red-500/30"
                        : alert.growth_rate === "Moderate"
                          ? "bg-orange-500/15 text-orange-400 ring-orange-500/30"
                          : "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
                    )}
                  >
                    {alert.growth_rate}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-lg font-bold text-cyan-400">
                      {alert.patient_count}
                    </p>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">
                      Linked patients
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">
                      Shared Symptoms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {alert.shared_symptoms.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/50"
                        >
                          {s.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {alert.geographic_spread && (
                  <div className="text-[10px] text-white/40">
                    <span className="text-white/25">Geo: </span>
                    {alert.geographic_spread}
                  </div>
                )}

                {alert.travel_commonalities &&
                  alert.travel_commonalities !== "No common travel" && (
                    <div className="text-[10px] text-white/40">
                      <span className="text-white/25">Travel: </span>
                      {alert.travel_commonalities}
                    </div>
                  )}

                {/* AI Recommended Action */}
                <div className="pt-2 border-t border-cyan-500/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/60 mb-1.5">
                    Recommended Actions
                  </p>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {alert.recommended_action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomaly alerts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Anomaly Alerts ({anomalies.length})
          </h3>
        </div>

        {anomalies.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-white/30">
              No anomalies detected. All regions within normal parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((region) => {
              const sev =
                SEVERITY_CONFIG[region.severity] ?? SEVERITY_CONFIG.moderate;
              const actions =
                CONTAINMENT_ACTIONS[region.severity] ??
                CONTAINMENT_ACTIONS.moderate;

              return (
                <div
                  key={region.id}
                  className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white/90">
                        {region.name}
                      </p>
                      <p className="text-[11px] text-white/35">
                        Updated {timeAgo(region.updated_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                        sev.bg,
                        sev.text,
                        sev.ring
                      )}
                    >
                      {sev.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-bold text-red-400">
                        {region.case_count.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-white/35 uppercase tracking-wider">
                        Cases
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">
                        Top Symptoms
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {region.top_symptoms.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/50"
                          >
                            {s.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Containment recommendations */}
                  <div className="pt-2 border-t border-red-500/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/60 mb-1.5">
                      Recommended Actions
                    </p>
                    <ul className="space-y-1">
                      {actions.slice(0, 3).map((action, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[11px] text-white/50"
                        >
                          <span className="text-red-400/60 mt-0.5 flex-shrink-0">
                            &bull;
                          </span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top regions (non-anomaly) */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
          Top Monitoring Regions
        </h3>
        <div className="space-y-2">
          {topRegions.map((region) => {
            const sev =
              SEVERITY_CONFIG[region.severity] ?? SEVERITY_CONFIG.low;
            return (
              <div
                key={region.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white/80 truncate">
                    {region.name}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {region.case_count.toLocaleString()} cases
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 flex-shrink-0",
                    sev.bg,
                    sev.text,
                    sev.ring
                  )}
                >
                  {sev.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
