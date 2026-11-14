'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Award,
  HeartHandshake,
  Users,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { SPONSORSHIP_TIERS } from '@/lib/data/constants';

export default function SponsorPage() {
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const userRoles = currentUser ? db.users.getRoles(currentUser.id) : [];
  const orgRole = userRoles.find((r) => r.scopeType === 'org');
  const org = orgRole?.scopeId ? db.orgs.getById(orgRole.scopeId) : db.orgs.getById('org_summit_cu');

  const donations = org ? db.funding.listDonations({ orgId: org.id }) : [];
  const volunteerSignups = org ? db.funding.listVolunteerSignups(org.id) : [];
  const receipts = org ? db.funding.listReceipts() : [];

  const tier = SPONSORSHIP_TIERS.find((t) => t.id === org?.sponsorshipTier) ?? SPONSORSHIP_TIERS[6]; // Gold default

  // Volunteer signup modal
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [activity, setActivity] = useState<'resume_review' | 'mock_interview' | 'guest_speaker' | 'month_of_giving_workshop'>('resume_review');
  const [date, setDate] = useState('2027-03-15');

  const handleCreateVolunteerSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !empName || !empEmail) return;
    db.funding.createVolunteerSignup({
      orgId: org.id,
      employeeName: empName,
      employeeEmail: empEmail,
      activity,
      scheduledDate: date,
    });
    setVolunteerModalOpen(false);
    setEmpName('');
    setEmpEmail('');
    alert('Employee volunteer shift confirmed and scheduled.');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-7 w-7 text-amber-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {org?.name ?? 'Summit Credit Union'} Sponsor Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Corporate Philanthropy & Community Engagement Hub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
            ★ {tier.name} ($20,000 Annual Partner)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seats Underwritten</span>
          <div className="text-3xl font-black text-primary">{tier.seatsIncluded} Students</div>
          <p className="text-xs text-muted-foreground">Fully funded scholarship seats</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cohort Graduation</span>
          <div className="text-3xl font-black text-emerald-600">92%</div>
          <p className="text-xs text-muted-foreground">Completion rate of funded scholars</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Career Placement</span>
          <div className="text-3xl font-black text-indigo-600">61%</div>
          <p className="text-xs text-muted-foreground">Placed in high-wage tech jobs</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee Volunteers</span>
          <div className="text-3xl font-black text-foreground">{volunteerSignups.length + 3} Shifts</div>
          <p className="text-xs text-muted-foreground">Resume reviews & mock interviews</p>
        </div>
      </div>

      {/* Anonymized Student Outcomes */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Anonymized Outcomes of Your Sponsored Seats</h3>
            <p className="text-xs text-muted-foreground">Live aggregate progress across cohorts funded by Summit Credit Union.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-accent/20 space-y-1">
            <span className="font-bold text-foreground block">Scholar Seat #1 — Lehi Winter 2027</span>
            <span className="text-emerald-600 font-semibold block">Active • 100% Attendance</span>
            <p className="text-muted-foreground">Completed Semantic HTML and Flexbox assignments with honors.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-accent/20 space-y-1">
            <span className="font-bold text-foreground block">Scholar Seat #2 — Sandy Winter 2027</span>
            <span className="text-emerald-600 font-semibold block">Active • 100% Attendance</span>
            <p className="text-muted-foreground">Enrolled in CAPM certification prep and project tracking.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-accent/20 space-y-1">
            <span className="font-bold text-foreground block">Scholar Seat #3 — Online Winter 2027</span>
            <span className="text-emerald-600 font-semibold block">Active • Childcare Stipend Utilized</span>
            <p className="text-muted-foreground">Building bilingual accessible storytime portfolio application.</p>
          </div>
        </div>
      </div>

      {/* Employee Volunteering Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Employee Volunteer Engagement</h3>
            <p className="text-xs text-muted-foreground">Engage your software engineers and managers as coaches.</p>
          </div>
          <button
            type="button"
            onClick={() => setVolunteerModalOpen(true)}
            className="rounded-xl bg-primary text-primary-foreground font-bold text-xs px-3.5 py-1.5 shadow-sm hover:bg-primary/90 transition"
          >
            + Register Employee Volunteer
          </button>
        </div>

        <div className="divide-y divide-border/60 text-xs">
          {volunteerSignups.map((v) => (
            <div key={v.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground">{v.employeeName}</span>{' '}
                <span className="text-muted-foreground">({v.employeeEmail})</span>
                <p className="text-[11px] text-muted-foreground capitalize">Activity: {v.activity.replace('_', ' ')}</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 text-[10px]">
                {v.status} ({v.scheduledDate})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Tax Receipts History */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground">Official Corporate Tax Receipts & Deductibility Statements</h3>
          <NextLink href="/receipts/rcp_summit_gold" className="text-xs font-bold text-primary hover:underline">
            View Latest 501(c)(3) Receipt PDF →
          </NextLink>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/50 border-b border-border font-bold text-muted-foreground">
              <tr>
                <th className="p-3">Receipt #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Tangible Benefits Value</th>
                <th className="p-3 text-right">Deductible Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-3 font-mono font-bold text-primary">RCP-2027-00102</td>
                <td className="p-3">Jan 10, 2027</td>
                <td className="p-3 font-semibold">Gold Partner</td>
                <td className="p-3 text-muted-foreground">$400.00 (Dinner Tickets)</td>
                <td className="p-3 text-right font-bold text-emerald-600">$19,600.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER VOLUNTEER MODAL */}
      {volunteerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Register Employee Volunteer</h3>
            <form onSubmit={handleCreateVolunteerSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="sconnor@company.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Volunteering Activity</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                >
                  <option value="resume_review">Resume Reviewing Queue</option>
                  <option value="mock_interview">Mock Interview Coaching</option>
                  <option value="guest_speaker">Guest Career Speaker Session</option>
                  <option value="month_of_giving_workshop">Month of Giving Technical Workshop</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVolunteerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
