'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Send,
  Eye,
  Columns,
  Share2,
  Lock,
} from 'lucide-react';
import { CareerPath, CatalogItem, RoadmapStep } from '@/lib/data/types';
import { scoreCareerPaths, RecommendationInput } from '@/lib/recommend/engine';
import { AI_DISCLAIMER_LABEL } from '@/lib/ai/safety';

export default function RoadmapPage() {
  const router = useRouter();
  const { currentUser, isGuest } = useAuth();
  const { locale, t } = useI18n();

  const paths = db.roadmap.listCareerPaths();
  const catalog = db.roadmap.listCatalog();

  // Get active roadmap or calculate top 3 paths for this user
  const savedRoadmap = currentUser ? db.roadmap.getRoadmap(currentUser.id) : undefined;
  const userProfile = currentUser ? db.roadmap.getInterestProfile(currentUser.id) : undefined;

  const userCompleted = currentUser
    ? db.cohorts.listEnrollments({ userId: currentUser.id, status: 'completed' }).map(() => 'cat_foundational')
    : [];

  const recInput: RecommendationInput = {
    soundsFunTags: userProfile?.soundsFunTags ?? ['building websites', 'designing how things look and feel'],
    generatedInterestTags: userProfile?.generatedInterestTags ?? ['Web Design', 'Accessibility'],
    transferableSkills: userProfile?.transferableSkills ?? ['Coordination', 'Organization'],
    targetTimelineMonths: userProfile?.targetTimelineMonths ?? 6,
    locationPreference: userProfile?.locationPreference ?? 'remote',
    employmentTarget: userProfile?.employmentTarget ?? 'part_time',
    valueDriver: userProfile?.valueDriver ?? 'Flexibility',
    weeklyHoursAvailable: userProfile?.weeklyHoursAvailable ?? 6,
    preferredScheduleWindows: userProfile?.preferredScheduleWindows ?? ['Saturday mornings'],
    inPersonOk: userProfile?.inPersonOk ?? false,
    completedCatalogItemIds: userCompleted,
  };

  const topRecommendations = scoreCareerPaths(recInput, paths, catalog);
  const [selectedPathSlug, setSelectedPathSlug] = useState<string>(
    savedRoadmap ? paths.find((p) => p.id === savedRoadmap.careerPathId)?.slug ?? topRecommendations[0]?.path.slug ?? 'web-development' : topRecommendations[0]?.path.slug ?? 'web-development'
  );

  const activeRec = topRecommendations.find((r) => r.path.slug === selectedPathSlug) ?? topRecommendations[0];

  // Steps
  const initialSteps = savedRoadmap
    ? db.roadmap.getRoadmapSteps(savedRoadmap.id)
    : activeRec?.steps.map((s, idx) => ({ ...s, id: `tmp_${idx}`, roadmapId: 'tmp' })) ?? [];

  const [steps, setSteps] = useState<RoadmapStep[]>(initialSteps as RoadmapStep[]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggleStepStatus = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === stepId) {
          const nextStatus = s.status === 'completed' ? 'not_started' : 'completed';
          if (savedRoadmap) {
            db.roadmap.updateRoadmapStep(stepId, { status: nextStatus });
          }
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleAskAiAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion) return;
    setAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/app/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'roadmap_advisor',
          userId: currentUser?.id,
          role: 'student',
          pathTitle: activeRec?.path.title,
          stepsListText: steps.map((s) => s.reasonText).join('; '),
          userQuestion: aiQuestion,
        }),
      });
      const data = await res.json();
      setAiAnswer(data.text || data.error || 'AI advisor unavailable.');
    } catch {
      setAiAnswer('Your roadmap is designed to build practical confidence step-by-step. Keep going with your current milestone!');
    } finally {
      setAiLoading(false);
    }
  };

  const handleTalkToAdvisor = () => {
    if (!currentUser) return;
    const summary = steps.map((s) => `${s.column.toUpperCase()}: ${s.reasonText}`).join('\n');
    db.help.createTicket({
      requesterId: currentUser.id,
      queue: 'careers',
      subject: `Career Roadmap Review: ${activeRec?.path.title}`,
      body: `Hello! I would like to review my personalized roadmap with an advisor.\n\nPath: ${activeRec?.path.title} (${activeRec?.score}% match)\n\nSteps:\n${summary}`,
    });
    alert('Ask Staff ticket created with your roadmap attached! An advisor will reply in your Help Desk.');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Personalized Roadmap</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rules-first career pathways grounded in verified Tech-Moms cohorts, certifications, and real employer jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCompareModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-accent transition shadow-sm"
          >
            <Columns className="h-4 w-4 text-primary" />
            <span>Compare Top 3 Paths</span>
          </button>
          <NextLink
            href="/find-your-path"
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-accent transition shadow-sm"
          >
            Retake Quiz
          </NextLink>
        </div>
      </div>

      {/* Path Switcher Bar (Top 3 Recommended Paths) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topRecommendations.map((rec) => {
          const isSelected = rec.path.slug === selectedPathSlug;
          return (
            <div
              key={rec.path.id}
              onClick={() => {
                setSelectedPathSlug(rec.path.slug);
                setSteps(rec.steps.map((s, idx) => ({ ...s, id: `tmp_${idx}`, roadmapId: 'tmp' })) as any);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm'
                  : 'border-border bg-card hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{rec.path.title}</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 font-black text-xs px-2 py-0.5">
                  {rec.score}% Match
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{rec.templateExplanation}</p>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider pt-1">
                {rec.path.salaryRangeEstimate}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Path Headline & Progress */}
      {activeRec && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Selected Career Pathway</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">{activeRec.path.title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                {activeRec.path.description}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground">
                You're <strong>{totalCount - completedCount}</strong> steps from job-ready!
              </span>
              <div className="w-48 bg-border rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-accent/30 p-3.5 rounded-xl border border-border/50 text-xs text-muted-foreground space-y-1">
            <span className="font-bold text-foreground">Why this fits you:</span>
            <p className="italic">"{activeRec.templateExplanation}"</p>
            <span className="text-[10px] text-primary block pt-0.5">{AI_DISCLAIMER_LABEL}</span>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setAiChatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-4 py-2 transition shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask About My Roadmap</span>
            </button>

            <button
              type="button"
              onClick={handleTalkToAdvisor}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground font-semibold text-xs px-4 py-2 transition"
            >
              <span>Talk to an Advisor</span>
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Timeline: NOW / NEXT / LATER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['now', 'next', 'later'] as const).map((colKey) => {
          const colSteps = steps.filter((s) => s.column === colKey);
          const colLabel = colKey === 'now' ? 'NOW (Next 0–3 Months)' : colKey === 'next' ? 'NEXT (3–6 Months)' : 'LATER (6–12+ Months)';

          return (
            <div key={colKey} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                  {colLabel}
                </span>
                <span className="rounded-full bg-accent px-2 py-0.2 text-[10px] font-bold text-muted-foreground">
                  {colSteps.length}
                </span>
              </div>

              <div className="space-y-4">
                {colSteps.map((step) => {
                  const catItem = catalog.find((c) => c.id === step.catalogItemId);
                  const isDone = step.status === 'completed';

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-2xl border transition shadow-sm space-y-3 ${
                        isDone ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                          {catItem?.type.replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleStepStatus(step.id)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-accent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isDone ? '✓ Completed' : 'Mark Done'}
                        </button>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground">{catItem?.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.reasonText}</p>
                      </div>

                      {/* Conflict Warning */}
                      {step.conflictWarning && (
                        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                          <div className="flex items-center gap-1 font-bold">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span>Schedule Notice</span>
                          </div>
                          <p>{step.conflictWarning}</p>
                        </div>
                      )}

                      <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/40">
                        <div className="flex justify-between">
                          <span>Weekly Hours:</span>
                          <span className="font-semibold text-foreground">~{catItem?.weeklyHours} hrs/wk</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost & Funding:</span>
                          <span className="font-semibold text-foreground">{catItem?.costRange}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <NextLink href="/funding/my" className="text-primary font-bold hover:underline">
                          Funding Options →
                        </NextLink>
                        <NextLink
                          href="/learn"
                          className="rounded-lg bg-primary text-primary-foreground font-semibold px-2.5 py-1 text-[11px] shadow-sm hover:bg-primary/90 transition"
                        >
                          Explore Course
                        </NextLink>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPARE PATHS MODAL */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-xl text-foreground">Compare Top 3 Career Pathways</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Side-by-side comparison based on your quiz profile.</p>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {topRecommendations.map((rec) => (
                <div key={rec.path.id} className="p-4 rounded-2xl border border-border bg-accent/20 space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-sm text-foreground">{rec.path.title}</span>
                    <span className="text-emerald-600">{rec.score}% Match</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-3">{rec.path.description}</p>
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <div>
                      <strong className="text-foreground">Salary:</strong> {rec.path.salaryRangeEstimate}
                    </div>
                    <div>
                      <strong className="text-foreground">Entry Roles:</strong> {rec.path.entryRoles.slice(0, 2).join(', ')}
                    </div>
                    <div>
                      <strong className="text-foreground">Core Skills:</strong> {rec.path.skills.slice(0, 3).join(', ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPathSlug(rec.path.slug);
                      setCompareModalOpen(false);
                    }}
                    className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2 text-xs shadow-sm hover:bg-primary/90 transition"
                  >
                    Select this Roadmap
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI ADVISOR CHAT MODAL */}
      {aiChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Ask About Your {activeRec?.path.title} Roadmap</h3>
            <p className="text-xs text-muted-foreground">
              Grounded strictly in the Tech-Moms course catalog and your chosen milestones.
            </p>

            <form onSubmit={handleAskAiAdvisor} className="space-y-3">
              <input
                type="text"
                required
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="e.g. Which certification should I take first while working part-time?"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full rounded-xl bg-primary text-primary-foreground text-xs font-bold py-2 hover:bg-primary/90 transition disabled:opacity-50"
              >
                {aiLoading ? 'Consulting Advisor...' : 'Ask Career Advisor'}
              </button>
            </form>

            {aiAnswer && (
              <div className="p-3.5 rounded-xl border border-border bg-accent/30 text-xs text-muted-foreground space-y-1.5 animate-in fade-in">
                <span className="font-bold text-foreground">Advisor Answer:</span>
                <p className="leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
                <span className="text-[10px] text-primary block pt-1">{AI_DISCLAIMER_LABEL}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAiChatOpen(false)}
              className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground pt-1"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
