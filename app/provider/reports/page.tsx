"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

type Audience = "government" | "hospital" | "technical";

interface ReportListItem {
  id: string;
  title: string;
  audience: string;
  scope: string;
  summary: string;
  patient_count: number;
  cluster_count: number;
  created_at: string;
}

/* ══════════════════════════════════════════════════════════════
   Audience Cards
   ══════════════════════════════════════════════════════════════ */

const AUDIENCE_OPTIONS: {
  value: Audience;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "government",
    label: "Government / Public Health",
    description:
      "Formal SitRep with risk assessment, containment recommendations, and resource guidance.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
        />
      </svg>
    ),
  },
  {
    value: "hospital",
    label: "Hospital Administration",
    description:
      "Executive briefing with key findings, risk level, and operational recommendations.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
        />
      </svg>
    ),
  },
  {
    value: "technical",
    label: "Technical / Epidemiology",
    description:
      "Data-heavy analysis with statistical summaries, cluster methodology, and confidence notes.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-1.5M12 12.75l3-1.5M12 12.75L9 11.25M12 12.75V15m0 6.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
  },
];

const AUDIENCE_BADGE_COLORS: Record<string, string> = {
  government: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  hospital: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  technical: "bg-purple-500/15 text-purple-400 ring-purple-500/30",
};

/* ══════════════════════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════════════════════ */

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenGenerator = searchParams.get("generate") === "true";

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(shouldOpenGenerator);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(
    null,
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  /* ── Fetch reports ── */
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── Generate report ── */
  const handleGenerate = useCallback(async () => {
    if (!selectedAudience) return;

    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience: selectedAudience, scope: "full" }),
      });

      if (res.ok) {
        const report = await res.json();
        if (report.id) {
          // Store the full report in sessionStorage so the detail page
          // can display it even if the DB table doesn't exist yet
          try {
            sessionStorage.setItem(
              `viro-report-${report.id}`,
              JSON.stringify(report),
            );
          } catch {
            // sessionStorage may be unavailable / full — non-critical
          }
          router.push(`/provider/reports/${report.id}`);
        } else {
          // Report generated but not stored -- refresh list
          await fetchReports();
          setShowGenerator(false);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setGenError(
          (data as { error?: string }).error ?? "Failed to generate report",
        );
      }
    } catch (err) {
      console.error("Report generation error:", err);
      setGenError("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [selectedAudience, router, fetchReports]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-5 flex-shrink-0 flex items-center justify-between border-b border-white/[0.06]">
        <div>
          <h1 className="text-lg font-semibold text-white/90">Reports</h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            AI-generated intelligence briefings for public health stakeholders
          </p>
        </div>
        <button
          onClick={() => {
            setShowGenerator(true);
            setSelectedAudience(null);
            setGenError(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[hsl(195,65%,48%)] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(195,65%,42%)] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
          Generate Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {/* ── Generate Form ── */}
        {showGenerator && (
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/80">
                Generate New Report
              </h2>
              <button
                onClick={() => setShowGenerator(false)}
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

            <p className="text-[12px] text-white/40 mb-5">
              Select the target audience. The AI will adapt tone, depth, and
              structure accordingly.
            </p>

            {/* Audience cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedAudience(opt.value)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    selectedAudience === opt.value
                      ? "border-[hsl(195,65%,48%)]/50 bg-[hsl(195,65%,48%)]/5 ring-1 ring-[hsl(195,65%,48%)]/20"
                      : "border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15] hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`mb-3 ${selectedAudience === opt.value ? "text-[hsl(195,65%,55%)]" : "text-white/30"}`}
                  >
                    {opt.icon}
                  </div>
                  <h3
                    className={`text-[13px] font-semibold mb-1 ${selectedAudience === opt.value ? "text-white/90" : "text-white/60"}`}
                  >
                    {opt.label}
                  </h3>
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Error */}
            {genError && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-[12px] text-red-400">{genError}</p>
              </div>
            )}

            {/* Generate button */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={!selectedAudience || generating}
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(195,65%,48%)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[hsl(195,65%,42%)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
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
                    Generating report...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
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
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Report List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
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
              <p className="text-xs text-white/30">Loading reports...</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="h-12 w-12 text-white/10 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h3 className="text-sm font-medium text-white/40 mb-1">
              No reports yet
            </h3>
            <p className="text-[12px] text-white/25">
              Generate your first intelligence report using the button above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-3">
              Previous Reports ({reports.length})
            </h2>
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => router.push(`/provider/reports/${report.id}`)}
                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[13px] font-medium text-white/70 group-hover:text-white/90 truncate transition-colors">
                        {report.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 flex-shrink-0 ${
                          AUDIENCE_BADGE_COLORS[report.audience] ??
                          "bg-white/10 text-white/50 ring-white/20"
                        }`}
                      >
                        {report.audience}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/30 line-clamp-2 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-white/25">
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {report.patient_count} patients &middot;{" "}
                      {report.cluster_count} clusters
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
