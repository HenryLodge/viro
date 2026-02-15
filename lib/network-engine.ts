/**
 * Network Engine — Symptom Network Graph & Cluster Detection
 *
 * Computes similarity between triaged patients across multiple dimensions,
 * builds a force-directed graph, detects clusters via connected components,
 * and generates alerts when cluster scores exceed a threshold.
 */

import { haversineKm } from "@/lib/hospital-matching";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export interface PatientNode {
  id: string;
  full_name: string | null;
  age: number | null;
  symptoms: string[];
  severity_flags: string[];
  risk_factors: string[];
  travel_history: string | null;
  exposure_history: string | null;
  triage_tier: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  status: string;
}

export interface GraphNode {
  id: string;
  tier: string | null;
  connectionCount: number;
  label: string; // anonymized summary for tooltip
  age: number | null;
  symptoms: string[];
  location: string | null; // metro region name or null
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  reason: string; // human-readable reason for connection
}

export interface Cluster {
  id: string;
  patientIds: string[];
  size: number;
  avgWeight: number;
  score: number;
  sharedSymptoms: string[];
  geographicSpread: string[];
  travelCommonalities: string[];
  isAlert: boolean;
}

export interface ClusterAlert {
  id: string;
  cluster_label: string;
  patient_count: number;
  shared_symptoms: string[];
  geographic_spread: string;
  travel_commonalities: string;
  growth_rate: string;
  recommended_action: string;
  created_at: string;
}

export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  clusterAlerts: ClusterAlert[];
}

/* ══════════════════════════════════════════════════════════════
   Config
   ══════════════════════════════════════════════════════════════ */

const SYMPTOM_WEIGHT = 0.35;
const TRAVEL_WEIGHT = 0.30;
const GEO_TEMPORAL_WEIGHT = 0.20;
const EXPOSURE_WEIGHT = 0.15;

const MIN_EDGE_WEIGHT = 0.20;
const CLUSTER_SCORE_THRESHOLD = 2.5;
const GEO_PROXIMITY_KM = 80;
const TEMPORAL_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

/* ── Known region keywords for travel parsing ── */

const TRAVEL_REGIONS = [
  "london", "paris", "tokyo", "beijing", "mumbai", "delhi", "lagos",
  "nairobi", "cairo", "dubai", "singapore", "sydney", "melbourne",
  "toronto", "vancouver", "mexico city", "são paulo", "rio de janeiro",
  "buenos aires", "johannesburg", "berlin", "rome", "madrid", "amsterdam",
  "seoul", "bangkok", "hong kong", "manila", "jakarta",
  "boston", "new york", "nyc", "philadelphia", "washington", "baltimore",
  "chicago", "atlanta", "miami", "houston", "dallas", "los angeles",
  "san francisco", "seattle", "denver", "phoenix", "portland", "detroit",
  "orlando", "tampa", "nashville", "charlotte", "raleigh",
];

/* ══════════════════════════════════════════════════════════════
   Similarity Functions
   ══════════════════════════════════════════════════════════════ */

/** Jaccard similarity: |A ∩ B| / |A ∪ B| */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const arrA = a.map((s) => s.toLowerCase());
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let intersection = 0;
  for (const item of arrA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...arrA, ...Array.from(setB)]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Count shared items between two string arrays (case-insensitive) */
function sharedItems(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => setB.has(s.toLowerCase()));
}

/** Extract travel region keywords from free-text */
function extractTravelRegions(text: string | null): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return TRAVEL_REGIONS.filter((r) => lower.includes(r));
}

/** Symptom similarity score (0-1) */
function symptomScore(a: PatientNode, b: PatientNode): number {
  const allA = [...a.symptoms, ...a.severity_flags];
  const allB = [...b.symptoms, ...b.severity_flags];
  const j = jaccard(allA, allB);
  const shared = sharedItems(allA, allB);
  // Edge if Jaccard > 0.4 or 3+ shared symptoms
  if (j < 0.4 && shared.length < 3) return 0;
  return Math.min(1, j * 2);
}

/** Travel correlation score (0-1) */
function travelScore(a: PatientNode, b: PatientNode): number {
  const regionsA = extractTravelRegions(a.travel_history);
  const regionsB = extractTravelRegions(b.travel_history);
  if (regionsA.length === 0 || regionsB.length === 0) return 0;
  const shared = sharedItems(regionsA, regionsB);
  if (shared.length === 0) return 0;
  return Math.min(1, shared.length * 0.5);
}

/** Geographic + temporal proximity score (0-1) */
function geoTemporalScore(a: PatientNode, b: PatientNode): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null)
    return 0;
  const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
  if (dist > GEO_PROXIMITY_KM) return 0;
  const timeDiff = Math.abs(
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (timeDiff > TEMPORAL_WINDOW_MS) return 0;
  // Closer in distance and time = higher score
  const distFactor = 1 - dist / GEO_PROXIMITY_KM;
  const timeFactor = 1 - timeDiff / TEMPORAL_WINDOW_MS;
  return (distFactor + timeFactor) / 2;
}

/** Exposure linkage score (0-1) */
function exposureScore(a: PatientNode, b: PatientNode): number {
  if (!a.exposure_history || !b.exposure_history) return 0;
  const wordsA = a.exposure_history.toLowerCase().split(/\s+/);
  const wordsB = new Set(b.exposure_history.toLowerCase().split(/\s+/));
  // Simple keyword overlap (filter out very short / common words)
  const meaningful = wordsA.filter(
    (w) => w.length > 3 && wordsB.has(w)
  );
  if (meaningful.length === 0) return 0;
  return Math.min(1, meaningful.length * 0.25);
}

/* ══════════════════════════════════════════════════════════════
   Edge Computation
   ══════════════════════════════════════════════════════════════ */

function computeEdgeWeight(
  a: PatientNode,
  b: PatientNode
): { weight: number; reason: string } | null {
  const sScore = symptomScore(a, b);
  const tScore = travelScore(a, b);
  const gScore = geoTemporalScore(a, b);
  const eScore = exposureScore(a, b);

  const weight =
    sScore * SYMPTOM_WEIGHT +
    tScore * TRAVEL_WEIGHT +
    gScore * GEO_TEMPORAL_WEIGHT +
    eScore * EXPOSURE_WEIGHT;

  if (weight < MIN_EDGE_WEIGHT) return null;

  // Build human-readable reason
  const reasons: string[] = [];
  if (sScore > 0) {
    const shared = sharedItems(
      [...a.symptoms, ...a.severity_flags],
      [...b.symptoms, ...b.severity_flags]
    );
    reasons.push(`shared symptoms: ${shared.slice(0, 4).join(", ")}`);
  }
  if (tScore > 0) {
    const sharedRegions = sharedItems(
      extractTravelRegions(a.travel_history),
      extractTravelRegions(b.travel_history)
    );
    reasons.push(`both traveled to ${sharedRegions.join(", ")}`);
  }
  if (gScore > 0) {
    reasons.push("geographic & temporal proximity");
  }
  if (eScore > 0) {
    reasons.push("exposure linkage");
  }

  return { weight: Math.round(weight * 1000) / 1000, reason: reasons.join(" + ") };
}

/* ══════════════════════════════════════════════════════════════
   Cluster Detection (Connected Components via BFS)
   ══════════════════════════════════════════════════════════════ */

function detectClusters(
  nodeIds: string[],
  edges: GraphEdge[]
): Cluster[] {
  // Build adjacency list
  const adj = new Map<string, { neighbor: string; weight: number }[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    adj.get(e.source)?.push({ neighbor: e.target, weight: e.weight });
    adj.get(e.target)?.push({ neighbor: e.source, weight: e.weight });
  }

  const visited = new Set<string>();
  const clusters: { ids: string[]; totalWeight: number; edgeCount: number }[] = [];

  for (const id of nodeIds) {
    if (visited.has(id)) continue;
    // BFS
    const queue = [id];
    const component: string[] = [];
    let totalWeight = 0;
    let edgeCount = 0;
    visited.add(id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const { neighbor, weight } of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
        // Count each edge once (source < target check)
        if (current < neighbor) {
          totalWeight += weight;
          edgeCount++;
        }
      }
    }

    if (component.length >= 2) {
      clusters.push({ ids: component, totalWeight, edgeCount });
    }
  }

  return clusters.map((c, i) => ({
    id: `cluster-${i}`,
    patientIds: c.ids,
    size: c.ids.length,
    avgWeight:
      c.edgeCount > 0
        ? Math.round((c.totalWeight / c.edgeCount) * 1000) / 1000
        : 0,
    score: 0, // computed below
    sharedSymptoms: [],
    geographicSpread: [],
    travelCommonalities: [],
    isAlert: false,
  }));
}

/* ══════════════════════════════════════════════════════════════
   Cluster Scoring & Alert Generation
   ══════════════════════════════════════════════════════════════ */

function scoreAndEnrichClusters(
  clusters: Cluster[],
  patientsMap: Map<string, PatientNode>
): Cluster[] {
  const now = Date.now();

  return clusters.map((cluster) => {
    const patients = cluster.patientIds
      .map((id) => patientsMap.get(id))
      .filter(Boolean) as PatientNode[];

    // Recency factor: average age of patients in hours, decayed
    const avgAgeMs =
      patients.reduce((sum, p) => sum + (now - new Date(p.created_at).getTime()), 0) /
      patients.length;
    const avgAgeHours = avgAgeMs / (1000 * 60 * 60);
    const recencyFactor = Math.max(0.1, 1 / (1 + avgAgeHours / 72)); // decays over ~3 days

    const score =
      Math.round(cluster.size * cluster.avgWeight * recencyFactor * 1000) / 1000;

    // Find shared symptoms across cluster
    const symptomCounts = new Map<string, number>();
    for (const p of patients) {
      const all = [...p.symptoms, ...p.severity_flags];
      for (const s of all) {
        const key = s.toLowerCase();
        symptomCounts.set(key, (symptomCounts.get(key) ?? 0) + 1);
      }
    }
    const sharedSymptoms = Array.from(symptomCounts.entries())
      .filter(([, count]) => count >= Math.ceil(patients.length * 0.5))
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s);

    // Geographic spread
    const geoSet = new Set<string>();
    for (const p of patients) {
      const regions = extractTravelRegions(p.travel_history);
      regions.forEach((r) => geoSet.add(r));
      // Use lat/lng to guess metro (rough)
      if (p.lat != null && p.lng != null) {
        if (p.lat > 42.0 && p.lat < 42.6 && p.lng > -71.5 && p.lng < -70.8)
          geoSet.add("Boston");
        else if (p.lat > 40.4 && p.lat < 41.0 && p.lng > -74.3 && p.lng < -73.7)
          geoSet.add("New York");
        else if (p.lat > 39.7 && p.lat < 40.2 && p.lng > -75.4 && p.lng < -74.9)
          geoSet.add("Philadelphia");
      }
    }

    // Travel commonalities
    const travelCounts = new Map<string, number>();
    for (const p of patients) {
      for (const r of extractTravelRegions(p.travel_history)) {
        travelCounts.set(r, (travelCounts.get(r) ?? 0) + 1);
      }
    }
    const travelCommonalities = Array.from(travelCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([r]) => r);

    return {
      ...cluster,
      score,
      sharedSymptoms,
      geographicSpread: Array.from(geoSet),
      travelCommonalities,
      isAlert: score >= CLUSTER_SCORE_THRESHOLD,
    };
  });
}

function generateAlerts(clusters: Cluster[]): ClusterAlert[] {
  return clusters
    .filter((c) => c.isAlert)
    .map((c) => {
      const label = buildClusterLabel(c);
      return {
        id: c.id,
        cluster_label: label,
        patient_count: c.size,
        shared_symptoms: c.sharedSymptoms,
        geographic_spread: c.geographicSpread.join(", ") || "Multiple regions",
        travel_commonalities:
          c.travelCommonalities.join(", ") || "No common travel",
        growth_rate:
          c.size >= 5 ? "Rapid" : c.size >= 3 ? "Moderate" : "Emerging",
        recommended_action: buildRecommendedAction(c),
        created_at: new Date().toISOString(),
      };
    });
}

function buildClusterLabel(c: Cluster): string {
  const parts: string[] = [];
  if (c.travelCommonalities.length > 0) {
    parts.push(
      `${c.travelCommonalities[0].charAt(0).toUpperCase() + c.travelCommonalities[0].slice(1)} travel`
    );
  }
  if (c.sharedSymptoms.length > 0) {
    parts.push(c.sharedSymptoms.slice(0, 2).join("/"));
  }
  if (parts.length === 0 && c.geographicSpread.length > 0) {
    parts.push(`${c.geographicSpread[0]} local`);
  }
  return parts.length > 0
    ? `${parts.join(" — ")} cluster`
    : `Cluster of ${c.size} patients`;
}

function buildRecommendedAction(c: Cluster): string {
  const actions: string[] = [];
  if (c.travelCommonalities.length > 0) {
    actions.push(
      `Initiate targeted screening at international arrivals linked to ${c.travelCommonalities.join(", ")}.`
    );
  }
  if (c.sharedSymptoms.length > 0) {
    actions.push(
      `Monitor for ${c.sharedSymptoms.slice(0, 3).join(", ")} symptom cluster in affected areas.`
    );
  }
  if (c.geographicSpread.length > 0) {
    actions.push(
      `Pre-position testing resources in ${c.geographicSpread.join(", ")}.`
    );
  }
  if (c.size >= 5) {
    actions.push("Consider issuing public health advisory for affected region.");
  }
  return actions.join(" ") || "Continue monitoring cluster growth.";
}

/* ══════════════════════════════════════════════════════════════
   Helpers — build node labels
   ══════════════════════════════════════════════════════════════ */

function buildNodeLabel(p: PatientNode): string {
  const parts: string[] = [];
  if (p.age != null) parts.push(`Age ${p.age}`);
  if (p.symptoms.length > 0)
    parts.push(p.symptoms.slice(0, 3).join(", "));
  if (p.triage_tier) parts.push(p.triage_tier);
  return parts.join(" · ") || "Patient";
}

function guessMetro(p: PatientNode): string | null {
  if (p.lat == null || p.lng == null) return null;
  if (p.lat > 42.0 && p.lat < 42.6 && p.lng > -71.5 && p.lng < -70.8)
    return "Boston";
  if (p.lat > 40.4 && p.lat < 41.0 && p.lng > -74.3 && p.lng < -73.7)
    return "New York";
  if (p.lat > 39.7 && p.lat < 40.2 && p.lng > -75.4 && p.lng < -74.9)
    return "Philadelphia";
  if (p.lat > 38.7 && p.lat < 39.1 && p.lng > -77.3 && p.lng < -76.8)
    return "Washington D.C.";
  if (p.lat > 33.5 && p.lat < 34.0 && p.lng > -84.6 && p.lng < -84.1)
    return "Atlanta";
  if (p.lat > 25.5 && p.lat < 26.0 && p.lng > -80.5 && p.lng < -80.0)
    return "Miami";
  return null;
}

/* ══════════════════════════════════════════════════════════════
   Main Entry: computeGraph
   ══════════════════════════════════════════════════════════════ */

export function computeGraph(patients: PatientNode[]): NetworkGraph {
  // Only include triaged patients
  const triaged = patients.filter(
    (p) => p.triage_tier && p.status !== "pending"
  );

  if (triaged.length === 0) {
    return { nodes: [], edges: [], clusters: [], clusterAlerts: [] };
  }

  const patientsMap = new Map(triaged.map((p) => [p.id, p]));

  // Compute edges (pairwise)
  const edges: GraphEdge[] = [];
  for (let i = 0; i < triaged.length; i++) {
    for (let j = i + 1; j < triaged.length; j++) {
      const result = computeEdgeWeight(triaged[i], triaged[j]);
      if (result) {
        edges.push({
          source: triaged[i].id,
          target: triaged[j].id,
          weight: result.weight,
          reason: result.reason,
        });
      }
    }
  }

  // Build connection counts
  const connectionCounts = new Map<string, number>();
  for (const e of edges) {
    connectionCounts.set(e.source, (connectionCounts.get(e.source) ?? 0) + 1);
    connectionCounts.set(e.target, (connectionCounts.get(e.target) ?? 0) + 1);
  }

  // Build graph nodes
  const nodes: GraphNode[] = triaged.map((p) => ({
    id: p.id,
    tier: p.triage_tier,
    connectionCount: connectionCounts.get(p.id) ?? 0,
    label: buildNodeLabel(p),
    age: p.age,
    symptoms: p.symptoms,
    location: guessMetro(p),
  }));

  // Detect clusters
  const nodeIds = triaged.map((p) => p.id);
  let clusters = detectClusters(nodeIds, edges);
  clusters = scoreAndEnrichClusters(clusters, patientsMap);

  // Generate alerts
  const clusterAlerts = generateAlerts(clusters);

  return { nodes, edges, clusters, clusterAlerts };
}
