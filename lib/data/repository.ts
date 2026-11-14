import {
  Announcement,
  AnnouncementComment,
  AnnouncementPriority,
  AnnouncementReceipt,
  AnnouncementRequest,
  AppDatabaseState,
  ApplicationStage,
  Assignment,
  AttendanceRecord,
  AudienceFilter,
  AuditLogEntry,
  Campaign,
  CampaignLineItem,
  CampaignThankYou,
  CampaignUpdate,
  CertificationRecord,
  Cohort,
  CohortLocation,
  CourseModule,
  DmAllowRule,
  DmPreference,
  Donation,
  Donor,
  DwsStateAidRecord,
  Enrollment,
  EnrollmentStatus,
  EventItem,
  EventRsvp,
  ForumPost,
  ForumThread,
  Fund,
  FundLedgerEntry,
  GrantListing,
  HelpQueue,
  HelpTicket,
  HelpTicketMessage,
  InterestWaitlistEntry,
  Job,
  JobApplication,
  LegalSettings,
  Lesson,
  LessonCompletion,
  Locale,
  Message,
  MockInterviewBooking,
  ModerationItem,
  NotificationItem,
  NotifyLevel,
  Organization,
  OutboxMessage,
  PersonalFundingApplication,
  Pledge,
  Program,
  Project,
  ProjectInquiryPing,
  ProjectJoinRequest,
  ProjectMember,
  ProjectStatus,
  ProjectTask,
  ProjectUpdate,
  Receipt,
  ResourceLibraryItem,
  ResumeReviewRequest,
  Role,
  ScopeType,
  Space,
  SpaceMember,
  SponsorshipBenefitOption,
  SponsorshipTierId,
  StaffSubrole,
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
} from './types';

export interface CreateAnnouncementInput {
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
  attachments?: Announcement['attachments'];
  scheduledFor?: string;
}

export interface CreateDonationInput {
  actorUserId?: string;
  donorType: 'individual' | 'organization';
  donorName: string;
  legalName?: string;
  orgCategory?: Organization['orgCategory'];
  ein?: string;
  contactTitle?: string;
  contactPhone?: string;
  email: string;
  billingEmail?: string;
  mailingAddress?: string;
  fundId: string;
  campaignId?: string;
  designationLabel: string;
  restrictionLabel?: string;
  sponsorshipTier?: SponsorshipTierId;
  sponsoredSeatsCount?: number;
  sponsoredCohortId?: string;
  amount: number;
  coverFees: boolean;
  frequency: 'one_time' | 'monthly' | 'yearly';
  displayMode: 'full_name' | 'first_only' | 'anonymous';
  hideAmountPublicly: boolean;
  encouragementMessage?: string;
  inHonorOf?: Donation['inHonorOf'];
  matchingEmployerName?: string;
  benefitsSelected: SponsorshipBenefitOption[];
  paymentMethod: Donation['paymentMethod'];
  paymentLast4?: string;
  poNumber?: string;
  engagementInterests?: ('volunteering' | 'hiring' | 'hosting_meetup')[];
}

export interface DataRepository {
  getStateSnapshot(): AppDatabaseState;
  subscribe(listener: () => void): () => void;
  resetDemoData(): void;

  users: {
    list(): User[];
    getById(id: string): User | undefined;
    listFeaturedPersonas(): User[];
    getRoles(userId: string): UserRole[];
    listAllRoles(): UserRole[];
    assignRole(actorId: string, input: { userId: string; role: Role; subroles?: StaffSubrole[]; scopeType: ScopeType; scopeId?: string }): UserRole;
    removeRole(actorId: string, roleRecordId: string): void;
    updateProfile(userId: string, patch: Partial<Pick<User, 'name' | 'locale' | 'city' | 'bio'>>): User;
    createAdultAccount(input: { name: string; email: string; city: string; locale: Locale; ageAttested: boolean }): User;
    toggleBlockUser(userId: string, targetUserId: string): void;
    getDmPreference(userId: string): DmPreference;
    updateDmPreference(userId: string, patch: Partial<DmPreference>): DmPreference;
  };

  orgs: {
    list(): Organization[];
    getById(id: string): Organization | undefined;
    create(input: Omit<Organization, 'id' | 'createdAt' | 'status'> & { status?: Organization['status'] }): Organization;
    updateStatus(actorId: string, orgId: string, status: Organization['status']): Organization;
  };

  programs: {
    list(): Program[];
    getById(id: string): Program | undefined;
  };

  cohorts: {
    list(programId?: string): Cohort[];
    getById(id: string): Cohort | undefined;
    create(actorId: string, input: Omit<Cohort, 'id'>): Cohort;
    listEnrollments(filters?: { userId?: string; cohortId?: string; status?: EnrollmentStatus }): Enrollment[];
    submitApplication(input: { userId: string; cohortId: string; programId: string; motivationNote: string; accompanyingChildrenCount?: number }): Enrollment;
    joinWaitlist(input: Omit<InterestWaitlistEntry, 'id' | 'createdAt'>): InterestWaitlistEntry;
    listWaitlist(): InterestWaitlistEntry[];
    scheduleInterview(actorId: string, enrollmentId: string, isoDate: string): Enrollment;
    updateEnrollmentStatus(actorId: string, enrollmentId: string, status: EnrollmentStatus): Enrollment;
    importAirtableRows(actorId: string, rows: { name: string; email: string; city: string; cohortId: string; role: Role }[]): number;
  };

  learn: {
    listModules(cohortId: string): CourseModule[];
    listLessons(cohortId: string): Lesson[];
    getLesson(lessonId: string): Lesson | undefined;
    isLessonCompleted(userId: string, lessonId: string): boolean;
    listCompletions(userId: string): LessonCompletion[];
    toggleLessonComplete(userId: string, lessonId: string): boolean;
    listAssignments(cohortId: string): Assignment[];
    listSubmissions(filters?: { assignmentId?: string; cohortId?: string; userId?: string }): Submission[];
    submitAssignment(input: { assignmentId: string; cohortId: string; userId: string; submittedUrl?: string; fileName?: string; notes?: string }): Submission;
    gradeSubmission(actorId: string, submissionId: string, input: { rubricScores: Record<string, number>; feedback: string; status: 'graded' | 'needs_revision' }): Submission;
    listAttendance(filters?: { cohortId?: string; userId?: string }): AttendanceRecord[];
    recordAttendance(actorId: string, input: { cohortId: string; userId: string; sessionDate: string; sessionLabel: string; sessionType: AttendanceRecord['sessionType']; status: AttendanceRecord['status'] }): AttendanceRecord;
    listCertifications(userId?: string): CertificationRecord[];
    upsertCertification(userId: string, input: Omit<CertificationRecord, 'id' | 'userId'> & { id?: string }): CertificationRecord;
    listResources(filters?: { category?: ResourceLibraryItem['category']; search?: string }): ResourceLibraryItem[];
  };

  announcements: {
    list(): Announcement[];
    resolveRecipients(filter: AudienceFilter): User[];
    create(input: CreateAnnouncementInput): Announcement;
    getReceipts(announcementId: string): AnnouncementReceipt[];
    getUserReceipt(announcementId: string, userId: string): AnnouncementReceipt | undefined;
    markRead(announcementId: string, userId: string): void;
    acknowledge(announcementId: string, userId: string): void;
    nudgeUnacknowledged(actorId: string, announcementId: string): number;
    listComments(announcementId: string): AnnouncementComment[];
    addComment(announcementId: string, authorId: string, body: string): AnnouncementComment;
    requestAnnouncement(input: Omit<AnnouncementRequest, 'id' | 'status' | 'createdAt'>): AnnouncementRequest;
    listRequests(): AnnouncementRequest[];
    reviewRequest(actorId: string, requestId: string, approve: boolean): AnnouncementRequest;
  };

  messages: {
    listSpacesForUser(userId: string): Space[];
    getSpace(spaceId: string): Space | undefined;
    createSubchannel(actorId: string, cohortId: string, name: string, description?: string): Space;
    openOrCreateDm(senderId: string, recipientIds: string[], opts?: { projectContextId?: string; jobApplicationId?: string }): Space;
    listMessages(spaceId: string): Message[];
    sendMessage(input: { spaceId: string; authorId: string; body: string; parentId?: string; isQuestion?: boolean; codeSnippet?: Message['codeSnippet']; attachment?: Message['attachment']; projectContextId?: string }): Message;
    editMessage(messageId: string, authorId: string, body: string): void;
    deleteMessage(messageId: string, actorId: string): void;
    toggleReaction(messageId: string, userId: string, emoji: string): void;
    markQuestionResolved(messageId: string, actorId: string): void;
    getSpaceMember(spaceId: string, userId: string): SpaceMember | undefined;
    setSpaceNotifyLevel(spaceId: string, userId: string, level: NotifyLevel): void;
    simulateIncomingReply(spaceId: string, currentUserId: string): Message | undefined;
  };

  help: {
    listTickets(filters?: { requesterId?: string; queue?: HelpQueue }): HelpTicket[];
    getMessages(ticketId: string): HelpTicketMessage[];
    createTicket(input: { requesterId: string; queue: HelpQueue; subject: string; body: string }): HelpTicket;
    replyTicket(input: { ticketId: string; authorId: string; body: string; internalNote?: boolean }): HelpTicketMessage;
    updateTicket(actorId: string, ticketId: string, patch: Partial<Pick<HelpTicket, 'assigneeId' | 'status' | 'queue'>>): HelpTicket;
  };

  projects: {
    list(): Project[];
    getById(projectId: string): Project | undefined;
    create(actorId: string, input: Omit<Project, 'id' | 'status' | 'featured' | 'lastActivityAt' | 'createdAt'> & { requiresApproval?: boolean }): Project;
    approveProject(actorId: string, projectId: string, approve: boolean): Project;
    updateStatus(actorId: string, projectId: string, status: ProjectStatus, completion?: { summary: string; screenshots?: string[] }): Project;
    toggleFeatured(actorId: string, projectId: string): Project;
    listMembers(projectId?: string): ProjectMember[];
    joinOpenProject(projectId: string, userId: string, roleTitle: string, asMentor?: boolean): ProjectMember;
    requestToJoin(projectId: string, userId: string, desiredRole: string, note: string): ProjectJoinRequest;
    listJoinRequests(projectId: string): ProjectJoinRequest[];
    reviewJoinRequest(actorId: string, requestId: string, approve: boolean, responseMessage?: string): ProjectJoinRequest;
    confirmMemberRole(projectId: string, userId: string, confirmedRole: string): ProjectMember;
    endorseMember(instructorId: string, projectId: string, memberUserId: string, note: string): ProjectMember;
    listTasks(projectId: string): ProjectTask[];
    createTask(projectId: string, input: { title: string; assigneeId?: string; dueDate?: string }): ProjectTask;
    updateTaskStatus(taskId: string, status: ProjectTask['status']): ProjectTask;
    listUpdates(projectId: string): ProjectUpdate[];
    postUpdate(projectId: string, authorId: string, body: string): ProjectUpdate;
    hasUnansweredPing(projectId: string, senderId: string): boolean;
    askProjectOwner(projectId: string, senderId: string, questionBody: string): Space;
    listPings(projectId?: string): ProjectInquiryPing[];
  };

  careers: {
    listJobs(): Job[];
    getJob(jobId: string): Job | undefined;
    createJob(actorId: string, input: Omit<Job, 'id' | 'createdAt'>): Job;
    listApplications(filters?: { jobId?: string; userId?: string; orgId?: string }): JobApplication[];
    applyToJob(input: { jobId: string; userId: string; coverNote?: string; resumeFileName: string }): JobApplication;
    updateApplicationStage(actorId: string, applicationId: string, stage: ApplicationStage, notes?: string, hiredPayIncreasePct?: number): JobApplication;
    getTalentProfile(userId: string): TalentProfile;
    listOptedInTalentProfiles(): TalentProfile[];
    updateTalentProfile(userId: string, patch: Partial<TalentProfile>): TalentProfile;
    listResumeReviews(userId?: string): ResumeReviewRequest[];
    requestResumeReview(input: { userId: string; resumeFileName: string; targetRole: string; notes?: string }): ResumeReviewRequest;
    completeResumeReview(reviewerId: string, reviewId: string, feedback: string): ResumeReviewRequest;
    listMockInterviews(): MockInterviewBooking[];
    bookMockInterview(slotId: string, userId: string): MockInterviewBooking;
  };

  funding: {
    getPersonalApplication(userId: string): PersonalFundingApplication | undefined;
    listAllPersonalApplications(actorId: string): PersonalFundingApplication[];
    submitPersonalApplication(userId: string, input: Omit<PersonalFundingApplication, 'id' | 'userId' | 'techMomsScholarshipAwarded' | 'sponsorSeatAwarded' | 'status' | 'submittedAt'>): PersonalFundingApplication;
    awardTechMomsAid(actorId: string, appId: string, scholarshipAmount: number, sponsorSeatAmount: number, sponsorOrgId?: string): PersonalFundingApplication;
    getDwsRecord(userId: string): DwsStateAidRecord;
    updateDwsRecord(userId: string, patch: Partial<DwsStateAidRecord>): DwsStateAidRecord;
    listFunds(): Fund[];
    listCampaigns(type?: Campaign['type']): Campaign[];
    getCampaign(id: string): Campaign | undefined;
    createStudentCampaign(userId: string, input: {
      enrollmentId?: string;
      programId: string;
      cohortId?: string;
      location: CohortLocation;
      title: string;
      story: string;
      displayMode: Campaign['displayMode'];
      showCity: boolean;
      lineItems: CampaignLineItem[];
      deadline: string;
    }): Campaign;
    createTechMomsCampaign(actorId: string, input: {
      programId: string;
      cohortId?: string;
      location: CohortLocation;
      title: string;
      story: string;
      goal: number;
      needTypes: Campaign['needTypes'];
      deadline: string;
    }): Campaign;
    reviewCampaign(actorId: string, campaignId: string, decision: 'live' | 'changes_requested' | 'declined', feedback?: string): Campaign;
    listCampaignUpdates(campaignId: string): CampaignUpdate[];
    postCampaignUpdate(campaignId: string, authorId: string, title: string, body: string): CampaignUpdate;
    sendThankYouNote(campaignId: string, studentId: string, donationId: string, message: string): CampaignThankYou;
    listThankYous(campaignId: string): CampaignThankYou[];
    createDonationOrPledge(input: CreateDonationInput): { donation: Donation; receipt?: Receipt; pledge?: Pledge; donor: Donor };
    listDonors(): Donor[];
    listDonations(filters?: { campaignId?: string; donorId?: string; orgId?: string }): Donation[];
    listPledges(): Pledge[];
    markPledgePaid(actorId: string, pledgeId: string): { pledge: Pledge; receipt: Receipt };
    refundDonation(actorId: string, donationId: string, reason: string): { donation: Donation; receipt?: Receipt };
    listReceipts(donorId?: string): Receipt[];
    getReceipt(receiptId: string): Receipt | undefined;
    reissueReceipt(receiptId: string, patch: { donorLegalName: string; donorAddress?: string }): Receipt;
    resendReceiptToOutbox(receiptId: string): void;
    moderateDonorMessage(actorId: string, donationId: string, status: 'approved' | 'hidden'): Donation;
    listLedger(): FundLedgerEntry[];
    listGrants(includeUnverified?: boolean): GrantListing[];
    suggestGrant(userId: string, input: Omit<GrantListing, 'id' | 'status'>): GrantListing;
    verifyGrant(actorId: string, grantId: string): GrantListing;
    listForumThreads(): ForumThread[];
    listForumPosts(threadId: string): ForumPost[];
    createForumThread(authorId: string, category: ForumThread['category'], title: string, body: string): ForumThread;
    replyForumThread(authorId: string, threadId: string, body: string): ForumPost;
    listVolunteerSignups(orgId?: string): VolunteerSignup[];
    createVolunteerSignup(input: Omit<VolunteerSignup, 'id' | 'status'>): VolunteerSignup;
  };

  events: {
    list(): EventItem[];
    getById(eventId: string): EventItem | undefined;
    listRsvps(eventId?: string): EventRsvp[];
    toggleRsvp(eventId: string, userId: string): EventRsvp;
    checkInAttendee(actorId: string, eventId: string, userId: string): EventRsvp;
  };

  notifications: {
    listForUser(userId: string): NotificationItem[];
    markRead(notificationId: string): void;
    markAllRead(userId: string): void;
  };

  outbox: {
    list(): OutboxMessage[];
  };

  moderation: {
    list(): ModerationItem[];
    report(input: Omit<ModerationItem, 'id' | 'status' | 'createdAt'>): ModerationItem;
    resolve(actorId: string, itemId: string, action: 'approved_kept' | 'hidden_removed'): ModerationItem;
  };

  audit: {
    list(): AuditLogEntry[];
  };

  legal: {
    get(): LegalSettings;
    update(actorId: string, patch: Partial<LegalSettings>): LegalSettings;
  };

  roadmap: {
    listCareerPaths(): CareerPath[];
    getCareerPath(idOrSlug: string): CareerPath | undefined;
    listCatalog(): CatalogItem[];
    getCatalogItem(id: string): CatalogItem | undefined;
    upsertCatalogItem(item: CatalogItem): CatalogItem;
    getInterestProfile(userId?: string): InterestProfile | undefined;
    saveInterestProfile(profile: Omit<InterestProfile, 'id' | 'completedAt'> & { id?: string }): InterestProfile;
    listAllInterestProfiles(): InterestProfile[];
    getRoadmap(userId: string): Roadmap | undefined;
    getRoadmapSteps(roadmapId: string): RoadmapStep[];
    saveRoadmap(roadmap: Omit<Roadmap, 'id' | 'createdAt' | 'updatedAt'>, steps: Omit<RoadmapStep, 'id' | 'roadmapId'>[]): { roadmap: Roadmap; steps: RoadmapStep[] };
    updateRoadmapStep(stepId: string, patch: Partial<Pick<RoadmapStep, 'status' | 'column' | 'orderIndex'>>): RoadmapStep;
    listAdvisorNotes(roadmapId: string): AdvisorNote[];
    addAdvisorNote(input: Omit<AdvisorNote, 'id' | 'createdAt'>): AdvisorNote;
    listRecommendationEvents(userId: string): RecommendationEvent[];
    triggerRecommendationUpdate(userId: string, trigger: RecommendationEvent['trigger'], changeDescription: string): void;
  };

  ai: {
    listSettings(): AiSetting[];
    updateSetting(featureKey: string, enabled: boolean): AiSetting;
    listUsageLogs(): AiUsageLog[];
    logUsage(featureName: string, userRole: string, tokenCount: number, latencyMs: number): AiUsageLog;
    listFaqs(): FaqEntry[];
  };
}
