# Motherboard — Build Plan & Stage Status

Motherboard is an all-in-one community, learning, career, funding, and personalized course/career roadmap ecosystem for **Tech-Moms**, built with Next.js (App Router), TypeScript, and Tailwind CSS. It runs with zero required environment variables in mock mode (`DATA_MODE=mock`), connects to server-side Gemini API when `GEMINI_API_KEY` is present (with graceful template fallbacks when absent), and includes a full Supabase schema + adapter layer (`DATA_MODE=supabase`) for production cutover.

---

## Stage Status Overview

| Stage | Scope | Status |
|---|---|---|
| **Stage 1** | Foundation, App Shell, Role Switcher, Mock Data & RBAC | ✅ **Built** |
| **Stage 2** | Home Dashboards, Learn LMS & Events | ✅ **Built** |
| **Stage 3** | Announcements, Messaging, Ask Staff & Notifications | ✅ **Built** |
| **Stage 4** | Projects Board & Team Workspaces | ✅ **Built** |
| **Stage 5** | Careers Board, Talent Profiles & Employer Portal | ✅ **Built** |
| **Stage 6** | Personal Funding Hub, Public Giving Board, Checkout, Receipts & Sponsor Portal | ✅ **Built** |
| **Stage 7** | Staff Console, Impact Dashboard, Profile Settings & Supabase SQL | ✅ **Built** |
| **Add-On** | "My Roadmap" (Course & Path Catalog, Quiz, Rules Engine, Public Quiz, Staff Demand) | ✅ **Built** |
| **Add-On** | Gemini AI Runtime (Server-side API routes, safety layer, feature prompts, settings) | ✅ **Built** |
| **Stage 8** | Polish, Mobile/Accessibility Pass, Acceptance Verification & Documentation | ✅ **Built** |

---

## Built Modules & Route Architecture

### Stage 1 — Foundation, Identity, RBAC & Mock Store (Built)
- `/lib/data/types.ts` — Comprehensive TypeScript interfaces for all domain entities.
- `/lib/data/repository.ts` — Typed repository contract decoupling UI from storage.
- `/lib/data/mock/seed.ts` & `/lib/data/mock/store.ts` — Full cohesive mock dataset (~60 users, 12 personas, 5 programs, 6 cohorts, lessons, assignments, announcements, spaces, tickets, 12 projects, 15 jobs, 20 applications, campaigns, 40 donations, pledges, receipts, events) with `localStorage` persistence and "Reset demo data".
- `/lib/auth/permissions.ts` — Centralized `can(user, action, context)` scoped RBAC engine.
- `/messages/en.json` & `/messages/es.json` — Complete English/Spanish bilingual dictionary.
- Routes: `/` (landing page with 12 persona cards & 18+ adult attestation), `/dev/outbox` (dispatch log for simulated email, SMS, push, and digests).

### Stage 2 — Home Dashboards, Learn LMS & Events (Built)
- Routes:
  - `/home` — Adaptive dashboard by role (Student, Applicant, Instructor/TA, Staff/Admin, Employer, Sponsor).
  - `/learn` — Canvas-style LMS: Programs, Cohort Home, Modules & Lessons with embedded video, Assignments with rubric grading, Attendance records, Certification Tracker, Resource Library, and 2.0 Pathway View.
  - `/events` — List & calendar views, RSVP toggle, capacity, `.ics` Add-to-Calendar download, staff QR check-in modal, and recording links.

### Stage 3 — Announcements, Messages & Ask Staff (Built)
- Routes:
  - `/announcements` — Composer with EN/ES, stacked audience builder & live recipient count, Normal/Important/Urgent delivery to `/dev/outbox`, scheduling, pinning, required acknowledgements ("I've read this"), poster stats + unacknowledged nudge button, searchable archive, and employer announcement request form.
  - `/messages` — Slack-style messaging across cohort channels, subchannels, spaces, staff/instructor sync, 1:1 DMs, group DMs, threads, reactions, code blocks, mark question as resolved, report message, quiet hours banner, read-only 90-day archived cohort, and simulated live replies.
  - `/help` — Ask Staff help desk with Admissions, Funding, Careers, Tech Support, and General queues, staff assignment, and internal notes.

### Stage 4 — Community Projects Board (Built)
- Routes:
  - `/projects` — Discoverable project cards, multi-facet filters, "Recommended for you" row, 30-day inactivity paused state, and project creation modal.
  - Project detail with FAQ, rate-limited "Ask about this project" DM trigger (enforcing `allowQuestions` and `can()` DM rules), Join / Request-to-Join, member Kanban board, auto-linked project channel in `/messages`, updates feed, completion showcase, role confirmation on Talent Profile, and instructor endorsements.

### Stage 5 — Careers & Employer Portal (Built)
- Routes:
  - `/careers` — Co-op style job board with filters (3–6 month returnship, school-hours friendly, transparent pay ranges), one-click apply, candidate pipeline (`Applied → Screening → Interview → Offer → Hired`), Talent Profile editor with field-by-field privacy toggles, resume review queue, and mock interview booking.
  - `/employer` — Employer onboarding, job posting manager, applicant pipeline management, opted-in Talent Directory search, and direct applicant messaging.

### Stage 6 — Funding Hub, Public Funding Board & Receipts (Built)
- Routes:
  - `/funding/my` — Private student funding application, Tech-Moms scholarship & sponsor-seat awards, Utah DWS workforce aid guidance pre-screener + document checklist + status tracker, matched external grants, and auto-calculated remaining gap linking into campaign creation.
  - `/give` — Public Funding Board (accessible to Guest Donor with no login): Student Campaigns with staff-set cost items, Tech-Moms Campaigns, Grants & Assistance, and Discussion Forum. Individual and corporate donation flows, Stripe-style mock checkout, net-30 corporate invoice pledges, Staff Funding Console.
  - `/receipts/[id]` — Printable HTML/PDF tax receipts with IRS goods-or-services valuation math, recurring donor year-end tax statements, receipt editing/reissuing, and refund void notices.
  - `/sponsor` — Corporate Sponsor Portal with partnership tier summary, seats funded, anonymized student outcomes, employee volunteer signups, receipts, and live impact charts.

### Stage 7 — Staff Console, Impact & Profile (Built)
- Routes & Artifacts:
  - `/staff` — Unified Staff & Admin Console: Admissions queue (interviews, accept + auto-enroll), People & Scoped Roles + Audit Log, Cohort Builder (auto-creating cohort spaces), Moderation Queue, Funding Ledger & Approvals, Placement Coordinator Pipeline, Legal Text settings ("Pending legal review"), and Airtable CSV Import wizard.
  - `/impact` — Live public & staff Impact Dashboard powered by Recharts.
  - `/profile` — User preferences: Language (EN/ES), notification rules, quiet hours (default 9pm–7am), "Who can DM me", Talent Profile privacy toggles, age/conduct attestations, and connected accounts (Slack bridge preview).
  - `/supabase/migrations/0001_init.sql`, `/supabase/seed.sql`, and `/lib/data/supabase/*` — Complete Postgres + RLS schema, seed script, and typed Supabase repository adapter.

---

## Add-On Feature 1: "My Roadmap" (Built)
- **Architecture**:
  - `/lib/recommend/engine.ts` — Deterministic recommendation engine that scores career paths and sequences roadmaps into NOW (0–3 mo), NEXT (3–6 mo), and LATER (6–12+ mo) columns based strictly on allow-listed inputs.
  - `/lib/recommend/engine.test.ts` — Unit tests covering 6 sample learner profiles.
  - `/lib/data/mock/roadmap-seed.ts` — Seed catalog containing 8 Career Paths, 20 Catalog Items (courses, certifications, resume modules), seed interest profiles for Maria, Aisha, Jenna, and 25 anonymous public quiz submissions for demand forecasting.
- **Routes**:
  - `/roadmap` — Interactive roadmap page for students/alumnae: path switcher across top 3 recommendations, match scores, 3-column timeline cards with prerequisites and cost/funding links, schedule conflict warnings, side-by-side path comparison modal, "Ask about my roadmap" grounded chat, and "Talk to an advisor" ticket creator.
  - `/find-your-path` — Public, no-login 6-step interactive quiz with progress bar, bilingual EN/ES, top 3 path recommendations with starter roadmaps, and "Email my results" to Dev Outbox.
  - `/staff/catalog` — Staff course and pathway catalog manager.
  - `/staff/demand` — Staff demand forecasting dashboard with aggregate Recharts visualizers (interest by path, location, schedule, and waitlists — zero personal names).

---

## Add-On Feature 2: Gemini AI Integration (Built)
- **Architecture**:
  - `GEMINI_API_KEY` stored server-side only in app secrets / environment variables. Never exposed to browser.
  - `/lib/ai/client.ts` — Server-side Gemini API client wrapper with model selection (`gemini-1.5-flash` for fast tasks, `gemini-1.5-pro` for reasoning) and graceful template fallback when key is absent.
  - `/lib/ai/safety.ts` — Rate-limiting bucket (30 requests/hr/user), strict prompt allow-lists, hard safety barriers preventing any financial, income, or household data from reaching AI prompts, and universal `"Generated with AI — review before using"` attribution.
  - `/lib/ai/prompts.ts` — Prompt builders for 10 modular AI features with offline fallback templates.
  - `/app/api/ai/route.ts` — Secure Next.js POST endpoint routing all AI queries and logging telemetry.
  - `/app/staff/ai-settings/page.tsx` — Admin controls to toggle AI features on/off and inspect anonymized usage telemetry.

---

## Acceptance Checklist

### Core Prototype Checks
- [x] The app builds with no errors (`npm run build` succeeds) and runs with zero environment variables set.
- [x] Every persona can log in via the switcher and sees only what their role allows via `can()`.
- [x] Instructor posts an urgent announcement to their cohort → recipient count correct → Dev Outbox shows email + SMS → student sees banner → acknowledges → instructor stats update.
- [x] Student DMs instructor; employer cannot cold-DM a student but can message an applicant to their job.
- [x] Student creates a project → another student asks the owner a question → requests to join → owner approves → project channel and kanban appear.
- [x] Jenna’s campaign: create → staff approves → guest donor gives $100 as individual → receipt generated with correct goods-or-services line → campaign total updates → ledger entry exists.
- [x] Company donor chooses Gold tier with event-ticket benefit, pays by invoice → pledge created → staff marks paid → receipt shows benefit value and deductible amount.
- [x] Recurring donor has a year-end statement.
- [x] Refund voids a receipt and updates deductible amount to $0.
- [x] Employer posts job → candidate applies → coordinator sees pipeline → moves to Hired → impact dashboard updates.
- [x] Spanish toggle switches all navigation, buttons, and system strings.
- [x] Keyboard-only navigation works on donate flow and messages.
- [x] `supabase/migrations/0001_init.sql` provides full Postgres schema with RLS on every table.

### "My Roadmap" Add-On Checks
- [x] Maria's roadmap adapts based on weekly availability and schedule windows.
- [x] Completing a course moves the next step into NOW and sends a notification.
- [x] With the Gemini key missing, roadmaps still appear with template explanations.
- [x] Gemini never receives income, household, funding or protected-trait data (enforced in `/lib/ai/safety.ts`).
- [x] Gemini's explanations only mention catalog items that exist.
- [x] A guest can take `/find-your-path` and get a starter roadmap with no login.
- [x] The demand dashboard (`/staff/demand`) shows only aggregates, no names.

### Gemini AI Runtime Checks
- [x] Every AI feature routes through server-side `/app/api/ai` without exposing API keys to the client.
- [x] With the key missing, each AI feature shows "AI assistant unavailable right now" (or clean fallback text) and the manual path still works.
- [x] No funding-application, income, household, eligibility or payment data is ever sent to Gemini.

