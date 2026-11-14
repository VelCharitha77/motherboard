'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Briefcase,
  Search,
  CheckCircle2,
  Building2,
  Clock,
  DollarSign,
  MapPin,
  Award,
  Send,
  Eye,
  EyeOff,
  UserCheck,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ApplicationStage, Job, JobType, LocationMode, TalentProfile } from '@/lib/data/types';

export default function CareersPage() {
  const { currentUser, can } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'jobs' | 'profile' | 'applications' | 'mentorship'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [schoolHoursOnly, setSchoolHoursOnly] = useState(false);

  // Job application modal
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [coverNote, setCoverNote] = useState('');

  // Resume Review modal
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeTargetRole, setResumeTargetRole] = useState('');
  const [resumeNotes, setResumeNotes] = useState('');

  // Mock Interview booking
  const mockSlots = db.careers.listMockInterviews();

  const jobs = db.careers.listJobs();
  const applications = currentUser ? db.careers.listApplications({ userId: currentUser.id }) : [];
  const talentProfile = currentUser ? db.careers.getTalentProfile(currentUser.id) : null;
  const resumeReviews = currentUser ? db.careers.listResumeReviews(currentUser.id) : [];

  // AI Feedback Modal state
  const [aiFeedbackJob, setAiFeedbackJob] = useState<Job | null>(null);
  const [aiFeedbackText, setAiFeedbackText] = useState<string | null>(null);
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    if (typeFilter !== 'all' && j.type !== typeFilter) return false;
    if (locationFilter !== 'all' && j.locationMode !== locationFilter) return false;
    if (schoolHoursOnly && !j.schoolHoursFriendly) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !applyingJob) return;
    db.careers.applyToJob({
      jobId: applyingJob.id,
      userId: currentUser.id,
      coverNote,
      resumeFileName: talentProfile?.resumeFileName || 'Resume.pdf',
    });
    setApplyingJob(null);
    setCoverNote('');
    alert('Application submitted successfully! You can track progress in your Application Pipeline tab.');
  };

  const handleUpdateProfile = (patch: Partial<TalentProfile>) => {
    if (!currentUser) return;
    db.careers.updateTalentProfile(currentUser.id, patch);
  };

  const handleToggleVisibility = (field: keyof TalentProfile['visibleFields']) => {
    if (!talentProfile) return;
    handleUpdateProfile({
      visibleFields: {
        ...talentProfile.visibleFields,
        [field]: !talentProfile.visibleFields[field],
      },
    });
  };

  const handleRequestReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !resumeTargetRole) return;
    db.careers.requestResumeReview({
      userId: currentUser.id,
      resumeFileName: talentProfile?.resumeFileName || 'Resume.pdf',
      targetRole: resumeTargetRole,
      notes: resumeNotes,
    });
    setResumeModalOpen(false);
    setResumeTargetRole('');
    setResumeNotes('');
    alert('Resume submitted to volunteer coaches & placement coordinators.');
  };

  const handleBookMockInterview = (slotId: string) => {
    if (!currentUser) return;
    db.careers.bookMockInterview(slotId, currentUser.id);
    alert('Mock interview confirmed! Zoom link and calendar invite sent.');
  };

  // Completed projects for this user to showcase
  const completedProjects = currentUser
    ? db.projects.listMembers().filter((m) => m.userId === currentUser.id && m.confirmedRole)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            <span>{t('careers.title', 'Careers & Co-op Board')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Verified employer returnships, transparent pay bands, and talent profiles with field-by-field privacy.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'jobs', label: 'Explore Postings', count: jobs.length },
            { key: 'applications', label: 'My Pipeline', count: applications.length },
            { key: 'profile', label: 'Talent Profile' },
            { key: 'mentorship', label: 'Resumes & Mock Interviews' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm font-bold' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="ml-1.5 text-[10px] opacity-80">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EXPLORE POSTINGS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, company, skills..."
                className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Employment Types</option>
                <option value="internship_returnship">3–6 Month Returnship</option>
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Locations</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-Site</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-2 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={schoolHoursOnly}
                  onChange={(e) => setSchoolHoursOnly(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span>School-Hours Friendly</span>
              </label>
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const org = db.orgs.getById(job.orgId);
              const alreadyApplied = applications.some((a) => a.jobId === job.id);
              const payFormatted =
                job.payPeriod === 'hour'
                  ? `$${job.payMin} – $${job.payMax} / hr`
                  : `$${(job.payMin / 1000).toFixed(0)}k – $${(job.payMax / 1000).toFixed(0)}k / yr`;

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm transition hover:border-primary/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          {org?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">• {job.city} ({job.locationMode})</span>
                        {job.schoolHoursFriendly && (
                          <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                            ✓ School-Hours Friendly
                          </span>
                        )}
                        {job.type === 'internship_returnship' && (
                          <span className="rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 text-[10px] font-bold">
                            3–6 Mo Returnship Model
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground mt-1">{job.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                        {job.description}
                      </p>
                    </div>

                    {/* Pay & Apply Button */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="font-extrabold text-base text-foreground flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="h-4 w-4" />
                        <span>{payFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setAiFeedbackJob(job);
                            setAiFeedbackLoading(true);
                            setAiFeedbackText(null);
                            try {
                              const res = await fetch('/api/ai', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  feature: 'resume_feedback',
                                  userId: currentUser?.id,
                                  role: 'student',
                                  resumeText: talentProfile?.summary || 'Tech-Moms web development & data graduate',
                                  jobTitle: job.title,
                                  jobRequirements: job.skills.join(', '),
                                }),
                              });
                              const d = await res.json();
                              setAiFeedbackText(d.text);
                            } catch {
                              setAiFeedbackText('1. Emphasize responsive layout & Git collaboration.\n2. Add quantifiable capstone metrics.\n3. Single column ATS format recommended.');
                            } finally {
                              setAiFeedbackLoading(false);
                            }
                          }}
                          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent text-primary transition flex items-center gap-1 shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI Resume Match ✨</span>
                        </button>

                        <button
                          type="button"
                          disabled={alreadyApplied || !can('careers:apply')}
                          onClick={() => setApplyingJob(job)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                            alreadyApplied
                              ? 'bg-accent text-muted-foreground'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {alreadyApplied ? '✓ Applied' : 'One-Click Apply'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Certs */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Skills:</span>
                    {job.skills.map((s) => (
                      <span key={s} className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-foreground">
                        {s}
                      </span>
                    ))}
                    {job.certsRequired.length > 0 && (
                      <span className="rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {job.certsRequired.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY APPLICATION PIPELINE */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-foreground">My Active Co-op & Returnship Pipeline</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Transparent pipeline shared between you, your placement coordinator, and hiring managers.
            </p>

            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  You have not applied to any positions yet. Explore open postings above!
                </div>
              ) : (
                applications.map((app) => {
                  const job = db.careers.getJob(app.jobId);
                  const org = db.orgs.getById(job?.orgId ?? '');
                  const stages: ApplicationStage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];
                  const currentIdx = stages.indexOf(app.stage);

                  return (
                    <div key={app.id} className="p-4 rounded-xl border border-border bg-accent/20 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{job?.title}</h4>
                          <p className="text-xs text-muted-foreground">{org?.name} • Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <span className="rounded-full bg-primary text-primary-foreground font-bold text-xs px-3 py-1 uppercase">
                          {app.stage}
                        </span>
                      </div>

                      {/* Visual Pipeline Stepper */}
                      <div className="grid grid-cols-5 gap-1 pt-2">
                        {stages.map((stg, idx) => (
                          <div key={stg} className="text-center space-y-1">
                            <div className={`h-2 rounded-full ${idx <= currentIdx ? 'bg-primary' : 'bg-border'}`} />
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">{stg}</span>
                          </div>
                        ))}
                      </div>

                      {app.coordinatorNotes && (
                        <div className="p-2.5 rounded-lg bg-card border border-border text-xs text-muted-foreground">
                          <strong>Placement Coordinator Note:</strong> {app.coordinatorNotes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TALENT PROFILE WITH PRIVACY TOGGLES */}
      {activeTab === 'profile' && talentProfile && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Talent Profile & Directory Opt-In</h3>
                <p className="text-xs text-muted-foreground">
                  You control exactly what approved hiring partners can view. All fields are opt-in.
                </p>
              </div>

              {/* Opt-in switch */}
              <label className="flex items-center gap-2 cursor-pointer bg-accent px-3 py-1.5 rounded-xl text-xs font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={talentProfile.optedInDirectory}
                  onChange={(e) => handleUpdateProfile({ optedInDirectory: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                <span>Include in Employer Talent Directory</span>
              </label>
            </div>

            {/* Headline & Summary */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={talentProfile.headline}
                  onChange={(e) => handleUpdateProfile({ headline: e.target.value })}
                  placeholder="e.g. Data Analyst & Front-End Developer | Tech-Moms Alum"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-foreground">Bio / Career Narrative</label>
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility('summary')}
                    className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                  >
                    {talentProfile.visibleFields.summary ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{talentProfile.visibleFields.summary ? 'Visible to Employers' : 'Hidden'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={talentProfile.summary}
                  onChange={(e) => handleUpdateProfile({ summary: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Field by field toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-accent/20 text-xs">
                {[
                  { field: 'projects' as const, label: 'Completed Portfolio Projects' },
                  { field: 'certifications' as const, label: 'Verified Certifications' },
                  { field: 'portfolio' as const, label: 'GitHub & Portfolio Links' },
                  { field: 'city' as const, label: 'Utah City Location' },
                  { field: 'email' as const, label: 'Direct Email Address' },
                ].map(({ field, label }) => {
                  const isVisible = talentProfile.visibleFields[field];
                  return (
                    <div key={field} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                      <span className="font-semibold text-foreground">{label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(field)}
                        className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded ${
                          isVisible ? 'text-emerald-700 bg-emerald-500/10' : 'text-muted-foreground bg-accent'
                        }`}
                      >
                        {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Completed Projects automatically populated from Stage 4 */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Verified Portfolio Projects (from Projects Board)
                </h4>
                {completedProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No confirmed project roles yet. Confirm your role in Projects to feature it here!</p>
                ) : (
                  completedProjects.map((m) => {
                    const prj = db.projects.getById(m.projectId);
                    return (
                      <div key={m.id} className="p-3 rounded-xl border border-border bg-accent/30 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-foreground">
                          <span>{prj?.title}</span>
                          <span className="text-emerald-600">✓ Verified Contribution</span>
                        </div>
                        <p className="text-muted-foreground">{m.confirmedRole}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESUMES & MOCK INTERVIEWS */}
      {activeTab === 'mentorship' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resume Review Queue */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Resume Review Queue</h3>
              <button
                type="button"
                onClick={() => setResumeModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                + Request Review
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit your resume for feedback from Tech-Moms career coordinators and industry mentors.
            </p>

            <div className="space-y-3">
              {resumeReviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No pending resume reviews.</div>
              ) : (
                resumeReviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl border border-border bg-accent/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Target Role: {rev.targetRole}</span>
                      <span className="text-[10px] uppercase font-bold text-primary">{rev.status.replace('_', ' ')}</span>
                    </div>
                    {rev.feedback && (
                      <div className="p-2 rounded bg-card border border-border/80 text-muted-foreground">
                        <strong>Feedback:</strong> {rev.feedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mock Interview Booking */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground">Mock Interview Coach Booking</h3>
            <p className="text-xs text-muted-foreground">
              Book a 45-minute practice interview session with industry volunteers like Sam Patel.
            </p>

            <div className="space-y-3">
              {mockSlots.map((slot) => {
                const isBooked = !!slot.bookedByUserId;
                const isBookedByMe = slot.bookedByUserId === currentUser?.id;
                return (
                  <div key={slot.id} className="p-3.5 rounded-xl border border-border bg-accent/20 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-foreground">{slot.focusTrack}</h4>
                      <p className="text-muted-foreground mt-0.5">Coach: {slot.mentorName} • {new Date(slot.startsAt).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleBookMockInterview(slot.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                        isBookedByMe
                          ? 'bg-emerald-600 text-white'
                          : isBooked
                          ? 'bg-accent text-muted-foreground'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isBookedByMe ? 'Booked ✓' : isBooked ? 'Taken' : 'Book Session'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ONE-CLICK APPLY MODAL */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Apply to {applyingJob.title}</h3>
            <p className="text-xs text-muted-foreground">
              Your verified Tech-Moms Talent Profile and active certifications will be attached automatically.
            </p>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Attached Resume</label>
                <div className="p-2.5 rounded-xl border border-border bg-accent/40 text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>{talentProfile?.resumeFileName || 'Aisha_Rahman_Software_Resume.pdf'}</span>
                  <span className="text-[10px] text-primary">From Profile</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Brief Cover Note / Why this team?</label>
                <textarea
                  rows={4}
                  required
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Tell the hiring team why you are excited for this returnship or role..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST RESUME REVIEW MODAL */}
      {resumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Request Resume Review</h3>
            <form onSubmit={handleRequestReview} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Target Role</label>
                <input
                  type="text"
                  required
                  value={resumeTargetRole}
                  onChange={(e) => setResumeTargetRole(e.target.value)}
                  placeholder="e.g. Junior Front-End Developer Returnship"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Specific Questions</label>
                <textarea
                  rows={3}
                  value={resumeNotes}
                  onChange={(e) => setResumeNotes(e.target.value)}
                  placeholder="What would you like the reviewer to focus on?"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResumeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI RESUME MATCH MODAL */}
      {aiFeedbackJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Career Coach</span>
                <h3 className="font-bold text-lg text-foreground mt-0.5">Resume Feedback: {aiFeedbackJob.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setAiFeedbackJob(null)}
                className="text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            {aiFeedbackLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Analyzing your talent profile against required skills...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border bg-accent/30 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {aiFeedbackText}
                </div>
                <span className="text-[10px] text-primary block">Generated with AI — review before using</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAiFeedbackJob(null)}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm"
            >
              Close Coach Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
