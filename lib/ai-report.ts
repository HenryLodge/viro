import OpenAI from "openai";
import type {
  GraphNode,
  GraphEdge,
  Cluster,
  ClusterAlert,
} from "@/lib/network-engine";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export interface ReportSection {
  id: string;
  title: string;
  content: string; // markdown-formatted text
  type: "narrative" | "data_summary" | "recommendations" | "forecast";
}

export interface Report {
  id: string;
  title: string;
  audience: "government" | "hospital" | "technical";
  scope: string;
  summary: string;
  sections: ReportSection[];
  patientCount: number;
  clusterCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
}

export type ReportAudience = "government" | "hospital" | "technical";

/** Compact data summary passed as GPT context. */
interface ReportDataSummary {
  totalPatients: number;
  totalClusters: number;
  activeClusters: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  tierDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
  topSymptoms: { symptom: string; count: number }[];
  clusterSummaries: {
    label: string;
    size: number;
    sharedSymptoms: string[];
    regions: string[];
    growthRate: string;
    score: number;
  }[];
  recentTrend: {
    last7Days: number;
    prior7Days: number;
    pctChange: number;
  };
}

/* ══════════════════════════════════════════════════════════════
   Audience-Specific System Prompts
   ══════════════════════════════════════════════════════════════ */

const GOVERNMENT_PROMPT = `You are a senior epidemiological intelligence analyst preparing a formal Situation Report (SitRep) for government public health officials.

Based on the provided surveillance data, generate a structured report with these sections:
1. Situation Overview (2-3 paragraphs summarizing the current state)
2. Epidemiological Summary (key statistics, trends, notable clusters)
3. Risk Assessment (current threat level with justification)
4. Active Cluster Analysis (detail on each significant cluster)
5. Emerging Patterns (novel signals that warrant attention)
6. Containment Recommendations (specific, actionable steps)
7. Resource Allocation Guidance (staffing, testing, supply recommendations)

Tone: Formal, authoritative, suitable for ministerial briefing.
Use precise language. Cite specific numbers from the data.

Return a JSON object with exactly:
{
  "title": "Situation Report -- <date>",
  "summary": "2-3 sentence executive summary",
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Markdown-formatted content with specific data points...",
      "type": "narrative" | "data_summary" | "recommendations" | "forecast"
    }
  ]
}`;

const HOSPITAL_PROMPT = `You are a healthcare intelligence analyst preparing an executive briefing for hospital administration (C-suite).

Based on the provided surveillance data, generate a concise, action-oriented report with these sections:
1. Executive Summary (key findings in 3-5 bullet points)
2. Current Risk Level (with clear justification)
3. Patient Volume Impact (current case loads and projections)
4. Staffing & Capacity Implications (what to prepare for)
5. Recommended Actions (3-5 specific, prioritized actions)

Tone: Professional, concise, executive-friendly. Focus on operational impact and actionable recommendations.
Avoid unnecessary technical detail. Lead with what matters most.

Return a JSON object with exactly:
{
  "title": "Hospital Intelligence Briefing -- <date>",
  "summary": "2-3 sentence executive summary",
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Markdown-formatted content...",
      "type": "narrative" | "data_summary" | "recommendations" | "forecast"
    }
  ]
}`;

const TECHNICAL_PROMPT = `You are an epidemiological data scientist preparing a technical analysis report for a data/epi team.

Based on the provided surveillance data, generate a data-heavy analysis with these sections:
1. Data Overview (dataset characteristics, coverage, completeness)
2. Statistical Summary (distributions, correlations, anomalies)
3. Cluster Analysis Methodology & Results (detailed breakdown of each cluster)
4. Symptom Signature Analysis (co-occurrence patterns, novel combinations)
5. Temporal Trend Analysis (growth rates, inflection points, trajectory)
6. Geographic Correlation Analysis (spatial patterns, corridors)
7. Confidence & Limitations (data quality notes, caveats)
8. Technical Recommendations (surveillance improvements, data collection gaps)

Tone: Technical, data-driven, precise. Include statistical context where appropriate.
Use specific numbers, percentages, and ratios from the data.

Return a JSON object with exactly:
{
  "title": "Technical Epidemiological Analysis -- <date>",
  "summary": "2-3 sentence technical summary",
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Markdown-formatted content with data tables, statistics...",
      "type": "narrative" | "data_summary" | "recommendations" | "forecast"
    }
  ]
}`;

const AUDIENCE_PROMPTS: Record<ReportAudience, string> = {
  government: GOVERNMENT_PROMPT,
  hospital: HOSPITAL_PROMPT,
  technical: TECHNICAL_PROMPT,
};

/* ══════════════════════════════════════════════════════════════
   Data Aggregation
   ══════════════════════════════════════════════════════════════ */

function ageBucket(age: number | null): string {
  if (age == null) return "18-34";
  if (age < 18) return "0-17";
  if (age < 35) return "18-34";
  if (age < 50) return "35-49";
  if (age < 65) return "50-64";
  return "65+";
}

/**
 * Builds a compact data summary for the GPT prompt from the graph data.
 */
export function aggregateReportData(
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: Cluster[],
  clusterAlerts: ClusterAlert[],
): ReportDataSummary {
  const now = Date.now();
  const msPerDay = 86_400_000;
  const sevenDaysAgo = now - 7 * msPerDay;
  const fourteenDaysAgo = now - 14 * msPerDay;

  // Date range
  let earliest = Infinity;
  let latest = -Infinity;
  for (const n of nodes) {
    if (n.createdAt) {
      const t = new Date(n.createdAt).getTime();
      if (t < earliest) earliest = t;
      if (t > latest) latest = t;
    }
  }

  // Tier distribution
  const tierDist: Record<string, number> = {};
  for (const n of nodes) {
    const tier = n.tier ?? "unknown";
    tierDist[tier] = (tierDist[tier] ?? 0) + 1;
  }

  // Age distribution
  const ageDist: Record<string, number> = {};
  for (const n of nodes) {
    const b = ageBucket(n.age);
    ageDist[b] = (ageDist[b] ?? 0) + 1;
  }

  // Region distribution
  const regionDist: Record<string, number> = {};
  for (const n of nodes) {
    const loc = n.location ?? "Unknown";
    regionDist[loc] = (regionDist[loc] ?? 0) + 1;
  }

  // Top symptoms
  const symptomCounts = new Map<string, number>();
  for (const n of nodes) {
    for (const s of n.symptoms) {
      symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
    }
  }
  const topSymptoms = Array.from(symptomCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([symptom, count]) => ({ symptom, count }));

  // Recent trend
  let last7 = 0;
  let prior7 = 0;
  for (const n of nodes) {
    if (!n.createdAt) continue;
    const t = new Date(n.createdAt).getTime();
    if (t >= sevenDaysAgo) last7++;
    else if (t >= fourteenDaysAgo) prior7++;
  }
  const pctChange =
    prior7 > 0
      ? Math.round(((last7 - prior7) / prior7) * 100)
      : last7 > 0
        ? 100
        : 0;

  // Cluster summaries
  const clusterSummaries = clusters
    .filter((c) => c.size >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((c) => {
      const alert = clusterAlerts.find((a) => a.id === c.id);
      return {
        label: alert?.cluster_label ?? `Cluster ${c.id}`,
        size: c.size,
        sharedSymptoms: c.sharedSymptoms.slice(0, 5),
        regions: c.geographicSpread.slice(0, 5),
        growthRate: alert?.growth_rate ?? "Unknown",
        score: c.score,
      };
    });

  return {
    totalPatients: nodes.length,
    totalClusters: clusters.length,
    activeClusters: clusters.filter((c) => c.isAlert).length,
    dateRangeStart:
      earliest === Infinity
        ? new Date().toISOString()
        : new Date(earliest).toISOString(),
    dateRangeEnd:
      latest === -Infinity
        ? new Date().toISOString()
        : new Date(latest).toISOString(),
    tierDistribution: tierDist,
    ageDistribution: ageDist,
    regionDistribution: regionDist,
    topSymptoms,
    clusterSummaries,
    recentTrend: { last7Days: last7, prior7Days: prior7, pctChange },
  };
}

/* ══════════════════════════════════════════════════════════════
   User Message Builder
   ══════════════════════════════════════════════════════════════ */

function buildReportMessage(summary: ReportDataSummary): string {
  const parts: string[] = [];

  parts.push(`Report Date: ${new Date().toISOString().slice(0, 10)}`);
  parts.push(
    `Surveillance Period: ${summary.dateRangeStart.slice(0, 10)} to ${summary.dateRangeEnd.slice(0, 10)}`,
  );
  parts.push(`Total Patients in Network: ${summary.totalPatients}`);
  parts.push(
    `Total Clusters: ${summary.totalClusters} (${summary.activeClusters} active alerts)`,
  );
  parts.push("");

  // Tier distribution
  parts.push("=== Triage Tier Distribution ===");
  for (const [tier, count] of Object.entries(summary.tierDistribution)) {
    const pct = Math.round((count / summary.totalPatients) * 100);
    parts.push(`  ${tier}: ${count} (${pct}%)`);
  }
  parts.push("");

  // Age distribution
  parts.push("=== Age Distribution ===");
  for (const [age, count] of Object.entries(summary.ageDistribution)) {
    parts.push(`  ${age}: ${count}`);
  }
  parts.push("");

  // Region distribution
  parts.push("=== Region Distribution ===");
  for (const [region, count] of Object.entries(summary.regionDistribution)) {
    parts.push(`  ${region}: ${count}`);
  }
  parts.push("");

  // Top symptoms
  parts.push("=== Top Symptoms ===");
  for (const { symptom, count } of summary.topSymptoms) {
    parts.push(`  ${symptom.replace(/_/g, " ")}: ${count}`);
  }
  parts.push("");

  // Recent trend
  parts.push("=== Recent Trend (7-day comparison) ===");
  parts.push(`  Last 7 days: ${summary.recentTrend.last7Days} new cases`);
  parts.push(`  Prior 7 days: ${summary.recentTrend.prior7Days} new cases`);
  const changeStr =
    summary.recentTrend.pctChange > 0
      ? `+${summary.recentTrend.pctChange}%`
      : `${summary.recentTrend.pctChange}%`;
  parts.push(`  Change: ${changeStr}`);
  parts.push("");

  // Cluster summaries
  parts.push("=== Active Clusters ===");
  if (summary.clusterSummaries.length === 0) {
    parts.push("  No significant clusters detected.");
  } else {
    for (const c of summary.clusterSummaries) {
      parts.push(
        `  ${c.label}: ${c.size} patients, symptoms=[${c.sharedSymptoms.join(", ")}], regions=[${c.regions.join(", ")}], growth=${c.growthRate}, score=${c.score.toFixed(2)}`,
      );
    }
  }
  parts.push("");

  parts.push("Generate the report based on this data. Return JSON.");

  return parts.join("\n");
}

/* ══════════════════════════════════════════════════════════════
   Response Validator
   ══════════════════════════════════════════════════════════════ */

function validateReportResponse(raw: Record<string, unknown>): {
  title: string;
  summary: string;
  sections: ReportSection[];
} {
  const title =
    typeof raw.title === "string"
      ? raw.title
      : `Report -- ${new Date().toISOString().slice(0, 10)}`;

  const summary =
    typeof raw.summary === "string"
      ? raw.summary
      : "Report generated from surveillance data.";

  const sections: ReportSection[] = [];
  if (Array.isArray(raw.sections)) {
    for (let i = 0; i < raw.sections.length; i++) {
      const s = raw.sections[i] as Record<string, unknown>;
      if (!s || typeof s !== "object") continue;

      const sTitle = typeof s.title === "string" ? s.title : `Section ${i + 1}`;
      const sContent =
        typeof s.content === "string" ? s.content : "No content available.";
      const validTypes = new Set([
        "narrative",
        "data_summary",
        "recommendations",
        "forecast",
      ]);
      const sType =
        typeof s.type === "string" && validTypes.has(s.type)
          ? (s.type as ReportSection["type"])
          : "narrative";

      sections.push({
        id: typeof s.id === "string" ? s.id : `section-${i + 1}`,
        title: sTitle,
        content: sContent,
        type: sType,
      });
    }
  }

  return { title, summary, sections };
}

/* ══════════════════════════════════════════════════════════════
   Main Entry Point
   ══════════════════════════════════════════════════════════════ */

/**
 * Generates an audience-adaptive intelligence report using GPT-4o.
 *
 * @param audience    - Target audience: "government", "hospital", or "technical"
 * @param scope       - Scope of the report (e.g. "full" or "filtered")
 * @param dataSummary - Pre-aggregated data summary (from `aggregateReportData`)
 * @returns A partial Report object with title, summary, and sections
 */
export async function generateReport(
  audience: ReportAudience,
  scope: string,
  dataSummary: ReportDataSummary,
): Promise<{ title: string; summary: string; sections: ReportSection[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = AUDIENCE_PROMPTS[audience];
  const userMessage = buildReportMessage(dataSummary);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = JSON.parse(content) as Record<string, unknown>;

  return validateReportResponse(parsed);
}
