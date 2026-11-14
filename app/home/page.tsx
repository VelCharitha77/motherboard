'use client';

import React from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Briefcase,
  HeartHandshake,
  Users,
  Video,
  Award,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';

export default function HomePage() {
  const { currentUser, isGuest } = useAuth();
  const { locale, t } = useI18n();

  if (isGuest || !currentUser) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-lg">
              GD
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome, Guest Supporter</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">You are browsing Motherboard without an active user session.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            As a public donor, you have full access to explore the Tech-Moms Public Funding Board, view student campaigns, browse cohort funding needs, and test our mock Stripe/ACH and corporate invoice donation checkout flows with instant tax receipts.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <NextLink
              href="/give"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-sm font-semibold transition"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Explore Public Funding Board</span>
            </NextLink>
            <NextLink
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm font-medium transition"
            >
              <span>Switch to a Student or Staff Persona</span>
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  const userRoles = db.users.getRoles(currentUser.id);
  const isStudent = userRoles.some((r) => r.role === 'student');
  const isInstructorOrTa = userRoles.some((r) => r.role === 'instructor' || r.role === 'ta');
  const isStaff = userRoles.some((r) => r.role === 'staff' || r.role === 'admin');
  const isEmployer = userRoles.some((r) => r.role === 'employer');
  const isSponsor = userRoles.some((r) => r.role === 'sponsor');
  const isApplicant = userRoles.some((r) => r.role === 'applicant') && !isStudent;

  // Cohort & enrollment data
  const enrollments = db.cohorts.listEnrollments({ userId: currentUser.id });
  const activeEnrollment = enrollments.find((e) => e.status === 'active' || e.status === 'admitted');
  const activeCohort = activeEnrollment ? db.cohorts.getById(activeEnrollment.cohortId) : undefined;
  const program = activeCohort ? db.programs.getById(activeCohort.programId) : undefined;

  // Assignments & attendance
  const assignments = activeCohort ? db.learn.listAssignments(activeCohort.id) : [];
  const submissions = db.learn.listSubmissions({ userId: currentUser.id });
  const pendingAssignments = assignments.filter((a) => !submissions.some((s) => s.assignmentId === a.id));

  // Urgent & cohort announcements
  const announcements = db.announcements.list();
  const urgent = announcements.find((a) => {
    if (a.priority !== 'urgent' || a.status !== 'sent') return false;
    const recipients = db.announcements.resolveRecipients(a.audienceFilter);
    return recipients.some((u) => u.id === currentUser.id);
  });
  const urgentReceipt = urgent ? db.announcements.getUserReceipt(urgent.id, currentUser.id) : undefined;

  // Upcoming Events
  const events = db.events.list();
  const nextEvent = events[0];

  // Projects & Jobs
  const recommendedProjects = db.projects.list().filter((p) => p.status === 'recruiting' || p.status === 'in_progress').slice(0, 2);
  const jobs = db.careers.listJobs().slice(0, 2);

  // Staff numbers
  const pendingApplicants = db.cohorts.listEnrollments({ status: 'applied' });
  const pendingCampaigns = db.funding.listCampaigns().filter((c) => c.status === 'in_review');
  const openTickets = db.help.listTickets().filter((t) => t.status === 'open');
  const pendingRequests = db.announcements.listRequests().filter((r) => r.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('home.welcome', 'Welcome back')}, {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {locale === 'es' ? currentUser.personaSubtitleEs || currentUser.personaSubtitle : currentUser.personaSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCohort && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              {activeCohort.name}
            </span>
          )}
        </div>
      </div>

      {/* Urgent Announcement Box */}
      {urgent && (
        <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Urgent Announcement
            </span>
            <span className="text-xs text-muted-foreground">{new Date(urgent.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="font-bold text-base text-foreground">
            {locale === 'es' && urgent.titleEs ? urgent.titleEs : urgent.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {locale === 'es' && urgent.bodyEs ? urgent.bodyEs : urgent.body}
          </p>
          <div className="pt-2 flex items-center justify-between">
            {urgentReceipt?.acknowledgedAt ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Acknowledged on {new Date(urgentReceipt.acknowledgedAt).toLocaleTimeString()}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => db.announcements.acknowledge(urgent.id, currentUser.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{t('home.acknowledge', "I've read this")}</span>
              </button>
            )}
            <NextLink href="/announcements" className="text-xs font-semibold text-primary hover:underline">
              View all announcements →
            </NextLink>
          </div>
        </div>
      )}

      {/* Role-Specific Dashboard Views */}

      {/* 1. STUDENT VIEW */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule Card */}
            {activeCohort && (
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{t('home.todaysSchedule', "Today's Schedule & Sessions")}</span>
                  </h2>
                  <span className="text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5">
                    Active Cohort
                  </span>
                </div>
                <div className="bg-accent/40 rounded-xl p-4 border border-border/60 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{activeCohort.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === 'es' ? activeCohort.scheduleEs : activeCohort.schedule}
                      </p>
                    </div>
                    {activeCohort.zoomLink && (
                      <a
                        href={activeCohort.zoomLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition shrink-0"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Join Zoom</span>
                      </a>
                    )}
                  </div>
                  {activeCohort.inPersonSaturdayAddress && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <strong>In-Person Location:</strong> {activeCohort.inPersonSaturdayAddress}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Assignments */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>{t('home.upcomingAssignments', 'Upcoming Assignments')}</span>
                </h2>
                <NextLink href="/learn" className="text-xs font-semibold text-primary hover:underline">
                  Go to Learn →
                </NextLink>
              </div>

              {pendingAssignments.length === 0 ? (
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>You are all caught up! No pending submissions.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingAssignments.slice(0, 3).map((asg) => (
                    <div key={asg.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-accent/20 hover:border-primary/40 transition">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-foreground">
                          {locale === 'es' && asg.titleEs ? asg.titleEs : asg.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Due: {new Date(asg.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <NextLink
                        href="/learn"
                        className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-1.5 transition"
                      >
                        Submit Work
                      </NextLink>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Projects */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-primary" />
                  <span>{t('home.recommendedProjects', 'Recommended Projects')}</span>
                </h2>
                <NextLink href="/projects" className="text-xs font-semibold text-primary hover:underline">
                  Browse Projects →
                </NextLink>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedProjects.map((prj) => (
                  <NextLink
                    key={prj.id}
                    href={`/projects`}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{prj.type.replace('_', ' ')}</span>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground mt-0.5 line-clamp-1">{prj.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{prj.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                      <span>{prj.timeCommitment}</span>
                      <span className="font-semibold text-primary">View Roles →</span>
                    </div>
                  </NextLink>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Funding Status & Next Event */}
          <div className="space-y-6">
            {/* Funding Status Widget */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-rose-500" />
                  <span>{t('home.fundingStatus', 'Funding Status')}</span>
                </h3>
                <NextLink href="/funding/my" className="text-xs text-primary font-semibold hover:underline">
                  My Hub →
                </NextLink>
              </div>
              <div className="p-3.5 rounded-xl bg-accent/40 border border-border/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tuition Covered:</span>
                  <span className="font-bold text-foreground">
                    ${activeEnrollment?.tuitionCredit ?? 0} / ${program?.tuitionCost ?? 1500}
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (((activeEnrollment?.tuitionCredit ?? 0) / (program?.tuitionCost || 1500)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  100% of admitted students receive guidance on Utah DWS workforce aid and Tech-Moms scholarship seats.
                </p>
              </div>
            </div>

            {/* Next Community Event */}
            {nextEvent && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{t('home.nextEvent', 'Next Community Event')}</span>
                  </h3>
                  <NextLink href="/events" className="text-xs text-primary font-semibold hover:underline">
                    Events →
                  </NextLink>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-accent/20 space-y-2">
                  <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {nextEvent.type.replace('_', ' ')}
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">{nextEvent.title}</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(nextEvent.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{nextEvent.description}</p>
                  <div className="pt-2">
                    <NextLink
                      href="/events"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>RSVP Details</span>
                      <ArrowRight className="h-3 w-3" />
                    </NextLink>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. INSTRUCTOR / TA VIEW */}
      {isInstructorOrTa && !isStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Instructor Cohort Management</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-border bg-accent/30 text-center">
                  <div className="text-2xl font-black text-primary">2</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Submissions to Grade</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-accent/30 text-center">
                  <div className="text-2xl font-black text-emerald-600">1</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Unanswered Question</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-accent/30 text-center">
                  <div className="text-2xl font-black text-foreground">100%</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Attendance Recorded</div>
                </div>
              </div>
              <div className="pt-3 flex gap-3">
                <NextLink href="/learn" className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs px-4 py-2 hover:bg-primary/90 transition">
                  Open Learn Grading Hub
                </NextLink>
                <NextLink href="/announcements" className="rounded-xl border border-border bg-card font-semibold text-xs px-4 py-2 hover:bg-accent transition">
                  Post to Cohort
                </NextLink>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STAFF / ADMIN VIEW */}
      {isStaff && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Admissions</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-extrabold text-foreground">{pendingApplicants.length}</div>
              <p className="text-xs text-muted-foreground">Pending cohort applications</p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Campaigns</span>
                <HeartHandshake className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-3xl font-extrabold text-foreground">{pendingCampaigns.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting staff review</p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Help Desk</span>
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-foreground">{openTickets.length}</div>
              <p className="text-xs text-muted-foreground">Open student help tickets</p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Announcements</span>
                <Building2 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-foreground">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Partner requests pending</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-base">Executive Operations & Admissions Console</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Review applications, assign roles, configure legal receipts, and manage funds.</p>
            </div>
            <NextLink href="/staff" className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm px-5 py-2.5 hover:bg-primary/90 transition shadow-sm">
              Launch Staff Console →
            </NextLink>
          </div>
        </div>
      )}

      {/* 4. EMPLOYER VIEW */}
      {isEmployer && !isStaff && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Employer Hiring Portal Overview</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your returnships, review applicants, and connect with motivated Tech-Moms talent.
            </p>
            <div className="pt-2 flex gap-3">
              <NextLink href="/employer" className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs px-4 py-2 hover:bg-primary/90 transition">
                Open Employer Dashboard
              </NextLink>
              <NextLink href="/careers" className="rounded-xl border border-border bg-card font-semibold text-xs px-4 py-2 hover:bg-accent transition">
                Browse Talent Directory
              </NextLink>
            </div>
          </div>
        </div>
      )}

      {/* 5. SPONSOR VIEW */}
      {isSponsor && !isStaff && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              <span>Corporate Sponsorship Impact Hub</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review your funded scholarships, download official tax receipts, and view live cohort employment metrics.
            </p>
            <div className="pt-2 flex gap-3">
              <NextLink href="/sponsor" className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs px-4 py-2 hover:bg-primary/90 transition">
                Open Sponsor Portal
              </NextLink>
              <NextLink href="/give" className="rounded-xl border border-border bg-card font-semibold text-xs px-4 py-2 hover:bg-accent transition">
                Public Funding Board
              </NextLink>
            </div>
          </div>
        </div>
      )}

      {/* 6. APPLICANT VIEW */}
      {isApplicant && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
            <div>
              <h2 className="font-bold text-lg text-foreground">Your Application Status: Admitted</h2>
              <p className="text-xs text-muted-foreground">You are officially accepted for Tech-Moms 2.0!</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every admitted Tech-Mom receives individualized funding support. Visit your personal Funding Hub to view your scholarship award and review the Utah DWS state-aid checklist.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <NextLink href="/funding/my" className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs px-4 py-2 hover:bg-primary/90 transition">
              View Funding Options & Gap Campaign
            </NextLink>
            <NextLink href="/events" className="rounded-xl border border-border bg-card font-semibold text-xs px-4 py-2 hover:bg-accent transition">
              Attend Upcoming Info Session
            </NextLink>
          </div>
        </div>
      )}
    </div>
  );
}
