import { CareerPath, CatalogItem, InterestProfile, RoadmapStep } from '../data/types';

export interface RecommendationInput {
  soundsFunTags: string[];
  generatedInterestTags: string[];
  transferableSkills: string[];
  targetTimelineMonths: number;
  locationPreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  employmentTarget: 'part_time' | 'full_time' | 'flexible';
  valueDriver: string;
  weeklyHoursAvailable: number;
  preferredScheduleWindows: string[];
  inPersonOk: boolean;
  preferredCity?: string;
  completedCatalogItemIds?: string[];
  activeCertifications?: string[];
}

export interface PathRecommendationResult {
  path: CareerPath;
  score: number;
  reasons: string[];
  timelineFitMonths: number;
  steps: Omit<RoadmapStep, 'id' | 'roadmapId'>[];
  templateExplanation: string;
}

const PATH_KEYWORDS: Record<string, string[]> = {
  'web-development': [
    'building websites', 'websites', 'designing how things look and feel', 'frontend', 'front-end',
    'html', 'css', 'javascript', 'react', 'code', 'coding', 'web', 'ui', 'creative'
  ],
  'data-analytics': [
    'finding patterns in data', 'data', 'patterns', 'sql', 'tableau', 'spreadsheets', 'excel',
    'analytics', 'reporting', 'numbers', 'finance', 'auditing', 'metrics', 'charts'
  ],
  'cybersecurity': [
    'protecting systems', 'security', 'cyber', 'protecting', 'defense', 'network', 'firewall',
    'compliance', 'operations', 'investigation', 'troubleshooting', 'safety'
  ],
  'project-management': [
    'organizing people and projects', 'organizing', 'planning', 'leadership', 'scrum', 'agile',
    'coordination', 'communication', 'deadlines', 'supervision', 'jira', 'capm', 'pmp'
  ],
  'quality-assurance': [
    'testing and finding bugs', 'testing', 'bugs', 'qa', 'quality', 'details', 'checklist',
    'verifying', 'reproduction', 'careful'
  ],
  'ux-ui-design': [
    'designing how things look and feel', 'design', 'figma', 'user experience', 'ux', 'ui',
    'wireframes', 'empathy', 'accessibility', 'colors', 'visual'
  ],
  'ai-automation': [
    'working with ai tools', 'ai', 'artificial intelligence', 'automation', 'prompts',
    'workflows', 'zapier', 'chatgpt', 'python', 'tools'
  ],
  'salesforce-admin': [
    'helping customers/admins with business software', 'business software', 'salesforce',
    'crm', 'operations', 'customer support', 'admin', 'workflows'
  ],
};

export function scoreCareerPaths(
  input: RecommendationInput,
  paths: CareerPath[],
  catalog: CatalogItem[]
): PathRecommendationResult[] {
  const completedIds = new Set(input.completedCatalogItemIds ?? []);
  const allUserTags = [
    ...input.soundsFunTags.map((t) => t.toLowerCase()),
    ...input.generatedInterestTags.map((t) => t.toLowerCase()),
    ...input.transferableSkills.map((t) => t.toLowerCase()),
  ];

  const results: PathRecommendationResult[] = paths.map((path) => {
    let score = 50; // base score
    const reasons: string[] = [];
    const keywords = PATH_KEYWORDS[path.slug] ?? [];

    // 1. Keyword & Interest Tag Matching (+10 to +30)
    let keywordHits = 0;
    for (const tag of allUserTags) {
      for (const kw of keywords) {
        if (tag.includes(kw) || kw.includes(tag)) {
          keywordHits++;
        }
      }
    }
    if (keywordHits > 0) {
      const boost = Math.min(30, keywordHits * 10);
      score += boost;
      reasons.push(`Direct alignment with your selected interest in "${path.title}".`);
    }

    // 2. Transferable skills fit (+10)
    if (input.transferableSkills.length > 0) {
      score += 10;
      reasons.push(`Your transferable background in ${input.transferableSkills.slice(0, 2).join(' & ')} accelerates your progression.`);
    }

    // 3. Timeline fit (+10)
    const isShortTarget = input.targetTimelineMonths <= 6;
    if (path.slug === 'web-development' || path.slug === 'project-management' || path.slug === 'salesforce-admin') {
      if (isShortTarget) {
        score += 8;
        reasons.push(`Fits your ${input.targetTimelineMonths}-month career relaunch timeline.`);
      }
    } else {
      score += 5;
    }

    // 4. Hours availability penalty / note
    if (path.slug === 'cybersecurity' && input.weeklyHoursAvailable < 7) {
      score -= 5;
    }

    // Clamp score 60-98 for encouraging presentation
    const finalScore = Math.max(65, Math.min(98, score));

    // Build Roadmap steps for this path
    const steps = buildStepsForPath(path, input, catalog, completedIds);

    // Template explanation
    const templateExplanation = `Your interest in ${input.soundsFunTags.slice(0, 2).join(' & ') || path.title} and target ${input.weeklyHoursAvailable} hours/week make ${path.title} a high-impact stepping stone to a Utah tech career.`;

    return {
      path,
      score: finalScore,
      reasons,
      timelineFitMonths: input.targetTimelineMonths,
      steps,
      templateExplanation,
    };
  });

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 3);
}

function buildStepsForPath(
  path: CareerPath,
  input: RecommendationInput,
  catalog: CatalogItem[],
  completedIds: Set<string>
): Omit<RoadmapStep, 'id' | 'roadmapId'>[] {
  const steps: Omit<RoadmapStep, 'id' | 'roadmapId'>[] = [];
  const sequence = path.recommendedSequence;

  sequence.forEach((itemId, idx) => {
    const item = catalog.find((c) => c.id === itemId);
    if (!item) return;

    const isCompleted = completedIds.has(item.id);
    let column: 'now' | 'next' | 'later' = 'now';
    if (idx === 0) column = 'now';
    else if (idx === 1 || idx === 2) column = 'next';
    else column = 'later';

    let conflictWarning: string | undefined;
    if (!isCompleted && item.weeklyHours > input.weeklyHoursAvailable) {
      conflictWarning = `${item.title} requires ~${item.weeklyHours} hrs/week; you indicated ${input.weeklyHoursAvailable} hrs. Option: start with AI Foundations or self-paced prep, or join the next cohort.`;
    }

    steps.push({
      catalogItemId: item.id,
      column,
      status: isCompleted ? 'completed' : idx === 0 ? 'in_progress' : 'not_started',
      orderIndex: idx + 1,
      reasonText: isCompleted
        ? 'Completed with verified honors.'
        : `Essential milestone for ${path.title}: builds ${item.skillsTaught.slice(0, 2).join(' & ')}.`,
      aiGenerated: false,
      conflictWarning,
    });
  });

  return steps;
}
