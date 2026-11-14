-- Motherboard Database Schema & Row Level Security Policies
-- Target: Supabase Postgres 15+
-- All tables have ROW LEVEL SECURITY enabled (Deny by default)

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  city TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  bio TEXT,
  age_attested_at TIMESTAMPTZ NOT NULL,
  code_of_conduct_accepted_at TIMESTAMPTZ NOT NULL,
  persona_key TEXT,
  persona_subtitle TEXT,
  persona_subtitle_es TEXT,
  is_featured_persona BOOLEAN DEFAULT FALSE,
  blocked_user_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  subroles TEXT[],
  scope_type TEXT NOT NULL,
  scope_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allow_from TEXT NOT NULL DEFAULT 'cohort_and_instructors',
  quiet_start TEXT NOT NULL DEFAULT '21:00',
  quiet_end TEXT NOT NULL DEFAULT '07:00',
  email_digests BOOLEAN DEFAULT TRUE,
  sms_urgent BOOLEAN DEFAULT TRUE,
  presence_visible BOOLEAN DEFAULT FALSE
);

-- 3. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  type TEXT NOT NULL,
  org_category TEXT NOT NULL,
  ein TEXT,
  website TEXT,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  billing_email TEXT,
  billing_address TEXT,
  sponsorship_tier TEXT,
  recognition_display TEXT DEFAULT 'full',
  engagement_interests TEXT[],
  approved_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROGRAMS & COHORTS
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_es TEXT NOT NULL,
  track TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL,
  description TEXT NOT NULL,
  description_es TEXT NOT NULL,
  tuition_cost NUMERIC NOT NULL DEFAULT 1500,
  childcare_cost NUMERIC NOT NULL DEFAULT 750,
  exam_cost NUMERIC NOT NULL DEFAULT 0,
  equipment_cost NUMERIC NOT NULL DEFAULT 650,
  cert_name TEXT,
  next_start_date TEXT,
  is_self_paced BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS cohorts (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  host_partner_org_id TEXT REFERENCES organizations(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  tuition_due_date DATE NOT NULL,
  schedule TEXT NOT NULL,
  schedule_es TEXT NOT NULL,
  in_person_saturday_address TEXT,
  zoom_link TEXT NOT NULL,
  instructor_ids TEXT[] NOT NULL DEFAULT '{}',
  ta_ids TEXT[] NOT NULL DEFAULT '{}',
  manager_id TEXT REFERENCES users(id),
  capacity INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied',
  motivation_note TEXT,
  accompanying_children_count INTEGER DEFAULT 0,
  interview_scheduled_at TIMESTAMPTZ,
  tuition_credit NUMERIC NOT NULL DEFAULT 0,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, cohort_id)
);

-- 5. LMS MODULES, LESSONS, ASSIGNMENTS & ATTENDANCE
CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT PRIMARY KEY,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_es TEXT NOT NULL,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_es TEXT NOT NULL,
  content TEXT NOT NULL,
  youtube_video_id TEXT,
  starter_code_url TEXT,
  slides_url TEXT,
  resources JSONB DEFAULT '[]'::jsonb,
  estimated_minutes INTEGER NOT NULL DEFAULT 45
);

CREATE TABLE IF NOT EXISTS lesson_completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_es TEXT NOT NULL,
  instructions TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  rubric JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_url TEXT,
  file_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  rubric_scores JSONB DEFAULT '{}'::jsonb,
  total_score NUMERIC,
  max_score NUMERIC,
  feedback TEXT,
  graded_by TEXT REFERENCES users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_label TEXT NOT NULL,
  session_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  recorded_by TEXT NOT NULL REFERENCES users(id)
);

-- 6. ANNOUNCEMENTS & MESSAGING SPACES
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  author_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  title_es TEXT,
  body_es TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_ack BOOLEAN DEFAULT FALSE,
  comments_enabled BOOLEAN DEFAULT TRUE,
  pinned BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_receipts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  nudged_at TIMESTAMPTZ,
  UNIQUE(announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  cohort_id TEXT REFERENCES cohorts(id),
  program_id TEXT REFERENCES programs(id),
  project_id TEXT,
  job_application_id TEXT,
  read_only BOOLEAN DEFAULT FALSE,
  archived_reason TEXT,
  participant_ids TEXT[],
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  parent_id TEXT REFERENCES messages(id),
  body TEXT NOT NULL,
  code_snippet JSONB,
  attachment JSONB,
  project_context_id TEXT,
  is_question BOOLEAN DEFAULT FALSE,
  resolved_by TEXT REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  reactions JSONB DEFAULT '{}'::jsonb,
  hidden_by TEXT REFERENCES users(id),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PROJECTS BOARD
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  owner_id TEXT NOT NULL REFERENCES users(id),
  sponsor_org_id TEXT REFERENCES organizations(id),
  cohort_id TEXT REFERENCES cohorts(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  open_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_commitment TEXT NOT NULL,
  schedule TEXT NOT NULL,
  end_date DATE NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 4,
  beginner_friendly BOOLEAN DEFAULT TRUE,
  join_mode TEXT NOT NULL DEFAULT 'open',
  visibility TEXT NOT NULL DEFAULT 'public',
  allow_questions BOOLEAN DEFAULT TRUE,
  faq JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'recruiting',
  featured BOOLEAN DEFAULT FALSE,
  approved_by TEXT REFERENCES users(id),
  completion_summary TEXT,
  screenshots TEXT[],
  inactivity_reminder_sent_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  member_type TEXT NOT NULL DEFAULT 'member',
  confirmed_role TEXT,
  endorsed_by_instructor_id TEXT REFERENCES users(id),
  endorsement_note TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CAREERS & TALENT
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  type TEXT NOT NULL,
  location_mode TEXT NOT NULL,
  city TEXT NOT NULL,
  school_hours_friendly BOOLEAN DEFAULT FALSE,
  career_path TEXT NOT NULL,
  certs_required TEXT[] DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  pay_min NUMERIC NOT NULL,
  pay_max NUMERIC NOT NULL,
  pay_period TEXT NOT NULL DEFAULT 'hour',
  cycle_label TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'applied',
  cover_note TEXT,
  resume_file_name TEXT NOT NULL,
  coordinator_notes TEXT,
  hired_pay_increase_pct NUMERIC,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talent_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  opted_in_directory BOOLEAN DEFAULT FALSE,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  career_paths TEXT[] NOT NULL,
  skills TEXT[] NOT NULL,
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  resume_file_name TEXT NOT NULL,
  availability TEXT NOT NULL,
  preferred_location_mode TEXT NOT NULL,
  school_hours_preferred BOOLEAN DEFAULT TRUE,
  visible_fields JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. FUNDING, CAMPAIGNS & RECEIPTS
CREATE TABLE IF NOT EXISTS personal_funding_applications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id),
  household_size INTEGER NOT NULL,
  annual_income_band TEXT NOT NULL,
  employment_status TEXT NOT NULL,
  caregiver_status BOOLEAN DEFAULT TRUE,
  needs_childcare_support BOOLEAN DEFAULT TRUE,
  needs_laptop BOOLEAN DEFAULT TRUE,
  private_statement TEXT NOT NULL,
  tech_moms_scholarship_awarded NUMERIC DEFAULT 0,
  sponsor_seat_awarded NUMERIC DEFAULT 0,
  sponsor_org_id TEXT REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  type TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  enrollment_id TEXT REFERENCES enrollments(id),
  program_id TEXT NOT NULL REFERENCES programs(id),
  cohort_id TEXT REFERENCES cohorts(id),
  location TEXT NOT NULL,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  display_mode TEXT NOT NULL,
  display_name TEXT NOT NULL,
  show_city BOOLEAN DEFAULT TRUE,
  city TEXT,
  photo_initials TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  aid_already_awarded NUMERIC NOT NULL DEFAULT 0,
  goal NUMERIC NOT NULL,
  raised NUMERIC NOT NULL DEFAULT 0,
  surplus_to_general_fund NUMERIC NOT NULL DEFAULT 0,
  donor_count INTEGER NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  need_types TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  approved_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  type TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  org_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  legal_name TEXT,
  org_category TEXT,
  ein TEXT,
  email TEXT NOT NULL,
  billing_email TEXT,
  mailing_address TEXT,
  anonymous_default BOOLEAN DEFAULT FALSE,
  magic_link_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  donor_id TEXT NOT NULL REFERENCES donors(id),
  donor_type TEXT NOT NULL,
  fund_id TEXT NOT NULL,
  campaign_id TEXT REFERENCES campaigns(id),
  designation_label TEXT NOT NULL,
  restriction_label TEXT,
  sponsorship_tier TEXT,
  sponsored_seats_count INTEGER,
  amount NUMERIC NOT NULL,
  processing_fee_covered NUMERIC NOT NULL DEFAULT 0,
  total_charged NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'one_time',
  display_mode TEXT NOT NULL DEFAULT 'full_name',
  hide_amount_publicly BOOLEAN DEFAULT FALSE,
  public_display_name TEXT NOT NULL,
  encouragement_message TEXT,
  message_moderation_status TEXT DEFAULT 'none',
  benefits_selected JSONB DEFAULT '[]'::jsonb,
  goods_services_value NUMERIC NOT NULL DEFAULT 0,
  deductible_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_last4 TEXT NOT NULL,
  po_number TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  donor_id TEXT NOT NULL REFERENCES donors(id),
  receipt_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  donor_legal_name TEXT NOT NULL,
  donor_contact_name TEXT,
  donor_email TEXT NOT NULL,
  donor_address TEXT,
  gross_amount NUMERIC NOT NULL,
  payment_method_label TEXT NOT NULL,
  designation_label TEXT NOT NULL,
  po_or_invoice_number TEXT,
  goods_services_description TEXT,
  goods_services_value NUMERIC NOT NULL DEFAULT 0,
  deductible_amount NUMERIC NOT NULL,
  discretion_statement_snapshot TEXT NOT NULL,
  org_legal_name_snapshot TEXT NOT NULL,
  org_ein_snapshot TEXT NOT NULL,
  org_address_snapshot TEXT NOT NULL,
  tax_exempt_snapshot TEXT NOT NULL,
  reissued_count INTEGER NOT NULL DEFAULT 0,
  voided_at TIMESTAMPTZ,
  void_reason TEXT
);

CREATE TABLE IF NOT EXISTS fund_ledger (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  donation_id TEXT REFERENCES donations(id),
  campaign_id TEXT REFERENCES campaigns(id),
  enrollment_id TEXT,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  entry_type TEXT NOT NULL,
  note TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ENABLE ROW LEVEL SECURITY ON EVERY TABLE (DENY BY DEFAULT)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_ledger ENABLE ROW LEVEL SECURITY;

-- 11. CENTRAL RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION auth_uid() RETURNS TEXT AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.sub', true), '')::text;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_has_role(req_role TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth_uid() AND (role = req_role OR role = 'admin')
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_is_funding_reviewer() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth_uid() AND (
      role = 'admin' OR 
      (role = 'staff' AND 'funding_reviewer' = ANY(subroles))
    )
  );
$$ LANGUAGE sql STABLE;

-- 12. SAMPLE POLICIES REINFORCING SENSITIVE DATA PRIVACY
-- Sensitive personal funding applications visible ONLY to student and funding reviewers
CREATE POLICY "funding_app_self_and_reviewer_select" ON personal_funding_applications
  FOR SELECT USING (user_id = auth_uid() OR auth_is_funding_reviewer());

CREATE POLICY "funding_app_self_insert" ON personal_funding_applications
  FOR INSERT WITH CHECK (user_id = auth_uid());

-- Campaigns are readable publicly on the Funding Board
CREATE POLICY "campaigns_public_select" ON campaigns
  FOR SELECT USING (status = 'live' OR owner_id = auth_uid() OR auth_has_role('staff'));

-- Receipts are readable by the donor or staff
CREATE POLICY "receipts_donor_and_staff" ON receipts
  FOR SELECT USING (
    donor_id IN (SELECT id FROM donors WHERE user_id = auth_uid() OR email = (SELECT email FROM users WHERE id = auth_uid()))
    OR auth_has_role('staff')
  );

-- Talent profiles directory access
CREATE POLICY "talent_profiles_select" ON talent_profiles
  FOR SELECT USING (
    user_id = auth_uid() OR 
    auth_has_role('staff') OR 
    (opted_in_directory = true AND auth_has_role('employer'))
  );
