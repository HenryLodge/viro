import { NextResponse } from "next/server";
import {
  detectPatterns,
  type AiInsight,
} from "@/lib/ai-patterns";
import type {
  GraphNode,
  GraphEdge,
  Cluster,
  ClusterAlert,
} from "@/lib/network-engine";

/**
 * POST /api/network/patterns
 *
 * Accepts an aggregated graph summary (nodes, edges, clusters, clusterAlerts)
 * from the dashboard and uses GPT-4o to surface emerging epidemiological
 * patterns not yet captured by rule-based cluster alerts.
 *
 * Request body:
 *   { nodes: GraphNode[], edges: GraphEdge[], clusters: Cluster[], clusterAlerts: ClusterAlert[] }
 *
 * Response:
 *   { insights: AiInsight[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { nodes, edges, clusters, clusterAlerts } = body as {
      nodes?: unknown;
      edges?: unknown;
      clusters?: unknown;
      clusterAlerts?: unknown;
    };

    // ── Validate required fields ──────────────────────────────────

    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "`nodes` must be an array of GraphNode objects." },
        { status: 400 },
      );
    }

    if (!Array.isArray(edges)) {
      return NextResponse.json(
        { error: "`edges` must be an array of GraphEdge objects." },
        { status: 400 },
      );
    }

    if (!Array.isArray(clusters)) {
      return NextResponse.json(
        { error: "`clusters` must be an array of Cluster objects." },
        { status: 400 },
      );
    }

    if (!Array.isArray(clusterAlerts)) {
      return NextResponse.json(
        { error: "`clusterAlerts` must be an array of ClusterAlert objects." },
        { status: 400 },
      );
    }

    // ── Call AI pattern detection ─────────────────────────────────

    const insights: AiInsight[] = await detectPatterns(
      nodes as GraphNode[],
      edges as GraphEdge[],
      clusters as Cluster[],
      clusterAlerts as ClusterAlert[],
    );

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("Network patterns API error:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
