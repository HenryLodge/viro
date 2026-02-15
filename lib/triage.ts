import OpenAI from "openai";

/* ── Types ── */

export interface PatientData {
  id: string;
  full_name: string | null;
  age: number | null;
  symptoms: string[];
  severity_flags: string[];
  risk_factors: string[];
  travel_history: string | null;
  exposure_history: string | null;
}

export interface TriageResult {
  tier: "critical" | "urgent" | "routine" | "self-care";
  reasoning: string;
  risk_flags: string[];
  recommended_action: string;
  self_care_instructions: string | null;
}

/* ── System prompt following ESI triage guidelines ── */

const SYSTEM_PROMPT = `You are an expert emergency triage nurse following the Emergency Severity Index (ESI) guidelines. Your role is to assess a patient's structured intake data and determine their urgency tier.

You MUST return a JSON object with exactly these fields:
{
  "tier": one of "critical", "urgent", "routine", or "self-care",
  "reasoning": a 2-4 sentence patient-facing explanation of why this tier was assigned. Use clear, non-alarming language. Explain what factors contributed to the assessment.
  "risk_flags": an array of short string identifiers for key risk factors identified (e.g. "high_fever", "elderly", "diabetes", "travel_exposure", "breathing_difficulty"),
  "recommended_action": a 1-2 sentence recommendation for what the patient should do next,
  "self_care_instructions": if tier is "self-care", provide specific home care guidance (rest, hydration, when to escalate). Otherwise set to null.
}

Tier Definitions:
- **critical**: Life-threatening symptoms present (e.g. severe breathing difficulty, chest pain, confusion, inability to keep fluids down combined with other risk factors). Immediate emergency care needed.
- **urgent**: Serious symptoms OR high-risk profile (elderly + multiple comorbidities, high fever with travel exposure, etc.). Same-day in-person evaluation needed.
- **routine**: Moderate symptoms without severe flags. Schedule appointment within 24-48 hours.
- **self-care**: Mild symptoms, low risk, no severe flags, no high-risk factors. Home monitoring with guidance.

Guidelines:
1. ALWAYS err on the side of caution. If uncertain between two tiers, choose the MORE urgent one.
2. Multi-factor risk combinations should escalate the tier (e.g. age > 65 + diabetes + fever = at least urgent).
3. Any breathing difficulty or chest pain should be at least urgent.
4. Recent travel to affected regions combined with respiratory symptoms should escalate by one tier.
5. The reasoning field is shown directly to the patient — keep it empathetic, clear, and non-technical.
6. Risk flags should be concise identifiers, not full sentences.`;

/* ── Run triage ── */

export async function runTriage(patient: PatientData): Promise<TriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }

  const openai = new OpenAI({ apiKey });

  const userMessage = buildUserMessage(patient);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = JSON.parse(content) as TriageResult;

  // Validate the tier value
  const validTiers = ["critical", "urgent", "routine", "self-care"];
  if (!validTiers.includes(parsed.tier)) {
    throw new Error(`Invalid triage tier returned: ${parsed.tier}`);
  }

  return {
    tier: parsed.tier,
    reasoning: parsed.reasoning ?? "Assessment completed.",
    risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    recommended_action: parsed.recommended_action ?? "Please consult a healthcare provider.",
    self_care_instructions: parsed.self_care_instructions ?? null,
  };
}

/* ── Build the user message with structured patient data ── */

function buildUserMessage(patient: PatientData): string {
  const parts: string[] = [
    "Please triage the following patient based on their intake data:\n",
  ];

  if (patient.full_name) parts.push(`Name: ${patient.full_name}`);
  if (patient.age != null) parts.push(`Age: ${patient.age}`);

  if (patient.symptoms.length > 0) {
    parts.push(`Symptoms: ${patient.symptoms.join(", ")}`);
  }

  if (patient.severity_flags.length > 0) {
    parts.push(`Severity Flags (currently experiencing): ${patient.severity_flags.join(", ")}`);
  }

  if (patient.risk_factors.length > 0) {
    parts.push(`Pre-existing Conditions / Risk Factors: ${patient.risk_factors.join(", ")}`);
  }

  if (patient.travel_history) {
    parts.push(`Recent Travel History: ${patient.travel_history}`);
  }

  if (patient.exposure_history) {
    parts.push(`Exposure History: ${patient.exposure_history}`);
  }

  return parts.join("\n");
}
