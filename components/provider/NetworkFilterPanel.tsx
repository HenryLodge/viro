"use client";

import { useMemo, useState, useCallback } from "react";
import type { GraphNode } from "@/lib/network-engine";

/* ══════════════════════════════════════════════════════════════
   Filter State
   ══════════════════════════════════════════════════════════════ */

export interface NetworkFilterState {
  ageGroups: Set<string>;
  triageTiers: Set<string>;
  symptoms: Set<string>;
  regions: Set<string>;
}

const AGE_GROUPS = ["0-17", "18-34", "35-49", "50-64", "65+"] as const;

const TIER_COLORS: Record<string, string> = {
  "self-care": "#6ee7b7",
  routine: "#7dd3fc",
  urgent: "#c084fc",
  critical: "#fb7185",
};

const TIERS = ["critical", "urgent", "routine", "self-care"] as const;

/** Determine age bucket */
function ageBucket(age: number | null): string {
  if (age == null) return "18-34";
  if (age < 18) return "0-17";
  if (age < 35) return "18-34";
  if (age < 50) return "35-49";
  if (age < 65) return "50-64";
  return "65+";
}

/** Check if any filter is active */
export function isFilterActive(f: NetworkFilterState | null): boolean {
  if (!f) return false;
  return (
    f.ageGroups.size > 0 ||
    f.triageTiers.size > 0 ||
    f.symptoms.size > 0 ||
    f.regions.size > 0
  );
}

/** Test whether a node passes the active filters */
export function nodeMatchesFilter(
  node: GraphNode,
  filters: NetworkFilterState | null,
): boolean {
  if (!filters || !isFilterActive(filters)) return true;

  if (filters.ageGroups.size > 0 && !filters.ageGroups.has(ageBucket(node.age)))
    return false;
  if (
    filters.triageTiers.size > 0 &&
    !filters.triageTiers.has(node.tier ?? "")
  )
    return false;
  if (
    filters.symptoms.size > 0 &&
    !node.symptoms.some((s) => filters.symptoms.has(s))
  )
    return false;
  if (
    filters.regions.size > 0 &&
    (!node.location || !filters.regions.has(node.location))
  )
    return false;

  return true;
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

interface NetworkFilterPanelProps {
  nodes: GraphNode[];
  filters: NetworkFilterState | null;
  onChange: (filters: NetworkFilterState | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function NetworkFilterPanel({
  nodes,
  filters,
  onChange,
  collapsed,
  onToggleCollapse,
}: NetworkFilterPanelProps) {
  const [symptomSearch, setSymptomSearch] = useState("");

  /* ── Derive available options from data ── */
  const { symptomOptions, regionOptions } = useMemo(() => {
    const symCounts = new Map<string, number>();
    const regCounts = new Map<string, number>();
    for (const n of nodes) {
      for (const s of n.symptoms) {
        symCounts.set(s, (symCounts.get(s) ?? 0) + 1);
      }
      if (n.location) {
        regCounts.set(n.location, (regCounts.get(n.location) ?? 0) + 1);
      }
    }
    return {
      symptomOptions: Array.from(symCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([s, c]) => ({ label: s, count: c })),
      regionOptions: Array.from(regCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([r, c]) => ({ label: r, count: c })),
    };
  }, [nodes]);

  const filteredSymptoms = useMemo(() => {
    if (!symptomSearch) return symptomOptions.slice(0, 15);
    const q = symptomSearch.toLowerCase();
    return symptomOptions
      .filter((s) => s.label.toLowerCase().includes(q))
      .slice(0, 15);
  }, [symptomOptions, symptomSearch]);

  /* ── Toggle helpers ── */
  const toggle = useCallback(
    (
      field: "ageGroups" | "triageTiers" | "symptoms" | "regions",
      value: string,
    ) => {
      const current = filters ?? {
        ageGroups: new Set<string>(),
        triageTiers: new Set<string>(),
        symptoms: new Set<string>(),
        regions: new Set<string>(),
      };
      const next = new Set(current[field]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      onChange({ ...current, [field]: next });
    },
    [filters, onChange],
  );

  const reset = useCallback(() => {
    onChange(null);
    setSymptomSearch("");
  }, [onChange]);

  const active = isFilterActive(filters);

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center w-8 h-full rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        title="Show filters"
      >
        <svg
          className="h-4 w-4 text-white/40"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
          />
        </svg>
        {active && (
          <span className="absolute top-2 right-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
        )}
      </button>
    );
  }

  return (
    <div className="w-[200px] xl:w-[220px] flex-shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <svg
            className="h-3.5 w-3.5 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
            />
          </svg>
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
            Filters
          </span>
        </div>
        <div className="flex items-center gap-1">
          {active && (
            <button
              onClick={reset}
              className="text-[9px] text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Reset
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-0.5 text-white/30 hover:text-white/50"
            title="Collapse filters"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* ── Triage Tier ── */}
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Triage Tier
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {TIERS.map((tier) => {
              const isOn = filters?.triageTiers.has(tier) ?? false;
              return (
                <button
                  key={tier}
                  onClick={() => toggle("triageTiers", tier)}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium border transition-all"
                  style={{
                    borderColor: isOn
                      ? TIER_COLORS[tier]
                      : "rgba(255,255,255,0.06)",
                    backgroundColor: isOn
                      ? TIER_COLORS[tier] + "20"
                      : "transparent",
                    color: isOn ? TIER_COLORS[tier] : "rgba(255,255,255,0.4)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[tier] }}
                  />
                  {tier}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Age Group ── */}
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Age Group
          </h4>
          <div className="space-y-1">
            {AGE_GROUPS.map((ag) => {
              const isOn = filters?.ageGroups.has(ag) ?? false;
              return (
                <label
                  key={ag}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => toggle("ageGroups", ag)}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${
                      isOn
                        ? "border-cyan-400 bg-cyan-400/20"
                        : "border-white/15 bg-white/[0.03] group-hover:border-white/25"
                    }`}
                  >
                    {isOn && (
                      <svg
                        className="h-2.5 w-2.5 text-cyan-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-[11px] ${isOn ? "text-white/80" : "text-white/40"}`}
                  >
                    {ag}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ── Symptoms ── */}
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Symptoms
          </h4>
          <input
            type="text"
            value={symptomSearch}
            onChange={(e) => setSymptomSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/70 placeholder-white/20 outline-none focus:border-white/20 mb-2"
          />
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {filteredSymptoms.map(({ label, count }) => {
              const isOn = filters?.symptoms.has(label) ?? false;
              return (
                <label
                  key={label}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => toggle("symptoms", label)}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOn
                        ? "border-cyan-400 bg-cyan-400/20"
                        : "border-white/15 bg-white/[0.03] group-hover:border-white/25"
                    }`}
                  >
                    {isOn && (
                      <svg
                        className="h-2.5 w-2.5 text-cyan-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-[10px] truncate ${isOn ? "text-white/80" : "text-white/40"}`}
                  >
                    {label.replace(/_/g, " ")}
                  </span>
                  <span className="text-[9px] text-white/20 ml-auto flex-shrink-0">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ── Region ── */}
        {regionOptions.length > 0 && (
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
              Region
            </h4>
            <div className="space-y-1">
              {regionOptions.map(({ label, count }) => {
                const isOn = filters?.regions.has(label) ?? false;
                return (
                  <label
                    key={label}
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => toggle("regions", label)}
                  >
                    <span
                      className={`h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOn
                          ? "border-cyan-400 bg-cyan-400/20"
                          : "border-white/15 bg-white/[0.03] group-hover:border-white/25"
                      }`}
                    >
                      {isOn && (
                        <svg
                          className="h-2.5 w-2.5 text-cyan-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-[10px] ${isOn ? "text-white/80" : "text-white/40"}`}
                    >
                      {label}
                    </span>
                    <span className="text-[9px] text-white/20 ml-auto">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
