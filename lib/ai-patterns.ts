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

/**
 * A single AI-surfaced insight about an emerging epidemiological pattern.
 * `suggestedFilters` uses arrays (JSON-safe) — the client converts to Sets
 * when applying to `NetworkFilterState`.
 */
export interface AiInsight {
  id: string;
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  category:
    | "symptom_pattern"
    | "demographic_anomaly"
    | "geographic_corridor"
    | "temporal_spike";
  affectedRegions: string[];
  suggestedFilters: {
    ageGroups?: string[];
    triageTiers?: string[];
    symptoms?: string[];
    regions?: string[];
  };
}

/** Compact aggregated summary sent as GPT context (keeps token count low). */
interface AggregatedSummary {
  totalPatients: number;
  dateRange: { earliest: string; latest: string };
  symptomCooccurrence: { pair: string; count: number }[];
  casesPerRegionPerDay: {
    region: string;
    last7: number;
    prior7: number;
    pctChange: number;
  }[];
  ageTierCrossTab: { ageGroup: string; tiers: Record<string, number> }[];
  topTravelCorridors: { origin: string; destination: string; count: number }[];
  clusterSummaries: {
    id: string;
    size: number;
    sharedSymptoms: string[];
    regions: string[];
    growthRate: string;
  }[];
}

/* ══════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════ */

const VALID_CATEGORIES = new Set([
  "symptom_pattern",
  "demographic_anomaly",
  "geographic_corridor",
  "temporal_spike",
]);

const VALID_CONFIDENCES = new Set(["high", "medium", "low"]);

/* ══════════════════════════════════════════════════════════════
   System Prompt
   ══════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are a senior epidemiological intelligence analyst reviewing aggregated surveillance data from a real-time patient monitoring network. Your task is to identify **emerging patterns** that are NOT already captured by the existing cluster alerts.

You will receive:
1. Symptom co-occurrence matrix (top symptom pairs with counts)
2. Cases per region per day (last 7 days vs prior 7 days, with % change)
3. Age group × triage tier cross-tabulation
4. Top travel corridors (origin-destination pairs)
5. Current cluster summaries (already known — do NOT repeat these)

Your job is to surface **novel signals** that:
(a) Are statistically unusual given the data
(b) Are NOT already explained by the existing cluster alerts
(c) Are actionable for a public health analyst

Return a JSON object with exactly this shape:
{
  "insights": [
    {
      "id": "unique-short-id",
      "title": "Short descriptive title (5-10 words)",
      "description": "2-3 sentence explanation of the pattern and why it matters",
      "confidence": "high" | "medium" | "low",
      "category": "symptom_pattern" | "demographic_anomaly" | "geographic_corridor" | "temporal_spike",
      "affectedRegions": ["Region1", "Region2"],
      "suggestedFilters": {
        "ageGroups": [],
        "triageTiers": [],
        "symptoms": [],
        "regions": []
      }
    }
  ]
}

Guidelines:
1. Return 2-5 insights. Quality over quantity — only surface genuinely interesting patterns.
2. Each insight MUST include suggestedFilters so the analyst can click "Focus" to filter the graph.
3. Only use filter values that appear in the provided data. Never invent symptom names or regions.
4. For confidence: "high" = clear statistical signal with multiple data points, "medium" = notable but could be noise, "low" = early signal worth watching.
5. Look for: unusual symptom combinations, unexpected age-severity correlations, emerging geographic corridors, sudden regional spikes, travel-related transmission chains not yet clustered.
6. Keep descriptions concise and written for a professional public health audience.
7. If the data is too sparse to identify meaningful patterns, return fewer insights or an empty array.`;

/* ══════════════════════════════════════════════════════════════
   Data Aggregation
   ══════════════════════════════════════════════════════════════ */

/** Map age to standard bucket */
function ageBucket(age: number | null): string {
  if (age == null) return "18-34";
  if (age < 18) return "0-17";
  if (age < 35) return "18-34";
  if (age < 50) return "35-49";
  if (age < 65) return "50-64";
  return "65+";
}

/** Parse ISO date string to "YYYY-MM-DD" */
function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Builds a compact aggregation of the current graph data suitable for
 * the GPT prompt. Keeps token count manageable by summarising rather
 * than sending raw patient records.
 */
export function aggregateGraphData(
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: Cluster[],
  clusterAlerts: ClusterAlert[],
): AggregatedSummary {
  const now = Date.now();
  const msPerDay = 86_400_000;
  const sevenDaysAgo = now - 7 * msPerDay;
  const fourteenDaysAgo = now - 14 * msPerDay;

  /* ── Date range ── */
  let earliest = Infinity;
  let latest = -Infinity;
  for (const n of nodes) {
    if (n.createdAt) {
      const t = new Date(n.createdAt).getTime();
      if (t < earliest) earliest = t;
      if (t > latest) latest = t;
    }
  }

  /* ── 1. Symptom co-occurrence matrix (top 15 pairs) ── */
  const pairCounts = new Map<string, number>();
  for (const n of nodes) {
    const syms = Array.from(new Set(n.symptoms)).sort();
    for (let i = 0; i < syms.length; i++) {
      for (let j = i + 1; j < syms.length; j++) {
        const key = `${syms[i]}|${syms[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const symptomCooccurrence = Array.from(pairCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pair, count]) => ({ pair: pair.replace("|", " + "), count }));

  /* ── 2. Cases per region per day (last 7 vs prior 7) ── */
  const regionLast7 = new Map<string, number>();
  const regionPrior7 = new Map<string, number>();
  for (const n of nodes) {
    const region = n.location;
    if (!region || !n.createdAt) continue;
    const t = new Date(n.createdAt).getTime();
    if (t >= sevenDaysAgo) {
      regionLast7.set(region, (regionLast7.get(region) ?? 0) + 1);
    } else if (t >= fourteenDaysAgo) {
      regionPrior7.set(region, (regionPrior7.get(region) ?? 0) + 1);
    }
  }
  const allRegions = new Set([...Array.from(regionLast7.keys()), ...Array.from(regionPrior7.keys())]);
  const casesPerRegionPerDay = Array.from(allRegions)
    .map((region) => {
      const last7 = regionLast7.get(region) ?? 0;
      const prior7 = regionPrior7.get(region) ?? 0;
      const pctChange =
        prior7 > 0
          ? Math.round(((last7 - prior7) / prior7) * 100)
          : last7 > 0
            ? 100
            : 0;
      return { region, last7, prior7, pctChange };
    })
    .sort((a, b) => b.last7 - a.last7);

  /* ── 3. Age-tier cross tabulation ── */
  const ageGroups = ["0-17", "18-34", "35-49", "50-64", "65+"];
  const crossTab = new Map<
    string,
    { critical: number; urgent: number; routine: number; "self-care": number }
  >();
  for (const ag of ageGroups) {
    crossTab.set(ag, { critical: 0, urgent: 0, routine: 0, "self-care": 0 });
  }
  for (const n of nodes) {
    const ag = ageBucket(n.age);
    const tier = (n.tier ?? "routine") as keyof ReturnType<
      typeof crossTab.get
    >;
    const row = crossTab.get(ag);
    if (row && tier in row) {
      (row as Record<string, number>)[tier] =
        ((row as Record<string, number>)[tier] ?? 0) + 1;
    }
  }
  const ageTierCrossTab = ageGroups.map((ag) => ({
    ageGroup: ag,
    tiers: crossTab.get(ag) as Record<string, number>,
  }));

  /* ── 4. Top travel corridors ── */
  const corridorCounts = new Map<string, number>();
  for (const e of edges) {
    const srcNode = nodes.find((n) => n.id === e.source);
    const tgtNode = nodes.find((n) => n.id === e.target);
    if (!srcNode?.travelHistory || !tgtNode?.travelHistory) continue;
    if (!srcNode.location || !tgtNode.location) continue;
    if (srcNode.location === tgtNode.location) continue;
    const corridor = [srcNode.location, tgtNode.location].sort().join(" → ");
    corridorCounts.set(corridor, (corridorCounts.get(corridor) ?? 0) + 1);
  }
  const topTravelCorridors = Array.from(corridorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [origin, destination] = key.split(" → ");
      return { origin, destination, count };
    });

  /* ── 5. Cluster summaries ── */
  const clusterSummaries = clusters
    .filter((c) => c.size >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((c) => {
      const matchingAlert = clusterAlerts.find((a) => a.id === c.id);
      return {
        id: c.id,
        size: c.size,
        sharedSymptoms: c.sharedSymptoms.slice(0, 5),
        regions: c.geographicSpread.slice(0, 5),
        growthRate: matchingAlert?.growth_rate ?? "Unknown",
      };
    });

  return {
    totalPatients: nodes.length,
    dateRange: {
      earliest:
        earliest === Infinity
          ? new Date().toISOString()
          : new Date(earliest).toISOString(),
      latest:
        latest === -Infinity
          ? new Date().toISOString()
          : new Date(latest).toISOString(),
    },
    symptomCooccurrence,
    casesPerRegionPerDay,
    ageTierCrossTab,
    topTravelCorridors,
    clusterSummaries,
  };
}

/* ══════════════════════════════════════════════════════════════
   User Message Builder
   ══════════════════════════════════════════════════════════════ */

function buildUserMessage(summary: AggregatedSummary): string {
  const parts: string[] = [];

  parts.push(`Total patients in network: ${summary.totalPatients}`);
  parts.push(
    `Date range: ${toDateKey(summary.dateRange.earliest)} to ${toDateKey(summary.dateRange.latest)}`,
  );
  parts.push("");

  // Symptom co-occurrence
  parts.push("=== Symptom Co-occurrence (top pairs) ===");
  if (summary.symptomCooccurrence.length === 0) {
    parts.push("No significant symptom pairs detected.");
  } else {
    for (const { pair, count } of summary.symptomCooccurrence) {
      parts.push(`  ${pair}: ${count} patients`);
    }
  }
  parts.push("");

  // Cases per region
  parts.push("=== Cases Per Region (last 7 days vs prior 7 days) ===");
  if (summary.casesPerRegionPerDay.length === 0) {
    parts.push("No regional data available.");
  } else {
    for (const r of summary.casesPerRegionPerDay) {
      const changeStr =
        r.pctChange > 0 ? `+${r.pctChange}%` : `${r.pctChange}%`;
      parts.push(
        `  ${r.region}: ${r.last7} (last 7d) vs ${r.prior7} (prior 7d) [${changeStr}]`,
      );
    }
  }
  parts.push("");

  // Age-tier cross tab
  parts.push("=== Age Group × Triage Tier Cross-Tabulation ===");
  for (const row of summary.ageTierCrossTab) {
    const tierStr = Object.entries(row.tiers)
      .map(([tier, n]) => `${tier}=${n}`)
      .join(", ");
    parts.push(`  ${row.ageGroup}: ${tierStr}`);
  }
  parts.push("");

  // Travel corridors
  parts.push("=== Top Travel Corridors ===");
  if (summary.topTravelCorridors.length === 0) {
    parts.push("No significant travel corridors detected.");
  } else {
    for (const c of summary.topTravelCorridors) {
      parts.push(`  ${c.origin} → ${c.destination}: ${c.count} linked pairs`);
    }
  }
  parts.push("");

  // Existing cluster summaries (so GPT doesn't repeat them)
  parts.push("=== Existing Cluster Alerts (already known — do NOT repeat) ===");
  if (summary.clusterSummaries.length === 0) {
    parts.push("No active clusters.");
  } else {
    for (const c of summary.clusterSummaries) {
      parts.push(
        `  ${c.id}: ${c.size} patients, symptoms=[${c.sharedSymptoms.join(", ")}], regions=[${c.regions.join(", ")}], growth=${c.growthRate}`,
      );
    }
  }
  parts.push("");

  parts.push(
    "Identify 2-5 emerging patterns from this data that are NOT already covered by the existing cluster alerts. Return JSON.",
  );

  return parts.join("\n");
}

/* ══════════════════════════════════════════════════════════════
   Response Validator
   ══════════════════════════════════════════════════════════════ */

function validateInsights(raw: Record<string, unknown>): AiInsight[] {
  const rawInsights = Array.isArray(raw.insights) ? raw.insights : [];

  const validated: AiInsight[] = [];

  for (let i = 0; i < rawInsights.length; i++) {
    const r = rawInsights[i] as Record<string, unknown>;
    if (!r || typeof r !== "object") continue;

    // Required string fields
    const title = typeof r.title === "string" ? r.title : null;
    const description = typeof r.description === "string" ? r.description : null;
    if (!title || !description) continue;

    // Category validation
    const category =
      typeof r.category === "string" && VALID_CATEGORIES.has(r.category)
        ? (r.category as AiInsight["category"])
        : "symptom_pattern";

    // Confidence validation
    const confidence =
      typeof r.confidence === "string" && VALID_CONFIDENCES.has(r.confidence)
        ? (r.confidence as AiInsight["confidence"])
        : "medium";

    // Affected regions
    const affectedRegions = Array.isArray(r.affectedRegions)
      ? (r.affectedRegions as unknown[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];

    // Suggested filters — extract arrays, ignore invalid values
    const sf = (r.suggestedFilters ?? {}) as Record<string, unknown>;
    const suggestedFilters: AiInsight["suggestedFilters"] = {};
    if (Array.isArray(sf.ageGroups)) {
      suggestedFilters.ageGroups = (sf.ageGroups as unknown[]).filter(
        (v): v is string => typeof v === "string",
      );
    }
    if (Array.isArray(sf.triageTiers)) {
      suggestedFilters.triageTiers = (sf.triageTiers as unknown[]).filter(
        (v): v is string => typeof v === "string",
      );
    }
    if (Array.isArray(sf.symptoms)) {
      suggestedFilters.symptoms = (sf.symptoms as unknown[]).filter(
        (v): v is string => typeof v === "string",
      );
    }
    if (Array.isArray(sf.regions)) {
      suggestedFilters.regions = (sf.regions as unknown[]).filter(
        (v): v is string => typeof v === "string",
      );
    }

    validated.push({
      id: typeof r.id === "string" ? r.id : `insight-${i}`,
      title,
      description,
      confidence,
      category,
      affectedRegions,
      suggestedFilters,
    });
  }

  return validated;
}

/* ══════════════════════════════════════════════════════════════
   Main Entry Point
   ══════════════════════════════════════════════════════════════ */

/**
 * Scans the aggregated network graph data and uses GPT-4o to surface
 * emerging epidemiological patterns that are not yet captured by
 * rule-based cluster alerts.
 *
 * @param nodes  - All graph nodes (patients) in the current network
 * @param edges  - All computed edges (patient-patient similarities)
 * @param clusters - Detected clusters from the network engine
 * @param clusterAlerts - Existing cluster alerts already surfaced
 * @returns An array of `AiInsight` objects describing novel patterns
 */
export async function detectPatterns(
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: Cluster[],
  clusterAlerts: ClusterAlert[],
): Promise<AiInsight[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  // Skip if data is too sparse for meaningful analysis
  if (nodes.length < 5) {
    return [];
  }

  const openai = new OpenAI({ apiKey });

  const summary = aggregateGraphData(nodes, edges, clusters, clusterAlerts);
  const userMessage = buildUserMessage(summary);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1500,
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

  return validateInsights(parsed);
}
