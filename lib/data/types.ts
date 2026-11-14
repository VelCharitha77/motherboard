export type Locale = 'en' | 'es';

export type Role =
  | 'applicant'
  | 'student'
  | 'alumni'
  | 'instructor'
  | 'ta'
  | 'mentor'
  | 'employer'
  | 'sponsor'
  | 'partner_institution'
  | 'staff'
  | 'admin';

export type StaffSubrole =
  | 'program_manager'
  | 'funding_reviewer'
  | 'placement_coordinator'
  | 'pd_coordinator'
  | 'outreach';

export type ScopeType = 'global' | 'program' | 'cohort' | 'org';

export interface UserRole {
  id: string;
  userId: string;
  role: Role;
  subroles?: StaffSubrole[];
  scopeType: ScopeType;
  scopeId?: string;
}

export type DmAllowRule = 'everyone' | 'cohort_and_instructors' | 'staff_only';

export interface DmPreference {
  userId: string;
  allowFrom: DmAllowRule;
  quietStart: string; // HH:mm e.g. "21:00"
  quietEnd: string;   // HH:mm e.g. "07:00"
  emailDigests: boolean;
  smsUrgent: boolean;
  presenceVisible: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  locale: Locale;
  city: string;
  avatarInitials: string;
  avatarColor: string;
  bio: string;
  ageAttestedAt: string;
  codeOfConductAcceptedAt: string;
  personaKey?: string;
  personaSubtitle?: string;
  personaSubtitleEs?: string;
  isFeaturedPersona?: boolean;
  blockedUserIds: string[];
  createdAt: string;
}

export type OrganizationType = 'employer' | 'sponsor' | 'partner_institution';

export type SponsorshipTierId =
  | 'lunch'
  | 'half_tuition'
  | 'full_tuition'
  | 'cohort_childcare'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'premium';

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  type: OrganizationType;
  orgCategory:
    | 'corporation'
    | 'small_business'
    | 'foundation'
    | 'daf'
    | 'association'
    | 'government'
    | 'university';
  ein?: string;
  website?: string;
  city: string;
  status: 'pending' | 'approved' | 'declined';
  contactName: string;
  contactTitle?: string;
  contactEmail: string;
  contactPhone?: string;
  billingEmail?: string;
  billingAddress?: string;
  sponsorshipTier?: SponsorshipTierId;
  recognitionDisplay?: 'full' | 'anonymous';
  engagementInterests?: ('volunteering' | 'hiring' | 'hosting_meetup')[];
  approvedBy?: string;
  createdAt: string;
}

export type ProgramTrack =
  | 'foundational'
  | '2.0_data'
  | '2.0_pm'
  | '2.0_cyber'
  | '2.0_ai'
  | 'digital_literacy'
  | 'resume';

export interface Program {
  id: string;
  slug: string;
  name: string;
  nameEs: string;
  track: ProgramTrack;
  durationWeeks: number;
  description: string;
  descriptionEs: string;
  tuitionCost: number;
  childcareCost: number;
  examCost: number;
  equipmentCost: number;
  certName?: string;
  nextStartDate: string;
  isSelfPaced?: boolean;
}

export type CohortLocation = 'Lehi' | 'Sandy' | 'St. George' | 'Online';

export interface Cohort {
  id: string;
  programId: string;
  name: string;
  location: CohortLocation;
  hostPartnerOrgId?: string;
  startDate: string;
  endDate: string;
  tuitionDueDate: string;
  schedule: string;
  scheduleEs: string;
  inPersonSaturdayAddress?: string;
  zoomLink: string;
  instructorIds: string[];
  taIds: string[];
  managerId?: string;
  capacity: number;
  status: 'upcoming' | 'active' | 'completed';
}

export type EnrollmentStatus =
  | 'applied'
  | 'waitlisted'
  | 'admitted'
  | 'active'
  | 'completed'
  | 'withdrawn'
  | 'declined';

export interface Enrollment {
  id: string;
  userId: string;
  cohortId: string;
  programId: string;
  status: EnrollmentStatus;
  motivationNote?: string;
  accompanyingChildrenCount?: number; // Digital Literacy parent-only note; no child accounts ever created
  interviewScheduledAt?: string;
  tuitionCredit: number;
  appliedAt: string;
  updatedAt: string;
}

export interface InterestWaitlistEntry {
  id: string;
  name: string;
  email: string;
  programId: string;
  preferredLocation: CohortLocation;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  cohortId: string;
  weekNumber: number;
  title: string;
  titleEs: string;
  summary: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  cohortId: string;
  orderIndex: number;
  title: string;
  titleEs: string;
  content: string;
  youtubeVideoId?: string;
  starterCodeUrl?: string;
  slidesUrl?: string;
  resources: { label: string; url: string }[];
  estimatedMinutes: number;
}

export interface LessonCompletion {
  userId: string;
  lessonId: string;
  completedAt: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  moduleId: string;
  cohortId: string;
  title: string;
  titleEs: string;
  instructions: string;
  dueDate: string;
  rubric: RubricCriterion[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  cohortId: string;
  userId: string;
  submittedUrl?: string;
  fileName?: string;
  notes?: string;
  status: 'submitted' | 'graded' | 'needs_revision';
  rubricScores?: Record<string, number>;
  totalScore?: number;
  maxScore?: number;
  feedback?: string;
  gradedBy?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  cohortId: string;
  userId: string;
  sessionDate: string;
  sessionLabel: string;
  sessionType: 'wednesday_evening' | 'saturday_morning' | 'in_person_saturday';
  status: 'present' | 'excused' | 'absent';
  recordedBy: string;
}

export interface CertificationRecord {
  id: string;
  userId: string;
  certName: string;
  provider: string;
  studyPlanNotes: string;
  examDate?: string;
  status: 'studying' | 'scheduled' | 'passed' | 'retake_planned';
  verified: boolean;
}

export interface ResourceLibraryItem {
  id: string;
  title: string;
  titleEs: string;
  category:
    | 'better_way_thursday'
    | 'resume_program'
    | 'career_relaunch'
    | 'tech_skills'
    | 'finding_a_job';
  careerPath: string;
  tags: string[];
  summary: string;
  youtubeVideoId?: string;
  guideContent?: string;
  durationLabel: string;
  publishedAt: string;
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface AudienceFilter {
  roles?: Role[];
  programIds?: string[];
  cohortIds?: string[];
  cities?: string[];
  orgIds?: string[];
}

export interface AnnouncementAttachment {
  label: string;
  url: string;
  kind: 'file' | 'event' | 'assignment';
  refId?: string;
}

export interface Announcement {
  id: string;
  authorId: string;
  title: string;
  body: string;
  titleEs?: string;
  bodyEs?: string;
  priority: AnnouncementPriority;
  audienceFilter: AudienceFilter;
  requiresAck: boolean;
  commentsEnabled: boolean;
  pinned: boolean;
  attachments: AnnouncementAttachment[];
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

export interface AnnouncementReceipt {
  id: string;
  announcementId: string;
  userId: string;
  deliveredAt: string;
  readAt?: string;
  acknowledgedAt?: string;
  nudgedAt?: string;
}

export interface AnnouncementComment {
  id: string;
  announcementId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface AnnouncementRequest {
  id: string;
  requesterId: string;
  orgId: string;
  title: string;
  body: string;
  audienceNote: string;
  status: 'pending' | 'approved' | 'declined';
  reviewedBy?: string;
  createdAt: string;
}

export type SpaceType =
  | 'cohort'
  | 'subchannel'
  | 'program'
  | 'alumni'
  | 'city'
  | 'career'
  | 'staff'
  | 'instructor_staff'
  | 'project'
  | 'dm'
  | 'group_dm';

export interface Space {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: SpaceType;
  cohortId?: string;
  programId?: string;
  projectId?: string;
  jobApplicationId?: string;
  readOnly: boolean;
  archivedReason?: string;
  participantIds?: string[]; // Used for DMs, group DMs, and restricted spaces
  createdBy: string;
  createdAt: string;
}

export type NotifyLevel = 'all' | 'mentions' | 'mute';

export interface SpaceMember {
  spaceId: string;
  userId: string;
  notifyLevel: NotifyLevel;
  lastReadAt?: string;
}

export interface Message {
  id: string;
  spaceId: string;
  authorId: string;
  parentId?: string;
  body: string;
  codeSnippet?: { language: string; code: string };
  attachment?: { name: string; kind: 'image' | 'file'; url: string };
  projectContextId?: string;
  isQuestion: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  reactions: Record<string, string[]>; // emoji -> userIds
  hiddenBy?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export type HelpQueue = 'admissions' | 'funding' | 'careers' | 'tech_support' | 'general';

export interface HelpTicket {
  id: string;
  requesterId: string;
  queue: HelpQueue;
  subject: string;
  assigneeId?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface HelpTicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  internalNote: boolean;
  createdAt: string;
}

export type ProjectType =
  | 'portfolio'
  | 'capstone'
  | 'nonprofit_client'
  | 'study_group'
  | 'open_source'
  | 'hackathon'
  | 'sponsored';

export type ProjectStatus =
  | 'pending_approval'
  | 'idea'
  | 'recruiting'
  | 'in_progress'
  | 'completed'
  | 'paused'
  | 'archived';

export type ProjectJoinMode = 'open' | 'request' | 'invite';
export type ProjectVisibility = 'cohort' | 'members' | 'public';

export interface ProjectOpenRole {
  title: string;
  count: number;
  filled: number;
}

export interface Project {
  id: string;
  ownerId: string;
  sponsorOrgId?: string;
  cohortId?: string;
  title: string;
  description: string;
  type: ProjectType;
  skills: string[];
  openRoles: ProjectOpenRole[];
  timeCommitment: string;
  schedule: 'evenings' | 'weekends' | 'async' | 'flexible';
  endDate: string;
  maxMembers: number;
  beginnerFriendly: boolean;
  joinMode: ProjectJoinMode;
  visibility: ProjectVisibility;
  allowQuestions: boolean;
  faq: { question: string; answer: string }[];
  links: { github?: string; figma?: string; live?: string; docs?: string };
  status: ProjectStatus;
  featured: boolean;
  approvedBy?: string;
  completionSummary?: string;
  screenshots?: string[];
  inactivityReminderSentAt?: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  roleTitle: string;
  memberType: 'owner' | 'co_owner' | 'member' | 'mentor';
  confirmedRole?: string;
  endorsedByInstructorId?: string;
  endorsementNote?: string;
  joinedAt: string;
}

export interface ProjectJoinRequest {
  id: string;
  projectId: string;
  userId: string;
  desiredRole: string;
  note: string;
  status: 'pending' | 'approved' | 'declined';
  responseMessage?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assigneeId?: string;
  status: 'todo' | 'doing' | 'done';
  dueDate?: string;
  createdAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ProjectInquiryPing {
  id: string;
  projectId: string;
  senderId: string;
  ownerId: string;
  spaceId: string;
  answered: boolean;
  createdAt: string;
}

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship_returnship';
export type LocationMode = 'remote' | 'hybrid' | 'onsite';
export type ApplicationStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'declined';

export interface Job {
  id: string;
  orgId: string;
  title: string;
  description: string;
  responsibilities: string[];
  type: JobType;
  locationMode: LocationMode;
  city: string;
  schoolHoursFriendly: boolean;
  careerPath: 'Web Dev' | 'Data Analytics' | 'Cybersecurity' | 'Project Management' | 'UX / Product' | 'IT & Operations';
  certsRequired: string[];
  skills: string[];
  payMin: number;
  payMax: number;
  payPeriod: 'year' | 'hour';
  cycleLabel?: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  stage: ApplicationStage;
  coverNote?: string;
  resumeFileName: string;
  coordinatorNotes?: string;
  hiredPayIncreasePct?: number;
  appliedAt: string;
  updatedAt: string;
}

export interface TalentProfile {
  userId: string;
  optedInDirectory: boolean;
  headline: string;
  summary: string;
  careerPaths: string[];
  skills: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeFileName: string;
  availability: 'immediately' | 'within_30_days' | 'next_coop_cycle' | 'not_looking';
  preferredLocationMode: LocationMode | 'any';
  schoolHoursPreferred: boolean;
  visibleFields: {
    summary: boolean;
    certifications: boolean;
    projects: boolean;
    portfolio: boolean;
    availability: boolean;
    city: boolean;
    email: boolean;
  };
  updatedAt: string;
}

export interface ResumeReviewRequest {
  id: string;
  userId: string;
  resumeFileName: string;
  targetRole: string;
  notes?: string;
  reviewerId?: string;
  feedback?: string;
  status: 'pending' | 'in_review' | 'completed';
  createdAt: string;
}

export interface MockInterviewBooking {
  id: string;
  mentorId: string;
  mentorName: string;
  focusTrack: string;
  startsAt: string;
  zoomLink: string;
  bookedByUserId?: string;
}

export interface PersonalFundingApplication {
  id: string;
  userId: string;
  cohortId: string;
  householdSize: number;
  annualIncomeBand: 'under_35k' | '35k_55k' | '55k_80k' | '80k_plus';
  employmentStatus: 'unemployed' | 'part_time' | 'career_break' | 'full_time_low_wage' | 'full_time';
  caregiverStatus: boolean;
  needsChildcareSupport: boolean;
  needsLaptop: boolean;
  privateStatement: string;
  techMomsScholarshipAwarded: number;
  sponsorSeatAwarded: number;
  sponsorOrgId?: string;
  status: 'not_started' | 'submitted' | 'awarded';
  submittedAt?: string;
  reviewedBy?: string;
}

export interface DwsStateAidRecord {
  userId: string;
  utahResident: boolean;
  dislocatedOrUnderemployed: boolean;
  preScreenerResult: 'not_checked' | 'likely_eligible' | 'worth_asking';
  checklist: {
    utahIdReady: boolean;
    incomeVerificationReady: boolean;
    acceptanceLetterSaved: boolean;
    counselorAppointmentBooked: boolean;
  };
  status: 'not_started' | 'preparing' | 'submitted_to_dws' | 'approved' | 'not_eligible';
  estimatedSupport: number;
  notes?: string;
}

export interface Fund {
  id: string;
  name: string;
  type: 'general_scholarship' | 'campaign_pool' | 'restricted_cohort' | 'childcare' | 'equipment';
  restrictedLocation?: CohortLocation;
  restrictedProgramId?: string;
  balance: number;
}

export interface CampaignLineItem {
  id: string;
  category: 'tuition' | 'childcare' | 'exam' | 'equipment';
  label: string;
  amount: number;
}

export interface Campaign {
  id: string;
  type: 'student' | 'techmoms';
  ownerId: string;
  enrollmentId?: string;
  programId: string;
  cohortId?: string;
  location: CohortLocation;
  title: string;
  story: string;
  displayMode: 'first_only' | 'first_last_initial' | 'full_name';
  displayName: string;
  showCity: boolean;
  city?: string;
  photoInitials: string;
  lineItems: CampaignLineItem[];
  aidAlreadyAwarded: number;
  goal: number;
  raised: number;
  surplusToGeneralFund: number;
  donorCount: number;
  deadline: string;
  needTypes: ('tuition' | 'childcare' | 'exam' | 'equipment')[];
  status: 'draft' | 'in_review' | 'changes_requested' | 'live' | 'closed' | 'declined';
  reviewFeedback?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface CampaignThankYou {
  id: string;
  campaignId: string;
  studentId: string;
  donationId: string;
  message: string;
  createdAt: string;
}

export interface SponsorshipBenefitOption {
  id: string;
  label: string;
  fairMarketValue: number;
  description: string;
}

export interface Donor {
  id: string;
  type: 'individual' | 'organization';
  userId?: string;
  orgId?: string;
  name: string;
  legalName?: string;
  orgCategory?: Organization['orgCategory'];
  ein?: string;
  contactTitle?: string;
  contactPhone?: string;
  email: string;
  billingEmail?: string;
  mailingAddress?: string;
  anonymousDefault: boolean;
  magicLinkToken: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorType: 'individual' | 'organization';
  fundId: string;
  campaignId?: string;
  designationLabel: string;
  restrictionLabel?: string;
  sponsorshipTier?: SponsorshipTierId;
  sponsoredSeatsCount?: number;
  sponsoredCohortId?: string;
  amount: number; // Base gift amount credited to Tech-Moms
  processingFeeCovered: number;
  totalCharged: number;
  frequency: 'one_time' | 'monthly' | 'yearly';
  displayMode: 'full_name' | 'first_only' | 'anonymous';
  hideAmountPublicly: boolean;
  publicDisplayName: string;
  encouragementMessage?: string;
  messageModerationStatus: 'none' | 'pending' | 'approved' | 'hidden';
  inHonorOf?: { type: 'honor' | 'memory'; honoreeName: string; notifyEmail?: string };
  matchingEmployerName?: string;
  matchingStatus?: 'none' | 'submitted' | 'received';
  benefitsSelected: SponsorshipBenefitOption[];
  goodsServicesValue: number;
  deductibleAmount: number;
  paymentMethod: 'card' | 'apple_pay' | 'ach' | 'invoice_net30' | 'check_wire';
  paymentLast4: string;
  poNumber?: string;
  status: 'completed' | 'pledged' | 'refunded';
  createdAt: string;
}

export interface Pledge {
  id: string;
  donationId: string;
  donorId: string;
  orgName: string;
  contactEmail: string;
  billingEmail?: string;
  amount: number;
  sponsorshipTier?: SponsorshipTierId;
  benefitsSelected: SponsorshipBenefitOption[];
  poNumber?: string;
  invoiceNumber: string;
  dueDate: string;
  status: 'open' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  donationId: string;
  donorId: string;
  receiptNumber: string;
  issuedAt: string;
  donorLegalName: string;
  donorContactName?: string;
  donorEmail: string;
  donorAddress?: string;
  grossAmount: number;
  paymentMethodLabel: string;
  designationLabel: string;
  poOrInvoiceNumber?: string;
  goodsServicesDescription?: string;
  goodsServicesValue: number;
  deductibleAmount: number;
  discretionStatementSnapshot: string;
  orgLegalNameSnapshot: string;
  orgEinSnapshot: string;
  orgAddressSnapshot: string;
  taxExemptSnapshot: string;
  reissuedCount: number;
  voidedAt?: string;
  voidReason?: string;
}

export interface FundLedgerEntry {
  id: string;
  donationId?: string;
  campaignId?: string;
  enrollmentId?: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  entryType: 'donation_in' | 'campaign_allocation' | 'surplus_sweep' | 'enrollment_credit' | 'scholarship_topup' | 'refund_reversal';
  note: string;
  actorId: string;
  createdAt: string;
}

export interface GrantListing {
  id: string;
  title: string;
  provider: string;
  category: 'scholarship' | 'state_aid' | 'childcare' | 'employer_tuition' | 'equipment';
  amountLabel: string;
  eligibilitySummary: string;
  deadline: string;
  applicationUrl: string;
  howToApply: string;
  status: 'verified' | 'pending_verification';
  suggestedByUserId?: string;
  verifiedBy?: string;
}

export interface ForumThread {
  id: string;
  authorId: string;
  category: 'dws_tips' | 'scholarships' | 'childcare' | 'ask_funding_staff';
  title: string;
  body: string;
  pinned?: boolean;
  hiddenBy?: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  hiddenBy?: string;
  createdAt: string;
}

export interface VolunteerSignup {
  id: string;
  orgId: string;
  employeeName: string;
  employeeEmail: string;
  activity: 'resume_review' | 'mock_interview' | 'guest_speaker' | 'month_of_giving_workshop';
  scheduledDate: string;
  status: 'confirmed' | 'completed';
}

export type EventType =
  | 'quarterly_meetup'
  | 'virtual_workshop'
  | 'better_way_thursday'
  | 'info_session';

export interface EventItem {
  id: string;
  title: string;
  titleEs: string;
  type: EventType;
  description: string;
  startsAt: string;
  endsAt: string;
  locationLabel: string;
  isVirtual: boolean;
  zoomOrAddress: string;
  capacity: number;
  hostOrgName?: string;
  sponsorOrgId?: string;
  recordingResourceId?: string;
  checkInCode: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: 'going' | 'cancelled';
  checkedInAt?: string;
  createdAt: string;
}

export type NotificationCategory =
  | 'announcement'
  | 'message'
  | 'grade'
  | 'job_match'
  | 'funding'
  | 'project'
  | 'event';

export interface NotificationItem {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string;
  urgent?: boolean;
  readAt?: string;
  createdAt: string;
}

export interface OutboxMessage {
  id: string;
  channel: 'email' | 'sms' | 'digest' | 'push';
  toName: string;
  toAddress: string;
  subject: string;
  body: string;
  relatedModule: string;
  queuedForQuietHours?: boolean;
  createdAt: string;
}

export interface ModerationItem {
  id: string;
  targetType: 'message' | 'project' | 'forum_post' | 'donor_message';
  targetId: string;
  reportedByUserId: string;
  reason: string;
  previewText: string;
  status: 'pending' | 'approved_kept' | 'hidden_removed';
  reviewedBy?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

export interface LegalSettings {
  orgLegalName: string;
  orgEin: string;
  orgAddress: string;
  taxExemptStatement: string;
  fundPolicyText: string;
  fundPolicyTextEs: string;
  receiptDiscretionText: string;
  noGoodsServicesText: string;
  goodsServicesTemplate: string;
  pendingLegalReview: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface AppDatabaseState {
  users: User[];
  userRoles: UserRole[];
  dmPreferences: DmPreference[];
  organizations: Organization[];
  programs: Program[];
  cohorts: Cohort[];
  enrollments: Enrollment[];
  waitlistEntries: InterestWaitlistEntry[];
  modules: CourseModule[];
  lessons: Lesson[];
  lessonCompletions: LessonCompletion[];
  assignments: Assignment[];
  submissions: Submission[];
  attendance: AttendanceRecord[];
  certifications: CertificationRecord[];
  resources: ResourceLibraryItem[];
  announcements: Announcement[];
  announcementReceipts: AnnouncementReceipt[];
  announcementComments: AnnouncementComment[];
  announcementRequests: AnnouncementRequest[];
  spaces: Space[];
  spaceMembers: SpaceMember[];
  messages: Message[];
  helpTickets: HelpTicket[];
  helpTicketMessages: HelpTicketMessage[];
  projects: Project[];
  projectMembers: ProjectMember[];
  projectJoinRequests: ProjectJoinRequest[];
  projectTasks: ProjectTask[];
  projectUpdates: ProjectUpdate[];
  projectInquiryPings: ProjectInquiryPing[];
  jobs: Job[];
  jobApplications: JobApplication[];
  talentProfiles: TalentProfile[];
  resumeReviews: ResumeReviewRequest[];
  mockInterviews: MockInterviewBooking[];
  fundingApplications: PersonalFundingApplication[];
  dwsAidRecords: DwsStateAidRecord[];
  funds: Fund[];
  campaigns: Campaign[];
  campaignUpdates: CampaignUpdate[];
  campaignThankYous: CampaignThankYou[];
  donors: Donor[];
  donations: Donation[];
  pledges: Pledge[];
  receipts: Receipt[];
  fundLedger: FundLedgerEntry[];
  grantListings: GrantListing[];
  forumThreads: ForumThread[];
  forumPosts: ForumPost[];
  volunteerSignups: VolunteerSignup[];
  events: EventItem[];
  eventRsvps: EventRsvp[];
  notifications: NotificationItem[];
  outbox: OutboxMessage[];
  moderationQueue: ModerationItem[];
  auditLog: AuditLogEntry[];
  legalSettings: LegalSettings;
  careerPaths: CareerPath[];
  catalogItems: CatalogItem[];
  interestProfiles: InterestProfile[];
  roadmaps: Roadmap[];
  roadmapSteps: RoadmapStep[];
  advisorNotes: AdvisorNote[];
  recommendationEvents: RecommendationEvent[];
  faqEntries: FaqEntry[];
  aiSettings: AiSetting[];
  aiUsageLogs: AiUsageLog[];
}

export interface CareerPath {
  id: string;
  slug: string;
  title: string;
  titleEs: string;
  description: string;
  typicalDay: string;
  entryRoles: string[];
  skills: string[];
  recommendedSequence: string[]; // catalog item IDs
  relatedCertIds: string[];
  salaryRangeEstimate: string; // e.g. "$65,000 – $82,000 (Estimate)"
}

export type CatalogItemType =
  | 'techmoms_program'
  | 'external_course'
  | 'certification'
  | 'resume_course'
  | 'workshop_recording';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  title: string;
  description: string;
  skillsTaught: string[];
  careerPathsSupported: string[]; // path IDs or slugs
  level: 'starter' | 'next_step' | 'advanced';
  durationWeeks: number;
  weeklyHours: number;
  scheduleExample: string;
  format: 'in_person' | 'hybrid' | 'online';
  locations: string[];
  prerequisites: string[]; // item IDs or descriptive prerequisites
  costRange: string;
  fundingOptionsLink: string;
  upcomingCohortDates: string[];
  openToNonAlumni: boolean;
}

export interface InterestProfile {
  id: string;
  userId?: string; // empty/absent for public anonymous quiz
  email?: string; // optional contact for guest emailing
  soundsFunTags: string[];
  freeTextInterests: string;
  generatedInterestTags: string[];
  experienceLevel: string;
  transferableSkills: string[];
  targetTimelineMonths: number;
  locationPreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  employmentTarget: 'part_time' | 'full_time' | 'flexible';
  valueDriver: string;
  weeklyHoursAvailable: number;
  preferredScheduleWindows: string[];
  inPersonOk: boolean;
  preferredCity: string;
  learningStyle: string;
  completedAt: string;
  isPublicAnonymous?: boolean;
}

export interface Roadmap {
  id: string;
  userId: string;
  careerPathId: string;
  status: 'active' | 'archived';
  sharedWithAdvisors: boolean;
  targetTimelineMonths: number;
  matchScore: number;
  matchExplanation: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapStep {
  id: string;
  roadmapId: string;
  catalogItemId: string;
  column: 'now' | 'next' | 'later';
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  orderIndex: number;
  reasonText: string;
  aiGenerated: boolean;
  conflictWarning?: string;
  linkedProjectId?: string;
  linkedEventId?: string;
}

export interface AdvisorNote {
  id: string;
  roadmapId: string;
  authorId: string;
  note: string;
  pinnedStepId?: string;
  suggestedCatalogItemId?: string;
  createdAt: string;
}

export interface RecommendationEvent {
  id: string;
  userId: string;
  trigger: 'course_completed' | 'cert_added' | 'project_finished' | 'cohort_opened' | 'quiz_updated';
  changeDescription: string;
  createdAt: string;
}

export interface FaqEntry {
  id: string;
  queue: HelpQueue;
  question: string;
  answer: string;
  tags: string[];
}

export interface AiSetting {
  featureKey: string;
  enabled: boolean;
  description: string;
}

export interface AiUsageLog {
  id: string;
  featureName: string;
  userRole: string;
  tokenCount: number;
  latencyMs: number;
  timestamp: string;
}
