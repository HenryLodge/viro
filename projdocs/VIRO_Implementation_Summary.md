# VIRO — Implementation Summary

**Last updated:** February 2025  
**Purpose:** Snapshot of what is built and what remains for the InnovAIte 2026 hackathon.

---

## 1. What We Have

### 1.1 Authentication & Landing

| Item | Status | Notes |
|------|--------|------|
| Landing page | Done | Hero, gradient background, ViroLogo, CTAs (Get started / Sign in) |
| Login / sign-up | Done | LoginForm (email, password, role), CompleteProfileForm for incomplete profiles |
| Auth callback | Done | `/auth/callback` — PKCE, exchanges code for session |
| Profile API | Done | GET/POST `/api/auth/profile` — role, full_name, email |
| Middleware | Done | Session refresh; protects `/patient/*`, `/provider/*`; redirects by role |
| Sign out | Done | SignOutButton in patient and provider layouts |

**Key files:** `app/page.tsx`, `app/login/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/profile/route.ts`, `middleware.ts`, `lib/supabase/*`, `components/auth/*`, `components/ViroLogo.tsx`

---

### 1.2 Database (Supabase)

| Item | Status | Notes |
|------|--------|------|
| profiles | Done | id, role, full_name, email, created_at; RLS |
| patients | Done | Full schema per PRD §6.2; real-time enabled; RLS (own rows + providers read all) |
| hospitals | Done | id, name, lat, lng, capacity, specialties, wait_time, etc.; RLS (read) |
| regions | Done | id, name, lat, lng, case_count, severity, anomaly_flag, top_symptoms; RLS (read) |
| patients.lat / lng | Done | Added in separate migration for geolocation |

**Migrations:** `supabase/migrations/20260214000001_profiles.sql`, `20260214000002_tables.sql`, `20260215000001_patient_location.sql`

**Seed data:** `supabase/seed.sql` — 65 hospitals (US), 25 regions (global), demo users + profiles, 12 synthetic patients. Run in Supabase SQL Editor to populate.

---

### 1.3 Patient Flow (Layer 1 & 2)

| Item | Status | Notes |
|------|--------|------|
| Intake form | Done | Full name, age, sex, symptoms, severity flags, risk factors, travel/exposure, location (metro or geolocation) |
| Intake → DB | Done | Creates `patients` row (status `pending`), redirects to `/patient/results?id=<patient_id>` |
| Triage API | Done | POST `/api/triage` with `patient_id`; fetches patient, runs GPT-4o triage, hospital ranking, updates patient, returns triage + top 3 hospitals |
| AI triage | Done | `lib/triage.ts` — OpenAI GPT-4o, ESI-style prompt, JSON: tier, reasoning, risk_flags, recommended_action, self_care_instructions |
| Hospital matching | Done | `lib/hospital-matching.ts` — weighted score (capacity, distance, specialty, wait) |
| Results page | Done | Tier, reasoning, risk flags, recommended action, self-care; Leaflet map; hospital cards; Confirm → status |
| Status page | Done | Step progress (triaged → routed → admitted), hospital details |

**Key files:** `app/patient/intake/page.tsx`, `app/patient/results/page.tsx`, `app/patient/status/page.tsx`, `app/api/triage/route.ts`, `components/patient/IntakeForm.tsx`, `components/patient/HospitalMap.tsx`, `lib/triage.ts`, `lib/hospital-matching.ts`

---

### 1.4 Provider Flow (Layer 3)

| Item | Status | Notes |
|------|--------|------|
| Dashboard | Done | Globe (Globe.gl), anomaly sidebar, recent patients mini-feed, stats |
| Real-time patients | Done | Supabase subscription on `patients` INSERT; dashboard + full PatientFeed |
| Patients page | Done | PatientFeed with filters (tier, status), search, PatientCard list |
| Capacity page | Done | Fetches `/api/hospitals`; CapacitySummaryCards + HospitalCapacityTable |
| Hospitals API | Done | GET `/api/hospitals`; optional lat/lng/tier/specialty for ranked results |

**Key files:** `app/provider/dashboard/page.tsx`, `app/provider/patients/page.tsx`, `app/provider/capacity/page.tsx`, `app/api/hospitals/route.ts`, `components/provider/GlobeVisualization.tsx`, `components/provider/AnomalyAlertsSidebar.tsx`, `components/provider/PatientFeed.tsx`, `components/provider/PatientCard.tsx`, `components/provider/CapacitySummaryCards.tsx`, `components/provider/HospitalCapacityTable.tsx`, `components/provider/DashboardStats.tsx`, `components/provider/RecentPatientsMini.tsx`

---

### 1.5 Tech Stack in Use

- **Framework:** Next.js 14 (App Router), TypeScript  
- **Styling:** Tailwind CSS, shadcn/ui (button, input, label)  
- **Backend / DB:** Supabase (Postgres, Auth, Realtime)  
- **AI:** OpenAI GPT-4o via `lib/triage.ts` (called from `/api/triage`)  
- **Maps:** Leaflet (react-leaflet) in `HospitalMap`  
- **Globe:** Globe.gl in `GlobeVisualization`  
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (see `.env.example`; use `.env.local` for local values)

---

## 2. What to Verify or Add

1. **Run seed and migrations in Supabase**  
   - Ensure all three migrations have been run (profiles, tables, patient_location).  
   - Run `supabase/seed.sql` in the SQL Editor so hospitals, regions, and demo patients exist.

2. **Environment**  
   - `OPENAI_API_KEY` in `.env.local` so triage works.  
   - Supabase keys in `.env.local` (not only in `.env.example`).

3. **Optional: Persist recommended_action and self_care_instructions**  
   - Results page shows them; they are not stored in `patients` today.  
   - For “already triaged” to show them again, add columns to `patients` and update the triage API’s update payload.

4. **Demo**  
   - Confirm demo accounts (e.g. patient@viro.com, doctor@viro.com) match seed and work.  
   - Rehearse full flow: landing → login → intake → results → map → status; provider dashboard → patients → capacity.

---

## 3. PRD Alignment

| PRD Section | Implementation |
|------------|-----------------|
| §5 Architecture (system flow) | Intake → triage API (GPT-4o) → patients table → results + map; provider real-time feed |
| §6 Database schema | profiles, patients, hospitals, regions + RLS |
| §7.1 Layer 1 (intake + triage) | IntakeForm, `/api/triage`, `lib/triage.ts`, results page |
| §7.2 Layer 2 (routing + map) | `lib/hospital-matching.ts`, HospitalMap, hospital cards on results |
| §7.3 Layer 3 (globe + dashboard) | GlobeVisualization, AnomalyAlertsSidebar, real-time patient feed, capacity view |
| §8 Auth & roles | Supabase Auth, profiles.role, middleware redirects |
| §14 Mock data | seed.sql (hospitals, regions, synthetic patients) |

---

*VIRO — Viral Intelligence & Response Orchestrator. Built for InnovAIte 2026.*
