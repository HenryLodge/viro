import OpenAI from "openai";
import type { GraphNode } from "@/lib/network-engine";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export interface ForecastResult {
  projectedDays: { date: string; cases: number }[];
  narrative: string;
  riskLevel: "critical" | "high" | "moderate" | "low";
  peakEstimate: string;
  confidenceNote: string;
}

export interface DailyCaseCount {
  date: string;
  cases: number;
}

export interface ClusterMeta {
  clusterId: string;
  totalSize: number;
  sharedSymptoms: string[];
  geographicSpread: string[];
  growthRate: string;
}

/* ══════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════ */

const VALID_RISK_LEVELS = new Set(["critical", "high", "moderate", "low"]);

/* ══════════════════════════════════════════════════════════════
   System Prompt
   ══════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are an epidemiological forecasting analyst. You will receive a daily new-case time series for a disease cluster, along with metadata about the cluster (shared symptoms, geographic spread, growth rate, total size).

Your task is to:
1. Project new cases per day for the next 7 days
2. Identify the likely growth pattern (exponential, linear, plateau, declining)
3. Estimate peak timing
4. Write a 2-3 sentence narrative suitable for a public health analyst

Return a JSON object with exactly this shape:
{
  "projectedDays": [
    { "date": "YYYY-MM-DD", "cases": <number> }
  ],
  "narrative": "<2-3 sentence explanation of the trend and what to expect>",
  "riskLevel": "critical" | "high" | "moderate" | "low",
  "peakEstimate": "<e.g. 'Expected peak: ~95 patients by Feb 22'>",
  "confidenceNote": "<caveat about projection reliability>"
}

Guidelines:
1. projectedDays MUST contain exactly 7 entries, one for each of the next 7 days after the last data point.
2. Base projections on the observed trajectory. Consider whether growth is accelerating, linear, or decelerating.
3. riskLevel: "critical" = exponential growth with no signs of slowing, "high" = rapid growth, "moderate" = steady linear growth, "low" = plateau or decline.
4. Be conservative in projections — pandemics often have inflection points. Note this in confidenceNote.
5. The narrative should be concise, professional, and actionable.
6. If the data is too sparse (fewer than 3 data points), note limited reliability in confidenceNote.
7. All projected case counts should be non-negative integers.`;

/* ══════════════════════════════════════════════════════════════
   Daily Case Count Aggregation
   ══════════════════════════════════════════════════════════════ */

/**
 * Computes daily case counts from a set of cluster nodes based on their
 * `createdAt` timestamps. Returns an array sorted by date (ascending).
 */
export function computeDailyCaseCounts(
  clusterNodes: GraphNode[],
): DailyCaseCount[] {
  const counts = new Map<string, number>();

  for (const node of clusterNodes) {
    if (!node.createdAt) continue;
    const dateKey = node.createdAt.slice(0, 10); // YYYY-MM-DD
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  // Fill gaps in the date range so the time series is continuous
  const dates = Array.from(counts.keys()).sort();
  if (dates.length < 2) {
    return dates.map((date) => ({ date, cases: counts.get(date)! }));
  }

  const result: DailyCaseCount[] = [];
  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, cases: counts.get(key) ?? 0 });
  }

  return result;
}

/* ══════════════════════════════════════════════════════════════
   User Message Builder
   ══════════════════════════════════════════════════════════════ */

function buildUserMessage(
  dailyCases: DailyCaseCount[],
  meta: ClusterMeta,
): string {
  const parts: string[] = [];

  parts.push("=== Cluster Metadata ===");
  parts.push(`Cluster ID: ${meta.clusterId}`);
  parts.push(`Total size: ${meta.totalSize} patients`);
  parts.push(`Shared symptoms: ${meta.sharedSymptoms.join(", ") || "None"}`);
  parts.push(
    `Geographic spread: ${meta.geographicSpread.join(", ") || "Unknown"}`,
  );
  parts.push(`Growth rate: ${meta.growthRate}`);
  parts.push("");

  parts.push("=== Daily New Cases ===");
  for (const { date, cases } of dailyCases) {
    parts.push(`  ${date}: ${cases} new cases`);
  }
  parts.push("");

  const totalCases = dailyCases.reduce((sum, d) => sum + d.cases, 0);
  parts.push(`Total cases in series: ${totalCases}`);
  parts.push(`Data points: ${dailyCases.length} days`);
  parts.push("");

  parts.push(
    "Project new cases per day for the next 7 days and provide a risk assessment. Return JSON.",
  );

  return parts.join("\n");
}

/* ══════════════════════════════════════════════════════════════
   Response Validator
   ══════════════════════════════════════════════════════════════ */

function validateForecast(raw: Record<string, unknown>): ForecastResult {
  // Projected days
  const projectedDays: ForecastResult["projectedDays"] = [];
  if (Array.isArray(raw.projectedDays)) {
    for (const day of raw.projectedDays) {
      const d = day as Record<string, unknown>;
      if (typeof d.date === "string" && typeof d.cases === "number") {
        projectedDays.push({
          date: d.date,
          cases: Math.max(0, Math.round(d.cases)),
        });
      }
    }
  }

  // Narrative
  const narrative =
    typeof raw.narrative === "string"
      ? raw.narrative
      : "Forecast analysis unavailable.";

  // Risk level
  const riskLevel =
    typeof raw.riskLevel === "string" && VALID_RISK_LEVELS.has(raw.riskLevel)
      ? (raw.riskLevel as ForecastResult["riskLevel"])
      : "moderate";

  // Peak estimate
  const peakEstimate =
    typeof raw.peakEstimate === "string"
      ? raw.peakEstimate
      : "Peak estimate unavailable.";

  // Confidence note
  const confidenceNote =
    typeof raw.confidenceNote === "string"
      ? raw.confidenceNote
      : "Projections are based on limited data and should be interpreted with caution.";

  return {
    projectedDays,
    narrative,
    riskLevel,
    peakEstimate,
    confidenceNote,
  };
}

/* ══════════════════════════════════════════════════════════════
   Main Entry Point
   ══════════════════════════════════════════════════════════════ */

/**
 * Generates a 7-day forecast for a cluster's growth trajectory using GPT-4o.
 *
 * @param dailyCases - Daily new case counts (from `computeDailyCaseCounts`)
 * @param meta       - Cluster metadata (symptoms, regions, growth rate, etc.)
 * @returns A `ForecastResult` with projected daily cases, narrative, and risk level
 */
export async function generateForecast(
  dailyCases: DailyCaseCount[],
  meta: ClusterMeta,
): Promise<ForecastResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  const openai = new OpenAI({ apiKey });

  const userMessage = buildUserMessage(dailyCases, meta);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 1000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = JSON.parse(content) as Record<string, unknown>;

  return validateForecast(parsed);
}
