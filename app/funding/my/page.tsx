'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  PiggyBank,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { CampaignLineItem, PersonalFundingApplication } from '@/lib/data/types';
import { STAFF_COST_CATALOG } from '@/lib/data/constants';

export default function MyFundingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const userFundingApp = currentUser ? db.funding.getPersonalApplication(currentUser.id) : undefined;
  const dwsRecord = currentUser ? db.funding.getDwsRecord(currentUser.id) : undefined;
  const enrollments = currentUser ? db.cohorts.listEnrollments({ userId: currentUser.id }) : [];
  const activeEnrollment = enrollments.find((e) => e.status === 'active' || e.status === 'admitted');
  const activeCohort = activeEnrollment ? db.cohorts.getById(activeEnrollment.cohortId) : undefined;
  const program = activeCohort ? db.programs.getById(activeCohort.programId) : undefined;

  // Student campaigns owned by this user
  const myCampaigns = currentUser ? db.funding.listCampaigns('student').filter((c) => c.ownerId === currentUser.id) : [];

  // Application form state
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [householdSize, setHouseholdSize] = useState(userFundingApp?.householdSize ?? 4);
  const [annualIncomeBand, setAnnualIncomeBand] = useState<PersonalFundingApplication['annualIncomeBand']>(
    userFundingApp?.annualIncomeBand ?? 'under_35k'
  );
  const [employmentStatus, setEmploymentStatus] = useState<PersonalFundingApplication['employmentStatus']>(
    userFundingApp?.employmentStatus ?? 'part_time'
  );
  const [caregiverStatus, setCaregiverStatus] = useState(userFundingApp?.caregiverStatus ?? true);
  const [needsChildcare, setNeedsChildcare] = useState(userFundingApp?.needsChildcareSupport ?? true);
  const [needsLaptop, setNeedsLaptop] = useState(userFundingApp?.needsLaptop ?? true);
  const [statement, setStatement] = useState(userFundingApp?.privateStatement ?? '');

  // Campaign builder state
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignStory, setCampaignStory] = useState('');
  const [displayMode, setDisplayMode] = useState<'first_only' | 'first_last_initial' | 'full_name'>('first_only');
  const [showCity, setShowCity] = useState(true);
  const [selectedCostKeys, setSelectedCostKeys] = useState<{ tuition: boolean; childcare: boolean; exam: boolean; equipment: boolean }>({
    tuition: true,
    childcare: true,
    exam: false,
    equipment: false,
  });

  const totalProgramCost = (program?.tuitionCost ?? 1500) + (needsChildcare ? 750 : 0) + (needsLaptop ? 650 : 0);
  const aidAwarded = (userFundingApp?.techMomsScholarshipAwarded ?? 0) + (userFundingApp?.sponsorSeatAwarded ?? 0);
  const remainingGap = Math.max(0, totalProgramCost - aidAwarded);

  const handleSaveApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeCohort) return;
    db.funding.submitPersonalApplication(currentUser.id, {
      cohortId: activeCohort.id,
      householdSize,
      annualIncomeBand,
      employmentStatus,
      caregiverStatus,
      needsChildcareSupport: needsChildcare,
      needsLaptop,
      privateStatement: statement,
    });
    setAppModalOpen(false);
    alert('Confidential funding application submitted to Tech-Moms review staff.');
  };

  const handleToggleDwsChecklist = (key: 'utahIdReady' | 'incomeVerificationReady' | 'acceptanceLetterSaved' | 'counselorAppointmentBooked') => {
    if (!currentUser || !dwsRecord) return;
    db.funding.updateDwsRecord(currentUser.id, {
      checklist: {
        ...dwsRecord.checklist,
        [key]: !dwsRecord.checklist[key],
      },
    });
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeCohort || !campaignTitle || !campaignStory) return;

    const lineItems: CampaignLineItem[] = [];
    if (selectedCostKeys.tuition) {
      lineItems.push({ id: `li_${Date.now()}_1`, category: 'tuition', label: 'Program Tuition', amount: program?.tuitionCost ?? 1500 });
    }
    if (selectedCostKeys.childcare) {
      lineItems.push({ id: `li_${Date.now()}_2`, category: 'childcare', label: 'Cohort Saturday Childcare Stipends', amount: 750 });
    }
    if (selectedCostKeys.exam) {
      lineItems.push({ id: `li_${Date.now()}_3`, category: 'exam', label: 'Certification Exam Voucher', amount: 350 });
    }
    if (selectedCostKeys.equipment) {
      lineItems.push({ id: `li_${Date.now()}_4`, category: 'equipment', label: 'Laptop & Hardware Access Bundle', amount: 650 });
    }

    db.funding.createStudentCampaign(currentUser.id, {
      enrollmentId: activeEnrollment?.id,
      programId: activeCohort.programId,
      cohortId: activeCohort.id,
      location: activeCohort.location,
      title: campaignTitle,
      story: campaignStory,
      displayMode,
      showCity,
      lineItems,
      deadline: activeCohort.tuitionDueDate || '2027-02-28',
    });

    setCampaignModalOpen(false);
    alert('Your funding campaign has been submitted for staff review! Once approved, it will appear publicly on the Funding Board.');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-primary" />
            <span>{t('funding.myFunding', 'My Funding Hub')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Personalized tuition assistance, Utah Department of Workforce Services guidance, and scholarship gap funding.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAppModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent transition shadow-sm self-start sm:self-auto"
        >
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span>{userFundingApp ? 'Edit Confidential Application' : 'Complete Funding Application'}</span>
        </button>
      </div>

      {/* Tuition & Gap Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Cohort Tuition Breakdown</span>
            <h2 className="text-xl font-bold text-foreground mt-0.5">{activeCohort?.name ?? 'Enrolled Cohort'}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Remaining Tuition Gap:</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ${remainingGap}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-accent/30 border border-border/50">
            <span className="text-muted-foreground block">1. Total Verified Program Costs:</span>
            <span className="text-lg font-bold text-foreground">${totalProgramCost}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-accent/30 border border-border/50">
            <span className="text-muted-foreground block">2. Tech-Moms Aid & Sponsor Seats:</span>
            <span className="text-lg font-bold text-emerald-600">-${aidAwarded}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-accent/30 border border-border/50">
            <span className="text-muted-foreground block">3. Final Out-of-Pocket Gap:</span>
            <span className="text-lg font-bold text-foreground">${remainingGap}</span>
          </div>
        </div>

        {remainingGap > 0 && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground max-w-xl">
              Don’t let financial gaps delay your graduation. You can fund your remaining gap by launching a verified student campaign on the public Funding Board.
            </p>
            <button
              type="button"
              onClick={() => setCampaignModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition shadow-sm"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Start a Funding Board Campaign</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Core Funding Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source 1: Tech-Moms Scholarship & Sponsor Seats */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>1. Tech-Moms Aid & Sponsor Seats</span>
            </h3>
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-bold">
              ${aidAwarded} Awarded
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tech-Moms awards need-based partial scholarships funded by individual supporters and corporate partners like Summit Credit Union.
          </p>
          <div className="p-3 rounded-xl bg-accent/30 border border-border/60 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span>Scholarship Award:</span>
              <span className="font-bold text-foreground">${userFundingApp?.techMomsScholarshipAwarded ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sponsor Seat Award:</span>
              <span className="font-bold text-foreground">${userFundingApp?.sponsorSeatAwarded ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/40">
              <span>Application Status:</span>
              <span className="font-semibold capitalize text-foreground">{userFundingApp?.status ?? 'Not submitted'}</span>
            </div>
          </div>
        </div>

        {/* Source 2: Utah Department of Workforce Services (DWS) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>2. State Workforce Aid (Utah DWS)</span>
            </h3>
            <span className="rounded-full bg-blue-500/10 text-blue-600 px-2.5 py-0.5 text-xs font-bold capitalize">
              {dwsRecord?.status.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Guidance Only:</strong> Tech-Moms helps you prepare documents and counselor talking points, but the state workforce agency makes final eligibility determinations.
            </span>
          </div>

          {/* Screener Checklist */}
          {dwsRecord && (
            <div className="space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-muted-foreground">Document Checklist</span>
              {[
                { k: 'utahIdReady' as const, label: 'UtahID account created at jobs.utah.gov' },
                { k: 'incomeVerificationReady' as const, label: 'Past 3 pay stubs or unemployment documentation' },
                { k: 'acceptanceLetterSaved' as const, label: 'Tech-Moms official acceptance verification letter' },
                { k: 'counselorAppointmentBooked' as const, label: 'Appointment booked with DWS employment counselor' },
              ].map(({ k, label }) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent/40">
                  <input
                    type="checkbox"
                    checked={dwsRecord.checklist[k]}
                    onChange={() => handleToggleDwsChecklist(k)}
                    className="rounded border-border text-primary"
                  />
                  <span className={dwsRecord.checklist[k] ? 'line-through text-muted-foreground' : 'text-foreground'}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* What to say guide */}
          <div className="p-3 rounded-xl bg-accent/40 border border-border/60 text-xs space-y-1">
            <span className="font-bold text-foreground">What to say to your DWS counselor:</span>
            <p className="text-muted-foreground italic">
              "I have been admitted to Tech-Moms, a technical skills training program. I am seeking WIOA assistance to cover my program tuition, Saturday childcare stipends, and certification vouchers."
            </p>
          </div>
        </div>
      </div>

      {/* Active Student Campaign Tracker (if student created one) */}
      {myCampaigns.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground">My Live Funding Board Campaign</h3>
            <NextLink href="/give" className="text-xs font-bold text-primary hover:underline">
              View on Public Board →
            </NextLink>
          </div>

          {myCampaigns.map((cmp) => (
            <div key={cmp.id} className="p-4 rounded-xl border border-border bg-accent/20 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Status: {cmp.status}</span>
                  <h4 className="font-bold text-sm text-foreground mt-0.5">{cmp.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600">${cmp.raised}</span>
                  <span className="text-xs text-muted-foreground"> / ${cmp.goal} goal</span>
                </div>
              </div>

              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (cmp.raised / cmp.goal) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{cmp.donorCount} community donors</span>
                <span>Deadline: {new Date(cmp.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIDENTIAL APPLICATION MODAL */}
      {appModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Lock className="h-5 w-5" />
              <h3 className="text-lg font-bold text-foreground">Confidential Tuition Assistance Form</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              This financial information is encrypted and strictly accessible only to the student and funding-review staff. It is NEVER shown to employers or public donors.
            </p>

            <form onSubmit={handleSaveApplication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Household Size</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Annual Household Income Band</label>
                  <select
                    value={annualIncomeBand}
                    onChange={(e) => setAnnualIncomeBand(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                  >
                    <option value="under_35k">Under $35,000</option>
                    <option value="35k_55k">$35,000 – $55,000</option>
                    <option value="55k_80k">$55,000 – $80,000</option>
                    <option value="80k_plus">$80,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Employment Situation</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                >
                  <option value="part_time">Part-time / Low-wage</option>
                  <option value="career_break">Career Break (Caregiving)</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="full_time">Full-time</option>
                </select>
              </div>

              <div className="space-y-2 pt-1 text-xs text-foreground">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsChildcare}
                    onChange={(e) => setNeedsChildcare(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>I need Saturday cohort childcare support to attend sessions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsLaptop}
                    onChange={(e) => setNeedsLaptop(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>I need a laptop hardware bundle for coding coursework</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Confidential Statement</label>
                <textarea
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Share any special circumstances (medical hardship, single parent, etc.)..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Save & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STUDENT CAMPAIGN MODAL */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Launch Student Funding Campaign</h3>
            <p className="text-xs text-muted-foreground">
              Campaign goals pull directly from staff-set costs minus aid already awarded. Over-funding is prohibited; surplus supports other students.
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Campaign Headline</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Help Maria complete Web Engineering & support her children"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Your Story & Goals</label>
                <textarea
                  rows={4}
                  required
                  value={campaignStory}
                  onChange={(e) => setCampaignStory(e.target.value)}
                  placeholder="Share what this training means to you and your family..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Staff-Set Line Item Selection */}
              <div className="space-y-2 p-3 rounded-xl border border-border bg-accent/20 text-xs">
                <span className="font-bold text-muted-foreground block">Verified Real Costs (Select What You Need Covered):</span>
                {[
                  { k: 'tuition' as const, label: `Program Tuition ($${program?.tuitionCost ?? 1500})` },
                  { k: 'childcare' as const, label: `Saturday Childcare Stipend ($750)` },
                  { k: 'exam' as const, label: `Certification Exam Voucher ($350)` },
                  { k: 'equipment' as const, label: `Configured Laptop Package ($650)` },
                ].map(({ k, label }) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCostKeys[k]}
                      onChange={(e) => setSelectedCostKeys({ ...selectedCostKeys, [k]: e.target.checked })}
                      className="rounded border-border text-primary"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Display Identity on Public Card</label>
                  <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                  >
                    <option value="first_only">First Name Only (e.g. Maria) — Recommended</option>
                    <option value="first_last_initial">First Name + Last Initial (e.g. Maria L.)</option>
                    <option value="full_name">Full Name (e.g. Maria Lopez)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCity}
                      onChange={(e) => setShowCity(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span className="font-semibold text-foreground">Display Utah City</span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                <strong>Legal & Fund Notice:</strong> In accordance with IRS rules, gifts are made to the Tech-Moms Scholarship Fund. Donor student selection is advisory; Tech-Moms maintains final discretion to ensure tax deductibility. Surplus funds support other students.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
                >
                  Submit for Staff Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
