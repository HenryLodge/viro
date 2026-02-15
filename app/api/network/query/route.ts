import { NextResponse } from "next/server";
import {
  parseNaturalLanguageQuery,
  type FilterVocabulary,
} from "@/lib/ai-query";

/**
 * POST /api/network/query
 *
 * Accepts a natural-language analyst query along with the available
 * filter vocabulary (symptoms & regions currently in the dataset)
 * and returns a structured filter state parsed by GPT-4o.
 *
 * Request body:
 *   { query: string, availableSymptoms: string[], availableRegions: string[] }
 *
 * Response:
 *   { ageGroups, triageTiers, symptoms, regions, beforeDate }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { query, availableSymptoms, availableRegions } = body as {
      query?: unknown;
      availableSymptoms?: unknown;
      availableRegions?: unknown;
    };

    // ── Validate required fields ──────────────────────────────────

    if (typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty `query` string." },
        { status: 400 },
      );
    }

    if (!Array.isArray(availableSymptoms)) {
      return NextResponse.json(
        { error: "`availableSymptoms` must be an array of strings." },
        { status: 400 },
      );
    }

    if (!Array.isArray(availableRegions)) {
      return NextResponse.json(
        { error: "`availableRegions` must be an array of strings." },
        { status: 400 },
      );
    }

    // ── Build vocabulary & call AI parser ─────────────────────────

    const vocabulary: FilterVocabulary = {
      availableSymptoms: availableSymptoms.filter(
        (s): s is string => typeof s === "string",
      ),
      availableRegions: availableRegions.filter(
        (r): r is string => typeof r === "string",
      ),
    };

    const filters = await parseNaturalLanguageQuery(query.trim(), vocabulary);

    return NextResponse.json(filters);
  } catch (err) {
    console.error("Network query API error:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
