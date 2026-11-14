import { callGemini } from './client';
import { sanitizeAllowList } from './safety';

export async function askStudyHelper(input: {
  lessonTitle: string;
  lessonContent: string;
  userQuestion: string;
  locale: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const safe = sanitizeAllowList(input, ['lessonTitle', 'lessonContent', 'userQuestion', 'locale']);

  const systemInstruction = `You are a supportive, warm tutor for Tech-Moms, a Utah nonprofit helping mothers transition into tech careers.
Grounded strictly in the provided lesson content.
HARD SAFETY RULES:
- Explain concepts clearly with encouraging, confidence-building language.
- DO NOT provide copy-paste full assignment solutions. Give hints, guiding questions, and small 2-3 line code syntax examples.
- Answer in ${safe.locale === 'es' ? 'Spanish' : 'English'}.`;

  const prompt = `Lesson: ${safe.lessonTitle}
Content: ${safe.lessonContent}
Student Question: ${safe.userQuestion}`;

  const res = await callGemini(prompt, { systemInstruction, model: 'fast' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  // Fallback
  const fallback = safe.locale === 'es'
    ? `Pista del Tutor: Para ${safe.lessonTitle}, revisa la estructura semántica de tus etiquetas y recuerda que los elementos flexibles se adaptan usando min-width: 0.`
    : `Tutor Hint: In ${safe.lessonTitle}, focus on testing your layout step-by-step. Make sure your elements have responsive flex-grow properties rather than fixed pixel widths!`;
  return { text: fallback, tokenCount: 40, latencyMs: 10, isFallback: true };
}

export async function draftInstructorQuiz(input: {
  lessonTitle: string;
  lessonContent: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const prompt = `Based on the lesson "${input.lessonTitle}":\n${input.lessonContent}\n\nDraft 5 multiple choice review questions with answers and brief explanations for beginners.`;
  const res = await callGemini(prompt, { model: 'fast' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  const fallback = `1. What is the primary purpose of semantic HTML?\nA) Styling\nB) Screen reader accessibility & SEO (Correct)\nC) Running JavaScript`;
  return { text: fallback, tokenCount: 30, latencyMs: 10, isFallback: true };
}

export async function draftRubricFeedback(input: {
  assignmentTitle: string;
  rubricSummary: string;
  studentNotes?: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const prompt = `Draft supportive instructor feedback for a Tech-Moms student who completed "${input.assignmentTitle}".\nRubric: ${input.rubricSummary}\nStudent Note: ${input.studentNotes || 'N/A'}\nFocus on encouragement, praise their semantic execution, and suggest one improvement.`;
  const res = await callGemini(prompt, { model: 'strong' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  const fallback = `Outstanding effort on ${input.assignmentTitle}! Your semantic structure and attention to accessible labels are commendable. For your next milestone, try testing with smaller viewport widths.`;
  return { text: fallback, tokenCount: 45, latencyMs: 10, isFallback: true };
}

export async function draftAnnouncement(input: {
  bullets: string;
  priority: string;
  tone?: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const prompt = `You are helping Tech-Moms staff compose a clear, warm announcement.\nPriority: ${input.priority}\nBullet points: ${input.bullets}\nFormat into a friendly 2-3 paragraph announcement with a clear call to action.`;
  const res = await callGemini(prompt, { model: 'fast' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  return {
    text: `Hello Tech-Moms community! Here is an important update regarding our upcoming sessions:\n\n${input.bullets}\n\nPlease reach out on Slack or Motherboard with any questions!`,
    tokenCount: 40,
    latencyMs: 10,
    isFallback: true,
  };
}

export async function translateText(input: {
  text: string;
  targetLocale: 'en' | 'es';
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const prompt = `Translate the following Tech-Moms text into natural, respectful ${input.targetLocale === 'es' ? 'Spanish (Español latinoamericano)' : 'English'}.\n\nText:\n${input.text}`;
  const res = await callGemini(prompt, { model: 'fast', temperature: 0.2 });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  return { text: `[Traducción]: ${input.text}`, tokenCount: 20, latencyMs: 5, isFallback: true };
}

export async function catchUpMessages(input: {
  channelName: string;
  recentMessagesText: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const prompt = `Summarize recent messages in channel ${input.channelName}:\n${input.recentMessagesText}\nIdentify: 1) Key discussion topics, 2) Unresolved questions, 3) Important announcements or deadlines.`;
  const res = await callGemini(prompt, { model: 'fast' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  return {
    text: `Summary for ${input.channelName}:\n• Students asked questions regarding Flexbox navigation wrapping.\n• Dana Ruiz provided guidance on adding min-width: 0 to flexible items.\n• Kris Lane confirmed office hours this Wednesday at 5:30 PM.`,
    tokenCount: 50,
    latencyMs: 10,
    isFallback: true,
  };
}

export async function reviewResumeForJob(input: {
  resumeText: string;
  jobTitle: string;
  jobRequirements: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const safe = sanitizeAllowList(input, ['resumeText', 'jobTitle', 'jobRequirements']);
  const prompt = `You are a Tech-Moms career coach reviewing a student resume against a job posting.\nTarget Job: ${safe.jobTitle}\nRequirements: ${safe.jobRequirements}\nStudent Resume: ${safe.resumeText}\nProvide 3 actionable tips: matching keywords to emphasize, missing skills to address, and ATS formatting guidance.`;
  const res = await callGemini(prompt, { model: 'strong' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  return {
    text: `Resume Review Feedback for ${safe.jobTitle}:\n1. Strong match on HTML/CSS and Git collaboration.\n2. Consider moving your verified capstone project higher up in your experience section.\n3. Quantify metrics (e.g. "improved responsive load time" or "audited 42 trailheads for accessibility").`,
    tokenCount: 60,
    latencyMs: 10,
    isFallback: true,
  };
}

export async function askRoadmapAdvisor(input: {
  pathTitle: string;
  stepsListText: string;
  userQuestion: string;
}): Promise<{ text: string; tokenCount: number; latencyMs: number; isFallback?: boolean }> {
  const safe = sanitizeAllowList(input, ['pathTitle', 'stepsListText', 'userQuestion']);
  const prompt = `You are a friendly academic advisor for Tech-Moms. Ground your advice ONLY in the student's roadmap and catalog.\nPath: ${safe.pathTitle}\nRoadmap Steps: ${safe.stepsListText}\nStudent Question: ${safe.userQuestion}\nAnswer warmly in 2-3 sentences.`;
  const res = await callGemini(prompt, { model: 'fast' });
  if (res.text) return { text: res.text, tokenCount: res.tokenCount, latencyMs: res.latencyMs };

  return {
    text: `Your roadmap for ${safe.pathTitle} is structured to balance foundational skills with portfolio projects. Completing your current step will unlock interview readiness!`,
    tokenCount: 35,
    latencyMs: 10,
    isFallback: true,
  };
}
