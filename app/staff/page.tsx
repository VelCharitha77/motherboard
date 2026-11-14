'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  BookOpen,
  Upload,
  Settings,
  Scale,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CohortLocation, Enrollment, HelpQueue, LegalSettings, Role, ScopeType } from '@/lib/data/types';

export default function StaffPage() {
  const { currentUser, can } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'admissions' | 'people' | 'cohorts' | 'moderation' | 'funding' | 'legal' | 'airtable'>('admissions');

  // Admissions state
  const enrollments = db.cohorts.listEnrollments();
  const pendingEnrollments = enrollments.filter((e) => e.status === 'applied');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewEnrId, setInterviewEnrId] = useState<string | null>(null);

  // People & Roles state
  const allUsers = db.users.list();
  const allRoles = db.users.listAllRoles();
  const [roleUserId, setRoleUserId] = useState(allUsers[0]?.id ?? '');
  const [roleToAssign, setRoleToAssign] = useState<Role>('student');
  const [roleScopeType, setRoleScopeType] = useState<ScopeType>('cohort');
  const [roleScopeId, setRoleScopeId] = useState('coh_online_w27');

  // Cohort Builder state
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortProgId, setNewCohortProgId] = useState('prog_foundational');
  const [newCohortLocation, setNewCohortLocation] = useState<CohortLocation>('Lehi');
  const [newCohortStart, setNewCohortStart] = useState('2027-05-01');
  const [newCohortEnd, setNewCohortEnd] = useState('2027-07-10');
  const [newCohortSchedule, setNewCohortSchedule] = useState('Wednesdays 6:00 PM & Saturdays 9:00 AM');
  const [newCohortAddress, setNewCohortAddress] = useState('UVU Thanksgiving Point, Lehi, UT');

  // Moderation state
  const modQueue = db.moderation.list();

  // Funding ledger & pledges
  const ledger = db.funding.listLedger();
  const pledges = db.funding.listPledges();
  const campaigns = db.funding.listCampaigns();

  // Legal text settings
  const legalSettings = db.legal.get();
  const [policyText, setPolicyText] = useState(legalSettings.fundPolicyText);
  const [receiptDiscretion, setReceiptDiscretion] = useState(legalSettings.receiptDiscretionText);
  const [noGoodsText, setNoGoodsText] = useState(legalSettings.noGoodsServicesText);

  // Airtable mock import state
  const [airtableCsvData, setAirtableCsvData] = useState(
    'Name,Email,City,Cohort,Role\nJennifer Vance,jennifer.v@example.com,Lehi,coh_lehi_w27,student\nCamila Ortiz,camila.o@example.com,Sandy,coh_sandy_w27,student\nJessica Wu,jessica.wu@example.com,Salt Lake City,coh_online_w27,student'
  );
  const [importSummary, setImportSummary] = useState<string | null>(null);

  if (!can('nav:staff')) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground">The Staff Console is restricted to Tech-Moms program managers, coordinators, and administrators.</p>
        <NextLink href="/" className="text-xs font-bold text-primary hover:underline">
          Switch to Rachel Kim (Staff) or Morgan Ellis (Admin)
        </NextLink>
      </div>
    );
  }

  const handleAcceptEnrollment = (enrId: string) => {
    if (!currentUser) return;
    db.cohorts.updateEnrollmentStatus(currentUser.id, enrId, 'admitted');
    alert('Candidate accepted! Student role granted and welcome letter dispatched to Dev Outbox.');
  };

  const handleDeclineEnrollment = (enrId: string) => {
    if (!currentUser) return;
    db.cohorts.updateEnrollmentStatus(currentUser.id, enrId, 'declined');
    alert('Candidate marked declined.');
  };

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !interviewEnrId || !interviewDate) return;
    db.cohorts.scheduleInterview(currentUser.id, interviewEnrId, interviewDate);
    setInterviewEnrId(null);
    setInterviewDate('');
    alert('Interview scheduled. Invitation dispatched to applicant email.');
  };

  const handleAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !roleUserId) return;
    db.users.assignRole(currentUser.id, {
      userId: roleUserId,
      role: roleToAssign,
      scopeType: roleScopeType,
      scopeId: roleScopeId,
    });
    alert('Role assigned successfully.');
  };

  const handleRemoveRole = (roleRecordId: string) => {
    if (!currentUser) return;
    db.users.removeRole(currentUser.id, roleRecordId);
  };

  const handleCreateCohort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCohortName) return;
    db.cohorts.create(currentUser.id, {
      programId: newCohortProgId,
      name: newCohortName,
      location: newCohortLocation,
      startDate: newCohortStart,
      endDate: newCohortEnd,
      tuitionDueDate: newCohortStart,
      schedule: newCohortSchedule,
      scheduleEs: newCohortSchedule,
      inPersonSaturdayAddress: newCohortAddress,
      zoomLink: 'https://zoom.example.com/j/new-cohort',
      instructorIds: ['usr_kris'],
      taIds: ['usr_dana'],
      managerId: currentUser.id,
      capacity: 20,
      status: 'upcoming',
    });
    setNewCohortName('');
    alert('Cohort created! Dedicated cohort communication space auto-created in Messages.');
  };

  const handleMarkPledgePaid = (pledgeId: string) => {
    if (!currentUser) return;
    const { receipt } = db.funding.markPledgePaid(currentUser.id, pledgeId);
    alert(`Pledge marked paid! Receipt #${receipt.receiptNumber} generated.`);
  };

  const handleSaveLegal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    db.legal.update(currentUser.id, {
      fundPolicyText: policyText,
      receiptDiscretionText: receiptDiscretion,
      noGoodsServicesText: noGoodsText,
    });
    alert('Legal text settings updated.');
  };

  const handleRunAirtableImport = () => {
    if (!currentUser) return;
    const lines = airtableCsvData.trim().split('\n').slice(1);
    const parsed = lines.map((l) => {
      const [name, email, city, cohortId, role] = l.split(',');
      return { name, email, city, cohortId, role: role as Role };
    });
    const count = db.cohorts.importAirtableRows(currentUser.id, parsed);
    setImportSummary(`Successfully imported ${count} learner records from CSV into cohorts and roles.`);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Staff & Operations Console</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
              {currentUser?.name ?? 'Staff'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Admissions pipeline, scoped role management, cohort creation, moderation, and legal text settings.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <NextLink href="/staff/catalog" className="text-xs font-bold text-primary hover:underline">
              Course Catalog →
            </NextLink>
            <span className="text-muted-foreground text-xs">•</span>
            <NextLink href="/staff/demand" className="text-xs font-bold text-primary hover:underline">
              Demand Dashboard →
            </NextLink>
            <span className="text-muted-foreground text-xs">•</span>
            <NextLink href="/staff/ai-settings" className="text-xs font-bold text-primary hover:underline">
              AI Controls & Logs →
            </NextLink>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border border-border bg-card p-1 rounded-xl overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { key: 'admissions', label: 'Admissions Queue', count: pendingEnrollments.length },
            { key: 'people', label: 'People & Scoped Roles' },
            { key: 'cohorts', label: 'Cohort Builder' },
            { key: 'moderation', label: 'Moderation Queue', count: modQueue.filter((m) => m.status === 'pending').length },
            { key: 'funding', label: 'Ledger & Pledges' },
            { key: 'legal', label: 'Legal Disclosures' },
            { key: 'airtable', label: 'Airtable Import' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap transition ${
                activeTab === tab.key ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="ml-1 opacity-80">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: ADMISSIONS QUEUE */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground">Pending Cohort Applications</h3>
            <p className="text-xs text-muted-foreground">
              Review applicant motivation notes, schedule intake conversations, and accept or decline. Acceptance automatically grants the student role and enrolls the learner in their cohort.
            </p>

            <div className="divide-y divide-border/60">
              {pendingEnrollments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No pending applications in queue.</div>
              ) : (
                pendingEnrollments.map((enr) => {
                  const applicant = db.users.getById(enr.userId);
                  const cohort = db.cohorts.getById(enr.cohortId);

                  return (
                    <div key={enr.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{applicant?.name}</h4>
                          <span className="text-xs text-muted-foreground">({applicant?.email})</span>
                          <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">
                            {cohort?.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground italic bg-accent/30 p-2.5 rounded-lg max-w-2xl">
                          "{enr.motivationNote}"
                        </p>
                        {enr.interviewScheduledAt && (
                          <p className="text-[11px] text-blue-600 font-semibold">
                            Intake Interview Scheduled: {new Date(enr.interviewScheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setInterviewEnrId(enr.id)}
                          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent transition"
                        >
                          Schedule Intake
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptEnrollment(enr.id)}
                          className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                        >
                          Accept & Auto-Enroll
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineEnrollment(enr.id)}
                          className="rounded-lg border border-border text-muted-foreground hover:text-red-600 px-2 py-1.5 text-xs font-semibold"
                        >
                          Decline
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

      {/* TAB 2: PEOPLE & SCOPED ROLES */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          <form onSubmit={handleAssignRole} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
            <h3 className="font-bold text-base text-foreground">Assign Scoped Role</h3>
            <p className="text-xs text-muted-foreground">
              Roles are additive and strictly scoped (global, program, cohort, or organization).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">User</label>
                <select
                  value={roleUserId}
                  onChange={(e) => setRoleUserId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Role</label>
                <select
                  value={roleToAssign}
                  onChange={(e) => setRoleToAssign(e.target.value as Role)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                >
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                  <option value="instructor">Instructor</option>
                  <option value="ta">TA</option>
                  <option value="mentor">Mentor</option>
                  <option value="staff">Staff</option>
                  <option value="employer">Employer</option>
                  <option value="sponsor">Sponsor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Scope Type</label>
                <select
                  value={roleScopeType}
                  onChange={(e) => setRoleScopeType(e.target.value as ScopeType)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                >
                  <option value="cohort">Cohort</option>
                  <option value="program">Program</option>
                  <option value="org">Organization</option>
                  <option value="global">Global</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Scope ID</label>
                <input
                  type="text"
                  value={roleScopeId}
                  onChange={(e) => setRoleScopeId(e.target.value)}
                  placeholder="coh_online_w27"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
            >
              Assign Role Record
            </button>
          </form>

          {/* Active Roles List */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-foreground">Active Scoped Role Ledger ({allRoles.length})</h3>
            <div className="max-h-80 overflow-y-auto divide-y divide-border/60 text-xs">
              {allRoles.slice(0, 30).map((r) => {
                const u = db.users.getById(r.userId);
                return (
                  <div key={r.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground">{u?.name}</span>{' '}
                      <span className="text-muted-foreground">({u?.email})</span>
                      <p className="text-[11px] text-muted-foreground">
                        Role: <strong className="text-primary capitalize">{r.role}</strong> • Scope: {r.scopeType} {r.scopeId ? `(${r.scopeId})` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(r.id)}
                      className="text-[11px] text-muted-foreground hover:text-red-600 font-semibold"
                    >
                      Revoke
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COHORT BUILDER */}
      {activeTab === 'cohorts' && (
        <form onSubmit={handleCreateCohort} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-lg text-foreground">Cohort Builder</h3>
          <p className="text-xs text-muted-foreground">
            Creating a cohort automatically provisions its matching communication space in Messages.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Cohort Name</label>
              <input
                type="text"
                required
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="e.g. St. George Spring 2027"
                className="w-full rounded-xl border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Location</label>
              <select
                value={newCohortLocation}
                onChange={(e) => setNewCohortLocation(e.target.value as CohortLocation)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
              >
                <option value="Lehi">Lehi (UVU)</option>
                <option value="Sandy">Sandy (SLCC)</option>
                <option value="St. George">St. George (Utah Tech)</option>
                <option value="Online">Online Statewide</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Start Date</label>
              <input
                type="date"
                required
                value={newCohortStart}
                onChange={(e) => setNewCohortStart(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Date</label>
              <input
                type="date"
                required
                value={newCohortEnd}
                onChange={(e) => setNewCohortEnd(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
          >
            Create Cohort & Provision Space
          </button>
        </form>
      )}

      {/* TAB 4: MODERATION QUEUE */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground">Content Moderation Queue</h3>
            <div className="divide-y divide-border/60 text-xs">
              {modQueue.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">All queues are clear.</div>
              ) : (
                modQueue.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold uppercase text-primary text-[10px]">{item.targetType}</span>
                      <p className="font-semibold text-foreground mt-0.5">Reason: {item.reason}</p>
                      <p className="text-muted-foreground italic mt-0.5">"{item.previewText}"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-bold text-muted-foreground">{item.status.replace('_', ' ')}</span>
                      {item.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => currentUser && db.moderation.resolve(currentUser.id, item.id, 'approved_kept')}
                            className="px-2.5 py-1 rounded bg-accent hover:bg-border text-foreground font-semibold"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={() => currentUser && db.moderation.resolve(currentUser.id, item.id, 'hidden_removed')}
                            className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FUND LEDGER & PLEDGES */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          {/* Pledges Section */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground">Corporate Invoiced Pledges (Net-30)</h3>
            <p className="text-xs text-muted-foreground">
              Under 501(c)(3) rules, invoiced gifts are recorded as pledges and receipted only when marked paid.
            </p>
            <div className="divide-y divide-border/60 text-xs">
              {pledges.map((plg) => (
                <div key={plg.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-foreground">{plg.orgName} — ${plg.amount.toLocaleString()}</h4>
                    <p className="text-muted-foreground">
                      Invoice: {plg.invoiceNumber} • PO: {plg.poNumber || 'N/A'} • Due: {plg.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 uppercase text-[10px]">
                      {plg.status}
                    </span>
                    {plg.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleMarkPledgePaid(plg.id)}
                        className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 font-bold hover:bg-emerald-700 transition shadow-sm"
                      >
                        Mark Payment Received & Issue Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fund Ledger Entries */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-foreground">Fund Accounting Audit Ledger</h3>
            <div className="max-h-72 overflow-y-auto divide-y divide-border/60 text-xs font-mono">
              {ledger.map((ent) => (
                <div key={ent.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground">
                      [{ent.entryType.toUpperCase()}] ${ent.amount}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      From: {ent.fromAccount} → To: {ent.toAccount}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-sans">{ent.note}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(ent.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LEGAL TEXT SETTINGS */}
      {activeTab === 'legal' && (
        <form onSubmit={handleSaveLegal} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <span>IRS Legal Text & Receipt Disclosures</span>
              </h3>
              <p className="text-xs text-muted-foreground">All wording below feeds campaign pages and official tax receipts.</p>
            </div>
            <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3 py-0.5 text-xs font-bold">
              ★ Pending Legal Review
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Fund Policy & Advisory Designation Text</label>
            <textarea
              rows={4}
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Receipt Fiduciary Discretion Statement</label>
            <textarea
              rows={2}
              value={receiptDiscretion}
              onChange={(e) => setReceiptDiscretion(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">No Goods-or-Services Statement</label>
            <input
              type="text"
              value={noGoodsText}
              onChange={(e) => setNoGoodsText(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
          >
            Save Legal Text Settings
          </button>
        </form>
      )}

      {/* TAB 7: AIRTABLE MIGRATION IMPORT */}
      {activeTab === 'airtable' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Airtable Legacy Data Migration</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            One-time migration wizard: paste or preview Airtable CSV rows to import past cohort applicants, alumni, and volunteer records without losing history.
          </p>

          <textarea
            rows={5}
            value={airtableCsvData}
            onChange={(e) => setAirtableCsvData(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs focus:outline-none"
          />

          {importSummary && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {importSummary}
            </div>
          )}

          <button
            type="button"
            onClick={handleRunAirtableImport}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
          >
            Preview & Execute Migration
          </button>
        </div>
      )}

      {/* SCHEDULE INTAKE MODAL */}
      {interviewEnrId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Schedule Admissions Intake</h3>
            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInterviewEnrId(null)}
                  className="px-3 py-1.5 text-xs font-semibold hover:bg-accent rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
