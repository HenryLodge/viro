"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReportSection } from "@/lib/ai-report";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

interface ReportData {
  id: string;
  title: string;
  audience: string;
  scope: string;
  summary: string;
  sections: ReportSection[];
  patient_count: number;
  cluster_count: number;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
}

/* ══════════════════════════════════════════════════════════════
   Badge Colors
   ══════════════════════════════════════════════════════════════ */

const AUDIENCE_BADGE_COLORS: Record<string, string> = {
  government: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  hospital: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  technical: "bg-purple-500/15 text-purple-400 ring-purple-500/30",
};

const SECTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  narrative: (
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  data_summary: (
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
        d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
      />
    </svg>
  ),
  recommendations: (
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  forecast: (
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
        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      />
    </svg>
  ),
};

/* ══════════════════════════════════════════════════════════════
   Simple Markdown Renderer
   ══════════════════════════════════════════════════════════════ */

function renderMarkdown(content: string): React.ReactNode {
  // Split into paragraphs / blocks
  const blocks = content.split(/\n\n+/);

  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Headings
    if (trimmed.startsWith("### ")) {
      return (
        <h5
          key={idx}
          className="text-[12px] font-semibold text-white/70 mt-3 mb-1"
        >
          {trimmed.slice(4)}
        </h5>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h4
          key={idx}
          className="text-[13px] font-semibold text-white/80 mt-4 mb-1"
        >
          {trimmed.slice(3)}
        </h4>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h3
          key={idx}
          className="text-sm font-bold text-white/90 mt-4 mb-2"
        >
          {trimmed.slice(2)}
        </h3>
      );
    }

    // Bullet list
    if (trimmed.match(/^[-*] /m)) {
      const items = trimmed.split(/\n/).filter((l) => l.trim());
      return (
        <ul key={idx} className="space-y-1 my-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="text-[12px] text-white/50 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-1 before:top-[7px] before:h-1 before:w-1 before:rounded-full before:bg-white/20"
            >
              {item.replace(/^[-*]\s*/, "")}
            </li>
          ))}
        </ul>
      );
    }

    // Numbered list
    if (trimmed.match(/^\d+\. /m)) {
      const items = trimmed.split(/\n/).filter((l) => l.trim());
      return (
        <ol key={idx} className="space-y-1 my-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="text-[12px] text-white/50 leading-relaxed pl-5 relative"
            >
              <span className="absolute left-0 text-white/25 text-[11px] font-medium">
                {i + 1}.
              </span>
              {item.replace(/^\d+\.\s*/, "")}
            </li>
          ))}
        </ol>
      );
    }

    // Regular paragraph -- apply bold/italic inline
    const formatted = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/70 font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-white/40">$1</em>');

    return (
      <p
        key={idx}
        className="text-[12px] text-white/50 leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

/* ══════════════════════════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════════════════════════ */

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data as ReportData);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(
          (errData as { error?: string }).error ?? "Failed to load report",
        );
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
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
          <p className="text-xs text-white/30">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <svg
            className="h-12 w-12 text-red-400/30 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h3 className="text-sm font-medium text-white/50 mb-1">
            {error ?? "Report not found"}
          </h3>
          <button
            onClick={() => router.push("/provider/reports")}
            className="text-[12px] text-[hsl(195,65%,55%)] hover:underline mt-2"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const badgeColor =
    AUDIENCE_BADGE_COLORS[report.audience] ??
    "bg-white/10 text-white/50 ring-white/20";

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-5 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push("/provider/reports")}
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
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-white/90">
                {report.title}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${badgeColor}`}
              >
                {report.audience}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/30">
              <span>
                {new Date(report.created_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span>{report.patient_count} patients</span>
              <span>{report.cluster_count} clusters</span>
              <span>
                {report.date_range_start?.slice(0, 10)} to{" "}
                {report.date_range_end?.slice(0, 10)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Executive Summary */}
          <div className="rounded-xl border border-[hsl(195,65%,48%)]/20 bg-[hsl(195,65%,48%)]/5 p-5 mb-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(195,65%,55%)]/70 mb-2">
              Executive Summary
            </h3>
            <p className="text-[13px] text-white/60 leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {report.sections.map((section, idx) => (
              <section
                key={section.id || idx}
                className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white/25">
                    {SECTION_TYPE_ICONS[section.type] ??
                      SECTION_TYPE_ICONS.narrative}
                  </span>
                  <h3 className="text-[13px] font-semibold text-white/80">
                    {section.title}
                  </h3>
                  <span className="text-[9px] text-white/15 uppercase tracking-wider">
                    {section.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="prose-sm">
                  {renderMarkdown(section.content)}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/15 text-center">
              This report was generated by VIRO AI on{" "}
              {new Date(report.created_at).toLocaleString("en-US")}. Data
              reflects surveillance information available at time of generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
