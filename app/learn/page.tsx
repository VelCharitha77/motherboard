'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Video,
  FileText,
  Search,
  ExternalLink,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Assignment, CourseModule, Lesson, Submission } from '@/lib/data/types';

export default function LearnPage() {
  const { currentUser, can } = useAuth();
  const { locale, t } = useI18n();

  const programs = db.programs.list();
  const cohorts = db.cohorts.list();

  // Selected program & cohort
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    currentUser?.id === 'usr_aisha' ? 'coh_data_w27' : 'coh_online_w27'
  );
  const [activeTab, setActiveTab] = useState<'modules' | 'assignments' | 'attendance' | 'certs' | 'resources' | 'pathways'>('modules');

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) ?? cohorts[0];
  const program = programs.find((p) => p.id === selectedCohort?.programId);

  // Modules, lessons, assignments
  const modules = selectedCohort ? db.learn.listModules(selectedCohort.id) : [];
  const lessons = selectedCohort ? db.learn.listLessons(selectedCohort.id) : [];
  const assignments = selectedCohort ? db.learn.listAssignments(selectedCohort.id) : [];
  const submissions = db.learn.listSubmissions({ cohortId: selectedCohort?.id });

  // Selected lesson modal
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Assignment submission modal
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Instructor grading state
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState('');

  // Certifications
  const certs = db.learn.listCertifications(currentUser?.id);

  // Resource Library search
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategory, setResourceCategory] = useState<string>('all');
  const resources = db.learn.listResources({
    category: resourceCategory === 'all' ? undefined : (resourceCategory as any),
    search: resourceSearch,
  });

  // Attendance
  const attendanceRecords = selectedCohort ? db.learn.listAttendance({ cohortId: selectedCohort.id }) : [];
  const myAttendance = currentUser ? attendanceRecords.filter((a) => a.userId === currentUser.id) : [];

  const isInstructor = can('learn:grade', { cohort: selectedCohort });

  const handleLessonToggle = (lessonId: string) => {
    if (!currentUser) return;
    db.learn.toggleLessonComplete(currentUser.id, lessonId);
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeAssignment || !selectedCohort) return;
    db.learn.submitAssignment({
      assignmentId: activeAssignment.id,
      cohortId: selectedCohort.id,
      userId: currentUser.id,
      submittedUrl: submissionUrl,
      notes: submissionNotes,
    });
    setActiveAssignment(null);
    setSubmissionUrl('');
    setSubmissionNotes('');
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !gradingSubmission) return;
    db.learn.gradeSubmission(currentUser.id, gradingSubmission.id, {
      rubricScores,
      feedback: gradingFeedback,
      status: 'graded',
    });
    setGradingSubmission(null);
    setRubricScores({});
    setGradingFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Cohort Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span>{t('learn.title', 'Learning Hub')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Canvas-style LMS for Tech-Moms Foundational, 2.0 tracks, and career certifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground hidden sm:inline">Cohort:</label>
          <select
            value={selectedCohortId}
            onChange={(e) => setSelectedCohortId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cohort Hero Banner */}
      {selectedCohort && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {program?.name} ({program?.durationWeeks} weeks)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1.5">{selectedCohort.name}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{locale === 'es' ? selectedCohort.scheduleEs : selectedCohort.schedule}</span>
              </p>
              {selectedCohort.inPersonSaturdayAddress && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>{selectedCohort.inPersonSaturdayAddress}</span>
                </p>
              )}
            </div>

            {selectedCohort.zoomLink && (
              <a
                href={selectedCohort.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 shadow-sm transition shrink-0"
              >
                <Video className="h-4 w-4" />
                <span>{t('learn.zoomMeeting', 'Join Live Zoom Session')}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        {[
          { key: 'modules', label: t('learn.modules', 'Modules & Lessons'), icon: BookOpen },
          { key: 'assignments', label: t('learn.assignments', 'Assignments'), icon: FileText },
          { key: 'attendance', label: t('learn.attendance', 'Attendance'), icon: CheckCircle2 },
          { key: 'certs', label: t('learn.certifications', 'Certification Tracker'), icon: Award },
          { key: 'resources', label: t('learn.resourceLibrary', 'Resource Library'), icon: Sparkles },
          { key: 'pathways', label: t('learn.pathways', 'Next Steps & 2.0 Pathways'), icon: ArrowRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
                isActive ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MODULES & LESSONS */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-card text-center text-sm text-muted-foreground">
              Modules are being prepared for this cohort.
            </div>
          ) : (
            modules.map((mod) => {
              const modLessons = lessons.filter((l) => l.moduleId === mod.id);
              return (
                <div key={mod.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="border-b border-border/60 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Week {mod.weekNumber}</span>
                    <h3 className="text-lg font-bold text-foreground mt-0.5">
                      {locale === 'es' && mod.titleEs ? mod.titleEs : mod.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{mod.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {modLessons.map((les) => {
                      const completed = currentUser ? db.learn.isLessonCompleted(currentUser.id, les.id) : false;
                      return (
                        <div
                          key={les.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-accent/20 hover:border-primary/50 transition cursor-pointer"
                          onClick={() => setActiveLesson(les)}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLessonToggle(les.id);
                              }}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-border bg-card hover:bg-accent'
                              }`}
                              title={completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {completed ? <Check className="h-4 w-4" /> : null}
                            </button>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                                {locale === 'es' && les.titleEs ? les.titleEs : les.title}
                              </h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{les.estimatedMinutes} mins • Video & Resources</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS & RUBRIC GRADING */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assignments.map((asg) => {
              const mySub = currentUser ? submissions.find((s) => s.assignmentId === asg.id && s.userId === currentUser.id) : undefined;
              return (
                <div key={asg.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                      {mySub ? (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          mySub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {mySub.status === 'graded' ? `Graded (${mySub.totalScore}/100)` : 'Submitted'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">Not Submitted</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-foreground">{locale === 'es' && asg.titleEs ? asg.titleEs : asg.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{asg.instructions}</p>

                    {/* Rubric Breakdown */}
                    <div className="bg-accent/30 p-3 rounded-xl border border-border/40 space-y-1.5">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Evaluation Rubric</h5>
                      {asg.rubric.map((r) => (
                        <div key={r.id} className="flex justify-between text-xs text-muted-foreground">
                          <span>{r.label}</span>
                          <span className="font-semibold text-foreground">{r.maxPoints} pts</span>
                        </div>
                      ))}
                    </div>

                    {/* Graded Feedback */}
                    {mySub?.feedback && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">Instructor Feedback:</span>
                        <p className="text-muted-foreground">{mySub.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveAssignment(asg)}
                      className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-xs py-2.5 hover:bg-primary/90 transition shadow-sm"
                    >
                      {mySub ? 'Resubmit / Edit Work' : 'Submit Assignment'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Instructor Submissions Queue (visible if instructor) */}
          {isInstructor && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Instructor Grading & Rubric Review Queue</span>
              </h3>
              <div className="divide-y divide-border/60">
                {submissions.map((sub) => {
                  const asg = assignments.find((a) => a.id === sub.assignmentId);
                  const student = db.users.getById(sub.userId);
                  return (
                    <div key={sub.id} className="py-3.5 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {student?.name} — {asg?.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(sub.submittedAt).toLocaleString()} • URL: {sub.submittedUrl || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.status === 'graded' && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {sub.totalScore}/100
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setGradingSubmission(sub);
                            setRubricScores(sub.rubricScores ?? {});
                            setGradingFeedback(sub.feedback ?? '');
                          }}
                          className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs px-3 py-1.5 transition"
                        >
                          {sub.status === 'graded' ? 'Re-grade' : 'Grade with Rubric'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-foreground">Attendance Records & Compliance</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Attendance tracking ensures eligibility for graduation certificates and Utah DWS workforce aid compliance.
            </p>

            <div className="divide-y divide-border/60">
              {myAttendance.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No attendance records logged yet.</div>
              ) : (
                myAttendance.map((rec) => (
                  <div key={rec.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-foreground">{rec.sessionLabel}</span>
                      <p className="text-[11px] text-muted-foreground">{rec.sessionDate}</p>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full capitalize">
                      {rec.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATION TRACKER */}
      {activeTab === 'certs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{c.provider}</span>
                  <span className="rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs px-2.5 py-0.5 capitalize">
                    {c.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">{c.certName}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.studyPlanNotes}</p>
                {c.examDate && (
                  <p className="text-xs font-semibold text-foreground">
                    Target Exam Date: {new Date(c.examDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RESOURCE LIBRARY */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Search webinars, guides, resume courses..."
                className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={resourceCategory}
              onChange={(e) => setResourceCategory(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              <option value="better_way_thursday">Better Way Thursday</option>
              <option value="resume_program">Resume Building Suite</option>
              <option value="career_relaunch">Career Relaunch</option>
              <option value="tech_skills">Technical Guides</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resources.map((res) => (
              <div key={res.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="uppercase font-bold text-primary">{res.category.replace('_', ' ')}</span>
                    <span>{res.durationLabel}</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-foreground mt-1">{res.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{res.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {res.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-accent px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {res.youtubeVideoId && (
                  <div className="pt-2">
                    <a
                      href={`https://www.youtube.com/watch?v=${res.youtubeVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Watch Embedded Webinar</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: 2.0 PATHWAY VIEW */}
      {activeTab === 'pathways' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">You finished Foundational → Your Tech-Moms 2.0 Pathways</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Alumnae next-step tracks feature specialized technical certifications and direct employer capstone showcases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {programs.filter((p) => p.track.startsWith('2.0_')).map((p2) => (
              <div key={p2.id} className="rounded-xl border border-border bg-accent/20 p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                    {p2.durationWeeks} Weeks • Hybrid
                  </span>
                  <h3 className="font-bold text-base text-foreground mt-1.5">{p2.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{p2.description}</p>
                  <p className="text-xs font-semibold text-foreground pt-2">
                    Target Cert: <span className="text-primary">{p2.certName}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60">
                  <NextLink
                    href="/funding/my"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Check Scholarship & Aid Options</span>
                    <ArrowRight className="h-3 w-3" />
                  </NextLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LESSON MODAL */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Lesson</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">{activeLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLesson(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Video Embed */}
            {activeLesson.youtubeVideoId && (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeLesson.youtubeVideoId}`}
                  title={activeLesson.title}
                  allowFullScreen
                />
              </div>
            )}

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>{activeLesson.content}</p>
            </div>

            {activeLesson.resources.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Resources & Cheatsheets</span>
                {activeLesson.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{r.label}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  handleLessonToggle(activeLesson.id);
                  setActiveLesson(null);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition"
              >
                Toggle Complete & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT SUBMISSION MODAL */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Submit: {activeAssignment.title}</h3>
            <p className="text-xs text-muted-foreground">{activeAssignment.instructions}</p>

            <form onSubmit={handleSubmitAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">GitHub / CodePen / Live URL</label>
                <input
                  type="url"
                  required
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://github.com/my-username/my-assignment"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Notes for Reviewer</label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe your approach, tests, or questions for Kris and Dana..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Confirm Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTRUCTOR GRADING MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Rubric Evaluation</h3>
            <p className="text-xs text-muted-foreground">Score each criterion and provide constructive guidance.</p>

            <form onSubmit={handleGradeSubmission} className="space-y-3">
              {assignments.find((a) => a.id === gradingSubmission.assignmentId)?.rubric.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-foreground">{r.label} (Max {r.maxPoints} pts):</span>
                  <input
                    type="number"
                    min={0}
                    max={r.maxPoints}
                    value={rubricScores[r.id] ?? r.maxPoints}
                    onChange={(e) => setRubricScores({ ...rubricScores, [r.id]: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-border bg-background px-2.5 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Feedback to Student</label>
                <textarea
                  rows={3}
                  required
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Great progress! Keep an eye on..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Save Grade & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
