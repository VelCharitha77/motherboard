'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  DollarSign,
  Building2,
  ShieldCheck,
  Download,
  CreditCard,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Campaign, Donation, GrantListing, Organization, SponsorshipBenefitOption, SponsorshipTierId } from '@/lib/data/types';
import { SPONSORSHIP_BENEFIT_CATALOG, SPONSORSHIP_TIERS } from '@/lib/data/constants';

export default function GivePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'student_campaigns' | 'techmoms_campaigns' | 'grants' | 'forum'>('student_campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Checkout modal
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [targetCampaign, setTargetCampaign] = useState<Campaign | null>(null);

  // Step 1: Individual vs Company
  const [donorType, setDonorType] = useState<'individual' | 'organization'>('individual');

  // Form A: Individual
  const [indAmount, setIndAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<Donation['frequency']>('one_time');
  const [donorName, setDonorName] = useState(currentUser?.name ?? '');
  const [donorEmail, setDonorEmail] = useState(currentUser?.email ?? '');
  const [donorAddress, setDonorAddress] = useState('');
  const [displayMode, setDisplayMode] = useState<Donation['displayMode']>('full_name');
  const [hideAmount, setHideAmount] = useState(false);
  const [coverFees, setCoverFees] = useState(true);
  const [encouragement, setEncouragement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Donation['paymentMethod']>('card');

  // Form B: Company
  const [companyName, setCompanyName] = useState('Wasatch Cloud Solutions');
  const [orgType, setOrgType] = useState<Organization['orgCategory']>('corporation');
  const [companyEin, setCompanyEin] = useState('87-7654321');
  const [contactName, setContactName] = useState(currentUser?.name ?? 'Alex Vance');
  const [contactEmail, setContactEmail] = useState(currentUser?.email ?? 'giving@example.com');
  const [billingAddress, setBillingAddress] = useState('250 S Main St, Salt Lake City, UT 84101');
  const [sponsorshipTier, setSponsorshipTier] = useState<SponsorshipTierId>('bronze');
  const [poNumber, setPoNumber] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<SponsorshipBenefitOption[]>([SPONSORSHIP_BENEFIT_CATALOG[0]]);

  // Grant Suggestion Modal
  const [suggestGrantOpen, setSuggestGrantOpen] = useState(false);
  const [grantTitle, setGrantTitle] = useState('');
  const [grantProvider, setGrantProvider] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantLink, setGrantLink] = useState('');

  // Forum state
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [threadModalOpen, setThreadModalOpen] = useState(false);

  const campaigns = db.funding.listCampaigns();
  const studentCampaigns = campaigns.filter((c) => c.type === 'student' && c.status === 'live');
  const techMomsCampaigns = campaigns.filter((c) => c.type === 'techmoms' && c.status === 'live');
  const grants = db.funding.listGrants();
  const forumThreads = db.funding.listForumThreads();
  const legalSettings = db.legal.get();

  const handleOpenDonate = (campaign?: Campaign) => {
    setTargetCampaign(campaign ?? null);
    setDonateModalOpen(true);
  };

  const handleProcessDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = donorType === 'individual'
      ? customAmount ? Number(customAmount) : indAmount
      : SPONSORSHIP_TIERS.find((t) => t.id === sponsorshipTier)?.amount ?? 5000;

    const result = db.funding.createDonationOrPledge({
      actorUserId: currentUser?.id,
      donorType,
      donorName: donorType === 'individual' ? donorName : companyName,
      legalName: donorType === 'organization' ? companyName : undefined,
      orgCategory: donorType === 'organization' ? orgType : undefined,
      ein: donorType === 'organization' ? companyEin : undefined,
      email: donorType === 'individual' ? donorEmail : contactEmail,
      mailingAddress: donorType === 'individual' ? donorAddress : billingAddress,
      fundId: 'fnd_general',
      campaignId: targetCampaign?.id,
      designationLabel: targetCampaign ? `Support ${targetCampaign.displayName}'s cohort through Tech-Moms Scholarship Fund` : 'Tech-Moms General Scholarship Fund',
      sponsorshipTier: donorType === 'organization' ? sponsorshipTier : undefined,
      amount: finalAmount,
      coverFees,
      frequency,
      displayMode,
      hideAmountPublicly: hideAmount,
      encouragementMessage: encouragement,
      benefitsSelected: donorType === 'organization' ? selectedBenefits : [],
      paymentMethod,
      paymentLast4: paymentMethod === 'invoice_net30' ? 'N/A' : '4242',
      poNumber: donorType === 'organization' ? poNumber : undefined,
    });

    setDonateModalOpen(false);
    if (result.receipt) {
      router.push(`/receipts/${result.receipt.id}`);
    } else {
      alert(`Pledge recorded under Invoice #${result.pledge?.invoiceNumber}! Official tax receipt will issue upon payment.`);
    }
  };

  const handleSuggestGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !grantTitle || !grantProvider) return;
    db.funding.suggestGrant(currentUser.id, {
      title: grantTitle,
      provider: grantProvider,
      category: 'scholarship',
      amountLabel: grantAmount || '$1,000+',
      eligibilitySummary: 'Suggested by community member. Under staff verification.',
      deadline: 'Rolling',
      applicationUrl: grantLink || 'https://jobs.utah.gov',
      howToApply: 'Visit provider link.',
    });
    setSuggestGrantOpen(false);
    setGrantTitle('');
    setGrantProvider('');
    alert('Thank you! Our funding staff will verify this grant listing.');
  };

  const handleCreateForumThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newThreadTitle || !newThreadBody) return;
    db.funding.createForumThread(currentUser.id, 'dws_tips', newThreadTitle, newThreadBody);
    setThreadModalOpen(false);
    setNewThreadTitle('');
    setNewThreadBody('');
  };

  const handleDownloadW9 = () => {
    const dummyPdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF`;
    const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Tech-Moms_W9_2027.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/30 p-6 sm:p-10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
              Tech-Moms Scholarship Fund
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t('funding.fundingBoard', 'Public Funding Board')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every dollar directly unlocks tuition, Saturday childcare stipends, and certification vouchers for Utah mothers entering technology careers.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenDonate()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:bg-primary/90 transition shadow-md"
            >
              <HeartHandshake className="h-5 w-5" />
              <span>Donate to General Scholarship</span>
            </button>
            <p className="text-[11px] text-muted-foreground">
              Instant 501(c)(3) tax receipt • Card, ACH, Apple Pay & Net-30 Invoices
            </p>
          </div>
        </div>

        {/* IRS Deductibility Policy Box */}
        <div className="bg-card/80 border border-border/80 rounded-2xl p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong>Tax Deductibility & Scholarship Fund Policy:</strong> {legalSettings.fundPolicyText}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        {[
          { key: 'student_campaigns', label: t('funding.studentCampaigns', 'Student Campaigns'), count: studentCampaigns.length },
          { key: 'techmoms_campaigns', label: t('funding.techMomsCampaigns', 'Tech-Moms Campaigns'), count: techMomsCampaigns.length },
          { key: 'grants', label: t('funding.grantsAssistance', 'Grants & State Aid'), count: grants.length },
          { key: 'forum', label: t('funding.discussion', 'Funding Discussion Forum'), count: forumThreads.length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`rounded-xl px-4 py-2 font-bold whitespace-nowrap transition ${
              activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <span>{tab.label}</span>
            <span className="ml-1.5 text-xs opacity-80">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* TAB 1: STUDENT CAMPAIGNS */}
      {activeTab === 'student_campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentCampaigns.map((cmp) => {
              const progressPct = Math.min(100, (cmp.raised / cmp.goal) * 100);
              const isOverfunded = cmp.raised > cmp.goal;

              return (
                <div
                  key={cmp.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {cmp.photoInitials}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{cmp.displayName}</h4>
                          <p className="text-[11px] text-muted-foreground">
                            {cmp.location} • Cohort Winter 2027
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs px-2.5 py-0.5">
                        {progressPct.toFixed(0)}% Funded
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug">{cmp.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{cmp.story}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">${cmp.raised.toLocaleString()} raised</span>
                        <span className="text-muted-foreground">${cmp.goal.toLocaleString()} goal</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                      {isOverfunded && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-0.5">
                          ✓ Fully funded! ${cmp.surplusToGeneralFund} surplus transferred to General Fund.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{cmp.donorCount} donors</span>
                    <button
                      type="button"
                      onClick={() => handleOpenDonate(cmp)}
                      className="rounded-xl bg-primary text-primary-foreground font-bold text-xs px-4 py-2 hover:bg-primary/90 transition shadow-sm"
                    >
                      Donate to Seat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TECH-MOMS CAMPAIGNS */}
      {activeTab === 'techmoms_campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {techMomsCampaigns.map((cmp) => {
              const progressPct = Math.min(100, (cmp.raised / cmp.goal) * 100);
              return (
                <div key={cmp.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                      Cohort Institutional Need
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{cmp.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{cmp.story}</p>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>${cmp.raised.toLocaleString()} raised</span>
                        <span className="text-muted-foreground">${cmp.goal.toLocaleString()} goal</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{cmp.donorCount} supporters</span>
                    <button
                      type="button"
                      onClick={() => handleOpenDonate(cmp)}
                      className="rounded-xl bg-primary text-primary-foreground font-bold text-xs px-4 py-2 hover:bg-primary/90 transition shadow-sm"
                    >
                      Fund Campaign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GRANTS & ASSISTANCE */}
      {activeTab === 'grants' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground">Verified External Grants & State Aid Directory</h3>
            <button
              type="button"
              onClick={() => setSuggestGrantOpen(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Suggest a Grant Opportunity
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {grants.map((grt) => (
              <div key={grt.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary">{grt.category.replace('_', ' ')}</span>
                  <h4 className="font-bold text-sm text-foreground mt-1">{grt.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Provider: {grt.provider}</p>
                  <div className="text-sm font-extrabold text-emerald-600 mt-2">{grt.amountLabel}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{grt.eligibilitySummary}</p>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <a
                    href={grt.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>How to Apply</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DISCUSSION FORUM */}
      {activeTab === 'forum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground">Funding Questions & Community Tips</h3>
            <button
              type="button"
              onClick={() => setThreadModalOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground font-bold text-xs px-3.5 py-1.5 shadow-sm hover:bg-primary/90 transition"
            >
              + Start Discussion Thread
            </button>
          </div>

          <div className="space-y-3">
            {forumThreads.map((thm) => {
              const author = db.users.getById(thm.authorId);
              const posts = db.funding.listForumPosts(thm.id);
              return (
                <div key={thm.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Posted by {author?.name}</span>
                    <span>{new Date(thm.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-base text-foreground">{thm.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{thm.body}</p>

                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{posts.length} replies</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DONATE & CHECKOUT MODAL (STRICTLY MODELING PROMPT 6) */}
      {donateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-xl text-foreground">
                  {targetCampaign ? `Support ${targetCampaign.displayName}'s Cohort` : 'Donate to Tech-Moms Scholarship Fund'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contributions are tax-deductible under 501(c)(3) rules. Instant receipt provided.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDonateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Step 1 Selector: Individual vs Company */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent border border-border">
              <button
                type="button"
                onClick={() => setDonorType('individual')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  donorType === 'individual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Giving as an Individual
              </button>
              <button
                type="button"
                onClick={() => setDonorType('organization')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  donorType === 'organization' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Giving for a Company / Organization
              </button>
            </div>

            <form onSubmit={handleProcessDonation} className="space-y-4">
              {/* FORM A: INDIVIDUAL */}
              {donorType === 'individual' ? (
                <>
                  {/* Preset amounts */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Contribution Amount</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[25, 50, 100, 250, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setIndAmount(amt);
                            setCustomAmount('');
                          }}
                          className={`py-2 rounded-xl border text-xs sm:text-sm font-bold transition ${
                            !customAmount && indAmount === amt ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="number"
                        placeholder="Or enter custom amount ($)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['one_time', 'monthly', 'yearly'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFrequency(freq)}
                        className={`py-2 rounded-xl border capitalize font-semibold transition ${
                          frequency === freq ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-background hover:bg-accent'
                        }`}
                      >
                        {freq.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Donor Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="First and last name"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Email for Receipt</label>
                      <input
                        type="email"
                        required
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="receipt@example.com"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Mailing Address (Optional for year-end statements)</label>
                    <input
                      type="text"
                      value={donorAddress}
                      onChange={(e) => setDonorAddress(e.target.value)}
                      placeholder="123 Main St, Salt Lake City, UT 84101"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Recognition & Message */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Display Preference</label>
                      <select
                        value={displayMode}
                        onChange={(e) => setDisplayMode(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                      >
                        <option value="full_name">Show my full name</option>
                        <option value="first_only">Show first name only</option>
                        <option value="anonymous">Keep contribution anonymous</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideAmount}
                          onChange={(e) => setHideAmount(e.target.checked)}
                          className="rounded border-border text-primary"
                        />
                        <span className="font-semibold text-muted-foreground">Hide gift amount from public list</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Message of Encouragement</label>
                    <input
                      type="text"
                      value={encouragement}
                      onChange={(e) => setEncouragement(e.target.value)}
                      placeholder="e.g. So proud of your hard work! Keep shining!"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Processing Fee Checkbox */}
                  <div className="p-3 rounded-xl border border-border bg-accent/20 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                      <input
                        type="checkbox"
                        checked={coverFees}
                        onChange={(e) => setCoverFees(e.target.checked)}
                        className="rounded border-border text-primary"
                      />
                      <span>
                        Cover 2.9% + $0.30 processing fees (+${((customAmount ? Number(customAmount) : indAmount) * 0.029 + 0.30).toFixed(2)})
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                /* FORM B: COMPANY / ORGANIZATION */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Organization Legal Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Organization EIN (Optional)</label>
                      <input
                        type="text"
                        value={companyEin}
                        onChange={(e) => setCompanyEin(e.target.value)}
                        placeholder="XX-XXXXXXX"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Sponsorship Tiers */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Sponsorship Tier</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {SPONSORSHIP_TIERS.map((tier) => (
                        <div
                          key={tier.id}
                          onClick={() => setSponsorshipTier(tier.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            sponsorshipTier === tier.id ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'bg-background hover:bg-accent'
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span>{tier.name}</span>
                            <span className="text-primary">${tier.amount.toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{tier.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits Received Checklist (Feeds IRS goods & services receipt value) */}
                  <div className="p-3.5 rounded-xl border border-border bg-accent/20 space-y-2 text-xs">
                    <span className="font-bold text-foreground block">Sponsorship Tangible Benefits Received:</span>
                    <p className="text-[11px] text-muted-foreground">
                      IRS rules require subtracting tangible benefit values from gross deductible amounts.
                    </p>
                    {SPONSORSHIP_BENEFIT_CATALOG.map((b) => {
                      const isChecked = selectedBenefits.some((sb) => sb.id === b.id);
                      return (
                        <label key={b.id} className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedBenefits([...selectedBenefits, b]);
                              else setSelectedBenefits(selectedBenefits.filter((sb) => sb.id !== b.id));
                            }}
                            className="mt-0.5 rounded border-border text-primary"
                          />
                          <span className="text-foreground">
                            {b.label} {b.fairMarketValue > 0 ? `(FMV: $${b.fairMarketValue})` : ''}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Payment Method Option: Instant Card/ACH vs Invoice Net-30 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                      >
                        <option value="card">Credit Card (Stripe)</option>
                        <option value="ach">ACH Bank Transfer</option>
                        <option value="invoice_net30">Send Me an Invoice (Net-30 Pledge)</option>
                      </select>
                    </div>
                    {paymentMethod === 'invoice_net30' && (
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Purchase Order (PO) Number</label>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          placeholder="e.g. PO-2027-089"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* Instant Download W-9 and 501(c)(3) letter */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleDownloadW9}
                      className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Tech-Moms W-9 & 501(c)(3) Letter</span>
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  Stripe Mock Test Mode Active
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition shadow-md"
                >
                  {paymentMethod === 'invoice_net30' ? 'Confirm Invoice Pledge' : 'Complete Donation & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUGGEST GRANT MODAL */}
      {suggestGrantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Suggest a Grant Opportunity</h3>
            <form onSubmit={handleSuggestGrant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  value={grantTitle}
                  onChange={(e) => setGrantTitle(e.target.value)}
                  placeholder="e.g. Utah STEM Action Center Scholarship"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Provider / Foundation</label>
                <input
                  type="text"
                  required
                  value={grantProvider}
                  onChange={(e) => setGrantProvider(e.target.value)}
                  placeholder="e.g. Utah STEM Action Center"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuggestGrantOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* START FORUM THREAD MODAL */}
      {threadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Start Discussion Thread</h3>
            <form onSubmit={handleCreateForumThread} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Question or Topic</label>
                <input
                  type="text"
                  required
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="e.g. Tips for meeting with your DWS counselor"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Details</label>
                <textarea
                  rows={4}
                  required
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  placeholder="Share advice or ask questions about funding..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setThreadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Post Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
