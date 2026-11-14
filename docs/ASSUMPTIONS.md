# Motherboard — Product & Technical Assumptions Log

This file records design, domain, and technical assumptions made during the 8-stage prototype build so stakeholders, legal counsel, and engineering can review them before production cutover.

---

## Stage 1 — Foundation, Identity, RBAC, & Data Layer
1. **Fictional Brand & Data Safety**: Per prototype guidelines, all user names, employer names (e.g., *Northpeak Software*, *Wasatch Cloud*, *Canyon Health Tech*), sponsor names (e.g., *Summit Credit Union*), EIN placeholders (`XX-XXXXXXX`), and dollar figures are fictionalized while faithfully modeling Tech-Moms' real cohort locations (Lehi, Sandy, St. George, Online) and program structure.
2. **Additive + Scoped Roles**: A single user can hold multiple roles simultaneously (for example, Aisha Rahman holds both `alumni` from Foundational and `student` scoped to the `Data Analytics 2.0` cohort; Rachel Kim holds `staff` with `program_manager` and `funding_reviewer` sub-scopes).
3. **Locale Switching Behavior**: Switching to Maria Lopez (`locale: 'es'`) automatically switches the active UI language to Spanish so stakeholders immediately experience bilingual support; users can manually toggle EN/ES in the header at any time without losing session state.
4. **Client Persistence**: Mock repositories persist mutations in browser `localStorage` under a versioned key (`motherboard_demo_v1`) and fall back gracefully to in-memory state during SSR so Next.js Server/Client hydration never mismatches and zero environment variables are required.
5. **Minors Policy Enforcement**: Signup/onboarding requires an explicit 18+ attestation checkbox. Digital Literacy adult learners can note accompanying school-age children only as an internal count on their enrollment record—no child accounts, chat profiles, or directory records exist anywhere in the schema.

## Stage 2 — Home Dashboards, Learn, & Events
6. **Program & Tuition Cost Catalog**: Staff-set baseline program costs are modeled as $1,500 Foundational tuition ($3,000 for 2.0 tracks), $750 cohort childcare stipend, $350 certification exam voucher (Security+ / CAPM), and $650 laptop package so student campaigns pull strictly from verified line items rather than free-text amounts.
7. **Grading Model**: Assignments use a structured 3-criterion rubric (Completeness, Technical Execution, Reflection/Presentation) that outputs both a numeric score and a Pass / Needs Revision status, accommodating instructors who prefer rubric feedback over letter grades.
8. **Calendar Export**: "Add to Calendar" on `/events` generates a standards-compliant `.ics` download directly in the browser so no external Google/Outlook OAuth keys are needed in demo mode.

## Stage 3 — Announcements, Messaging, Ask Staff, & Notifications
9. **Quiet Hours Delivery**: Users default to quiet hours from `21:00` to `07:00` local time. Normal and Important notifications created during quiet hours are flagged `queuedForQuietHours` in `/dev/outbox`, whereas `Urgent` announcements (e.g., weather/room changes) bypass quiet hours immediately via in-app banner + email + SMS.
10. **Cohort Channel Archival**: Cohorts whose `endDate` passed more than 90 days ago automatically mark their cohort channels `readOnly: true` while preserving full search and resolved Q&A history.

## Stage 4 — Projects Board
11. **Anti-Spam Question Rate Limit**: "Ask about this project" checks three gates via `can()`: (a) project `allowQuestions === true`, (b) owner's DM privacy allows the sender, and (c) the sender does not already have an unanswered project inquiry thread with the owner for that project.
12. **Inactivity Threshold**: Projects with `lastActivityAt` older than 30 days display an inactivity notice and auto-transition to `paused` until the owner posts an update or reactivates recruiting.

## Stage 5 — Careers & Employer Portal
13. **Transparent Pay Requirement**: Job postings require both `payMin` and `payMax` before publishing, matching the blueprint's requirement that all postings disclose compensation ranges.
14. **Field-by-Field Talent Privacy**: Opting into the Talent Directory defaults sensitive contact details (`email`, `city`) to hidden until the student/alum explicitly toggles each field visible; completed projects only appear once the member confirms their role.

## Stage 6 — Funding Hub, Public Funding Board, Checkout, & Tax Receipts
15. **IRS Advisory Designation & Surplus Handling**: All student campaign donations credit the *Tech-Moms Scholarship Fund* with an advisory student recommendation, never pay cash to individuals, and automatically sweep any surplus above remaining program cost (`goal`) into the General Scholarship Fund ledger. All legal copy is editable in `/staff` and badged **"Pending legal review"**.
16. **Quid Pro Quo / Tier Benefit Valuation**: Corporate sponsorship tiers allow selecting tangible benefits received (e.g., Fundraising Gala / Event Ticket Bundle valued at $400, Recruitment Table valued at $250, while logo recognition is $0 IRS incidental recognition). Receipts automatically subtract tangible benefit value from gross gift amount to display the tax-deductible portion.
17. **Invoiced Corporate Gifts**: Selecting "Invoice (Net-30)" creates a `Pledge` record and does **not** issue a tax receipt until a Staff/Admin user marks the invoice paid, matching 501(c)(3) constructive-receipt accounting rules.
18. **Processing Fee Coverage**: Donors opting to cover Stripe processing fees add an estimated `2.9% + $0.30` to the charge total; the full gross contribution transferred to Tech-Moms is recorded on the receipt.

## Stage 7 — Staff Console, Impact Dashboard, & Supabase Cutover
19. **Supabase RLS Parity**: `/supabase/migrations/0001_init.sql` enables `ROW LEVEL SECURITY` on every table with helper SQL functions (`auth_has_role`, `auth_shares_cohort`, `auth_is_funding_reviewer`) mirroring `/lib/auth/permissions.ts` (`deny` by default).
20. **Dual Adapter Env Switch**: Setting `DATA_MODE=supabase` (or `NEXT_PUBLIC_DATA_MODE=supabase`) switches `/lib/data/index.ts` to the `@supabase/supabase-js` repository implementation; when unset, the app defaults to `mock` mode so Vercel deployments work out-of-the-box with zero configuration.

## Add-On Feature — "My Roadmap" Personalized Recommendations
21. **Deterministic Rules-First Scoring**: The engine in `/lib/recommend/engine.ts` calculates career path match scores and builds milestone step sequences deterministically using an allow-list of user interests, past education, skills, and weekly availability. It functions completely offline with zero API keys required.
22. **Constructive Conflict Flagging**: The engine never outputs negative or discouraging rejections ("not suited"). If a learner’s available weekly hours (e.g. 4 hrs/week) fall short of an intensive cohort (e.g. Cybersecurity 2.0 at 8 hrs/week), the step is preserved on the roadmap with a supportive note proposing self-paced prep, AI Foundations, or a future cohort start date.
23. **Anonymous Public Demand Forecasting**: Quiz submissions on `/find-your-path` create aggregate interest records without requiring user accounts or storing personal contact names, providing staff with regional demand insights on `/staff/demand` while strictly safeguarding prospective learner privacy.

## Add-On Feature — Server-Side Gemini AI Integration
24. **Server-Side API Key Isolation**: `GEMINI_API_KEY` is loaded strictly on the server in `/lib/ai/client.ts` and `/app/api/ai/route.ts`. It is never prefixed with `NEXT_PUBLIC_` and never bundled into client browser chunks.
25. **Hard Financial & Household Privacy Firewall**: Under no circumstances are household size, annual income bracket, funding application answers, or payment methods passed to any AI prompt builder. All prompt parameters are filtered against strict string allow-lists in `/lib/ai/safety.ts`.
26. **Graceful Offline Fallback**: If `GEMINI_API_KEY` is not set or network connectivity fails, every AI endpoint returns template-based fallback text or `"AI assistant unavailable right now"` without crashing or blocking core platform workflows.
27. **Human-in-the-Loop Safeguards**: AI never makes automated admissions, grading, funding, or hiring decisions. All AI-generated drafts (announcements, rubric feedback, thank-you notes, cover letters) require human review, editing, and confirmation before dispatch.

