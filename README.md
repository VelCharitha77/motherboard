# Motherboard — Tech-Moms Ecosystem Web Application

*An all-in-one ecosystem for Tech-Moms students, alumni, staff, employers, and supporters.*

Motherboard connects every phase of a student’s journey: **training, supportive community, tuition assistance, career relaunch, and personalized career roadmaps**.

---

## Quick Start (Local Run)

The application runs out of the box with zero required environment variables using an in-memory client repository with browser `localStorage` persistence.

```bash
# 1. Install dependencies
npm install

# 2. Start the Next.js development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

To run unit tests for the deterministic recommendation engine:
```bash
npx tsx -e "import { runRecommendationEngineTests } from './lib/recommend/engine.test'; console.log(runRecommendationEngineTests());"
```

To test production compilation:
```bash
npm run build
npm run start
```

---

## Deploying to Vercel

1. Push this repository to GitHub (`https://github.com/VelCharitha77/motherboard.git`).
2. Log into [Vercel](https://vercel.com) and click **Add New → Project**.
3. Import the `motherboard` repository. Vercel automatically detects Next.js (App Router).
4. Leave environment variables empty for default Mock Mode.
5. Click **Deploy**. Every subsequent push to `main` deploys automatically.

---

## Optional: Gemini AI Runtime Configuration

Motherboard includes 10 server-side AI features powered by Google Gemini (study tutor, quiz generation, rubric feedback drafts, announcement drafting, Spanish translation, channel catch-up summaries, and resume coaching).

To enable live Gemini calls:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com).
2. Add to your `.env.local` or Vercel Environment Variables:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. When `GEMINI_API_KEY` is not present, the app automatically falls back to clean, supportive template responses—the manual path and core application are **never blocked**.

---

## Switching to Supabase Mode (Production Cutover)

When ready to switch from local mock state to Supabase Postgres:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the Supabase SQL Editor and execute:
   - `/supabase/migrations/0001_init.sql` (Creates all tables with Row Level Security enabled and strict default-deny policies).
   - `/supabase/seed.sql` (Inserts initial seed data).
3. In Vercel or `.env.local`, set:
   ```env
   DATA_MODE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 10-Minute Stakeholder Demo Script

### 1. Persona Switcher & Landing Page (`/`)
- Start at `/`. View the 12 stakeholder persona cards.
- Switch to **Maria Lopez** (`Student — Foundational, Online Winter 2027`).
- Notice the UI automatically switches to **Spanish** (`es`) because Maria prefers Spanish. Toggle between EN and ES in the top bar.

### 2. Urgent Announcement & Learning LMS (`/home` & `/learn`)
- On `/home`, view the active cohort schedule, Zoom link, and red urgent snow announcement banner.
- Click **"I've read this"** to acknowledge the announcement.
- Visit `/learn` to explore the Canvas-style LMS: view Week 2 semantic HTML form lessons, watch the embedded YouTube tutorial, and toggle **"Mark Complete"**.
- View the **"Ask about this lesson"** AI study helper for hints on Flexbox and semantic tags.

### 3. Community Projects & Team Workspaces (`/projects`)
- Navigate to `/projects`. View active community projects.
- Click on **Accessible Storytime Spanish-English Reader**.
- Notice the member task board (Kanban) and updates feed.
- Click **"Ask Owner a Question"** (demonstrating rate-limited direct messaging to the project lead).

### 4. Personal Funding Hub & State Aid (`/funding/my`)
- Open `/funding/my` to view the three-source funding model:
  1. Tech-Moms partial scholarship ($1,000) and sponsor seat ($500).
  2. Utah Department of Workforce Services (DWS) WIOA screener and checklist with "what to say to your counselor" talking points.
  3. Remaining tuition gap calculation.
- Click **"Start a Funding Board Campaign"** to preview how admitted students launch gap funding requests with staff-set costs.

### 5. Public Funding Board & Guest Checkout (`/give`)
- In the top bar, switch to **Guest Donor** (simulating a public visitor with no account).
- Open `/give`. Browse student campaigns, Tech-Moms campaigns, and verified grants.
- Click **Donate** on Jenna’s Cybersecurity campaign.
- Select **Giving as an Individual**, pick $100, check "Cover processing fees", and submit via the mock Stripe checkout.
- Instantly view the generated **501(c)(3) Tax Receipt** (`/receipts/[id]`) with IRS goods-and-services compliance statements.

### 6. Corporate Sponsorship & Net-30 Invoices (`/give` & `/sponsor`)
- In checkout, select **Giving for a Company / Organization**.
- Pick the **Gold Partner Tier ($20,000)**, select event ticket benefits ($400 FMV), and choose **"Send me an invoice (Net-30)"** with PO number.
- Switch to **Marcus Vance** (`Corporate Sponsor — Summit Credit Union`).
- Open `/sponsor` to view funded scholar outcomes, employee volunteer sign-ups, and downloadable W-9 and tax receipts.

### 7. Staff & Operations Console (`/staff`)
- Switch to **Rachel Kim** (`Program Staff`).
- Open `/staff` to review pending admissions applications, schedule interviews, and click **Accept & Auto-Enroll**.
- View the **Fund Accounting Ledger** and verify how surplus campaign funds automatically sweep into the General Scholarship Fund.
- Open `/staff/catalog` to inspect course catalog items and `/staff/demand` to review anonymous regional demand charts.

### 8. Dev Outbox (`/dev/outbox`)
- Click **Outbox** in the top bar to inspect all simulated emails, SMS text alerts, and tax receipt notifications dispatched during the demo.

---

## Acceptance Verification Matrix

| Checklist Item | Description | Status |
|---|---|---|
| **Zero-Config Build** | App builds with `npm run build` and runs without required secrets | Pass |
| **Persona Switching** | Switching instantly swaps navigation, data views, and permissions via `can()` | Pass |
| **Urgent Announcements** | Urgent alert banner displays, sends email/SMS to Outbox, and tracks acknowledgements | Pass |
| **Direct Messaging Rules** | Students can DM instructors; employers cannot cold-DM students unless applied | Pass |
| **Project Workspaces** | Project creation, inquiry pings, join requests, and role confirmation sync to profile | Pass |
| **Tax Deductibility Math** | Sponsorship tangible benefits subtract fair market value from deductible receipts | Pass |
| **Net-30 Invoiced Pledges** | Invoiced gifts record as pledges and only generate tax receipts once marked paid | Pass |
| **Surplus Fund Sweeps** | Over-funded student campaigns automatically sweep surplus into General Fund ledger | Pass |
| **Refund Voiding** | Refunding a contribution updates the ledger and voids the associated tax receipt | Pass |
| **Careers Pipeline** | Job applications advance through stages (`Applied → Hired`) and update impact stats | Pass |
| **Bilingual Support** | Complete English and Spanish UI string parity with language switcher | Pass |
| **Roadmap Adaptation** | Course recommendations dynamically adapt to availability and schedule windows | Pass |
| **Offline AI Fallback** | All AI features return template text or clear notices when `GEMINI_API_KEY` is unset | Pass |
| **Privacy Firewall** | Household size, income bracket, and payment methods are never passed to AI prompts | Pass |
| **Supabase SQL Schema** | `/supabase/migrations/0001_init.sql` provides Postgres schema with RLS on all tables | Pass |


- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
