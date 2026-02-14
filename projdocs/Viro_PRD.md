# VIRO — Product Requirements Document

**Viral Intelligence & Response Orchestrator**

**Project:** InnovAIte 2026 Hackathon — AINU's Third Annual Hackathon
**Date:** February 14–15, 2026
**Team:** Viro Team
**Submission Email:** aiclub.neu@gmail.com

---

## 1. Problem Statement

During outbreak events, the hardest problem isn't just treating patients — it's getting the right patients to the right care fast while hospitals and doctors are overwhelmed. Existing systems are fragmented: patients don't know where to go, hospitals can't communicate capacity in real time, and public health teams lack early warning when symptom patterns shift. A failure in one part of the system cascades across all others.

VIRO addresses this by providing an AI-powered triage, routing, and surveillance platform that serves both patients and healthcare providers through a unified system.

---

## 2. Product Overview

VIRO is a three-layer AI-powered pandemic response system:

- **Layer 1 — Patient Intake & Triage:** Patients submit symptoms, risk factors, and exposure history. An AI engine (Claude API) returns an urgency tier with clinical reasoning.
- **Layer 2 — Smart Hospital Routing:** Triaged patients are matched to nearby facilities based on real-time capacity, specialty availability, and proximity.
- **Layer 3 — Global Epidemiological Network Globe:** A 3D globe visualization showing outbreak concentration, anomaly detection, and cascading threat paths for public health command teams.

---

## 3. Target Users

### 3.1 Patients
- Individuals experiencing symptoms during an outbreak
- Need fast, clear guidance on urgency and where to go
- May be anxious, non-technical, and accessing from mobile

### 3.2 Healthcare Providers / Public Health Teams
- Doctors, nurses, hospital administrators, epidemiologists
- Need real-time visibility into patient flow, capacity, and emerging patterns
- Must make rapid resource allocation decisions under pressure

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Database | Supabase (Postgres, Auth, Real-time, Edge Functions) |
| AI Engine | OpenAI GPT-4o (via Supabase Edge Function) |
| Maps | Leaflet.js / react-leaflet |
| Globe Visualization | Globe.gl (Three.js-based) |
| Deployment | Vercel |
| Language | TypeScript throughout |

---

## 5. Architecture

### 5.1 System Flow

```
Patient submits intake form
        ↓
Next.js frontend → Supabase Edge Function
        ↓
Edge Function calls OpenAI GPT-4o API with structured patient data
        ↓
GPT-4o returns: urgency tier, reasoning, risk flags (JSON)
        ↓
Edge Function writes result to Supabase `patients` table
        ↓
Patient sees triage result + hospital recommendation (Layer 2)
        ↓
Provider dashboard receives real-time update (Supabase subscription)
        ↓
Globe visualization updates with aggregated regional data (Layer 3)
```

### 5.2 Route Structure

```
app/
├── page.tsx                      # Role selection (Patient vs Provider login)
├── patient/
│   ├── intake/page.tsx           # Symptom intake form
│   ├── results/page.tsx          # Triage result + hospital routing + map
│   └── status/page.tsx           # Tracking/status updates
├── provider/
│   ├── dashboard/page.tsx        # Globe + anomaly alerts (main command center)
│   ├── patients/page.tsx         # Incoming triaged patient feed (real-time)
│   └── capacity/page.tsx         # Hospital capacity overview
├── api/
│   ├── triage/route.ts           # Fallback triage endpoint (if not using edge fn)
│   └── hospitals/route.ts        # Hospital data endpoint
```

---

## 6. Database Schema (Supabase)

### 6.1 `profiles` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Linked to Supabase Auth user |
| role | text | `patient` or `provider` |
| full_name | text | |
| email | text | |
| created_at | timestamptz | |

### 6.2 `patients` Table (Real-time enabled)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| full_name | text | |
| age | int | |
| symptoms | jsonb | Array of symptom objects |
| severity_flags | jsonb | e.g., difficulty breathing, chest pain |
| risk_factors | jsonb | e.g., immunocompromised, age > 65 |
| travel_history | text | Recent travel / exposure details |
| exposure_history | text | Known contact with confirmed cases |
| triage_tier | text | `critical` / `urgent` / `routine` / `self-care` |
| triage_reasoning | text | AI-generated explanation |
| risk_flags | jsonb | Key flags identified by AI |
| assigned_hospital_id | uuid (FK → hospitals) | |
| status | text | `pending` / `triaged` / `routed` / `admitted` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 6.3 `hospitals` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| lat | float | |
| lng | float | |
| total_capacity | int | Total beds |
| available_beds | int | Current availability |
| specialties | jsonb | Array of strings |
| wait_time_minutes | int | Estimated current wait |
| contact_phone | text | |
| address | text | |

### 6.4 `regions` Table (for Globe)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | City/region name |
| lat | float | |
| lng | float | |
| case_count | int | Active cases in region |
| severity | text | `low` / `moderate` / `high` / `critical` |
| anomaly_flag | boolean | True if pattern anomaly detected |
| top_symptoms | jsonb | Array of trending symptoms |
| updated_at | timestamptz | |

---

## 7. Feature Specifications

### 7.1 Layer 1 — Patient Intake & AI Triage

**Patient Intake Form Fields:**
- Full name, age, sex
- Primary symptoms (multi-select checklist + free text)
- Symptom duration
- Severity flags: difficulty breathing, chest pain, high fever (>103°F), confusion, inability to keep fluids down
- Pre-existing conditions / risk factors: immunocompromised, diabetes, heart disease, age > 65, pregnancy
- Recent travel (last 14 days) — location + dates
- Known exposure to confirmed cases (yes/no + details)

**AI Triage Engine (OpenAI GPT-4o):**

The Supabase Edge Function sends structured patient data to GPT-4o with a system prompt that acts as a triage engine. GPT-4o returns a JSON response:

```json
{
  "tier": "urgent",
  "reasoning": "Patient presents with high fever (104°F) for 3 days with recent travel to affected region. Combined with age (68) and diabetes, risk profile warrants urgent in-person evaluation.",
  "risk_flags": ["high_fever", "elderly", "diabetes", "travel_exposure"],
  "recommended_action": "Seek immediate in-person evaluation at nearest facility with infectious disease capability.",
  "self_care_instructions": null
}
```

**Triage Tiers:**
- **Critical** — Life-threatening symptoms, immediate emergency care needed
- **Urgent** — Serious symptoms or high-risk profile, same-day evaluation needed
- **Routine** — Moderate symptoms, schedule appointment within 24–48 hours
- **Self-Care** — Mild symptoms, low risk, home monitoring with guidance provided

### 7.2 Layer 2 — Smart Hospital Routing

**Matching Algorithm:**

Once a patient has a triage tier, the system matches them to a facility using a weighted scoring function:

```
score = (w1 × normalized_available_beds)
      + (w2 × 1 / distance_km)
      + (w3 × specialty_match_bonus)
      - (w4 × normalized_wait_time)
```

Suggested weights: w1 = 0.3, w2 = 0.3, w3 = 0.25, w4 = 0.15

**Display:**
- Top 3 recommended facilities shown on a Leaflet map
- Each pin shows: name, distance, estimated wait, available beds
- Clicking a recommendation shows directions and contact info

### 7.3 Layer 3 — Global Epidemiological Network Globe

**Visualization (Globe.gl):**
- 3D rotating globe with nodes at geographic coordinates
- Nodes = cities/regions from `regions` table
- Node size = case volume
- Node color = severity gradient (green → yellow → orange → red)
- Node pulse animation = anomaly detected
- Arcs between nodes = outbreak spread paths / patient transfer links
- Arc color: dim gray (normal) → bright red (active cascade)

**Anomaly Detection (simplified):**
- Synthetic time-series data per region (daily symptom counts, 2–3 weeks)
- Rolling average + standard deviation
- If latest data point > 2 standard deviations above mean → flag anomaly
- Flagged nodes pulse red, connected arcs highlight

**Provider Dashboard Integration:**
- Globe is the centerpiece of the provider dashboard
- Sidebar shows: anomaly alerts, top trending symptoms, recommended containment actions
- Real-time patient feed below or beside the globe (Supabase subscription on `patients` table)
- Hospital capacity summary panel

---

## 8. Authentication & Role-Based Access

**Approach:** Supabase Auth with email login

- On signup/login, user selects role (`patient` or `provider`)
- Role stored in `profiles` table
- Next.js middleware redirects based on role:
  - `patient` → `/patient/intake`
  - `provider` → `/provider/dashboard`
- For hackathon demo: pre-seed demo accounts (patient@viro.com / doctor@viro.com)

---

## 9. Edge Function — Triage Pipeline

**Endpoint:** `POST /functions/v1/triage`

**Flow:**
1. Receive patient intake payload
2. Validate required fields
3. Construct OpenAI API request with system prompt + patient data (using `response_format: { type: "json_object" }` for reliable JSON output)
4. Parse GPT-4o's JSON response
5. Run hospital matching algorithm against `hospitals` table
6. Write complete record to `patients` table (triage result + assigned hospital)
7. Return result to frontend

**System Prompt (summary):**
The GPT-4o system prompt instructs the model to act as an emergency triage nurse following ESI (Emergency Severity Index) guidelines. It receives structured patient data and must return a JSON object with tier, reasoning, risk_flags, recommended_action, and optional self_care_instructions. The prompt emphasizes: erring on the side of caution (upgrade tier if uncertain), flagging multi-factor risk combinations, and providing clear, non-alarming language for patient-facing reasoning.

---

## 10. Demo Flow (Presentation)

The ideal demo tells a complete end-to-end story in under 10 minutes:

1. **Open Viro** — Show the role selection / login screen
2. **Patient Journey** — Log in as a patient. Fill out the intake form with a realistic scenario (e.g., 68-year-old with fever, cough, recent travel to outbreak zone, diabetic). Submit.
3. **Triage Result** — Show the AI-generated urgency tier ("Urgent"), the reasoning, and the risk flags. Highlight that this happened in seconds.
4. **Hospital Routing** — Show the map with top 3 recommended facilities. Click one to see details.
5. **Switch to Provider** — Log in as a provider. Show the dashboard.
6. **Real-Time Feed** — Point out that the patient we just triaged appears in the incoming feed in real time.
7. **Globe** — Show the 3D globe. Narrate: "Each node represents a monitoring region. Watch what happens when we simulate a spike in respiratory cases in Boston." The Boston node swells, turns red, pulses. Arcs to connected cities light up.
8. **Anomaly Alert** — Show the sidebar alert recommending containment actions: targeted messaging, pop-up clinic deployment, staffing reallocation.
9. **Close** — "VIRO reduces outbreak deaths by triaging patients quickly, routing them away from overwhelmed hospitals, and giving health systems an early warning when symptom patterns shift — so resources move before the crisis spreads."

---

## 11. Judging Rubric Alignment

| Criteria | How Viro Addresses It |
|----------|----------------------|
| **Alignment to Problem Statement** | Directly addresses pandemic preparedness — an existential-scale threat. AI-powered, systems-thinking approach to interconnected health infrastructure. |
| **Responsiveness to Human Needs** | Two distinct user experiences designed for their actual needs. Patient view is calming and clear. Provider view is data-rich and actionable. Accessible via web/mobile. |
| **Technicality** | OpenAI GPT-4o for AI triage, Supabase real-time subscriptions, edge functions, Globe.gl 3D visualization, weighted scoring algorithm for routing, anomaly detection. |
| **Ethical Considerations** | Patient data privacy (Supabase RLS), transparent AI reasoning (patients see why they were triaged), equitable routing (not just proximity — accounts for capacity), accessible design. |
| **Feasibility & Scalability** | Modular three-layer architecture. Each layer works independently. Could plug into real hospital APIs, real epidemiological data feeds. Supabase scales horizontally. |
| **Innovation & Creativity** | Novel combination of AI triage + smart routing + global surveillance in one platform. The globe visualization ties individual patient data to global outbreak intelligence. |
| **Presentation Skills** | End-to-end demo story from patient to provider. Real-time data flow visible. Globe provides a dramatic visual anchor. |

---

## 12. Team Task Division

| Person | Responsibility | Priority |
|--------|---------------|----------|
| **A** | Supabase setup (tables, auth, RLS) + Edge Function + GPT-4o triage prompt | P0 — do first |
| **B** | Patient flow: login → intake form → results page → map (Leaflet) | P0 — do first |
| **C** | Provider flow: dashboard layout → real-time patient feed → capacity view | P0 — do first |
| **D** | Globe visualization (Globe.gl) + mock data seeding + presentation deck | P1 — start after data is seeded |

If 3-person team: merge C and D — the globe lives inside the provider dashboard.

---

## 13. Priority Order

**Must have by tonight (Feb 14):**
1. Patient can submit intake → edge function calls GPT-4o → triage result saved to DB → patient sees result
2. Provider dashboard shows incoming patients in real-time

**Must have by tomorrow morning (Feb 15):**
3. Hospital routing with map view
4. Globe visualization with mock data

**Polish (before 2:30 PM submission):**
5. Anomaly detection + alerts on provider dashboard
6. Demo flow rehearsed and smooth
7. Presentation deck (if using one)
8. Submission email sent to aiclub.neu@gmail.com

---

## 14. Mock Data Requirements

### Hospitals (seed 15–20)
Pre-populate with real-ish hospitals across the US Northeast (Boston, NYC, Philly, etc.) with realistic capacity, specialty, and wait time data.

### Regions (seed 20–30)
Global cities with synthetic case counts and severity levels. At least 2–3 regions should have anomaly flags set to `true` for demo purposes.

### Synthetic Patients (for demo)
Pre-seed 10–15 patients with varying triage tiers to populate the provider feed before the live demo.

---

## 15. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (used in Supabase Edge Function)
OPENAI_API_KEY=

# Optional
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

*Built for InnovAIte 2026. VIRO — Viral Intelligence & Response Orchestrator.*
