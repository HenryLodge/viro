import { NextResponse } from "next/server";
import {
  generateForecast,
  type DailyCaseCount,
  type ClusterMeta,
  type ForecastResult,
} from "@/lib/ai-forecast";

/**
 * POST /api/network/forecast
 *
 * Accepts a cluster's daily case time-series data and metadata, then uses
 * GPT-4o to generate a 7-day outbreak trend forecast.
 *
 * Request body:
 *   { dailyCases: DailyCaseCount[], clusterMeta: ClusterMeta }
 *
 * Response:
 *   ForecastResult
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { dailyCases, clusterMeta } = body as {
      dailyCases?: unknown;
      clusterMeta?: unknown;
    };

    // ── Validate required fields ──────────────────────────────────

    if (!Array.isArray(dailyCases) || dailyCases.length === 0) {
      return NextResponse.json(
        {
          error:
            "`dailyCases` must be a non-empty array of { date: string, cases: number } objects.",
        },
        { status: 400 },
      );
    }

    // Validate each entry
    for (let i = 0; i < dailyCases.length; i++) {
      const entry = dailyCases[i] as Record<string, unknown>;
      if (typeof entry?.date !== "string" || typeof entry?.cases !== "number") {
        return NextResponse.json(
          {
            error: `dailyCases[${i}] must have a string "date" and number "cases".`,
          },
          { status: 400 },
        );
      }
    }

    if (!clusterMeta || typeof clusterMeta !== "object") {
      return NextResponse.json(
        { error: "`clusterMeta` must be an object with cluster metadata." },
        { status: 400 },
      );
    }

    const meta = clusterMeta as Record<string, unknown>;
    if (typeof meta.clusterId !== "string") {
      return NextResponse.json(
        { error: "`clusterMeta.clusterId` must be a string." },
        { status: 400 },
      );
    }

    // ── Call AI forecast ──────────────────────────────────────────

    const forecast: ForecastResult = await generateForecast(
      dailyCases as DailyCaseCount[],
      clusterMeta as ClusterMeta,
    );

    return NextResponse.json(forecast);
  } catch (err) {
    console.error("Network forecast API error:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
