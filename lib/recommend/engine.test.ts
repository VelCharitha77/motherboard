import { scoreCareerPaths, RecommendationInput } from './engine';
import { SEED_CAREER_PATHS, SEED_CATALOG_ITEMS } from '../data/mock/roadmap-seed';

/**
 * Recommendation Engine Unit Tests
 * Testing 6 distinct sample learner profiles.
 */
export function runRecommendationEngineTests() {
  const testsPassed: string[] = [];

  // Profile 1: Maria (Websites & Design, 6 hrs/wk, Remote)
  const p1: RecommendationInput = {
    soundsFunTags: ['building websites', 'designing how things look and feel'],
    generatedInterestTags: ['Front-End', 'CSS', 'Accessibility'],
    transferableSkills: ['Bilingual Community Translation', 'Event Planning'],
    targetTimelineMonths: 6,
    locationPreference: 'remote',
    employmentTarget: 'part_time',
    valueDriver: 'Flexibility for children',
    weeklyHoursAvailable: 6,
    preferredScheduleWindows: ['Saturday mornings'],
    inPersonOk: false,
  };
  const res1 = scoreCareerPaths(p1, SEED_CAREER_PATHS, SEED_CATALOG_ITEMS);
  if (res1[0].path.slug === 'web-development' || res1[0].path.slug === 'ux-ui-design') {
    testsPassed.push('Test 1: Maria recommended Web Dev / UX successfully');
  }

  // Profile 2: Aisha (Data Patterns, SQL, 10 hrs/wk)
  const p2: RecommendationInput = {
    soundsFunTags: ['finding patterns in data', 'working with ai tools'],
    generatedInterestTags: ['SQL', 'Tableau', 'Analytics'],
    transferableSkills: ['Healthcare Clinic Scheduling', 'Patient Auditing'],
    targetTimelineMonths: 3,
    locationPreference: 'hybrid',
    employmentTarget: 'full_time',
    valueDriver: 'High earning potential',
    weeklyHoursAvailable: 10,
    preferredScheduleWindows: ['Weekday evenings'],
    inPersonOk: true,
  };
  const res2 = scoreCareerPaths(p2, SEED_CAREER_PATHS, SEED_CATALOG_ITEMS);
  if (res2[0].path.slug === 'data-analytics') {
    testsPassed.push('Test 2: Aisha recommended Data Analytics successfully');
  }

  // Profile 3: Jenna (Protecting systems, Cybersecurity)
  const p3: RecommendationInput = {
    soundsFunTags: ['protecting systems'],
    generatedInterestTags: ['Cybersecurity', 'Security+'],
    transferableSkills: ['Operations Supervisor', 'Compliance'],
    targetTimelineMonths: 6,
    locationPreference: 'hybrid',
    employmentTarget: 'full_time',
    valueDriver: 'Job stability',
    weeklyHoursAvailable: 8,
    preferredScheduleWindows: ['Weekday evenings', 'Saturday mornings'],
    inPersonOk: true,
  };
  const res3 = scoreCareerPaths(p3, SEED_CAREER_PATHS, SEED_CATALOG_ITEMS);
  if (res3[0].path.slug === 'cybersecurity') {
    testsPassed.push('Test 3: Jenna recommended Cybersecurity successfully');
  }

  // Profile 4: Low weekly availability (4 hrs/wk) -> Conflict warning test
  const p4: RecommendationInput = {
    soundsFunTags: ['protecting systems'],
    generatedInterestTags: ['Cybersecurity'],
    transferableSkills: ['Retail Management'],
    targetTimelineMonths: 12,
    locationPreference: 'remote',
    employmentTarget: 'flexible',
    valueDriver: 'Family care',
    weeklyHoursAvailable: 4,
    preferredScheduleWindows: ['Saturday mornings'],
    inPersonOk: false,
  };
  const res4 = scoreCareerPaths(p4, SEED_CAREER_PATHS, SEED_CATALOG_ITEMS);
  const cyberStep = res4.find((r) => r.path.slug === 'cybersecurity')?.steps.find((s) => s.catalogItemId === 'cat_cyber_20');
  if (cyberStep?.conflictWarning) {
    testsPassed.push('Test 4: Schedule hour conflict warning correctly flagged for low hours');
  }

  // Profile 5: Project Management / Agile
  const p5: RecommendationInput = {
    soundsFunTags: ['organizing people and projects'],
    generatedInterestTags: ['Agile', 'Scrum', 'Planning'],
    transferableSkills: ['School PTA Treasurer', 'Hospitality Coordinator'],
    targetTimelineMonths: 6,
    locationPreference: 'remote',
    employmentTarget: 'part_time',
    valueDriver: 'Leadership',
    weeklyHoursAvailable: 8,
    preferredScheduleWindows: ['Weekday evenings'],
    inPersonOk: false,
  };
  const res5 = scoreCareerPaths(p5, SEED_CAREER_PATHS, SEED_CATALOG_ITEMS);
  if (res5[0].path.slug === 'project-management') {
    testsPassed.push('Test 5: PM/Scrum profile correctly scored #1');
  }

  // Profile 6: Salesforce Administration
  const p6: RecommendationInput = {
    soundsFunTags: ['helping customers/admins with business software'],
    generatedInterestTags: ['Salesforce', 'CRM', 'Admin'],
    transferableSkills: ['Customer Support', 'Data Entry'],
    targetTimelineMonths: 6,
    locationPreference: 'remote',
    employmentTarget: 'full_time',
    valueDriver: 'Career stability',
    weeklyHoursAvailable: 6,
    preferredScheduleWindows: ['Weekday evenings'],
    inPersonOk: false,
  };
  const res6 = scoreCareerPaths(p6, SEED_CAREER_PATHS, SEED_CATALOG_ITEMS);
  if (res6[0].path.slug === 'salesforce-admin') {
    testsPassed.push('Test 6: Salesforce profile correctly scored #1');
  }

  return testsPassed;
}
