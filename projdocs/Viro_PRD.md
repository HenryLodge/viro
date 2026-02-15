# VIRO — Product Requirements Document

**Viral Intelligence & Response Orchestrator**

**Project:** InnovAIte 2026 Hackathon — AINU's Third Annual Hackathon
**Date:** February 14-15, 2026
**Team:** Viro Team
**Submission Email:** aiclub.neu@gmail.com

---

## 1. Problem Statement

Pandemics are not stopped by treating one patient at a time — they are stopped by seeing the pattern before it becomes a crisis. Today's health infrastructure fails at exactly this point. Patient intake data is siloed inside individual hospitals. Governments and public health agencies rely on slow, manually-reported case counts that lag days or weeks behind reality. By the time an emerging cluster is recognized, community transmission is already underway.

The core problems:

- **Fragmented intake data.** Every hospital uses its own triage forms, its own systems. There is no standardized, interoperable check-in that feeds into a shared intelligence layer.
- **No real-time pattern detection.** Public health teams have no way to see symptom clusters forming across hospitals, cities, or borders until it's too late.
- **Patients don't know where to go.** During surges, patients flood the nearest ER regardless of capacity, while specialized facilities nearby have open beds.
- **No bridge from individual care to population intelligence.** The same data collected at triage — symptoms, travel history, exposure — is exactly what epidemiologists need, but it never reaches them in a usable form.

VIRO solves this by providing a universal patient triage check-in form that any hospital can deploy, combined with a pandemic intelligence platform that aggregates the non-sensitive data flowing from those check-ins to detect emerging threats in real time. Individual patients get fast, AI-powered triage and routing. Governments and health systems get early warning.

---

## 2. Product Overview

VIRO is a pandemic intelligence platform with two sides:

**Side 1 — Universal Patient Check-In.** A standardized, AI-powered triage form that any hospital or clinic can deploy. Patients submit their symptoms, risk factors, and exposure history. An AI engine (OpenAI GPT-4o) returns an urgency tier with clinical reasoning, and the system recommends the best nearby facility based on real-time capacity and specialty match. This is the data collection layer — every check-in contributes anonymized, non-sensitive data to the intelligence pipeline.

**Side 2 — Viro Intelligence Console.** The product Viro sells to governments, hospital networks, and public health agencies. A real-time analytics dashboard with a 3D global surveillance globe, a symptom network graph with data analysis tools, anomaly detection, and cluster alerting. Analysts use it to spot emerging outbreaks, trace geographic spread corridors, identify demographic vulnerabilities, and allocate resources before a crisis escalates.

### The Four Layers

- **Layer 1 — Universal Triage Check-In:** Standardized patient intake form with AI-powered triage. Deployable at any participating hospital.
- **Layer 2 — Smart Hospital Routing:** Triaged patients are matched to nearby facilities based on real-time capacity, specialty availability, and proximity.
- **Layer 3 — Global Epidemiological Globe:** A 3D globe visualization showing outbreak concentration, anomaly detection, and cascading threat paths across regions.
- **Layer 4 — Data Analysis Tooling:** Interactive tools on the network graph for filtering, time-based exploration, drill-down analysis, and report generation. *(Aspirational — see Section 7.4)*

---

## 3. Target Users

### 3.1 Patients
- Individuals experiencing symptoms during an outbreak or routine illness
- Need fast, clear guidance on urgency and where to go
- May be anxious, non-technical, and accessing from mobile
- Interact with Viro through the universal check-in form at a hospital kiosk, website, or mobile device

### 3.2 Analysts (Viro Intelligence Console Users)
- Government public health officials, epidemiologists, hospital network administrators
- The customers who purchase access to Viro's intelligence platform
- Need real-time visibility into emerging patterns, geographic spread, demographic risk, and resource strain
- Must make rapid containment and resource allocation decisions under pressure
- Interact with Viro through the Analyst Console (globe view, network graph, alerts, data tools)

### 3.3 Hospital IT / Deployment Partners
- Hospital systems and clinic networks that deploy Viro's universal check-in form
- Integrate Viro's triage form into their existing patient intake workflow
- Benefit from AI triage and smart routing for their patients
- Their check-in data (anonymized) feeds into the intelligence layer

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Database | Supabase (Postgres, Auth, Real-time) |
| AI Engine | OpenAI GPT-4o (via Next.js API route) |
| Maps | Leaflet.js / react-leaflet |
| Globe Visualization | Globe.gl (Three.js-based) |
| Network Graph | react-force-graph-2d |
| Charts | Recharts |
| Deployment | Vercel |
| Language | TypeScript throughout |

---

## 5. Architecture

### 5.1 System Flow

```
Patient arrives at hospital → Universal Check-In Form (Viro)
        ↓
Patient submits symptoms, risk factors, exposure history
        ↓
Next.js API route calls OpenAI GPT-4o with structured patient data
        ↓
GPT-4o returns: urgency tier, reasoning, risk flags (JSON)
        ↓
Result written to Supabase `patients` table
        ↓
Patient sees triage result + recommended hospital (Layer 2)
        ↓
Non-sensitive data flows to Viro Intelligence Console in real time
        ↓
┌─────────────────────────────────────────────────────────┐
│  Viro Intelligence Console (Analyst View)               │
│                                                         │
│  Globe View ─── regional case concentration, anomaly    │
│                 detection, geographic spread arcs        │
│                                                         │
│  Network View ─ symptom network graph, cluster           │
│                 detection, data analysis tools           │
│                                                         │
│  Alerts ─────── anomaly alerts, cluster alerts,         │
│                 recommended containment actions          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow: From Check-In to Intelligence

The key architectural insight is that the same data collected for individual patient care also powers population-level surveillance:

1. **Patient-facing**: Name, triage result, hospital recommendation (used once, PII-protected)
2. **Intelligence-facing**: Age bracket, symptoms, severity flags, risk factors, travel history, exposure history, geographic coordinates, timestamps (anonymized, aggregated, retained for pattern analysis)

This dual-use design means every patient check-in makes the intelligence layer smarter.

### 5.3 Route Structure

```
app/
├── page.tsx                      # Landing page (product overview + CTAs)
├── login/page.tsx                # Authentication (Patient vs Analyst)
├── patient/
│   ├── intake/page.tsx           # Universal triage check-in form
│   ├── results/page.tsx          # Triage result + hospital routing + map
│   └── status/page.tsx           # Tracking / status updates
├── provider/
│   └── dashboard/page.tsx        # Viro Intelligence Console (Globe + Network + Alerts)
├── api/
│   ├── auth/profile/route.ts     # User profile management
│   ├── triage/route.ts           # AI triage endpoint
│   ├── hospitals/route.ts        # Hospital data + ranking endpoint
│   └── network/route.ts          # Symptom network graph data endpoint
```

*Note: The `/provider/` route path is used in code for the analyst experience. The role in the database is being renamed from `provider` to `analyst`.*

---

## 6. Database Schema (Supabase)

### 6.1 `profiles` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Linked to Supabase Auth user |
| role | text | `patient` or `analyst` |
| full_name | text | |
| email | text | |
| created_at | timestamptz | |

### 6.2 `patients` Table (Real-time enabled)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK -> profiles) | |
| full_name | text | PII — used for patient-facing only |
| age | int | Retained for demographic analysis |
| symptoms | jsonb | Array of symptom strings |
| severity_flags | jsonb | e.g., difficulty breathing, chest pain |
| risk_factors | jsonb | e.g., immunocompromised, age > 65 |
| travel_history | text | Recent travel / exposure details |
| exposure_history | text | Known contact with confirmed cases |
| triage_tier | text | `critical` / `urgent` / `routine` / `self-care` |
| triage_reasoning | text | AI-generated explanation |
| risk_flags | jsonb | Key flags identified by AI |
| assigned_hospital_id | uuid (FK -> hospitals) | |
| status | text | `pending` / `triaged` / `routed` / `admitted` |
| lat | float | Geographic coordinate for analysis |
| lng | float | Geographic coordinate for analysis |
| created_at | timestamptz | Timestamp for temporal analysis |
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

### 6.5 `cluster_alerts` Table
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | |
| cluster_label | text | Human-readable cluster name |
| patient_count | int | Number of patients in cluster |
| shared_symptoms | jsonb | Common symptoms across cluster |
| geographic_spread | text | Description of affected areas |
| travel_commonalities | text | Shared travel/exposure patterns |
| growth_rate | text | `Emerging` / `Steady` / `Accelerating` / `Exponential` |
| recommended_action | text | AI/rule-generated containment recommendation |
| created_at | timestamptz | |

---

## 7. Feature Specifications

### 7.1 Layer 1 — Universal Triage Check-In

The standardized patient intake form that any hospital can deploy. Designed to be fast (under 3 minutes), accessible on mobile, and calming for anxious patients.

**Check-In Form Fields:**
- Full name, age, sex
- Primary symptoms (multi-select checklist + free text)
- Symptom duration
- Severity flags: difficulty breathing, chest pain, high fever (>103 F), confusion, inability to keep fluids down
- Pre-existing conditions / risk factors: immunocompromised, diabetes, heart disease, age > 65, pregnancy
- Recent travel (last 14 days) — location + dates
- Known exposure to confirmed cases (yes/no + details)
- Location (geolocation or metro area selection)

**AI Triage Engine (OpenAI GPT-4o):**

The API route sends structured patient data to GPT-4o with a system prompt that acts as a triage engine following ESI (Emergency Severity Index) guidelines. GPT-4o returns a JSON response:

```json
{
  "tier": "urgent",
  "reasoning": "Patient presents with high fever for 3 days with recent travel to affected region. Combined with age (68) and diabetes, risk profile warrants urgent in-person evaluation.",
  "risk_flags": ["high_fever", "elderly", "diabetes", "travel_exposure"],
  "recommended_action": "Seek immediate in-person evaluation at nearest facility with infectious disease capability.",
  "self_care_instructions": null
}
```

**Triage Tiers:**
- **Critical** — Life-threatening symptoms, immediate emergency care needed
- **Urgent** — Serious symptoms or high-risk profile, same-day evaluation needed
- **Routine** — Moderate symptoms, schedule appointment within 24-48 hours
- **Self-Care** — Mild symptoms, low risk, home monitoring with guidance provided

### 7.2 Layer 2 — Smart Hospital Routing

After triage, the system matches the patient to the best nearby facility. This benefits both the patient (faster care) and the health system (load balancing across facilities).

**Matching Algorithm:**

```
score = (w1 x normalized_available_beds)
      + (w2 x 1 / distance_km)
      + (w3 x specialty_match_bonus)
      - (w4 x normalized_wait_time)
```

Weights: w1 = 0.15, w2 = 0.50, w3 = 0.25, w4 = 0.10

**Display:**
- Top 3 recommended facilities shown on a Leaflet map
- Each pin shows: name, distance, estimated wait, available beds
- Clicking a recommendation shows directions, contact info, and specialties
- Patient confirms selection and proceeds to status tracking

### 7.3 Layer 3 — Global Epidemiological Globe (Analyst Console)

The centerpiece of the Viro Intelligence Console. A 3D globe visualization that gives analysts a real-time picture of global outbreak dynamics.

**Visualization (Globe.gl):**
- 3D rotating globe with nodes at geographic coordinates
- Nodes = cities/regions from `regions` table
- Node size = case volume
- Node color = severity gradient (green -> yellow -> orange -> red)
- Node pulse animation = anomaly detected
- Arcs between nodes = outbreak spread paths / geographic correlation
- Arc color: dim gray (normal) -> bright red (active cascade)

**Anomaly Detection:**
- Per-region case count and severity tracking
- Anomaly flag triggers pulsing red ring on globe
- Connected arcs highlight to show potential spread corridors

**Analyst Console Integration:**
- Globe is the default view of the Analyst Console
- Sidebar shows: anomaly alerts, top trending symptoms, recommended containment actions
- Toggle between Globe View and Network View
- Dashboard stats bar: Active Cases, Anomalies Detected, Triaged Today, Critical Patients
- Real-time updates via Supabase subscriptions — new patients appear as they check in

### 7.4 Layer 4 — Data Analysis Tooling (Network Graph View)

The Network Graph view provides analysts with interactive tools to explore patient data, discover patterns, and generate insights. The graph represents patients as nodes and connects them by symptom similarity, travel correlation, geographic proximity, and exposure links.

**[Built] Symptom Network Graph:**
- Force-directed graph (react-force-graph-2d) of patient connections
- Nodes = patients, colored by triage tier, sized by connection count
- Edges = weighted similarity (symptoms 35%, travel 30%, geo-temporal 20%, exposure 15%)
- Hover to highlight a node and its neighbors
- Click to focus and zoom
- Automatic cluster detection via connected-component analysis
- Cluster alerts generated when clusters exceed threshold

**[Built] Cluster Alerts:**
- Displayed in the sidebar when in Network View
- Each alert shows: cluster label, patient count, shared symptoms, geographic spread, travel commonalities, growth rate, recommended action
- Examples: flight corridor clusters, workplace clusters, community transmission clusters, demographic cohorts

**[Aspirational] Filters and Facets:**
- Sidebar filter panel on the Network View
- Filter by: age group (0-17, 18-34, 35-49, 50-64, 65+), symptom (multi-select), region/city, triage tier, date range
- Filters dynamically re-render the graph, showing only matching patients and their connections
- Filter state reflected in URL for shareability

**[Aspirational] Time Slider:**
- Horizontal slider below the graph representing the pandemic timeline (e.g., 60-day window)
- Scrub through time to see the graph evolve — watch clusters form, spread corridors emerge, and acceleration phases begin
- Play/pause button for automatic animation
- Allows analysts to answer: "When did this cluster first appear?" and "How fast is it growing?"

**[Aspirational] Drill-Down Panels:**
- Click a cluster or individual node to open a detail panel
- **Cluster drill-down**: demographic breakdown (age distribution chart), symptom frequency bar chart, geographic spread mini-map, growth-over-time sparkline, list of contributing exposure events
- **Patient drill-down**: full anonymized profile, connections to other patients, timeline of similar cases in the same region
- Powered by Recharts for embedded visualizations

**[Aspirational] Export and Reports:**
- Export current filtered view as CSV (patient records matching active filters)
- Generate a PDF summary report with: cluster count, top symptoms, growth rates, demographic risk breakdown, geographic spread summary
- Designed for analysts who need to brief leadership or share findings across agencies

---

## 8. Data Privacy and Non-Sensitive Collection

Viro's intelligence layer is built on a principle of **privacy-preserving epidemiological analysis**. The platform collects structured health data at triage and retains only what is necessary for pattern detection.

**What is retained for analysis (non-sensitive):**
- Age (integer, not date of birth)
- Symptoms, severity flags, risk factors (structured medical data)
- Travel history and exposure history (anonymized location data)
- Triage tier and reasoning
- Geographic coordinates (city-level precision, jittered)
- Timestamps

**What is PII-protected (not used in analytics):**
- Full name (used only for patient-facing triage result)
- Email and auth credentials (Supabase Auth, never exposed to analytics)
- User ID linkage (analytics queries never join back to auth identity)

**Technical safeguards:**
- Supabase Row-Level Security (RLS) ensures patients can only read their own records
- Analyst role has read access to patient data for aggregate analysis but cannot modify records
- All data transmitted over HTTPS; database encrypted at rest
- Geographic coordinates are jittered at intake to prevent precise location identification

---

## 9. Authentication and Role-Based Access

**Approach:** Supabase Auth with email login

- On signup/login, user selects role (`patient` or `analyst`)
- Role stored in `profiles` table
- Next.js middleware redirects based on role:
  - `patient` -> `/patient/intake`
  - `analyst` -> `/provider/dashboard`
- Pre-seeded demo accounts:
  - Patient: `patient@viro.com` / `viro2026`
  - Analyst: `doctor@viro.com` / `viro2026`

**Access Control:**

| Resource | Patient | Analyst |
|----------|---------|---------|
| Intake form | Read/Write own | No access |
| Triage results | Read own | Read all (aggregate) |
| Hospital data | Read | Read |
| Globe / Network | No access | Read |
| Cluster alerts | No access | Read |
| Region data | No access | Read |
| Data analysis tools | No access | Full access |

---

## 10. Triage Pipeline

**Endpoint:** `POST /api/triage`

**Flow:**
1. Receive patient ID in request body
2. Fetch patient record from Supabase
3. Construct OpenAI API request with system prompt + patient data (using `response_format: { type: "json_object" }` for reliable JSON output)
4. Parse GPT-4o's JSON response
5. Run hospital matching algorithm against `hospitals` table
6. Update patient record with triage result, assigned hospital, and status
7. Run network engine for cluster detection; persist cluster alerts if threshold crossed
8. Return triage result, assigned hospital, top hospitals, and network alerts to frontend

**System Prompt (summary):**
The GPT-4o system prompt instructs the model to act as an emergency triage nurse following ESI (Emergency Severity Index) guidelines. It receives structured patient data and must return a JSON object with tier, reasoning, risk_flags, recommended_action, and optional self_care_instructions. The prompt emphasizes: erring on the side of caution (upgrade tier if uncertain), flagging multi-factor risk combinations, and providing clear, non-alarming language for patient-facing reasoning.

---

## 11. Demo Flow (Presentation)

The demo tells the story of Viro as a platform — from a single patient check-in to global pandemic intelligence.

1. **Open Viro** — Show the landing page. "Viro is a pandemic intelligence platform. Hospitals deploy our universal check-in form. Governments and health systems use our analytics console to catch outbreaks early."
2. **Patient Check-In** — Log in as a patient. Fill out the triage form: 68-year-old with fever, dry cough, joint pain, recent travel to Mumbai, diabetic. Submit.
3. **AI Triage Result** — Show the urgency tier ("Urgent"), the reasoning, and the risk flags. "This took seconds. The patient knows exactly how serious their situation is."
4. **Hospital Routing** — Show the map with top 3 recommended facilities. "The system routes them away from the overcrowded ER to a facility with open beds and infectious disease capability."
5. **Switch to Analyst Console** — Log in as an analyst. Show the Intelligence Console.
6. **Globe View** — Show the 3D globe. "Every node is a city where Viro check-ins are happening. Mumbai is red and pulsing — that's where our Viro-X index cases originated. Watch the arcs: Mumbai to London, Mumbai to New York. This is the flight corridor spread pattern."
7. **Network View** — Switch to the symptom network graph. "Each dot is a patient. The connections show symptom and travel similarity. See these clusters? The system detected them automatically — a flight corridor cluster on BA-138, a workplace cluster at Goldman Sachs in NYC, a community transmission cluster in Boston."
8. **Cluster Alert** — Click a cluster alert in the sidebar. "Joint pain plus dry cough — that's the Viro-X signature. The system flagged it as an early diagnostic marker across 25% of all cases."
9. **Data Tools** *(if built)* — Show the time slider scrubbing through the 60-day window. Watch clusters form in real time. Apply a filter for age 65+. "Elderly patients have a 4x critical outcome rate — this is actionable intelligence for resource allocation."
10. **Close** — "One check-in form. One intelligence platform. Viro turns fragmented hospital data into early warning — so governments can move resources before the next pandemic spreads."

---

## 12. Judging Rubric Alignment

| Criteria | How Viro Addresses It |
|----------|----------------------|
| **Alignment to Problem Statement** | Directly addresses pandemic preparedness — an existential-scale threat. Solves the data fragmentation problem by standardizing intake and feeding it into a real-time intelligence layer. |
| **Responsiveness to Human Needs** | Two distinct experiences: patients get calming, fast triage and clear routing. Analysts get a powerful, data-rich console for early warning and resource planning. Accessible via web/mobile. |
| **Technicality** | OpenAI GPT-4o for AI triage, Supabase real-time subscriptions, Globe.gl 3D visualization, force-directed network graph with cluster detection, weighted scoring for hospital routing, anomaly detection. |
| **Ethical Considerations** | Privacy-preserving design: non-sensitive data retained for analysis, PII protected by RLS. Transparent AI reasoning (patients see why they were triaged). Equitable routing accounts for capacity, not just proximity. |
| **Feasibility & Scalability** | Modular four-layer architecture. Each layer works independently. Universal check-in form can be deployed at any hospital. Intelligence console scales with data volume. Supabase scales horizontally. |
| **Innovation & Creativity** | Novel two-sided platform: standardized check-in at the point of care feeds directly into global surveillance intelligence. The same data that helps one patient also helps prevent the next pandemic. |
| **Presentation Skills** | End-to-end story from patient check-in to global intelligence. Real-time data flow visible. Globe and network graph provide dramatic visual anchors. |

---

## 13. Seed Data

### Hospitals (65 across the US)
Pre-populated with realistic hospitals across all US regions (Northeast, Southeast, Midwest, Southwest, West Coast) with accurate capacity, specialty, wait time, and address data.

### Regions (25+ global cities)
Global cities with case counts and severity levels for the globe visualization. Anomaly hotspots seeded in Mumbai, Boston, Sao Paulo, and Lagos.

### Pandemic Seed Data (1,100+ synthetic patients)
Generated via `scripts/generate-pandemic-seed.ts`, simulating a 60-day "Pathogen Viro-X" pandemic with embedded discoverable patterns:

- **Phase 1 (Days 1-15)**: ~55 cases concentrated in Mumbai. Signature symptoms: fever, dry cough, fatigue, joint pain.
- **Phase 2 (Days 15-30)**: ~170 cases spreading via flight corridors to London, Dubai, Singapore, NYC.
- **Phase 3 (Days 30-45)**: ~375 cases with community transmission. Symptom evolution: shortness of breath and chest tightness become common.
- **Phase 4 (Days 45-60)**: ~520 cases with global acceleration. Elderly and immunocompromised patients show disproportionate critical outcomes.

**Embedded patterns for analysis:**
- Geographic spread corridors (Mumbai -> London -> NYC -> Boston)
- Flight-linked clusters (BA-138, AA-112, EK-500)
- Workplace clusters (Goldman Sachs NYC, Boston General Hospital staff)
- Community transmission clusters (Dorchester, Boston University)
- Demographic vulnerability (age 65+ has 4x critical rate; immunocompromised 3x)
- Viro-X symptom signature (joint pain + dry cough = early diagnostic marker)

Run: `npx tsx scripts/generate-pandemic-seed.ts`

---

## 14. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (used for AI triage)
OPENAI_API_KEY=

# Optional
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 15. Roadmap

### Built (v1.0)
- Universal patient triage check-in form with AI-powered triage (GPT-4o)
- Smart hospital routing with Leaflet map
- Patient status tracking
- Analyst Console: Globe view with regional surveillance
- Analyst Console: Network graph with cluster detection and alerts
- Real-time updates via Supabase subscriptions
- Role-based auth (patient / analyst)
- 1,100+ pandemic seed records with embedded epidemiological patterns
- 65 US hospitals, 25+ global regions

### Next (v1.1 — Aspirational)
- Filters/facets on network graph (age, symptom, region, tier, date range)
- Time slider for temporal exploration of pandemic progression
- Drill-down panels with demographic breakdowns, symptom charts, and trend sparklines
- CSV export of filtered data
- PDF report generation for briefings

### Future (v2.0+)
- Hospital API integrations for real-time bed availability
- Multi-tenant deployment (each hospital network gets its own check-in instance)
- Real epidemiological data feeds (WHO, CDC) alongside Viro check-in data
- Predictive modeling: forecast outbreak trajectory based on current growth patterns
- Mobile-native check-in app for deployment in resource-limited settings

---

*VIRO — Viral Intelligence & Response Orchestrator. Universal triage. Global intelligence. Early warning.*
