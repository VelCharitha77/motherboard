'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Users,
  MessageSquare,
  DollarSign,
  MapPin,
  Clock,
  Award,
  Send,
  Eye,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ApplicationStage, Job, JobType, LocationMode } from '@/lib/data/types';
import { filterTalentProfileForViewer } from '@/lib/auth/permissions';

export default function EmployerPage() {
  const router = useRouter();
  const { currentUser, can } = useAuth();
  const { t } = useI18n();

  const userRoles = currentUser ? db.users.getRoles(currentUser.id) : [];
  const orgRole = userRoles.find((r) => r.scopeType === 'org');
  const org = orgRole?.scopeId ? db.orgs.getById(orgRole.scopeId) : db.orgs.getById('org_northpeak');

  const [activeTab, setActiveTab] = useState<'applicants' | 'post_job' | 'talent_directory' | 'coordinator'>('applicants');

  // Job creation form
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobType, setJobType] = useState<JobType>('internship_returnship');
  const [locationMode, setLocationMode] = useState<LocationMode>('hybrid');
  const [city, setCity] = useState('Lehi');
  const [schoolHours, setSchoolHours] = useState(true);
  const [careerPath, setCareerPath] = useState<Job['careerPath']>('Web Dev');
  const [payMin, setPayMin] = useState(30);
  const [payMax, setPayMax] = useState(38);
  const [payPeriod, setPayPeriod] = useState<'hour' | 'year'>('hour');
  const [skillsText, setSkillsText] = useState('HTML5, CSS3, JavaScript, Git');

  // Talent search
  const [talentSearch, setTalentSearch] = useState('');

  const orgJobs = org ? db.careers.listJobs().filter((j) => j.orgId === org.id) : [];
  const applications = org ? db.careers.listApplications({ orgId: org.id }) : [];

  // Talent directory profiles (filtered through privacy redaction)
  const stateSnapshot = db.getStateSnapshot();
  const rawTalentProfiles = db.careers.listOptedInTalentProfiles();
  const visibleTalentProfiles = rawTalentProfiles
    .map((p) => filterTalentProfileForViewer(p, currentUser, stateSnapshot))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const filteredTalent = visibleTalentProfiles.filter((tp) => {
    if (talentSearch) {
      const q = talentSearch.toLowerCase();
      const user = db.users.getById(tp.userId);
      return (
        user?.name.toLowerCase().includes(q) ||
        tp.headline.toLowerCase().includes(q) ||
        tp.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !org || !jobTitle || !jobDesc) return;
    const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    db.careers.createJob(currentUser.id, {
      orgId: org.id,
      title: jobTitle,
      description: jobDesc,
      responsibilities: [
        'Collaborate with engineering mentors on customer-facing web apps',
        'Participate in daily agile standups and code reviews',
        'Write clean, accessible semantic HTML, CSS, and modern JavaScript',
      ],
      type: jobType,
      locationMode,
      city,
      schoolHoursFriendly: schoolHours,
      careerPath,
      certsRequired: [],
      skills,
      payMin: Number(payMin),
      payMax: Number(payMax),
      payPeriod,
      cycleLabel: 'Spring/Summer 2027 Co-op Cycle',
      status: 'open',
    });
    setJobTitle('');
    setJobDesc('');
    setActiveTab('applicants');
    alert('Job posting published to Careers Board!');
  };

  const handleStageChange = (appId: string, stage: ApplicationStage) => {
    if (!currentUser) return;
    db.careers.updateApplicationStage(currentUser.id, appId, stage);
  };

  const handleMessageApplicant = (applicantUserId: string, appId: string) => {
    if (!currentUser) return;
    const dmSpace = db.messages.openOrCreateDm(currentUser.id, [applicantUserId], { jobApplicationId: appId });
    router.push('/messages');
  };

  const isPlacementCoordinator = can('careers:manage_placements');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {org?.name ?? 'Employer Portal'}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                org?.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}
            >
              {org?.status === 'approved' ? '✓ Approved Hiring Partner' : 'Pending Staff Approval'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your company’s returnship postings, review qualified candidates, and browse opted-in talent.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setActiveTab('applicants')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'applicants' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Applicants ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('post_job')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'post_job' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Post a Returnship
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('talent_directory')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'talent_directory' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Talent Directory
          </button>
        </div>
      </div>

      {/* TAB 1: APPLICANTS PIPELINE */}
      {activeTab === 'applicants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active Postings</span>
              <div className="text-2xl font-black text-primary mt-1">{orgJobs.length}</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Candidates</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{applications.length}</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">In Interview</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {applications.filter((a) => a.stage === 'interview').length}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Hires Placed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {applications.filter((a) => a.stage === 'hired').length}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground">Candidate Pipeline</h3>

            <div className="divide-y divide-border/60">
              {applications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No applicants received yet for your active postings.
                </div>
              ) : (
                applications.map((app) => {
                  const candidate = db.users.getById(app.userId);
                  const job = db.careers.getJob(app.jobId);
                  const profile = db.careers.getTalentProfile(app.userId);

                  return (
                    <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{candidate?.name}</h4>
                          <span className="text-xs text-primary font-medium">• Applied to {job?.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {profile?.headline} • Resume: <span className="font-mono">{app.resumeFileName}</span>
                        </p>
                        {app.coverNote && (
                          <p className="text-xs text-muted-foreground italic bg-accent/30 p-2 rounded-lg max-w-2xl mt-1">
                            "{app.coverNote}"
                          </p>
                        )}
                      </div>

                      {/* Stage Dropdown & Message Applicant */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <select
                          value={app.stage}
                          onChange={(e) => handleStageChange(app.id, e.target.value as ApplicationStage)}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none"
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                          <option value="declined">Declined</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleMessageApplicant(app.userId, app.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs px-3 py-1.5 hover:bg-primary/90 transition shadow-sm"
                          title="Message Applicant Directly"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Message</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POST A RETURNSHIP */}
      {activeTab === 'post_job' && (
        <form onSubmit={handleCreateJob} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-lg text-foreground">Post a 3–6 Month Returnship or Role</h3>
            <p className="text-xs text-muted-foreground">
              Tech-Moms requires transparent pay ranges on all listings to protect career returners.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Job Title</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Junior Front-End Web Developer (Returnship)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Role Description & Mentorship Structure</label>
            <textarea
              rows={4}
              required
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Describe daily work, mentorship structure, and growth opportunities..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-foreground mb-1">Employment Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:outline-none"
              >
                <option value="internship_returnship">3–6 Month Returnship</option>
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Location Mode</label>
              <select
                value={locationMode}
                onChange={(e) => setLocationMode(e.target.value as LocationMode)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:outline-none"
              >
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
                <option value="onsite">On-Site</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Utah City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Pay Range (Transparent) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-3.5 rounded-xl border border-border bg-accent/20">
            <div>
              <label className="block font-semibold text-foreground mb-1">Pay Period</label>
              <select
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-semibold focus:outline-none"
              >
                <option value="hour">Hourly Rate ($)</option>
                <option value="year">Annual Salary ($)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Minimum Compensation</label>
              <input
                type="number"
                required
                value={payMin}
                onChange={(e) => setPayMin(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Maximum Compensation</label>
              <input
                type="number"
                required
                value={payMax}
                onChange={(e) => setPayMax(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Required Skills (Comma separated)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={schoolHours}
              onChange={(e) => setSchoolHours(e.target.checked)}
              className="rounded border-border text-primary"
            />
            <span>This position supports school-hours scheduling (e.g. 9:00 AM – 2:30 PM)</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
            >
              Publish Listing to Careers Board
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TALENT DIRECTORY (RESPECTING FIELD BY FIELD PRIVACY) */}
      {activeTab === 'talent_directory' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={talentSearch}
              onChange={(e) => setTalentSearch(e.target.value)}
              placeholder="Search talent by skills, certification, name..."
              className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTalent.map((tp) => {
              const user = db.users.getById(tp.userId);
              return (
                <div key={tp.userId} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${user?.avatarColor}`}>
                        {user?.avatarInitials}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{user?.name}</h4>
                        <p className="text-[11px] text-primary font-medium">{tp.headline}</p>
                      </div>
                    </div>

                    {/* Summary (only if user made visible) */}
                    {tp.summary ? (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{tp.summary}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Summary hidden by candidate.</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tp.skills.map((s) => (
                        <span key={s} className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{tp.availability.replace('_', ' ')}</span>
                    <button
                      type="button"
                      onClick={() => handleMessageApplicant(tp.userId, 'inquiry')}
                      className="text-primary font-bold hover:underline"
                    >
                      Connect →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
