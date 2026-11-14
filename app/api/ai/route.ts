import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, AI_DISCLAIMER_LABEL } from '@/lib/ai/safety';
import {
  askStudyHelper,
  draftInstructorQuiz,
  draftRubricFeedback,
  draftAnnouncement,
  translateText,
  catchUpMessages,
  reviewResumeForJob,
  askRoadmapAdvisor,
} from '@/lib/ai/prompts';
import { db } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feature, userId, role, ...payload } = body;

    // Rate-limiting check per user
    const rateCheck = checkRateLimit(userId || 'anonymous');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.error }, { status: 429 });
    }

    // Safety allow-list filter: verify no funding application or income fields are passed
    if (body.annualIncomeBand || body.householdSize || body.privateStatement || body.paymentMethod) {
      return NextResponse.json({ error: 'Security Exception: Financial/income data must never be sent to AI services.' }, { status: 400 });
    }

    let result = '';
    let tokenCount = 0;
    let latencyMs = 0;
    let isFallback = false;

    switch (feature) {
      case 'learn_study_helper': {
        const res = await askStudyHelper({
          lessonTitle: payload.lessonTitle || '',
          lessonContent: payload.lessonContent || '',
          userQuestion: payload.userQuestion || '',
          locale: payload.locale || 'en',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'instructor_quiz': {
        const res = await draftInstructorQuiz({
          lessonTitle: payload.lessonTitle || '',
          lessonContent: payload.lessonContent || '',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'rubric_feedback': {
        const res = await draftRubricFeedback({
          assignmentTitle: payload.assignmentTitle || '',
          rubricSummary: payload.rubricSummary || '',
          studentNotes: payload.studentNotes,
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'announcement_draft': {
        const res = await draftAnnouncement({
          bullets: payload.bullets || '',
          priority: payload.priority || 'normal',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'translate': {
        const res = await translateText({
          text: payload.text || '',
          targetLocale: payload.targetLocale || 'es',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'messages_catchup': {
        const res = await catchUpMessages({
          channelName: payload.channelName || '',
          recentMessagesText: payload.recentMessagesText || '',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'resume_feedback': {
        const res = await reviewResumeForJob({
          resumeText: payload.resumeText || '',
          jobTitle: payload.jobTitle || '',
          jobRequirements: payload.jobRequirements || '',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      case 'roadmap_advisor': {
        const res = await askRoadmapAdvisor({
          pathTitle: payload.pathTitle || '',
          stepsListText: payload.stepsListText || '',
          userQuestion: payload.userQuestion || '',
        });
        result = res.text;
        tokenCount = res.tokenCount;
        latencyMs = res.latencyMs;
        isFallback = !!res.isFallback;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown AI feature: ${feature}` }, { status: 400 });
    }

    // Log AI usage without logging private prompt content
    db.ai.logUsage(feature, role || 'student', tokenCount, latencyMs);

    return NextResponse.json({
      text: result,
      tokenCount,
      latencyMs,
      disclaimer: AI_DISCLAIMER_LABEL,
      isFallback,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI service error' },
      { status: 500 }
    );
  }
}
