import OpenAI from "openai";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

/** The serializable (JSON-safe) version of NetworkFilterState returned by GPT. */
export interface ParsedFilterState {
  ageGroups: string[];
  triageTiers: string[];
  symptoms: string[];
  regions: string[];
  /** Optional ISO date string — if the query mentions a date/time constraint */
  beforeDate?: string | null;
}

/** Vocabulary passed to GPT so it can map natural language to exact filter values. */
export interface FilterVocabulary {
  availableSymptoms: string[];
  availableRegions: string[];
}

/* ══════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════ */

const VALID_AGE_GROUPS = ["0-17", "18-34", "35-49", "50-64", "65+"] as const;
const VALID_TRIAGE_TIERS = [
  "critical",
  "urgent",
  "routine",
  "self-care",
] as const;

/* ══════════════════════════════════════════════════════════════
   System Prompt
   ══════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are a filter-translation engine for an epidemiological surveillance dashboard. An analyst types a natural-language query describing the patients they want to see. Your job is to translate that query into a structured JSON filter object.

You MUST return a JSON object with exactly these fields:
{
  "ageGroups": string[],      // subset of the available age groups
  "triageTiers": string[],    // subset of the available triage tiers
  "symptoms": string[],       // subset of the available symptoms
  "regions": string[],        // subset of the available regions
  "beforeDate": string | null // ISO 8601 date string if the query mentions a time constraint, otherwise null
}

Rules:
1. Only use values from the provided vocabulary lists. Never invent new values.
2. For dimensions not mentioned in the query, return an empty array [].
3. Map natural language to the closest matching filter values:
   - "elderly" or "seniors" or "older adults" or "over 65" → ageGroups: ["65+"]
   - "children" or "kids" or "pediatric" or "minors" → ageGroups: ["0-17"]
   - "young adults" → ageGroups: ["18-34"]
   - "middle-aged" → ageGroups: ["35-49", "50-64"]
   - "critical" or "most severe" or "life-threatening" → triageTiers: ["critical"]
   - "urgent" or "high priority" → triageTiers: ["urgent"]
   - "urgent or worse" or "at least urgent" → triageTiers: ["critical", "urgent"]
   - "non-critical" or "lower priority" → triageTiers: ["routine", "self-care"]
4. For symptoms, find the closest match in the available symptoms list. Use fuzzy matching:
   - "respiratory" could match "severe_cough", "shortness_of_breath", etc.
   - "fever" could match "high_fever", "mild_fever", etc.
   Match ALL relevant symptoms from the vocabulary that relate to the query term.
5. For regions, match city/area names against the available regions list.
6. For time constraints like "last week", "past 3 days", "before February 10", compute an ISO date relative to today's date (provided below).
7. If the query is too vague to map to any filter dimension, return all empty arrays and null beforeDate.
8. Be generous in matching — if the analyst clearly intends a filter, apply it even if their phrasing is informal.`;

/* ══════════════════════════════════════════════════════════════
   User Message Builder
   ══════════════════════════════════════════════════════════════ */

export function buildQueryMessage(
  query: string,
  vocabulary: FilterVocabulary,
): string {
  const today = new Date().toISOString().split("T")[0];

  const parts: string[] = [
    `Today's date: ${today}`,
    "",
    `Available triage tiers: ${VALID_TRIAGE_TIERS.join(", ")}`,
    `Available age groups: ${VALID_AGE_GROUPS.join(", ")}`,
    `Available symptoms: [${vocabulary.availableSymptoms.join(", ")}]`,
    `Available regions: [${vocabulary.availableRegions.join(", ")}]`,
    "",
    `Analyst query: "${query}"`,
    "",
    "Translate this query into the JSON filter object.",
  ];

  return parts.join("\n");
}

/* ══════════════════════════════════════════════════════════════
   Response Parser & Validator
   ══════════════════════════════════════════════════════════════ */

function validateAndClean(
  raw: Record<string, unknown>,
  vocabulary: FilterVocabulary,
): ParsedFilterState {
  const ageGroupsSet = new Set<string>(VALID_AGE_GROUPS);
  const tiersSet = new Set<string>(VALID_TRIAGE_TIERS);
  const symptomsSet = new Set(vocabulary.availableSymptoms);
  const regionsSet = new Set(vocabulary.availableRegions);

  // Safely extract arrays, filtering to valid values only
  const ageGroups = Array.isArray(raw.ageGroups)
    ? (raw.ageGroups as string[]).filter((v) => ageGroupsSet.has(v))
    : [];

  const triageTiers = Array.isArray(raw.triageTiers)
    ? (raw.triageTiers as string[]).filter((v) => tiersSet.has(v))
    : [];

  const symptoms = Array.isArray(raw.symptoms)
    ? (raw.symptoms as string[]).filter((v) => symptomsSet.has(v))
    : [];

  const regions = Array.isArray(raw.regions)
    ? (raw.regions as string[]).filter((v) => regionsSet.has(v))
    : [];

  let beforeDate: string | null = null;
  if (typeof raw.beforeDate === "string" && raw.beforeDate) {
    // Basic ISO date validation
    const d = new Date(raw.beforeDate);
    if (!isNaN(d.getTime())) {
      beforeDate = d.toISOString();
    }
  }

  return { ageGroups, triageTiers, symptoms, regions, beforeDate };
}

/* ══════════════════════════════════════════════════════════════
   Main Entry Point
   ══════════════════════════════════════════════════════════════ */

/**
 * Translates a natural-language analyst query into a structured
 * `ParsedFilterState` using GPT-4o.
 *
 * @param query - The analyst's natural-language query string.
 * @param vocabulary - The currently available symptoms and regions
 *                     (derived from the active dataset).
 * @returns A `ParsedFilterState` that can be converted into a
 *          `NetworkFilterState` on the client (arrays → Sets).
 */
export async function parseNaturalLanguageQuery(
  query: string,
  vocabulary: FilterVocabulary,
): Promise<ParsedFilterState> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  const openai = new OpenAI({ apiKey });

  const userMessage = buildQueryMessage(query, vocabulary);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 600,
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

  return validateAndClean(parsed, vocabulary);
}
