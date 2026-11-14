import {
  Announcement,
  AnnouncementComment,
  AnnouncementReceipt,
  AnnouncementRequest,
  AppDatabaseState,
  Assignment,
  AttendanceRecord,
  AuditLogEntry,
  Campaign,
  CampaignThankYou,
  CampaignUpdate,
  CertificationRecord,
  Cohort,
  CourseModule,
  DmPreference,
  Donation,
  Donor,
  DwsStateAidRecord,
  Enrollment,
  EventItem,
  EventRsvp,
  ForumPost,
  ForumThread,
  Fund,
  FundLedgerEntry,
  GrantListing,
  HelpTicket,
  HelpTicketMessage,
  InterestWaitlistEntry,
  Job,
  JobApplication,
  LegalSettings,
  Lesson,
  LessonCompletion,
  Message,
  MockInterviewBooking,
  ModerationItem,
  NotificationItem,
  Organization,
  OutboxMessage,
  PersonalFundingApplication,
  Pledge,
  Program,
  Project,
  ProjectInquiryPing,
  ProjectJoinRequest,
  ProjectMember,
  ProjectTask,
  ProjectUpdate,
  Receipt,
  ResourceLibraryItem,
  ResumeReviewRequest,
  Role,
  Space,
  SpaceMember,
  Submission,
  TalentProfile,
  User,
  UserRole,
  VolunteerSignup,
  CareerPath,
  CatalogItem,
  InterestProfile,
  Roadmap,
  RoadmapStep,
  AdvisorNote,
  RecommendationEvent,
  FaqEntry,
  AiSetting,
  AiUsageLog,
} from '../types';
import { CreateAnnouncementInput, CreateDonationInput, DataRepository } from '../repository';
import { createInitialSeedState } from './seed';

const STORAGE_KEY = 'motherboard_demo_v1';

class MockDataStore implements DataRepository {
  private state: AppDatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitial();
  }

  private loadInitial(): AppDatabaseState {
    if (typeof window === 'undefined') {
      return createInitialSeedState();
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback on parse failure
    }
    const fresh = createInitialSeedState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
    return fresh;
  }

  private persistAndNotify() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Local storage full or private mode
      }
    }
    this.listeners.forEach((listener) => listener());
  }

  public getStateSnapshot(): AppDatabaseState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public resetDemoData(): void {
    this.state = createInitialSeedState();
    this.persistAndNotify();
  }

  public users = {
    list: (): User[] => this.state.users,
    getById: (id: string): User | undefined => this.state.users.find((u) => u.id === id),
    listFeaturedPersonas: (): User[] => this.state.users.filter((u) => u.isFeaturedPersona),
    getRoles: (userId: string): UserRole[] => this.state.userRoles.filter((r) => r.userId === userId),
    listAllRoles: (): UserRole[] => this.state.userRoles,
    assignRole: (
      actorId: string,
      input: { userId: string; role: Role; subroles?: UserRole['subroles']; scopeType: UserRole['scopeType']; scopeId?: string }
    ): UserRole => {
      const newRole: UserRole = {
        id: `ur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: input.userId,
        role: input.role,
        subroles: input.subroles,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
      };
      this.state.userRoles.push(newRole);
      this.state.auditLog.unshift({
        id: `aud_${Date.now()}`,
        actorId,
        action: 'role:assign',
        targetType: 'user_role',
        targetId: newRole.id,
        detail: `Assigned role ${input.role} (${input.scopeType}) to user ${input.userId}`,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return newRole;
    },
    removeRole: (actorId: string, roleRecordId: string): void => {
      this.state.userRoles = this.state.userRoles.filter((r) => r.id !== roleRecordId);
      this.state.auditLog.unshift({
        id: `aud_${Date.now()}`,
        actorId,
        action: 'role:remove',
        targetType: 'user_role',
        targetId: roleRecordId,
        detail: `Removed role assignment ${roleRecordId}`,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
    },
    updateProfile: (userId: string, patch: Partial<Pick<User, 'name' | 'locale' | 'city' | 'bio'>>): User => {
      const idx = this.state.users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        this.state.users[idx] = { ...this.state.users[idx], ...patch };
        this.persistAndNotify();
        return this.state.users[idx];
      }
      throw new Error('User not found');
    },
    createAdultAccount: (input: { name: string; email: string; city: string; locale: User['locale']; ageAttested: boolean }): User => {
      if (!input.ageAttested) {
        throw new Error('18+ age attestation is required to create a Motherboard account.');
      }
      const initials = input.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'TM';
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: input.name,
        email: input.email,
        locale: input.locale,
        city: input.city,
        avatarInitials: initials,
        avatarColor: 'bg-indigo-600',
        bio: 'Tech-Moms participant and lifelong learner.',
        ageAttestedAt: new Date().toISOString(),
        codeOfConductAcceptedAt: new Date().toISOString(),
        blockedUserIds: [],
        createdAt: new Date().toISOString(),
      };
      this.state.users.push(newUser);
      this.state.userRoles.push({
        id: `ur_${Date.now()}`,
        userId: newUser.id,
        role: 'applicant',
        scopeType: 'global',
      });
      this.state.dmPreferences.push({
        userId: newUser.id,
        allowFrom: 'cohort_and_instructors',
        quietStart: '21:00',
        quietEnd: '07:00',
        emailDigests: true,
        smsUrgent: true,
        presenceVisible: false,
      });
      this.persistAndNotify();
      return newUser;
    },
    toggleBlockUser: (userId: string, targetUserId: string): void => {
      const u = this.state.users.find((user) => user.id === userId);
      if (u) {
        if (u.blockedUserIds.includes(targetUserId)) {
          u.blockedUserIds = u.blockedUserIds.filter((id) => id !== targetUserId);
        } else {
          u.blockedUserIds.push(targetUserId);
        }
        this.persistAndNotify();
      }
    },
    getDmPreference: (userId: string): DmPreference => {
      return (
        this.state.dmPreferences.find((p) => p.userId === userId) ?? {
          userId,
          allowFrom: 'cohort_and_instructors',
          quietStart: '21:00',
          quietEnd: '07:00',
          emailDigests: true,
          smsUrgent: true,
          presenceVisible: false,
        }
      );
    },
    updateDmPreference: (userId: string, patch: Partial<DmPreference>): DmPreference => {
      const idx = this.state.dmPreferences.findIndex((p) => p.userId === userId);
      if (idx !== -1) {
        this.state.dmPreferences[idx] = { ...this.state.dmPreferences[idx], ...patch };
        this.persistAndNotify();
        return this.state.dmPreferences[idx];
      }
      const newPref: DmPreference = {
        userId,
        allowFrom: 'cohort_and_instructors',
        quietStart: '21:00',
        quietEnd: '07:00',
        emailDigests: true,
        smsUrgent: true,
        presenceVisible: false,
        ...patch,
      };
      this.state.dmPreferences.push(newPref);
      this.persistAndNotify();
      return newPref;
    },
  };

  public orgs = {
    list: (): Organization[] => this.state.organizations,
    getById: (id: string): Organization | undefined => this.state.organizations.find((o) => o.id === id),
    create: (input: Omit<Organization, 'id' | 'createdAt' | 'status'> & { status?: Organization['status'] }): Organization => {
      const newOrg: Organization = {
        ...input,
        id: `org_${Date.now()}`,
        status: input.status ?? 'pending',
        createdAt: new Date().toISOString(),
      };
      this.state.organizations.push(newOrg);
      this.persistAndNotify();
      return newOrg;
    },
    updateStatus: (actorId: string, orgId: string, status: Organization['status']): Organization => {
      const org = this.state.organizations.find((o) => o.id === orgId);
      if (!org) throw new Error('Org not found');
      org.status = status;
      org.approvedBy = status === 'approved' ? actorId : undefined;
      this.state.auditLog.unshift({
        id: `aud_${Date.now()}`,
        actorId,
        action: 'org:status',
        targetType: 'organization',
        targetId: orgId,
        detail: `Updated organization ${org.name} status to ${status}`,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return org;
    },
  };

  public programs = {
    list: (): Program[] => this.state.programs,
    getById: (id: string): Program | undefined => this.state.programs.find((p) => p.id === id),
  };

  public cohorts = {
    list: (programId?: string): Cohort[] => {
      return programId ? this.state.cohorts.filter((c) => c.programId === programId) : this.state.cohorts;
    },
    getById: (id: string): Cohort | undefined => this.state.cohorts.find((c) => c.id === id),
    create: (actorId: string, input: Omit<Cohort, 'id'>): Cohort => {
      const newCohort: Cohort = {
        ...input,
        id: `coh_${Date.now()}`,
      };
      this.state.cohorts.push(newCohort);
      // Automatically create matching cohort channel in Messages
      const channelSlug = newCohort.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      this.state.spaces.push({
        id: `spc_auto_${newCohort.id}`,
        name: `#${channelSlug}`,
        slug: channelSlug,
        description: `Cohort space for ${newCohort.name}`,
        type: 'cohort',
        cohortId: newCohort.id,
        readOnly: false,
        createdBy: actorId,
        createdAt: new Date().toISOString(),
      });
      this.state.auditLog.unshift({
        id: `aud_${Date.now()}`,
        actorId,
        action: 'cohort:create',
        targetType: 'cohort',
        targetId: newCohort.id,
        detail: `Created cohort ${newCohort.name} and auto-created space #${channelSlug}`,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return newCohort;
    },
    listEnrollments: (filters?: { userId?: string; cohortId?: string; status?: Enrollment['status'] }): Enrollment[] => {
      return this.state.enrollments.filter((e) => {
        if (filters?.userId && e.userId !== filters.userId) return false;
        if (filters?.cohortId && e.cohortId !== filters.cohortId) return false;
        if (filters?.status && e.status !== filters.status) return false;
        return true;
      });
    },
    submitApplication: (input: { userId: string; cohortId: string; programId: string; motivationNote: string; accompanyingChildrenCount?: number }): Enrollment => {
      const existing = this.state.enrollments.find((e) => e.userId === input.userId && e.cohortId === input.cohortId);
      if (existing) {
        existing.status = 'applied';
        existing.motivationNote = input.motivationNote;
        existing.accompanyingChildrenCount = input.accompanyingChildrenCount;
        existing.updatedAt = new Date().toISOString();
        this.persistAndNotify();
        return existing;
      }
      const newEnr: Enrollment = {
        id: `enr_${Date.now()}`,
        userId: input.userId,
        cohortId: input.cohortId,
        programId: input.programId,
        status: 'applied',
        motivationNote: input.motivationNote,
        accompanyingChildrenCount: input.accompanyingChildrenCount,
        tuitionCredit: 0,
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.enrollments.push(newEnr);
      this.persistAndNotify();
      return newEnr;
    },
    joinWaitlist: (input: Omit<InterestWaitlistEntry, 'id' | 'createdAt'>): InterestWaitlistEntry => {
      const entry: InterestWaitlistEntry = {
        ...input,
        id: `wl_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.state.waitlistEntries.push(entry);
      this.persistAndNotify();
      return entry;
    },
    listWaitlist: (): InterestWaitlistEntry[] => this.state.waitlistEntries,
    scheduleInterview: (actorId: string, enrollmentId: string, isoDate: string): Enrollment => {
      const enr = this.state.enrollments.find((e) => e.id === enrollmentId);
      if (!enr) throw new Error('Enrollment not found');
      enr.interviewScheduledAt = isoDate;
      enr.updatedAt = new Date().toISOString();
      const user = this.state.users.find((u) => u.id === enr.userId);
      this.state.outbox.unshift({
        id: `obx_${Date.now()}`,
        channel: 'email',
        toName: user?.name ?? 'Applicant',
        toAddress: user?.email ?? 'applicant@example.com',
        subject: 'Tech-Moms: Admissions Interview Scheduled',
        body: `Your admissions conversation with Tech-Moms has been scheduled for ${new Date(isoDate).toLocaleString()}. We look forward to meeting you!`,
        relatedModule: 'admissions',
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return enr;
    },
    updateEnrollmentStatus: (actorId: string, enrollmentId: string, status: Enrollment['status']): Enrollment => {
      const enr = this.state.enrollments.find((e) => e.id === enrollmentId);
      if (!enr) throw new Error('Enrollment not found');
      enr.status = status;
      enr.updatedAt = new Date().toISOString();
      const user = this.state.users.find((u) => u.id === enr.userId);
      if (status === 'admitted') {
        // Automatically add student role for this cohort
        const hasRole = this.state.userRoles.some((r) => r.userId === enr.userId && r.role === 'student' && r.scopeId === enr.cohortId);
        if (!hasRole) {
          this.state.userRoles.push({
            id: `ur_${Date.now()}`,
            userId: enr.userId,
            role: 'student',
            scopeType: 'cohort',
            scopeId: enr.cohortId,
          });
        }
        // Auto-add to cohort channel
        const space = this.state.spaces.find((s) => s.cohortId === enr.cohortId);
        if (space) {
          const isMember = this.state.spaceMembers.some((sm) => sm.spaceId === space.id && sm.userId === enr.userId);
          if (!isMember) {
            this.state.spaceMembers.push({ spaceId: space.id, userId: enr.userId, notifyLevel: 'all' });
          }
        }
        this.state.outbox.unshift({
          id: `obx_${Date.now()}`,
          channel: 'email',
          toName: user?.name ?? 'Student',
          toAddress: user?.email ?? 'student@example.com',
          subject: 'Congratulations! You have been admitted to Tech-Moms',
          body: `Welcome to Tech-Moms! You have been accepted into your cohort. Please review your personalized Funding Hub to see your scholarship and aid options.`,
          relatedModule: 'admissions',
          createdAt: new Date().toISOString(),
        });
      }
      this.persistAndNotify();
      return enr;
    },
    importAirtableRows: (actorId: string, rows: { name: string; email: string; city: string; cohortId: string; role: Role }[]): number => {
      let importedCount = 0;
      rows.forEach((r) => {
        let user = this.state.users.find((u) => u.email === r.email);
        if (!user) {
          user = {
            id: `usr_at_${Date.now()}_${importedCount}`,
            name: r.name,
            email: r.email,
            locale: 'en',
            city: r.city || 'Salt Lake City',
            avatarInitials: r.name.substring(0, 2).toUpperCase(),
            avatarColor: 'bg-teal-600',
            bio: 'Imported from Tech-Moms Airtable record.',
            ageAttestedAt: new Date().toISOString(),
            codeOfConductAcceptedAt: new Date().toISOString(),
            blockedUserIds: [],
            createdAt: new Date().toISOString(),
          };
          this.state.users.push(user);
        }
        this.state.userRoles.push({
          id: `ur_at_${Date.now()}_${importedCount}`,
          userId: user.id,
          role: r.role,
          scopeType: 'cohort',
          scopeId: r.cohortId,
        });
        if (r.role === 'student' || r.role === 'alumni') {
          this.state.enrollments.push({
            id: `enr_at_${Date.now()}_${importedCount}`,
            userId: user.id,
            cohortId: r.cohortId,
            programId: 'prog_foundational',
            status: r.role === 'alumni' ? 'completed' : 'active',
            tuitionCredit: 1500,
            appliedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        importedCount++;
      });
      this.state.auditLog.unshift({
        id: `aud_${Date.now()}`,
        actorId,
        action: 'airtable:import',
        targetType: 'airtable_migration',
        targetId: `batch_${Date.now()}`,
        detail: `Imported ${importedCount} records from legacy Airtable CSV`,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return importedCount;
    },
  };

  public learn = {
    listModules: (cohortId: string): CourseModule[] => this.state.modules.filter((m) => m.cohortId === cohortId),
    listLessons: (cohortId: string): Lesson[] => this.state.lessons.filter((l) => l.cohortId === cohortId),
    getLesson: (lessonId: string): Lesson | undefined => this.state.lessons.find((l) => l.id === lessonId),
    isLessonCompleted: (userId: string, lessonId: string): boolean => {
      return this.state.lessonCompletions.some((c) => c.userId === userId && c.lessonId === lessonId);
    },
    listCompletions: (userId: string): LessonCompletion[] => {
      return this.state.lessonCompletions.filter((c) => c.userId === userId);
    },
    toggleLessonComplete: (userId: string, lessonId: string): boolean => {
      const idx = this.state.lessonCompletions.findIndex((c) => c.userId === userId && c.lessonId === lessonId);
      if (idx !== -1) {
        this.state.lessonCompletions.splice(idx, 1);
        this.persistAndNotify();
        return false;
      }
      this.state.lessonCompletions.push({
        userId,
        lessonId,
        completedAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return true;
    },
    listAssignments: (cohortId: string): Assignment[] => this.state.assignments.filter((a) => a.cohortId === cohortId),
    listSubmissions: (filters?: { assignmentId?: string; cohortId?: string; userId?: string }): Submission[] => {
      return this.state.submissions.filter((s) => {
        if (filters?.assignmentId && s.assignmentId !== filters.assignmentId) return false;
        if (filters?.cohortId && s.cohortId !== filters.cohortId) return false;
        if (filters?.userId && s.userId !== filters.userId) return false;
        return true;
      });
    },
    submitAssignment: (input: { assignmentId: string; cohortId: string; userId: string; submittedUrl?: string; fileName?: string; notes?: string }): Submission => {
      const existing = this.state.submissions.find((s) => s.assignmentId === input.assignmentId && s.userId === input.userId);
      if (existing) {
        existing.submittedUrl = input.submittedUrl;
        existing.fileName = input.fileName;
        existing.notes = input.notes;
        existing.status = 'submitted';
        existing.submittedAt = new Date().toISOString();
        this.persistAndNotify();
        return existing;
      }
      const newSub: Submission = {
        id: `sub_${Date.now()}`,
        ...input,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
      this.state.submissions.push(newSub);
      this.persistAndNotify();
      return newSub;
    },
    gradeSubmission: (actorId: string, submissionId: string, input: { rubricScores: Record<string, number>; feedback: string; status: 'graded' | 'needs_revision' }): Submission => {
      const sub = this.state.submissions.find((s) => s.id === submissionId);
      if (!sub) throw new Error('Submission not found');
      const totalScore = Object.values(input.rubricScores).reduce((a, b) => a + b, 0);
      sub.rubricScores = input.rubricScores;
      sub.totalScore = totalScore;
      sub.maxScore = 100;
      sub.feedback = input.feedback;
      sub.status = input.status;
      sub.gradedBy = actorId;
      sub.gradedAt = new Date().toISOString();
      // Notify student
      this.state.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: sub.userId,
        category: 'grade',
        title: `Assignment Graded (${totalScore}/100)`,
        body: input.feedback.substring(0, 100) + '...',
        href: '/learn',
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return sub;
    },
    listAttendance: (filters?: { cohortId?: string; userId?: string }): AttendanceRecord[] => {
      return this.state.attendance.filter((a) => {
        if (filters?.cohortId && a.cohortId !== filters.cohortId) return false;
        if (filters?.userId && a.userId !== filters.userId) return false;
        return true;
      });
    },
    recordAttendance: (actorId: string, input: { cohortId: string; userId: string; sessionDate: string; sessionLabel: string; sessionType: AttendanceRecord['sessionType']; status: AttendanceRecord['status'] }): AttendanceRecord => {
      const existing = this.state.attendance.find((a) => a.cohortId === input.cohortId && a.userId === input.userId && a.sessionDate === input.sessionDate);
      if (existing) {
        existing.status = input.status;
        existing.recordedBy = actorId;
        this.persistAndNotify();
        return existing;
      }
      const record: AttendanceRecord = {
        id: `att_${Date.now()}`,
        ...input,
        recordedBy: actorId,
      };
      this.state.attendance.push(record);
      this.persistAndNotify();
      return record;
    },
    listCertifications: (userId?: string): CertificationRecord[] => {
      return userId ? this.state.certifications.filter((c) => c.userId === userId) : this.state.certifications;
    },
    upsertCertification: (userId: string, input: Omit<CertificationRecord, 'id' | 'userId'> & { id?: string }): CertificationRecord => {
      if (input.id) {
        const cert = this.state.certifications.find((c) => c.id === input.id);
        if (cert) {
          Object.assign(cert, input);
          this.persistAndNotify();
          return cert;
        }
      }
      const newCert: CertificationRecord = {
        ...input,
        id: `cert_${Date.now()}`,
        userId,
      };
      this.state.certifications.push(newCert);
      this.persistAndNotify();
      return newCert;
    },
    listResources: (filters?: { category?: ResourceLibraryItem['category']; search?: string }): ResourceLibraryItem[] => {
      return this.state.resources.filter((r) => {
        if (filters?.category && r.category !== filters.category) return false;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          return (
            r.title.toLowerCase().includes(q) ||
            r.summary.toLowerCase().includes(q) ||
            r.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      });
    },
  };

  public announcements = {
    list: (): Announcement[] => this.state.announcements,
    resolveRecipients: (filter: Announcement['audienceFilter']): User[] => {
      return this.state.users.filter((u) => {
        const roles = this.state.userRoles.filter((r) => r.userId === u.id);
        if (filter.roles && filter.roles.length > 0) {
          const hasMatchingRole = roles.some((r) => filter.roles?.includes(r.role));
          if (!hasMatchingRole) return false;
        }
        if (filter.cohortIds && filter.cohortIds.length > 0) {
          const enrolledCohorts = this.state.enrollments.filter((e) => e.userId === u.id).map((e) => e.cohortId);
          const hasMatchingCohort = filter.cohortIds.some((cid) => enrolledCohorts.includes(cid));
          if (!hasMatchingCohort) return false;
        }
        if (filter.cities && filter.cities.length > 0) {
          if (!filter.cities.includes(u.city)) return false;
        }
        return true;
      });
    },
    create: (input: CreateAnnouncementInput): Announcement => {
      const newAnc: Announcement = {
        id: `anc_${Date.now()}`,
        authorId: input.authorId,
        title: input.title,
        body: input.body,
        titleEs: input.titleEs,
        bodyEs: input.bodyEs,
        priority: input.priority,
        audienceFilter: input.audienceFilter,
        requiresAck: input.requiresAck,
        commentsEnabled: input.commentsEnabled,
        pinned: input.pinned,
        attachments: input.attachments ?? [],
        status: input.scheduledFor ? 'scheduled' : 'sent',
        scheduledFor: input.scheduledFor,
        sentAt: input.scheduledFor ? undefined : new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.state.announcements.unshift(newAnc);
      const recipients = this.announcements.resolveRecipients(input.audienceFilter);
      recipients.forEach((recip) => {
        this.state.announcementReceipts.push({
          id: `rec_${Date.now()}_${recip.id}`,
          announcementId: newAnc.id,
          userId: recip.id,
          deliveredAt: new Date().toISOString(),
        });
        // In-app unified notification
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_${recip.id}`,
          userId: recip.id,
          category: 'announcement',
          title: `[${input.priority.toUpperCase()}] ${input.title}`,
          body: input.body.substring(0, 100) + '...',
          href: '/announcements',
          urgent: input.priority === 'urgent',
          createdAt: new Date().toISOString(),
        });
        // Simulated Dev Outbox delivery per priority rules
        if (input.priority === 'normal') {
          this.state.outbox.unshift({
            id: `obx_${Date.now()}_${recip.id}`,
            channel: 'digest',
            toName: recip.name,
            toAddress: recip.email,
            subject: `Tech-Moms Daily Digest: ${input.title}`,
            body: input.body,
            relatedModule: 'announcements',
            createdAt: new Date().toISOString(),
          });
        } else if (input.priority === 'important') {
          this.state.outbox.unshift({
            id: `obx_${Date.now()}_${recip.id}`,
            channel: 'email',
            toName: recip.name,
            toAddress: recip.email,
            subject: `Important Announcement: ${input.title}`,
            body: input.body,
            relatedModule: 'announcements',
            createdAt: new Date().toISOString(),
          });
        } else if (input.priority === 'urgent') {
          this.state.outbox.unshift({
            id: `obx_email_${Date.now()}_${recip.id}`,
            channel: 'email',
            toName: recip.name,
            toAddress: recip.email,
            subject: `[URGENT] ${input.title}`,
            body: input.body,
            relatedModule: 'announcements',
            createdAt: new Date().toISOString(),
          });
          this.state.outbox.unshift({
            id: `obx_sms_${Date.now()}_${recip.id}`,
            channel: 'sms',
            toName: recip.name,
            toAddress: '(801) 555-URGENT',
            subject: 'URGENT Alert',
            body: `${input.title}: ${input.body}`,
            relatedModule: 'announcements',
            createdAt: new Date().toISOString(),
          });
        }
      });
      this.persistAndNotify();
      return newAnc;
    },
    getReceipts: (announcementId: string): AnnouncementReceipt[] => {
      return this.state.announcementReceipts.filter((r) => r.announcementId === announcementId);
    },
    getUserReceipt: (announcementId: string, userId: string): AnnouncementReceipt | undefined => {
      return this.state.announcementReceipts.find((r) => r.announcementId === announcementId && r.userId === userId);
    },
    markRead: (announcementId: string, userId: string): void => {
      const rec = this.state.announcementReceipts.find((r) => r.announcementId === announcementId && r.userId === userId);
      if (rec && !rec.readAt) {
        rec.readAt = new Date().toISOString();
        this.persistAndNotify();
      }
    },
    acknowledge: (announcementId: string, userId: string): void => {
      let rec = this.state.announcementReceipts.find((r) => r.announcementId === announcementId && r.userId === userId);
      if (!rec) {
        rec = {
          id: `rec_${Date.now()}_${userId}`,
          announcementId,
          userId,
          deliveredAt: new Date().toISOString(),
        };
        this.state.announcementReceipts.push(rec);
      }
      rec.readAt = rec.readAt ?? new Date().toISOString();
      rec.acknowledgedAt = new Date().toISOString();
      this.persistAndNotify();
    },
    nudgeUnacknowledged: (actorId: string, announcementId: string): number => {
      const receipts = this.state.announcementReceipts.filter((r) => r.announcementId === announcementId && !r.acknowledgedAt);
      receipts.forEach((r) => {
        r.nudgedAt = new Date().toISOString();
        const user = this.state.users.find((u) => u.id === r.userId);
        this.state.outbox.unshift({
          id: `obx_nudge_${Date.now()}_${r.userId}`,
          channel: 'email',
          toName: user?.name ?? 'Student',
          toAddress: user?.email ?? 'student@example.com',
          subject: 'Reminder: Please acknowledge important announcement',
          body: 'You have an unacknowledged announcement waiting on Motherboard. Please review and click "I\'ve read this".',
          relatedModule: 'announcements',
          createdAt: new Date().toISOString(),
        });
      });
      this.persistAndNotify();
      return receipts.length;
    },
    listComments: (announcementId: string): AnnouncementComment[] => {
      return this.state.announcementComments.filter((c) => c.announcementId === announcementId);
    },
    addComment: (announcementId: string, authorId: string, body: string): AnnouncementComment => {
      const comment: AnnouncementComment = {
        id: `com_${Date.now()}`,
        announcementId,
        authorId,
        body,
        createdAt: new Date().toISOString(),
      };
      this.state.announcementComments.push(comment);
      this.persistAndNotify();
      return comment;
    },
    requestAnnouncement: (input: Omit<AnnouncementRequest, 'id' | 'status' | 'createdAt'>): AnnouncementRequest => {
      const req: AnnouncementRequest = {
        ...input,
        id: `anr_${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.state.announcementRequests.push(req);
      this.persistAndNotify();
      return req;
    },
    listRequests: (): AnnouncementRequest[] => this.state.announcementRequests,
    reviewRequest: (actorId: string, requestId: string, approve: boolean): AnnouncementRequest => {
      const req = this.state.announcementRequests.find((r) => r.id === requestId);
      if (!req) throw new Error('Announcement request not found');
      req.status = approve ? 'approved' : 'declined';
      req.reviewedBy = actorId;
      if (approve) {
        this.announcements.create({
          authorId: actorId,
          title: req.title,
          body: req.body,
          priority: 'normal',
          audienceFilter: { roles: ['student', 'alumni'] },
          requiresAck: false,
          commentsEnabled: true,
          pinned: false,
        });
      }
      this.persistAndNotify();
      return req;
    },
  };

  public messages = {
    listSpacesForUser: (userId: string): Space[] => {
      const enrolledCohorts = this.state.enrollments.filter((e) => e.userId === userId).map((e) => e.cohortId);
      const isStaffOrAdmin = this.state.userRoles.some((r) => r.userId === userId && (r.role === 'staff' || r.role === 'admin'));
      const isInstructorOrTa = this.state.userRoles.some((r) => r.userId === userId && (r.role === 'instructor' || r.role === 'ta'));
      return this.state.spaces.filter((s) => {
        if (s.type === 'staff') return isStaffOrAdmin;
        if (s.type === 'instructor_staff') return isInstructorOrTa || isStaffOrAdmin;
        if (s.type === 'dm' || s.type === 'group_dm') return s.participantIds?.includes(userId);
        if (s.cohortId) return enrolledCohorts.includes(s.cohortId) || isInstructorOrTa || isStaffOrAdmin;
        return true;
      });
    },
    getSpace: (spaceId: string): Space | undefined => this.state.spaces.find((s) => s.id === spaceId),
    createSubchannel: (actorId: string, cohortId: string, name: string, description?: string): Space => {
      const formattedName = name.startsWith('#') ? name : `#${name}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newSpace: Space = {
        id: `spc_sub_${Date.now()}`,
        name: formattedName,
        slug,
        description,
        type: 'subchannel',
        cohortId,
        readOnly: false,
        createdBy: actorId,
        createdAt: new Date().toISOString(),
      };
      this.state.spaces.push(newSpace);
      this.persistAndNotify();
      return newSpace;
    },
    openOrCreateDm: (senderId: string, recipientIds: string[], opts?: { projectContextId?: string; jobApplicationId?: string }): Space => {
      const allParticipants = Array.from(new Set([senderId, ...recipientIds])).sort();
      const isGroup = allParticipants.length > 2;
      const existing = this.state.spaces.find((s) => {
        if (isGroup && s.type !== 'group_dm') return false;
        if (!isGroup && s.type !== 'dm') return false;
        if (opts?.projectContextId && s.projectId !== opts.projectContextId) return false;
        const currentParts = (s.participantIds ?? []).slice().sort();
        return JSON.stringify(currentParts) === JSON.stringify(allParticipants);
      });
      if (existing) return existing;
      const otherNames = allParticipants
        .filter((id) => id !== senderId)
        .map((id) => this.state.users.find((u) => u.id === id)?.name ?? 'User')
        .join(', ');
      const newDmSpace: Space = {
        id: `spc_dm_${Date.now()}`,
        name: isGroup ? `Group: ${otherNames}` : otherNames,
        slug: `dm-${allParticipants.join('-')}`,
        type: isGroup ? 'group_dm' : 'dm',
        projectId: opts?.projectContextId,
        jobApplicationId: opts?.jobApplicationId,
        participantIds: allParticipants,
        readOnly: false,
        createdBy: senderId,
        createdAt: new Date().toISOString(),
      };
      this.state.spaces.push(newDmSpace);
      allParticipants.forEach((uid) => {
        this.state.spaceMembers.push({ spaceId: newDmSpace.id, userId: uid, notifyLevel: 'all' });
      });
      this.persistAndNotify();
      return newDmSpace;
    },
    listMessages: (spaceId: string): Message[] => {
      return this.state.messages.filter((m) => m.spaceId === spaceId && !m.deletedAt);
    },
    sendMessage: (input: { spaceId: string; authorId: string; body: string; parentId?: string; isQuestion?: boolean; codeSnippet?: Message['codeSnippet']; attachment?: Message['attachment']; projectContextId?: string }): Message => {
      const msg: Message = {
        id: `msg_${Date.now()}`,
        spaceId: input.spaceId,
        authorId: input.authorId,
        parentId: input.parentId,
        body: input.body,
        codeSnippet: input.codeSnippet,
        attachment: input.attachment,
        projectContextId: input.projectContextId,
        isQuestion: input.isQuestion ?? false,
        reactions: {},
        createdAt: new Date().toISOString(),
      };
      this.state.messages.push(msg);
      // Mark space as having activity
      const space = this.state.spaces.find((s) => s.id === input.spaceId);
      if (space?.projectId) {
        const prj = this.state.projects.find((p) => p.id === space.projectId);
        if (prj) prj.lastActivityAt = new Date().toISOString();
      }
      this.persistAndNotify();
      return msg;
    },
    editMessage: (messageId: string, authorId: string, body: string): void => {
      const msg = this.state.messages.find((m) => m.id === messageId);
      if (msg && msg.authorId === authorId) {
        msg.body = body;
        msg.editedAt = new Date().toISOString();
        this.persistAndNotify();
      }
    },
    deleteMessage: (messageId: string, actorId: string): void => {
      const msg = this.state.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.deletedAt = new Date().toISOString();
        this.persistAndNotify();
      }
    },
    toggleReaction: (messageId: string, userId: string, emoji: string): void => {
      const msg = this.state.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.reactions = msg.reactions ?? {};
        const currentList = msg.reactions[emoji] ?? [];
        if (currentList.includes(userId)) {
          msg.reactions[emoji] = currentList.filter((id) => id !== userId);
          if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        } else {
          msg.reactions[emoji] = [...currentList, userId];
        }
        this.persistAndNotify();
      }
    },
    markQuestionResolved: (messageId: string, actorId: string): void => {
      const msg = this.state.messages.find((m) => m.id === messageId);
      if (msg && msg.isQuestion) {
        msg.resolvedBy = actorId;
        msg.resolvedAt = new Date().toISOString();
        this.persistAndNotify();
      }
    },
    getSpaceMember: (spaceId: string, userId: string): SpaceMember | undefined => {
      return this.state.spaceMembers.find((sm) => sm.spaceId === spaceId && sm.userId === userId);
    },
    setSpaceNotifyLevel: (spaceId: string, userId: string, level: SpaceMember['notifyLevel']): void => {
      let sm = this.state.spaceMembers.find((m) => m.spaceId === spaceId && m.userId === userId);
      if (!sm) {
        sm = { spaceId, userId, notifyLevel: level };
        this.state.spaceMembers.push(sm);
      } else {
        sm.notifyLevel = level;
      }
      this.persistAndNotify();
    },
    simulateIncomingReply: (spaceId: string, currentUserId: string): Message | undefined => {
      const space = this.state.spaces.find((s) => s.id === spaceId);
      if (!space || space.readOnly) return undefined;
      const potentialAuthors = (space.participantIds ?? ['usr_kris', 'usr_dana', 'usr_rachel']).filter((id) => id !== currentUserId);
      const authorId = potentialAuthors[0] ?? 'usr_dana';
      const sampleReplies = [
        'Great question! That is a very common challenge when structuring responsive components.',
        'Thanks for reaching out! Let us review this together in office hours this Wednesday.',
        'Looking great! I left a few notes on GitHub to help you streamline the flex layout.',
        'Yes, that matches our recommended approach for the assignment. Keep going!',
      ];
      const reply = this.messages.sendMessage({
        spaceId,
        authorId,
        body: sampleReplies[Math.floor(Math.random() * sampleReplies.length)],
      });
      return reply;
    },
  };

  public help = {
    listTickets: (filters?: { requesterId?: string; queue?: HelpTicket['queue'] }): HelpTicket[] => {
      return this.state.helpTickets.filter((t) => {
        if (filters?.requesterId && t.requesterId !== filters.requesterId) return false;
        if (filters?.queue && t.queue !== filters.queue) return false;
        return true;
      });
    },
    getMessages: (ticketId: string): HelpTicketMessage[] => {
      return this.state.helpTicketMessages.filter((m) => m.ticketId === ticketId);
    },
    createTicket: (input: { requesterId: string; queue: HelpTicket['queue']; subject: string; body: string }): HelpTicket => {
      const ticket: HelpTicket = {
        id: `hkt_${Date.now()}`,
        requesterId: input.requesterId,
        queue: input.queue,
        subject: input.subject,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.helpTickets.unshift(ticket);
      this.state.helpTicketMessages.push({
        id: `hkm_${Date.now()}`,
        ticketId: ticket.id,
        authorId: input.requesterId,
        body: input.body,
        internalNote: false,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return ticket;
    },
    replyTicket: (input: { ticketId: string; authorId: string; body: string; internalNote?: boolean }): HelpTicketMessage => {
      const ticket = this.state.helpTickets.find((t) => t.id === input.ticketId);
      if (!ticket) throw new Error('Ticket not found');
      const msg: HelpTicketMessage = {
        id: `hkm_${Date.now()}`,
        ticketId: input.ticketId,
        authorId: input.authorId,
        body: input.body,
        internalNote: input.internalNote ?? false,
        createdAt: new Date().toISOString(),
      };
      this.state.helpTicketMessages.push(msg);
      ticket.updatedAt = new Date().toISOString();
      if (!input.internalNote && ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
      this.persistAndNotify();
      return msg;
    },
    updateTicket: (actorId: string, ticketId: string, patch: Partial<Pick<HelpTicket, 'assigneeId' | 'status' | 'queue'>>): HelpTicket => {
      const ticket = this.state.helpTickets.find((t) => t.id === ticketId);
      if (!ticket) throw new Error('Ticket not found');
      Object.assign(ticket, patch, { updatedAt: new Date().toISOString() });
      this.persistAndNotify();
      return ticket;
    },
  };

  public projects = {
    list: (): Project[] => this.state.projects,
    getById: (projectId: string): Project | undefined => this.state.projects.find((p) => p.id === projectId),
    create: (
      actorId: string,
      input: Omit<Project, 'id' | 'status' | 'featured' | 'lastActivityAt' | 'createdAt'> & { requiresApproval?: boolean }
    ): Project => {
      const project: Project = {
        ...input,
        id: `prj_${Date.now()}`,
        status: input.requiresApproval ? 'pending_approval' : 'recruiting',
        featured: false,
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.state.projects.unshift(project);
      this.state.projectMembers.push({
        id: `pm_${Date.now()}`,
        projectId: project.id,
        userId: actorId,
        roleTitle: 'Project Lead',
        memberType: 'owner',
        joinedAt: new Date().toISOString(),
      });
      // Auto-create matching project channel in Messages
      this.state.spaces.push({
        id: `spc_prj_${project.id}`,
        name: `#prj-${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)}`,
        slug: `prj-${project.id}`,
        description: `Project team channel for ${project.title}`,
        type: 'project',
        projectId: project.id,
        readOnly: false,
        createdBy: actorId,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return project;
    },
    approveProject: (actorId: string, projectId: string, approve: boolean): Project => {
      const prj = this.state.projects.find((p) => p.id === projectId);
      if (!prj) throw new Error('Project not found');
      prj.status = approve ? 'recruiting' : 'archived';
      prj.approvedBy = approve ? actorId : undefined;
      prj.lastActivityAt = new Date().toISOString();
      this.persistAndNotify();
      return prj;
    },
    updateStatus: (actorId: string, projectId: string, status: Project['status'], completion?: { summary: string; screenshots?: string[] }): Project => {
      const prj = this.state.projects.find((p) => p.id === projectId);
      if (!prj) throw new Error('Project not found');
      prj.status = status;
      prj.lastActivityAt = new Date().toISOString();
      if (status === 'completed' && completion) {
        prj.completionSummary = completion.summary;
        prj.screenshots = completion.screenshots;
      }
      this.persistAndNotify();
      return prj;
    },
    toggleFeatured: (actorId: string, projectId: string): Project => {
      const prj = this.state.projects.find((p) => p.id === projectId);
      if (!prj) throw new Error('Project not found');
      prj.featured = !prj.featured;
      this.persistAndNotify();
      return prj;
    },
    listMembers: (projectId?: string): ProjectMember[] => {
      return projectId ? this.state.projectMembers.filter((m) => m.projectId === projectId) : this.state.projectMembers;
    },
    joinOpenProject: (projectId: string, userId: string, roleTitle: string, asMentor?: boolean): ProjectMember => {
      const prj = this.state.projects.find((p) => p.id === projectId);
      if (!prj) throw new Error('Project not found');
      const member: ProjectMember = {
        id: `pm_${Date.now()}`,
        projectId,
        userId,
        roleTitle,
        memberType: asMentor ? 'mentor' : 'member',
        joinedAt: new Date().toISOString(),
      };
      this.state.projectMembers.push(member);
      // Update filled counts
      const targetRole = prj.openRoles.find((r) => r.title.toLowerCase() === roleTitle.toLowerCase());
      if (targetRole) targetRole.filled = Math.min(targetRole.count, targetRole.filled + 1);
      prj.lastActivityAt = new Date().toISOString();
      this.persistAndNotify();
      return member;
    },
    requestToJoin: (projectId: string, userId: string, desiredRole: string, note: string): ProjectJoinRequest => {
      const req: ProjectJoinRequest = {
        id: `pjr_${Date.now()}`,
        projectId,
        userId,
        desiredRole,
        note,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.state.projectJoinRequests.push(req);
      this.persistAndNotify();
      return req;
    },
    listJoinRequests: (projectId: string): ProjectJoinRequest[] => {
      return this.state.projectJoinRequests.filter((r) => r.projectId === projectId);
    },
    reviewJoinRequest: (actorId: string, requestId: string, approve: boolean, responseMessage?: string): ProjectJoinRequest => {
      const req = this.state.projectJoinRequests.find((r) => r.id === requestId);
      if (!req) throw new Error('Join request not found');
      req.status = approve ? 'approved' : 'declined';
      req.responseMessage = responseMessage;
      if (approve) {
        this.projects.joinOpenProject(req.projectId, req.userId, req.desiredRole);
      }
      this.persistAndNotify();
      return req;
    },
    confirmMemberRole: (projectId: string, userId: string, confirmedRole: string): ProjectMember => {
      const member = this.state.projectMembers.find((m) => m.projectId === projectId && m.userId === userId);
      if (!member) throw new Error('Member not found');
      member.confirmedRole = confirmedRole;
      this.persistAndNotify();
      return member;
    },
    endorseMember: (instructorId: string, projectId: string, memberUserId: string, note: string): ProjectMember => {
      const member = this.state.projectMembers.find((m) => m.projectId === projectId && m.userId === memberUserId);
      if (!member) throw new Error('Member not found');
      member.endorsedByInstructorId = instructorId;
      member.endorsementNote = note;
      this.persistAndNotify();
      return member;
    },
    listTasks: (projectId: string): ProjectTask[] => this.state.projectTasks.filter((t) => t.projectId === projectId),
    createTask: (projectId: string, input: { title: string; assigneeId?: string; dueDate?: string }): ProjectTask => {
      const task: ProjectTask = {
        id: `tsk_${Date.now()}`,
        projectId,
        title: input.title,
        assigneeId: input.assigneeId,
        status: 'todo',
        dueDate: input.dueDate,
        createdAt: new Date().toISOString(),
      };
      this.state.projectTasks.push(task);
      this.persistAndNotify();
      return task;
    },
    updateTaskStatus: (taskId: string, status: ProjectTask['status']): ProjectTask => {
      const task = this.state.projectTasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');
      task.status = status;
      this.persistAndNotify();
      return task;
    },
    listUpdates: (projectId: string): ProjectUpdate[] => this.state.projectUpdates.filter((u) => u.projectId === projectId),
    postUpdate: (projectId: string, authorId: string, body: string): ProjectUpdate => {
      const upd: ProjectUpdate = {
        id: `upd_${Date.now()}`,
        projectId,
        authorId,
        body,
        createdAt: new Date().toISOString(),
      };
      this.state.projectUpdates.unshift(upd);
      const prj = this.state.projects.find((p) => p.id === projectId);
      if (prj) prj.lastActivityAt = new Date().toISOString();
      this.persistAndNotify();
      return upd;
    },
    hasUnansweredPing: (projectId: string, senderId: string): boolean => {
      return this.state.projectInquiryPings.some((p) => p.projectId === projectId && p.senderId === senderId && !p.answered);
    },
    askProjectOwner: (projectId: string, senderId: string, questionBody: string): Space => {
      const prj = this.state.projects.find((p) => p.id === projectId);
      if (!prj) throw new Error('Project not found');
      // Create or open DM
      const dmSpace = this.messages.openOrCreateDm(senderId, [prj.ownerId], { projectContextId: projectId });
      this.messages.sendMessage({
        spaceId: dmSpace.id,
        authorId: senderId,
        body: `[Regarding Project: ${prj.title}]\n\n${questionBody}`,
        projectContextId: projectId,
      });
      // Record rate limit ping
      this.state.projectInquiryPings.push({
        id: `png_${Date.now()}`,
        projectId,
        senderId,
        ownerId: prj.ownerId,
        spaceId: dmSpace.id,
        answered: false,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return dmSpace;
    },
    listPings: (projectId?: string): ProjectInquiryPing[] => {
      return projectId ? this.state.projectInquiryPings.filter((p) => p.projectId === projectId) : this.state.projectInquiryPings;
    },
  };

  public careers = {
    listJobs: (): Job[] => this.state.jobs,
    getJob: (jobId: string): Job | undefined => this.state.jobs.find((j) => j.id === jobId),
    createJob: (actorId: string, input: Omit<Job, 'id' | 'createdAt'>): Job => {
      const job: Job = {
        ...input,
        id: `job_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.state.jobs.unshift(job);
      this.persistAndNotify();
      return job;
    },
    listApplications: (filters?: { jobId?: string; userId?: string; orgId?: string }): JobApplication[] => {
      return this.state.jobApplications.filter((app) => {
        if (filters?.jobId && app.jobId !== filters.jobId) return false;
        if (filters?.userId && app.userId !== filters.userId) return false;
        if (filters?.orgId) {
          const job = this.state.jobs.find((j) => j.id === app.jobId);
          if (job?.orgId !== filters.orgId) return false;
        }
        return true;
      });
    },
    applyToJob: (input: { jobId: string; userId: string; coverNote?: string; resumeFileName: string }): JobApplication => {
      const app: JobApplication = {
        id: `app_${Date.now()}`,
        jobId: input.jobId,
        userId: input.userId,
        stage: 'applied',
        coverNote: input.coverNote,
        resumeFileName: input.resumeFileName,
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.jobApplications.push(app);
      this.persistAndNotify();
      return app;
    },
    updateApplicationStage: (actorId: string, applicationId: string, stage: JobApplication['stage'], notes?: string, hiredPayIncreasePct?: number): JobApplication => {
      const app = this.state.jobApplications.find((a) => a.id === applicationId);
      if (!app) throw new Error('Application not found');
      app.stage = stage;
      if (notes) app.coordinatorNotes = notes;
      if (hiredPayIncreasePct) app.hiredPayIncreasePct = hiredPayIncreasePct;
      app.updatedAt = new Date().toISOString();
      this.persistAndNotify();
      return app;
    },
    getTalentProfile: (userId: string): TalentProfile => {
      return (
        this.state.talentProfiles.find((t) => t.userId === userId) ?? {
          userId,
          optedInDirectory: false,
          headline: 'Tech-Moms Graduate',
          summary: '',
          careerPaths: ['Web Dev'],
          skills: ['HTML5', 'CSS3', 'JavaScript'],
          resumeFileName: 'Resume_Draft.pdf',
          availability: 'immediately',
          preferredLocationMode: 'any',
          schoolHoursPreferred: true,
          visibleFields: { summary: true, certifications: true, projects: true, portfolio: true, availability: true, city: true, email: true },
          updatedAt: '2027-02-14T12:00:00Z',
        }
      );
    },
    listOptedInTalentProfiles: (): TalentProfile[] => {
      return this.state.talentProfiles.filter((t) => t.optedInDirectory);
    },
    updateTalentProfile: (userId: string, patch: Partial<TalentProfile>): TalentProfile => {
      const idx = this.state.talentProfiles.findIndex((t) => t.userId === userId);
      if (idx !== -1) {
        this.state.talentProfiles[idx] = { ...this.state.talentProfiles[idx], ...patch, updatedAt: new Date().toISOString() };
        this.persistAndNotify();
        return this.state.talentProfiles[idx];
      }
      const newProf: TalentProfile = {
        userId,
        optedInDirectory: false,
        headline: 'Tech-Moms Graduate',
        summary: '',
        careerPaths: ['Web Dev'],
        skills: ['HTML5', 'CSS3', 'JavaScript'],
        resumeFileName: 'Resume_Draft.pdf',
        availability: 'immediately',
        preferredLocationMode: 'any',
        schoolHoursPreferred: true,
        visibleFields: { summary: true, certifications: true, projects: true, portfolio: true, availability: true, city: true, email: true },
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.state.talentProfiles.push(newProf);
      this.persistAndNotify();
      return newProf;
    },
    listResumeReviews: (userId?: string): ResumeReviewRequest[] => {
      return userId ? this.state.resumeReviews.filter((r) => r.userId === userId) : this.state.resumeReviews;
    },
    requestResumeReview: (input: { userId: string; resumeFileName: string; targetRole: string; notes?: string }): ResumeReviewRequest => {
      const req: ResumeReviewRequest = {
        id: `rev_${Date.now()}`,
        userId: input.userId,
        resumeFileName: input.resumeFileName,
        targetRole: input.targetRole,
        notes: input.notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.state.resumeReviews.push(req);
      this.persistAndNotify();
      return req;
    },
    completeResumeReview: (reviewerId: string, reviewId: string, feedback: string): ResumeReviewRequest => {
      const req = this.state.resumeReviews.find((r) => r.id === reviewId);
      if (!req) throw new Error('Resume review request not found');
      req.reviewerId = reviewerId;
      req.feedback = feedback;
      req.status = 'completed';
      this.persistAndNotify();
      return req;
    },
    listMockInterviews: (): MockInterviewBooking[] => this.state.mockInterviews,
    bookMockInterview: (slotId: string, userId: string): MockInterviewBooking => {
      const slot = this.state.mockInterviews.find((s) => s.id === slotId);
      if (!slot) throw new Error('Slot not found');
      slot.bookedByUserId = userId;
      this.persistAndNotify();
      return slot;
    },
  };

  public funding = {
    getPersonalApplication: (userId: string): PersonalFundingApplication | undefined => {
      return this.state.fundingApplications.find((a) => a.userId === userId);
    },
    listAllPersonalApplications: (actorId: string): PersonalFundingApplication[] => {
      return this.state.fundingApplications;
    },
    submitPersonalApplication: (userId: string, input: Omit<PersonalFundingApplication, 'id' | 'userId' | 'techMomsScholarshipAwarded' | 'sponsorSeatAwarded' | 'status' | 'submittedAt'>): PersonalFundingApplication => {
      const existing = this.state.fundingApplications.find((a) => a.userId === userId);
      if (existing) {
        Object.assign(existing, input, { status: 'submitted', submittedAt: new Date().toISOString() });
        this.persistAndNotify();
        return existing;
      }
      const newApp: PersonalFundingApplication = {
        ...input,
        id: `fap_${Date.now()}`,
        userId,
        techMomsScholarshipAwarded: 0,
        sponsorSeatAwarded: 0,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
      this.state.fundingApplications.push(newApp);
      this.persistAndNotify();
      return newApp;
    },
    awardTechMomsAid: (actorId: string, appId: string, scholarshipAmount: number, sponsorSeatAmount: number, sponsorOrgId?: string): PersonalFundingApplication => {
      const app = this.state.fundingApplications.find((a) => a.id === appId);
      if (!app) throw new Error('Funding application not found');
      app.techMomsScholarshipAwarded = scholarshipAmount;
      app.sponsorSeatAwarded = sponsorSeatAmount;
      app.sponsorOrgId = sponsorOrgId;
      app.status = 'awarded';
      app.reviewedBy = actorId;
      // Record ledger entry
      this.state.fundLedger.push({
        id: `led_${Date.now()}`,
        enrollmentId: app.cohortId,
        fromAccount: 'Tech-Moms General Scholarship Fund',
        toAccount: `Student Enrollment Credit (${app.userId})`,
        amount: scholarshipAmount + sponsorSeatAmount,
        entryType: 'scholarship_topup',
        note: `Awarded $${scholarshipAmount} scholarship and $${sponsorSeatAmount} sponsor seat`,
        actorId,
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return app;
    },
    getDwsRecord: (userId: string): DwsStateAidRecord => {
      return (
        this.state.dwsAidRecords.find((r) => r.userId === userId) ?? {
          userId,
          utahResident: true,
          dislocatedOrUnderemployed: true,
          preScreenerResult: 'not_checked',
          checklist: { utahIdReady: false, incomeVerificationReady: false, acceptanceLetterSaved: false, counselorAppointmentBooked: false },
          status: 'not_started',
          estimatedSupport: 0,
        }
      );
    },
    updateDwsRecord: (userId: string, patch: Partial<DwsStateAidRecord>): DwsStateAidRecord => {
      const idx = this.state.dwsAidRecords.findIndex((r) => r.userId === userId);
      if (idx !== -1) {
        this.state.dwsAidRecords[idx] = { ...this.state.dwsAidRecords[idx], ...patch };
        this.persistAndNotify();
        return this.state.dwsAidRecords[idx];
      }
      const newRec: DwsStateAidRecord = {
        userId,
        utahResident: true,
        dislocatedOrUnderemployed: true,
        preScreenerResult: 'not_checked',
        checklist: { utahIdReady: false, incomeVerificationReady: false, acceptanceLetterSaved: false, counselorAppointmentBooked: false },
        status: 'not_started',
        estimatedSupport: 0,
        ...patch,
      };
      this.state.dwsAidRecords.push(newRec);
      this.persistAndNotify();
      return newRec;
    },
    listFunds: (): Fund[] => this.state.funds,
    listCampaigns: (type?: Campaign['type']): Campaign[] => {
      return type ? this.state.campaigns.filter((c) => c.type === type) : this.state.campaigns;
    },
    getCampaign: (id: string): Campaign | undefined => this.state.campaigns.find((c) => c.id === id),
    createStudentCampaign: (userId: string, input: {
      enrollmentId?: string;
      programId: string;
      cohortId?: string;
      location: Cohort['location'];
      title: string;
      story: string;
      displayMode: Campaign['displayMode'];
      showCity: boolean;
      lineItems: Campaign['lineItems'];
      deadline: string;
    }): Campaign => {
      const user = this.state.users.find((u) => u.id === userId);
      const fundingApp = this.state.fundingApplications.find((a) => a.userId === userId);
      const aidAlreadyAwarded = (fundingApp?.techMomsScholarshipAwarded ?? 0) + (fundingApp?.sponsorSeatAwarded ?? 0);
      const totalCost = input.lineItems.reduce((acc, item) => acc + item.amount, 0);
      const goal = Math.max(0, totalCost - aidAlreadyAwarded);
      let displayName = user?.name ?? 'Student';
      if (input.displayMode === 'first_only') displayName = user?.name.split(' ')[0] ?? 'Student';
      if (input.displayMode === 'first_last_initial') {
        const parts = (user?.name ?? 'Student').split(' ');
        displayName = parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '');
      }
      const campaign: Campaign = {
        id: `cmp_${Date.now()}`,
        type: 'student',
        ownerId: userId,
        enrollmentId: input.enrollmentId,
        programId: input.programId,
        cohortId: input.cohortId,
        location: input.location,
        title: input.title,
        story: input.story,
        displayMode: input.displayMode,
        displayName,
        showCity: input.showCity,
        city: input.showCity ? user?.city : undefined,
        photoInitials: user?.avatarInitials ?? 'TM',
        lineItems: input.lineItems,
        aidAlreadyAwarded,
        goal,
        raised: 0,
        surplusToGeneralFund: 0,
        donorCount: 0,
        deadline: input.deadline,
        needTypes: Array.from(new Set(input.lineItems.map((li) => li.category))),
        status: 'in_review',
        createdAt: new Date().toISOString(),
      };
      this.state.campaigns.unshift(campaign);
      this.persistAndNotify();
      return campaign;
    },
    createTechMomsCampaign: (actorId: string, input: {
      programId: string;
      cohortId?: string;
      location: Cohort['location'];
      title: string;
      story: string;
      goal: number;
      needTypes: Campaign['needTypes'];
      deadline: string;
    }): Campaign => {
      const campaign: Campaign = {
        id: `cmp_${Date.now()}`,
        type: 'techmoms',
        ownerId: actorId,
        programId: input.programId,
        cohortId: input.cohortId,
        location: input.location,
        title: input.title,
        story: input.story,
        displayMode: 'full_name',
        displayName: 'Tech-Moms Foundation',
        showCity: true,
        city: input.location === 'Online' ? 'Statewide' : input.location,
        photoInitials: 'TM',
        lineItems: [{ id: `li_${Date.now()}`, category: input.needTypes[0] ?? 'tuition', label: input.title, amount: input.goal }],
        aidAlreadyAwarded: 0,
        goal: input.goal,
        raised: 0,
        surplusToGeneralFund: 0,
        donorCount: 0,
        deadline: input.deadline,
        needTypes: input.needTypes,
        status: 'live',
        approvedBy: actorId,
        createdAt: new Date().toISOString(),
      };
      this.state.campaigns.unshift(campaign);
      this.persistAndNotify();
      return campaign;
    },
    reviewCampaign: (actorId: string, campaignId: string, decision: 'live' | 'changes_requested' | 'declined', feedback?: string): Campaign => {
      const cmp = this.state.campaigns.find((c) => c.id === campaignId);
      if (!cmp) throw new Error('Campaign not found');
      cmp.status = decision;
      cmp.reviewFeedback = feedback;
      if (decision === 'live') cmp.approvedBy = actorId;
      this.persistAndNotify();
      return cmp;
    },
    listCampaignUpdates: (campaignId: string): CampaignUpdate[] => this.state.campaignUpdates.filter((u) => u.campaignId === campaignId),
    postCampaignUpdate: (campaignId: string, authorId: string, title: string, body: string): CampaignUpdate => {
      const upd: CampaignUpdate = {
        id: `cpu_${Date.now()}`,
        campaignId,
        authorId,
        title,
        body,
        createdAt: new Date().toISOString(),
      };
      this.state.campaignUpdates.unshift(upd);
      this.persistAndNotify();
      return upd;
    },
    sendThankYouNote: (campaignId: string, studentId: string, donationId: string, message: string): CampaignThankYou => {
      const ty: CampaignThankYou = {
        id: `cty_${Date.now()}`,
        campaignId,
        studentId,
        donationId,
        message,
        createdAt: new Date().toISOString(),
      };
      this.state.campaignThankYous.push(ty);
      // Route note into outbox without exposing donor email directly to student
      const donation = this.state.donations.find((d) => d.id === donationId);
      const donor = this.state.donors.find((d) => d.id === donation?.donorId);
      if (donor) {
        this.state.outbox.unshift({
          id: `obx_ty_${Date.now()}`,
          channel: 'email',
          toName: donor.name,
          toAddress: donor.email,
          subject: 'A thank-you note from the student you supported at Tech-Moms',
          body: `A personal thank you note from the student:\n\n"${message}"\n\nThank you for making Tech-Moms possible!`,
          relatedModule: 'funding',
          createdAt: new Date().toISOString(),
        });
      }
      this.persistAndNotify();
      return ty;
    },
    listThankYous: (campaignId: string): CampaignThankYou[] => this.state.campaignThankYous.filter((t) => t.campaignId === campaignId),
    createDonationOrPledge: (input: CreateDonationInput): { donation: Donation; receipt?: Receipt; pledge?: Pledge; donor: Donor } => {
      // Find or create donor
      let donor = this.state.donors.find((d) => d.email.toLowerCase() === input.email.toLowerCase());
      if (!donor) {
        donor = {
          id: `dnr_${Date.now()}`,
          type: input.donorType,
          userId: input.actorUserId,
          name: input.donorName,
          legalName: input.legalName,
          orgCategory: input.orgCategory,
          ein: input.ein,
          contactTitle: input.contactTitle,
          contactPhone: input.contactPhone,
          email: input.email,
          billingEmail: input.billingEmail,
          mailingAddress: input.mailingAddress,
          anonymousDefault: input.displayMode === 'anonymous',
          magicLinkToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
          createdAt: new Date().toISOString(),
        };
        this.state.donors.push(donor);
      }
      const feeCovered = input.coverFees ? Number((input.amount * 0.029 + 0.30).toFixed(2)) : 0;
      const totalCharged = input.amount + feeCovered;
      const benefitsValue = input.benefitsSelected.reduce((sum, b) => sum + b.fairMarketValue, 0);
      const deductibleAmount = Math.max(0, totalCharged - benefitsValue);
      const isInvoice = input.paymentMethod === 'invoice_net30';
      const donationId = `don_${Date.now()}`;
      const donation: Donation = {
        id: donationId,
        donorId: donor.id,
        donorType: input.donorType,
        fundId: input.fundId,
        campaignId: input.campaignId,
        designationLabel: input.designationLabel,
        restrictionLabel: input.restrictionLabel,
        sponsorshipTier: input.sponsorshipTier,
        sponsoredSeatsCount: input.sponsoredSeatsCount,
        sponsoredCohortId: input.sponsoredCohortId,
        amount: input.amount,
        processingFeeCovered: feeCovered,
        totalCharged,
        frequency: input.frequency,
        displayMode: input.displayMode,
        hideAmountPublicly: input.hideAmountPublicly,
        publicDisplayName: input.displayMode === 'anonymous' ? 'Anonymous Supporter' : input.displayMode === 'first_only' ? input.donorName.split(' ')[0] : input.donorName,
        encouragementMessage: input.encouragementMessage,
        messageModerationStatus: input.encouragementMessage ? 'pending' : 'none',
        inHonorOf: input.inHonorOf,
        matchingEmployerName: input.matchingEmployerName,
        matchingStatus: input.matchingEmployerName ? 'submitted' : 'none',
        benefitsSelected: input.benefitsSelected,
        goodsServicesValue: benefitsValue,
        deductibleAmount,
        paymentMethod: input.paymentMethod,
        paymentLast4: input.paymentLast4 ?? '4242',
        poNumber: input.poNumber,
        status: isInvoice ? 'pledged' : 'completed',
        createdAt: new Date().toISOString(),
      };
      this.state.donations.unshift(donation);
      let receipt: Receipt | undefined;
      let pledge: Pledge | undefined;
      if (isInvoice) {
        // Create net-30 pledge
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        pledge = {
          id: `plg_${Date.now()}`,
          donationId: donation.id,
          donorId: donor.id,
          orgName: input.legalName || input.donorName,
          contactEmail: input.email,
          billingEmail: input.billingEmail,
          amount: input.amount,
          sponsorshipTier: input.sponsorshipTier,
          benefitsSelected: input.benefitsSelected,
          poNumber: input.poNumber,
          invoiceNumber,
          dueDate,
          status: 'open',
          createdAt: new Date().toISOString(),
        };
        this.state.pledges.unshift(pledge);
        this.state.outbox.unshift({
          id: `obx_inv_${Date.now()}`,
          channel: 'email',
          toName: donor.name,
          toAddress: donor.billingEmail || donor.email,
          subject: `Tech-Moms Invoice & Pledge Confirmation: ${invoiceNumber}`,
          body: `Thank you for your generous pledge of $${input.amount}. Invoice ${invoiceNumber} (Net-30) is attached. PO Number: ${input.poNumber || 'N/A'}. A tax receipt will be issued once payment is marked received.`,
          relatedModule: 'funding',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Generate instant 501(c)(3) tax receipt
        const legal = this.state.legalSettings;
        const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const goodsServicesDescription = benefitsValue > 0
          ? `${input.benefitsSelected.map((b) => b.label).join('; ')} provided with good-faith fair market value of $${benefitsValue}.`
          : legal.noGoodsServicesText;
        receipt = {
          id: `rcp_${Date.now()}`,
          donationId: donation.id,
          donorId: donor.id,
          receiptNumber,
          issuedAt: new Date().toISOString(),
          donorLegalName: input.legalName || input.donorName,
          donorContactName: input.donorType === 'organization' ? input.donorName : undefined,
          donorEmail: input.email,
          donorAddress: input.mailingAddress,
          grossAmount: totalCharged,
          paymentMethodLabel: `${input.paymentMethod.replace('_', ' ').toUpperCase()} ending in ${input.paymentLast4 ?? '4242'}`,
          designationLabel: input.designationLabel,
          poOrInvoiceNumber: input.poNumber,
          goodsServicesDescription,
          goodsServicesValue: benefitsValue,
          deductibleAmount,
          discretionStatementSnapshot: legal.receiptDiscretionText,
          orgLegalNameSnapshot: legal.orgLegalName,
          orgEinSnapshot: legal.orgEin,
          orgAddressSnapshot: legal.orgAddress,
          taxExemptSnapshot: legal.taxExemptStatement,
          reissuedCount: 0,
        };
        this.state.receipts.unshift(receipt);
        // Record in ledger
        this.state.fundLedger.unshift({
          id: `led_${Date.now()}`,
          donationId: donation.id,
          campaignId: input.campaignId,
          fromAccount: `${input.paymentMethod.toUpperCase()} Settlement`,
          toAccount: input.campaignId ? `Campaign Escrow (${input.campaignId})` : `Fund: ${input.designationLabel}`,
          amount: input.amount,
          entryType: input.campaignId ? 'campaign_allocation' : 'donation_in',
          note: `Contribution receipted under ${receiptNumber}`,
          actorId: 'system',
          createdAt: new Date().toISOString(),
        });
        // Update campaign raised and handle surplus sweep if applicable
        if (input.campaignId) {
          const campaign = this.state.campaigns.find((c) => c.id === input.campaignId);
          if (campaign) {
            campaign.raised += input.amount;
            campaign.donorCount += 1;
            if (campaign.raised > campaign.goal && campaign.type === 'student') {
              const surplus = campaign.raised - campaign.goal;
              campaign.surplusToGeneralFund = surplus;
              this.state.fundLedger.unshift({
                id: `led_surp_${Date.now()}`,
                donationId: donation.id,
                campaignId: campaign.id,
                fromAccount: `Campaign Escrow (${campaign.id})`,
                toAccount: 'Tech-Moms General Scholarship Fund',
                amount: surplus,
                entryType: 'surplus_sweep',
                note: `Surplus above goal ($${surplus}) automatically transferred to General Fund`,
                actorId: 'system',
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
        // Send email with receipt
        this.state.outbox.unshift({
          id: `obx_rcp_${Date.now()}`,
          channel: 'email',
          toName: donor.name,
          toAddress: donor.email,
          subject: `Your 501(c)(3) Tax Receipt: ${receiptNumber} ($${totalCharged.toFixed(2)})`,
          body: `Dear ${donor.name},\n\nThank you for supporting Tech-Moms! Your contribution of $${totalCharged.toFixed(2)} is receipted as #${receiptNumber}. ${goodsServicesDescription}\n\nDownload your printable receipt PDF anytime in the Motherboard donor portal.`,
          relatedModule: 'funding',
          createdAt: new Date().toISOString(),
        });
      }
      this.persistAndNotify();
      return { donation, receipt, pledge, donor };
    },
    listDonors: (): Donor[] => this.state.donors,
    listDonations: (filters?: { campaignId?: string; donorId?: string; orgId?: string }): Donation[] => {
      return this.state.donations.filter((d) => {
        if (filters?.campaignId && d.campaignId !== filters.campaignId) return false;
        if (filters?.donorId && d.donorId !== filters.donorId) return false;
        return true;
      });
    },
    listPledges: (): Pledge[] => this.state.pledges,
    markPledgePaid: (actorId: string, pledgeId: string): { pledge: Pledge; receipt: Receipt } => {
      const pledge = this.state.pledges.find((p) => p.id === pledgeId);
      if (!pledge) throw new Error('Pledge not found');
      pledge.status = 'paid';
      pledge.paidAt = new Date().toISOString();
      const donation = this.state.donations.find((d) => d.id === pledge.donationId);
      if (donation) donation.status = 'completed';
      const legal = this.state.legalSettings;
      const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const goodsServicesDescription = pledge.benefitsSelected.length > 0
        ? `${pledge.benefitsSelected.map((b) => b.label).join('; ')} provided with good-faith FMV of $${pledge.benefitsSelected.reduce((s, b) => s + b.fairMarketValue, 0)}.`
        : legal.noGoodsServicesText;
      const benefitsValue = pledge.benefitsSelected.reduce((s, b) => s + b.fairMarketValue, 0);
      const receipt: Receipt = {
        id: `rcp_${Date.now()}`,
        donationId: pledge.donationId,
        donorId: pledge.donorId,
        receiptNumber,
        issuedAt: new Date().toISOString(),
        donorLegalName: pledge.orgName,
        donorEmail: pledge.contactEmail,
        grossAmount: pledge.amount,
        paymentMethodLabel: 'Invoice Payment Received (Check / Wire / ACH)',
        designationLabel: donation?.designationLabel ?? 'Corporate Sponsorship Pledge',
        poOrInvoiceNumber: pledge.poNumber || pledge.invoiceNumber,
        goodsServicesDescription,
        goodsServicesValue: benefitsValue,
        deductibleAmount: Math.max(0, pledge.amount - benefitsValue),
        discretionStatementSnapshot: legal.receiptDiscretionText,
        orgLegalNameSnapshot: legal.orgLegalName,
        orgEinSnapshot: legal.orgEin,
        orgAddressSnapshot: legal.orgAddress,
        taxExemptSnapshot: legal.taxExemptStatement,
        reissuedCount: 0,
      };
      this.state.receipts.unshift(receipt);
      this.state.fundLedger.unshift({
        id: `led_${Date.now()}`,
        donationId: pledge.donationId,
        fromAccount: 'Accounts Receivable (Pledges)',
        toAccount: 'Tech-Moms General Scholarship Fund',
        amount: pledge.amount,
        entryType: 'donation_in',
        note: `Invoice ${pledge.invoiceNumber} payment received & receipted under ${receiptNumber}`,
        actorId,
        createdAt: new Date().toISOString(),
      });
      this.state.outbox.unshift({
        id: `obx_rcp_${Date.now()}`,
        channel: 'email',
        toName: pledge.orgName,
        toAddress: pledge.contactEmail,
        subject: `Payment Received & Tax Receipt: ${receiptNumber}`,
        body: `We have received your payment for Invoice ${pledge.invoiceNumber}. Your official tax receipt ${receiptNumber} is now available.`,
        relatedModule: 'funding',
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return { pledge, receipt };
    },
    refundDonation: (actorId: string, donationId: string, reason: string): { donation: Donation; receipt?: Receipt } => {
      const donation = this.state.donations.find((d) => d.id === donationId);
      if (!donation) throw new Error('Donation not found');
      donation.status = 'refunded';
      const receipt = this.state.receipts.find((r) => r.donationId === donationId);
      if (receipt) {
        receipt.voidedAt = new Date().toISOString();
        receipt.voidReason = reason;
        receipt.deductibleAmount = 0;
      }
      this.state.fundLedger.unshift({
        id: `led_ref_${Date.now()}`,
        donationId,
        fromAccount: 'Tech-Moms General Scholarship Fund',
        toAccount: 'Refund Clearing',
        amount: donation.amount,
        entryType: 'refund_reversal',
        note: `Donation refunded. Reason: ${reason}. Receipt voided.`,
        actorId,
        createdAt: new Date().toISOString(),
      });
      this.state.outbox.unshift({
        id: `obx_ref_${Date.now()}`,
        channel: 'email',
        toName: donation.publicDisplayName,
        toAddress: 'donor@example.com',
        subject: `Notice: Tax Receipt ${receipt?.receiptNumber ?? ''} Voided due to Refund`,
        body: `Your contribution of $${donation.totalCharged.toFixed(2)} has been refunded. Prior receipt #${receipt?.receiptNumber ?? ''} is voided for tax purposes.`,
        relatedModule: 'funding',
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return { donation, receipt };
    },
    listReceipts: (donorId?: string): Receipt[] => {
      return donorId ? this.state.receipts.filter((r) => r.donorId === donorId) : this.state.receipts;
    },
    getReceipt: (receiptId: string): Receipt | undefined => {
      return this.state.receipts.find((r) => r.id === receiptId || r.receiptNumber === receiptId);
    },
    reissueReceipt: (receiptId: string, patch: { donorLegalName: string; donorAddress?: string }): Receipt => {
      const receipt = this.state.receipts.find((r) => r.id === receiptId);
      if (!receipt) throw new Error('Receipt not found');
      receipt.donorLegalName = patch.donorLegalName;
      if (patch.donorAddress) receipt.donorAddress = patch.donorAddress;
      receipt.reissuedCount += 1;
      this.persistAndNotify();
      return receipt;
    },
    resendReceiptToOutbox: (receiptId: string): void => {
      const receipt = this.state.receipts.find((r) => r.id === receiptId);
      if (receipt) {
        this.state.outbox.unshift({
          id: `obx_resend_${Date.now()}`,
          channel: 'email',
          toName: receipt.donorLegalName,
          toAddress: receipt.donorEmail,
          subject: `Copy of Tax Receipt: ${receipt.receiptNumber}`,
          body: `Here is a re-sent copy of your tax receipt #${receipt.receiptNumber} for $${receipt.grossAmount.toFixed(2)}.`,
          relatedModule: 'funding',
          createdAt: new Date().toISOString(),
        });
        this.persistAndNotify();
      }
    },
    moderateDonorMessage: (actorId: string, donationId: string, status: 'approved' | 'hidden'): Donation => {
      const don = this.state.donations.find((d) => d.id === donationId);
      if (!don) throw new Error('Donation not found');
      don.messageModerationStatus = status;
      this.persistAndNotify();
      return don;
    },
    listLedger: (): FundLedgerEntry[] => this.state.fundLedger,
    listGrants: (includeUnverified?: boolean): GrantListing[] => {
      return includeUnverified ? this.state.grantListings : this.state.grantListings.filter((g) => g.status === 'verified');
    },
    suggestGrant: (userId: string, input: Omit<GrantListing, 'id' | 'status'>): GrantListing => {
      const grant: GrantListing = {
        ...input,
        id: `grt_${Date.now()}`,
        status: 'pending_verification',
        suggestedByUserId: userId,
      };
      this.state.grantListings.push(grant);
      this.persistAndNotify();
      return grant;
    },
    verifyGrant: (actorId: string, grantId: string): GrantListing => {
      const grant = this.state.grantListings.find((g) => g.id === grantId);
      if (!grant) throw new Error('Grant not found');
      grant.status = 'verified';
      grant.verifiedBy = actorId;
      this.persistAndNotify();
      return grant;
    },
    listForumThreads: (): ForumThread[] => this.state.forumThreads,
    listForumPosts: (threadId: string): ForumPost[] => this.state.forumPosts.filter((p) => p.threadId === threadId && !p.hiddenBy),
    createForumThread: (authorId: string, category: ForumThread['category'], title: string, body: string): ForumThread => {
      const thread: ForumThread = {
        id: `thm_${Date.now()}`,
        authorId,
        category,
        title,
        body,
        createdAt: new Date().toISOString(),
      };
      this.state.forumThreads.unshift(thread);
      this.persistAndNotify();
      return thread;
    },
    replyForumThread: (authorId: string, threadId: string, body: string): ForumPost => {
      const post: ForumPost = {
        id: `fpo_${Date.now()}`,
        threadId,
        authorId,
        body,
        createdAt: new Date().toISOString(),
      };
      this.state.forumPosts.push(post);
      this.persistAndNotify();
      return post;
    },
    listVolunteerSignups: (orgId?: string): VolunteerSignup[] => {
      return orgId ? this.state.volunteerSignups.filter((v) => v.orgId === orgId) : this.state.volunteerSignups;
    },
    createVolunteerSignup: (input: Omit<VolunteerSignup, 'id' | 'status'>): VolunteerSignup => {
      const vs: VolunteerSignup = {
        ...input,
        id: `vsg_${Date.now()}`,
        status: 'confirmed',
      };
      this.state.volunteerSignups.push(vs);
      this.persistAndNotify();
      return vs;
    },
  };

  public events = {
    list: (): EventItem[] => this.state.events,
    getById: (eventId: string): EventItem | undefined => this.state.events.find((e) => e.id === eventId),
    listRsvps: (eventId?: string): EventRsvp[] => {
      return eventId ? this.state.eventRsvps.filter((r) => r.eventId === eventId) : this.state.eventRsvps;
    },
    toggleRsvp: (eventId: string, userId: string): EventRsvp => {
      const existing = this.state.eventRsvps.find((r) => r.eventId === eventId && r.userId === userId);
      if (existing) {
        existing.status = existing.status === 'going' ? 'cancelled' : 'going';
        this.persistAndNotify();
        return existing;
      }
      const rsvp: EventRsvp = {
        id: `rsvp_${Date.now()}`,
        eventId,
        userId,
        status: 'going',
        createdAt: new Date().toISOString(),
      };
      this.state.eventRsvps.push(rsvp);
      this.persistAndNotify();
      return rsvp;
    },
    checkInAttendee: (actorId: string, eventId: string, userId: string): EventRsvp => {
      let rsvp = this.state.eventRsvps.find((r) => r.eventId === eventId && r.userId === userId);
      if (!rsvp) {
        rsvp = {
          id: `rsvp_${Date.now()}`,
          eventId,
          userId,
          status: 'going',
          checkedInAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        this.state.eventRsvps.push(rsvp);
      } else {
        rsvp.checkedInAt = new Date().toISOString();
      }
      this.persistAndNotify();
      return rsvp;
    },
  };

  public notifications = {
    listForUser: (userId: string): NotificationItem[] => this.state.notifications.filter((n) => n.userId === userId),
    markRead: (notificationId: string): void => {
      const notif = this.state.notifications.find((n) => n.id === notificationId);
      if (notif) {
        notif.readAt = new Date().toISOString();
        this.persistAndNotify();
      }
    },
    markAllRead: (userId: string): void => {
      this.state.notifications.forEach((n) => {
        if (n.userId === userId) n.readAt = new Date().toISOString();
      });
      this.persistAndNotify();
    },
  };

  public outbox = {
    list: (): OutboxMessage[] => this.state.outbox,
  };

  public moderation = {
    list: (): ModerationItem[] => this.state.moderationQueue,
    report: (input: Omit<ModerationItem, 'id' | 'status' | 'createdAt'>): ModerationItem => {
      const item: ModerationItem = {
        ...input,
        id: `mod_${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.state.moderationQueue.unshift(item);
      this.persistAndNotify();
      return item;
    },
    resolve: (actorId: string, itemId: string, action: 'approved_kept' | 'hidden_removed'): ModerationItem => {
      const item = this.state.moderationQueue.find((i) => i.id === itemId);
      if (!item) throw new Error('Moderation item not found');
      item.status = action;
      item.reviewedBy = actorId;
      this.persistAndNotify();
      return item;
    },
  };

  public audit = {
    list: (): AuditLogEntry[] => this.state.auditLog,
  };

  public legal = {
    get: (): LegalSettings => this.state.legalSettings,
    update: (actorId: string, patch: Partial<LegalSettings>): LegalSettings => {
      this.state.legalSettings = {
        ...this.state.legalSettings,
        ...patch,
        updatedAt: new Date().toISOString(),
        updatedBy: actorId,
      };
      this.state.auditLog.unshift({
        id: `aud_${Date.now()}`,
        actorId,
        action: 'legal:update',
        targetType: 'legal_settings',
        targetId: 'main',
        detail: 'Updated legal text disclosures and receipt statements',
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
      return this.state.legalSettings;
    },
  };

  public roadmap = {
    listCareerPaths: (): CareerPath[] => this.state.careerPaths,
    getCareerPath: (idOrSlug: string): CareerPath | undefined => {
      return this.state.careerPaths.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    },
    listCatalog: (): CatalogItem[] => this.state.catalogItems,
    getCatalogItem: (id: string): CatalogItem | undefined => this.state.catalogItems.find((c) => c.id === id),
    upsertCatalogItem: (item: CatalogItem): CatalogItem => {
      const idx = this.state.catalogItems.findIndex((c) => c.id === item.id);
      if (idx !== -1) {
        this.state.catalogItems[idx] = item;
      } else {
        this.state.catalogItems.push(item);
      }
      this.persistAndNotify();
      return item;
    },
    getInterestProfile: (userId?: string): InterestProfile | undefined => {
      if (!userId) return undefined;
      return this.state.interestProfiles.find((p) => p.userId === userId);
    },
    saveInterestProfile: (profile: Omit<InterestProfile, 'id' | 'completedAt'> & { id?: string }): InterestProfile => {
      const existingIdx = profile.userId
        ? this.state.interestProfiles.findIndex((p) => p.userId === profile.userId)
        : profile.id
        ? this.state.interestProfiles.findIndex((p) => p.id === profile.id)
        : -1;

      const fullProfile: InterestProfile = {
        ...profile,
        id: profile.id ?? (existingIdx !== -1 ? this.state.interestProfiles[existingIdx].id : `prf_${Date.now()}`),
        completedAt: new Date().toISOString(),
      };

      if (existingIdx !== -1) {
        this.state.interestProfiles[existingIdx] = fullProfile;
      } else {
        this.state.interestProfiles.push(fullProfile);
      }
      this.persistAndNotify();
      return fullProfile;
    },
    listAllInterestProfiles: (): InterestProfile[] => this.state.interestProfiles,
    getRoadmap: (userId: string): Roadmap | undefined => {
      return this.state.roadmaps.find((r) => r.userId === userId && r.status === 'active');
    },
    getRoadmapSteps: (roadmapId: string): RoadmapStep[] => {
      return this.state.roadmapSteps
        .filter((s) => s.roadmapId === roadmapId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    },
    saveRoadmap: (
      roadmapInput: Omit<Roadmap, 'id' | 'createdAt' | 'updatedAt'>,
      stepsInput: Omit<RoadmapStep, 'id' | 'roadmapId'>[]
    ): { roadmap: Roadmap; steps: RoadmapStep[] } => {
      // Archive existing active roadmap
      this.state.roadmaps.forEach((r) => {
        if (r.userId === roadmapInput.userId && r.status === 'active') {
          r.status = 'archived';
        }
      });
      const roadmapId = `rdm_${Date.now()}`;
      const newRoadmap: Roadmap = {
        ...roadmapInput,
        id: roadmapId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.roadmaps.push(newRoadmap);

      // Create steps
      const newSteps: RoadmapStep[] = stepsInput.map((s, idx) => ({
        ...s,
        id: `stp_${Date.now()}_${idx}`,
        roadmapId,
      }));
      this.state.roadmapSteps.push(...newSteps);
      this.persistAndNotify();
      return { roadmap: newRoadmap, steps: newSteps };
    },
    updateRoadmapStep: (stepId: string, patch: Partial<Pick<RoadmapStep, 'status' | 'column' | 'orderIndex'>>): RoadmapStep => {
      const step = this.state.roadmapSteps.find((s) => s.id === stepId);
      if (!step) throw new Error('Roadmap step not found');
      Object.assign(step, patch);
      this.persistAndNotify();
      return step;
    },
    listAdvisorNotes: (roadmapId: string): AdvisorNote[] => {
      return this.state.advisorNotes.filter((n) => n.roadmapId === roadmapId);
    },
    addAdvisorNote: (input: Omit<AdvisorNote, 'id' | 'createdAt'>): AdvisorNote => {
      const note: AdvisorNote = {
        ...input,
        id: `adn_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.state.advisorNotes.unshift(note);
      this.persistAndNotify();
      return note;
    },
    listRecommendationEvents: (userId: string): RecommendationEvent[] => {
      return this.state.recommendationEvents.filter((e) => e.userId === userId);
    },
    triggerRecommendationUpdate: (userId: string, trigger: RecommendationEvent['trigger'], changeDescription: string): void => {
      this.state.recommendationEvents.unshift({
        id: `rce_${Date.now()}`,
        userId,
        trigger,
        changeDescription,
        createdAt: new Date().toISOString(),
      });
      // Send notification to user
      this.state.notifications.unshift({
        id: `notif_rdm_${Date.now()}`,
        userId,
        category: 'announcement',
        title: 'Roadmap Updated',
        body: changeDescription,
        href: '/roadmap',
        createdAt: new Date().toISOString(),
      });
      // Send to outbox
      const user = this.state.users.find((u) => u.id === userId);
      this.state.outbox.unshift({
        id: `obx_rdm_${Date.now()}`,
        channel: 'email',
        toName: user?.name ?? 'Student',
        toAddress: user?.email ?? 'student@example.com',
        subject: 'Tech-Moms: Your personalized roadmap updated',
        body: changeDescription,
        relatedModule: 'roadmap',
        createdAt: new Date().toISOString(),
      });
      this.persistAndNotify();
    },
  };

  public ai = {
    listSettings: (): AiSetting[] => this.state.aiSettings,
    updateSetting: (featureKey: string, enabled: boolean): AiSetting => {
      const setting = this.state.aiSettings.find((s) => s.featureKey === featureKey);
      if (setting) {
        setting.enabled = enabled;
        this.persistAndNotify();
        return setting;
      }
      const newSetting = { featureKey, enabled, description: '' };
      this.state.aiSettings.push(newSetting);
      this.persistAndNotify();
      return newSetting;
    },
    listUsageLogs: (): AiUsageLog[] => this.state.aiUsageLogs,
    logUsage: (featureName: string, userRole: string, tokenCount: number, latencyMs: number): AiUsageLog => {
      const log: AiUsageLog = {
        id: `log_${Date.now()}`,
        featureName,
        userRole,
        tokenCount,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
      this.state.aiUsageLogs.unshift(log);
      this.persistAndNotify();
      return log;
    },
    listFaqs: (): FaqEntry[] => this.state.faqEntries,
  };
}

let storeInstance: MockDataStore | null = null;

export function getMockStore(): DataRepository {
  if (!storeInstance) {
    storeInstance = new MockDataStore();
  }
  return storeInstance;
}
