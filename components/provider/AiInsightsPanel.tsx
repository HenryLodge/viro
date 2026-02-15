"use client";

import { cn } from "@/lib/utils";
import type { AiInsight } from "@/lib/ai-patterns";
import type { NetworkFilterState } from "@/components/provider/NetworkFilterPanel";

/* ── Category config ── */

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; accent: string }
> = {
  symptom_pattern: {
    label: "Symptom Pattern",
    icon: "🧬",
    accent: "text-violet-400",
  },
  demographic_anomaly: {
    label: "Demographic Anomaly",
    icon: "👥",
    accent: "text-amber-400",
  },
  geographic_corridor: {
    label: "Geographic Corridor",
    icon: "🗺️",
    accent: "text-emerald-400",
  },
  temporal_spike: {
    label: "Temporal Spike",
    icon: "📈",
    accent: "text-rose-400",
  },
};

/* ── Confidence config ── */

const CONFIDENCE_CONFIG: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  high: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  medium: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    ring: "ring-amber-500/30",
  },
  low: {
    bg: "bg-white/[0.08]",
    text: "text-white/50",
    ring: "ring-white/10",
  },
};

/* ── Helpers ── */

/**
 * Converts the JSON-safe suggestedFilters (arrays) into a
 * `NetworkFilterState` with Sets for direct use by the graph.
 */
function toFilterState(
  suggestedFilters: AiInsight["suggestedFilters"],
): NetworkFilterState {
  return {
    ageGroups: new Set(suggestedFilters.ageGroups ?? []),
    triageTiers: new Set(suggestedFilters.triageTiers ?? []),
    symptoms: new Set(suggestedFilters.symptoms ?? []),
    regions: new Set(suggestedFilters.regions ?? []),
  };
}

/* ── Component ── */

export function AiInsightsPanel({
  insights,
  loading = false,
  error = null,
  onFocus,
}: {
  insights: AiInsight[];
  loading?: boolean;
  error?: string | null;
  onFocus?: (filters: NetworkFilterState) => void;
}) {
  /* ── Loading state ── */
  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            AI Insights
          </h3>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-violet-400 animate-spin"
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
              Analyzing patterns with AI...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            AI Insights
          </h3>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <p className="text-xs text-red-400/80">{error}</p>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (insights.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            AI Insights
          </h3>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs text-white/30">
            No novel patterns detected. All signals are covered by existing
            cluster alerts.
          </p>
        </div>
      </div>
    );
  }

  /* ── Insights list ── */
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          AI Insights ({insights.length})
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const cat =
            CATEGORY_CONFIG[insight.category] ??
            CATEGORY_CONFIG.symptom_pattern;
          const conf =
            CONFIDENCE_CONFIG[insight.confidence] ?? CONFIDENCE_CONFIG.medium;

          return (
            <div
              key={insight.id}
              className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-4 space-y-3"
            >
              {/* Header: title + confidence badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 leading-snug">
                    {insight.title}
                  </p>
                  <p className={cn("text-[10px] mt-0.5", cat.accent)}>
                    {cat.icon} {cat.label}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 flex-shrink-0 capitalize",
                    conf.bg,
                    conf.text,
                    conf.ring,
                  )}
                >
                  {insight.confidence}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-white/50 leading-relaxed">
                {insight.description}
              </p>

              {/* Affected regions */}
              {insight.affectedRegions.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">
                    Affected Regions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {insight.affectedRegions.map((region) => (
                      <span
                        key={region}
                        className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/50"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus button */}
              {onFocus && (
                <div className="pt-2 border-t border-violet-500/10">
                  <button
                    onClick={() => onFocus(toFilterState(insight.suggestedFilters))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/30 px-3 py-1.5 text-[11px] font-medium text-violet-300 transition-all"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                    Focus Graph
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
