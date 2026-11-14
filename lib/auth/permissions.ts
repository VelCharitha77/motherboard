import {
  AppDatabaseState,
  Cohort,
  PersonalFundingApplication,
  Project,
  Role,
  Space,
  StaffSubrole,
  TalentProfile,
  User,
  UserRole,
} from '@/lib/data/types';

export type PermissionAction =
  | 'nav:home'
  | 'nav:learn'
  | 'nav:messages'
  | 'nav:announcements'
  | 'nav:projects'
  | 'nav:careers'
  | 'nav:funding_my'
  | 'nav:give'
  | 'nav:events'
  | 'nav:profile'
  | 'nav:staff'
  | 'nav:employer'
  | 'nav:sponsor'
  | 'nav:help'
  | 'learn:manage_cohort'
  | 'learn:grade'
  | 'learn:take_attendance'
  | 'learn:submit_assignment'
  | 'announcement:post'
  | 'announcement:post_any_audience'
  | 'announcement:request'
  | 'message:dm_user'
  | 'message:mention_group'
  | 'message:moderate'
  | 'message:resolve_question'
  | 'help:create_ticket'
  | 'help:manage_tickets'
  | 'project:browse'
  | 'project:create'
  | 'project:join'
  | 'project:ask_owner'
  | 'project:endorse'
  | 'project:moderate'
  | 'careers:browse_full'
  | 'careers:apply'
  | 'careers:review_resumes'
  | 'careers:post_job'
  | 'careers:view_talent_directory'
  | 'careers:manage_placements'
  | 'funding:view_application'
  | 'funding:review_applications'
  | 'funding:create_student_campaign'
  | 'funding:manage_campaigns'
  | 'funding:view_grants_and_forum'
  | 'staff:manage_admissions'
  | 'staff:manage_roles'
  | 'staff:edit_legal'
  | 'sponsor:view_portal';

export interface PermissionContext {
  state: AppDatabaseState;
  targetUser?: User;
  cohort?: Cohort;
  cohortId?: string;
  programId?: string;
  orgId?: string;
  project?: Project;
  space?: Space;
  fundingApp?: PersonalFundingApplication;
}

export function getUserRoles(user: User | null | undefined, state: AppDatabaseState): UserRole[] {
  if (!user) return [];
  return state.userRoles.filter((r) => r.userId === user.id);
}

export function hasRole(user: User | null | undefined, state: AppDatabaseState, role: Role): boolean {
  return getUserRoles(user, state).some((r) => r.role === role);
}

export function hasAnyRole(user: User | null | undefined, state: AppDatabaseState, roles: Role[]): boolean {
  const userRoles = getUserRoles(user, state);
  return userRoles.some((r) => roles.includes(r.role));
}

export function hasStaffSubrole(
  user: User | null | undefined,
  state: AppDatabaseState,
  subrole: StaffSubrole
): boolean {
  if (!user) return false;
  const roles = getUserRoles(user, state);
  if (roles.some((r) => r.role === 'admin')) return true;
  return roles.some((r) => r.role === 'staff' && r.subroles?.includes(subrole));
}

export function getUserOrgIds(user: User | null | undefined, state: AppDatabaseState): string[] {
  if (!user) return [];
  return getUserRoles(user, state)
    .filter((r) => r.scopeType === 'org' && r.scopeId)
    .map((r) => r.scopeId as string);
}

export function getManagedCohortIds(user: User | null | undefined, state: AppDatabaseState): string[] {
  if (!user) return [];
  if (hasAnyRole(user, state, ['admin'])) {
    return state.cohorts.map((c) => c.id);
  }
  const roles = getUserRoles(user, state);
  const explicitIds = new Set<string>();
  for (const r of roles) {
    if (['instructor', 'ta', 'staff'].includes(r.role)) {
      if (r.scopeType === 'global') {
        return state.cohorts.map((c) => c.id);
      }
      if (r.scopeType === 'cohort' && r.scopeId) explicitIds.add(r.scopeId);
      if (r.scopeType === 'program' && r.scopeId) {
        state.cohorts
          .filter((c) => c.programId === r.scopeId)
          .forEach((c) => explicitIds.add(c.id));
      }
    }
  }
  state.cohorts.forEach((c) => {
    if (c.instructorIds.includes(user.id) || c.taIds.includes(user.id) || c.managerId === user.id) {
      explicitIds.add(c.id);
    }
  });
  return Array.from(explicitIds);
}

export function getEnrolledCohortIds(user: User | null | undefined, state: AppDatabaseState): string[] {
  if (!user) return [];
  return state.enrollments
    .filter((e) => e.userId === user.id && ['admitted', 'active', 'completed'].includes(e.status))
    .map((e) => e.cohortId);
}

/**
 * Single centralized authorization helper required across all UI and repository actions.
 */
export function can(
  user: User | null | undefined,
  action: PermissionAction,
  ctx: PermissionContext
): boolean {
  const { state } = ctx;

  // Public actions available even to logged-out Guest Donor
  if (action === 'nav:give') return true;

  if (!user) return false;

  const isAdmin = hasRole(user, state, 'admin');
  const isStaff = hasRole(user, state, 'staff') || isAdmin;
  const isStudent = hasRole(user, state, 'student');
  const isAlumni = hasRole(user, state, 'alumni');
  const isApplicant = hasRole(user, state, 'applicant');
  const isInstructorOrTa = hasAnyRole(user, state, ['instructor', 'ta']);
  const isMentor = hasRole(user, state, 'mentor');
  const isEmployer = hasRole(user, state, 'employer');
  const isSponsor = hasRole(user, state, 'sponsor');
  const isPartner = hasRole(user, state, 'partner_institution');

  switch (action) {
    case 'nav:home':
    case 'nav:events':
    case 'nav:profile':
      return true;

    case 'nav:learn':
      return isStudent || isAlumni || isInstructorOrTa || isStaff || isMentor || isApplicant;

    case 'nav:messages':
      return !isPartner && !isSponsor;

    case 'nav:announcements':
      return true;

    case 'nav:projects':
      return isStudent || isAlumni || isInstructorOrTa || isMentor || isStaff || isEmployer || isSponsor;

    case 'nav:careers':
      return isStudent || isAlumni || isMentor || isStaff || isEmployer;

    case 'nav:funding_my':
      return isApplicant || isStudent || isAlumni;

    case 'nav:help':
      return isApplicant || isStudent || isAlumni || isStaff;

    case 'nav:staff':
      return isStaff;

    case 'nav:employer':
      return isEmployer || hasStaffSubrole(user, state, 'placement_coordinator') || isAdmin;

    case 'nav:sponsor':
      return isSponsor || isStaff;

    case 'learn:manage_cohort':
    case 'learn:grade':
    case 'learn:take_attendance': {
      if (isAdmin) return true;
      const targetCohortId = ctx.cohort?.id ?? ctx.cohortId;
      if (!targetCohortId) return isInstructorOrTa || isStaff;
      return getManagedCohortIds(user, state).includes(targetCohortId);
    }

    case 'learn:submit_assignment': {
      const targetCohortId = ctx.cohort?.id ?? ctx.cohortId;
      if (!targetCohortId) return isStudent;
      return state.enrollments.some(
        (e) => e.userId === user.id && e.cohortId === targetCohortId && e.status === 'active'
      );
    }

    case 'announcement:post':
      return isAdmin || isStaff || isInstructorOrTa;

    case 'announcement:post_any_audience':
      return isAdmin;

    case 'announcement:request':
      return isEmployer || isSponsor;

    case 'message:mention_group':
      return isAdmin || isStaff || isInstructorOrTa;

    case 'message:moderate':
      return isStaff;

    case 'message:resolve_question': {
      if (isStaff) return true;
      const cohortId = ctx.space?.cohortId ?? ctx.cohortId;
      if (!cohortId) return isInstructorOrTa;
      return getManagedCohortIds(user, state).includes(cohortId);
    }

    case 'message:dm_user': {
      const target = ctx.targetUser;
      if (!target || target.id === user.id) return false;
      if (target.blockedUserIds.includes(user.id) || user.blockedUserIds.includes(target.id)) {
        return false;
      }
      if (isStaff) return true;

      const targetIsStaff = hasAnyRole(target, state, ['staff', 'admin']);
      if (targetIsStaff) {
        if (isEmployer) {
          return hasStaffSubrole(target, state, 'placement_coordinator') || hasRole(target, state, 'admin');
        }
        return true;
      }

      // Employers cannot cold-message students/alumni; ONLY applicants to their own org's jobs
      if (isEmployer && !isStudent && !isAlumni && !isInstructorOrTa && !isMentor) {
        const employerOrgIds = getUserOrgIds(user, state);
        const employerJobIds = state.jobs
          .filter((j) => employerOrgIds.includes(j.orgId))
          .map((j) => j.id);
        return state.jobApplications.some(
          (app) => employerJobIds.includes(app.jobId) && app.userId === target.id
        );
      }

      // Students cannot cold-DM employers unless they applied to that employer's job
      const targetIsEmployerOnly =
        hasRole(target, state, 'employer') &&
        !hasAnyRole(target, state, ['student', 'alumni', 'instructor', 'ta', 'mentor', 'staff', 'admin']);
      if (targetIsEmployerOnly) {
        const targetOrgIds = getUserOrgIds(target, state);
        const targetJobIds = state.jobs.filter((j) => targetOrgIds.includes(j.orgId)).map((j) => j.id);
        return state.jobApplications.some(
          (app) => targetJobIds.includes(app.jobId) && app.userId === user.id
        );
      }

      // Sponsors do not participate in student DMs
      if (isSponsor && !isAlumni && !isStudent && !isMentor) return false;

      // Respect target user's "Who can DM me" preference
      const targetPref = state.dmPreferences.find((p) => p.userId === target.id)?.allowFrom ?? 'cohort_and_instructors';
      if (targetPref === 'staff_only') {
        return false; // Staff already returned true above
      }

      const myCohorts = new Set([
        ...getEnrolledCohortIds(user, state),
        ...getManagedCohortIds(user, state),
      ]);
      const theirCohorts = new Set([
        ...getEnrolledCohortIds(target, state),
        ...getManagedCohortIds(target, state),
      ]);
      const sharesCohort = Array.from(myCohorts).some((cid) => theirCohorts.has(cid));

      if (targetPref === 'cohort_and_instructors') {
        if (sharesCohort) return true;
        // Instructors/TAs teaching target's cohort
        if (isInstructorOrTa && sharesCohort) return true;
        return false;
      }

      // allowFrom === 'everyone'
      return isStudent || isAlumni || isInstructorOrTa || isMentor || isApplicant;
    }

    case 'help:create_ticket':
      return isApplicant || isStudent || isAlumni;

    case 'help:manage_tickets':
      return isStaff;

    case 'project:browse':
      return isStudent || isAlumni || isInstructorOrTa || isMentor || isStaff || isEmployer || isSponsor;

    case 'project:create':
      return isStudent || isAlumni || isInstructorOrTa || isMentor || isEmployer || isSponsor || isStaff;

    case 'project:join': {
      if (isEmployer || isSponsor || isApplicant || isPartner) return false;
      return isStudent || isAlumni || isInstructorOrTa || isMentor || isStaff;
    }

    case 'project:ask_owner': {
      const project = ctx.project;
      if (!project || !project.allowQuestions) return false;
      if (project.ownerId === user.id) return false;
      if (isEmployer || isSponsor) return false;
      const owner = state.users.find((u) => u.id === project.ownerId);
      if (!owner) return false;
      const dmAllowed = can(user, 'message:dm_user', { state, targetUser: owner });
      if (!dmAllowed) return false;
      const alreadyUnanswered = state.projectInquiryPings.some(
        (p) => p.projectId === project.id && p.senderId === user.id && !p.answered
      );
      return !alreadyUnanswered;
    }

    case 'project:endorse':
      return isInstructorOrTa || isStaff;

    case 'project:moderate':
      return isStaff;

    case 'careers:browse_full':
      return isStudent || isAlumni || isMentor || isStaff || isEmployer;

    case 'careers:apply':
      return isStudent || isAlumni;

    case 'careers:review_resumes':
      return isMentor || hasStaffSubrole(user, state, 'pd_coordinator') || hasStaffSubrole(user, state, 'placement_coordinator') || isStaff;

    case 'careers:post_job':
    case 'careers:view_talent_directory': {
      if (isStaff) return true;
      if (!isEmployer) return false;
      const orgIds = getUserOrgIds(user, state);
      return state.organizations.some((o) => orgIds.includes(o.id) && o.status === 'approved');
    }

    case 'careers:manage_placements':
      return hasStaffSubrole(user, state, 'placement_coordinator') || isStaff;

    case 'funding:view_application': {
      const app = ctx.fundingApp;
      if (!app) return isApplicant || isStudent || isAlumni || hasStaffSubrole(user, state, 'funding_reviewer');
      if (app.userId === user.id) return true;
      return hasStaffSubrole(user, state, 'funding_reviewer') || isAdmin;
    }

    case 'funding:review_applications':
      return hasStaffSubrole(user, state, 'funding_reviewer') || isAdmin;

    case 'funding:create_student_campaign': {
      if (!isApplicant && !isStudent && !isAlumni) return false;
      const hasAdmittedOrActive = state.enrollments.some(
        (e) => e.userId === user.id && ['admitted', 'active'].includes(e.status)
      );
      const hasSubmittedFundingApp = state.fundingApplications.some(
        (f) => f.userId === user.id && ['submitted', 'awarded'].includes(f.status)
      );
      return hasAdmittedOrActive && hasSubmittedFundingApp;
    }

    case 'funding:manage_campaigns':
      return isStaff;

    case 'funding:view_grants_and_forum':
      return isApplicant || isStudent || isAlumni || isStaff;

    case 'staff:manage_admissions':
      return isStaff;

    case 'staff:manage_roles':
    case 'staff:edit_legal':
      return isAdmin || isStaff;

    case 'sponsor:view_portal': {
      if (isStaff) return true;
      if (!isSponsor) return false;
      if (!ctx.orgId) return true;
      return getUserOrgIds(user, state).includes(ctx.orgId);
    }

    default:
      return false;
  }
}

/**
 * Redacts talent profile fields when viewed by an Employer so field-by-field opt-in is strictly honored.
 */
export function filterTalentProfileForViewer(
  profile: TalentProfile,
  viewer: User | null | undefined,
  state: AppDatabaseState
): TalentProfile | null {
  if (!viewer) return null;
  if (viewer.id === profile.userId || hasAnyRole(viewer, state, ['staff', 'admin'])) {
    return profile;
  }
  if (!profile.optedInDirectory) return null;
  return {
    ...profile,
    summary: profile.visibleFields.summary ? profile.summary : '',
    portfolioUrl: profile.visibleFields.portfolio ? profile.portfolioUrl : undefined,
    githubUrl: profile.visibleFields.portfolio ? profile.githubUrl : undefined,
    linkedinUrl: profile.visibleFields.portfolio ? profile.linkedinUrl : undefined,
  };
}
