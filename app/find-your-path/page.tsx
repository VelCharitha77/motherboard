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
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Mail,
  Award,
} from 'lucide-react';
import { scoreCareerPaths, RecommendationInput } from '@/lib/recommend/engine';

export default function FindYourPathPage() {
  const router = useRouter();
  const { currentUser, switchUser } = useAuth();
  const { locale, t } = useI18n();

  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Question 1: What sounds fun
  const funOptions = [
    { key: 'building websites', title: 'Building Websites & Web Apps', desc: 'Crafting pages, buttons, and layouts using code' },
    { key: 'finding patterns in data', title: 'Finding Patterns in Data', desc: 'Creating charts, spreadsheets, and business insights' },
    { key: 'protecting systems', title: 'Protecting Systems & Cybersecurity', desc: 'Defending networks, passwords, and user safety' },
    { key: 'organizing people and projects', title: 'Organizing People & Projects', desc: 'Leading standups, keeping timelines, and solving team bottlenecks' },
    { key: 'designing how things look and feel', title: 'Designing How Things Look & Feel', desc: 'User experience research, wireframing, and accessible visual design' },
    { key: 'testing and finding bugs', title: 'Testing Software & Finding Bugs', desc: 'Catching edge cases and making sure apps work on every device' },
    { key: 'working with ai tools', title: 'Working with AI Tools & Automation', desc: 'Connecting prompts, automating repetitive workflows with smart tools' },
    { key: 'helping customers/admins with business software', title: 'Business Software Administration (Salesforce)', desc: 'Managing customer software and configuring automations' },
  ];
  const [selectedFun, setSelectedFun] = useState<string[]>(['building websites']);

  // Question 2: Free text
  const [freeText, setFreeText] = useState('');
  const [tags, setTags] = useState<string[]>(['Accessibility', 'Creative Layouts']);

  // Question 3: Experience & Transferable Skills
  const [experienceLevel, setExperienceLevel] = useState('Comfortable using computers, beginner in programming');
  const [skills, setSkills] = useState<string[]>(['Communication', 'Organization']);

  // Question 4: Goals
  const [timeline, setTimeline] = useState<number>(6);
  const [locationMode, setLocationMode] = useState<'remote' | 'hybrid' | 'onsite' | 'any'>('remote');
  const [employmentTarget, setEmploymentTarget] = useState<'part_time' | 'full_time' | 'flexible'>('part_time');
  const [valueDriver, setValueDriver] = useState('Flexibility for family & children');

  // Question 5: Availability
  const [weeklyHours, setWeeklyHours] = useState<number>(6);
  const [schedules, setSchedules] = useState<string[]>(['Saturday mornings', 'Weekday evenings']);
  const [city, setCity] = useState('Salt Lake City');

  // Question 6: Learning style & Email
  const [learningStyle, setLearningStyle] = useState('Live cohort with instructor feedback');
  const [userEmail, setUserEmail] = useState(currentUser?.email ?? '');

  // Results state
  const [resultsReady, setResultsReady] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const paths = db.roadmap.listCareerPaths();
  const catalog = db.roadmap.listCatalog();

  const handleToggleFun = (key: string) => {
    if (selectedFun.includes(key)) {
      setSelectedFun(selectedFun.filter((k) => k !== key));
    } else {
      setSelectedFun([...selectedFun, key]);
    }
  };

  const handleFinishQuiz = () => {
    const recInput: RecommendationInput = {
      soundsFunTags: selectedFun,
      generatedInterestTags: tags,
      transferableSkills: skills,
      targetTimelineMonths: timeline,
      locationPreference: locationMode,
      employmentTarget,
      valueDriver,
      weeklyHoursAvailable: weeklyHours,
      preferredScheduleWindows: schedules,
      inPersonOk: locationMode !== 'remote',
      preferredCity: city,
    };

    // Save profile to repository
    const saved = db.roadmap.saveInterestProfile({
      userId: currentUser?.id,
      email: userEmail || undefined,
      soundsFunTags: selectedFun,
      freeTextInterests: freeText,
      generatedInterestTags: tags,
      experienceLevel,
      transferableSkills: skills,
      targetTimelineMonths: timeline,
      locationPreference: locationMode,
      employmentTarget,
      valueDriver,
      weeklyHoursAvailable: weeklyHours,
      preferredScheduleWindows: schedules,
      inPersonOk: locationMode !== 'remote',
      preferredCity: city,
      learningStyle,
      isPublicAnonymous: !currentUser,
    });

    // If logged in, save the #1 roadmap automatically
    if (currentUser) {
      const recs = scoreCareerPaths(recInput, paths, catalog);
      const topRec = recs[0];
      if (topRec) {
        db.roadmap.saveRoadmap(
          {
            userId: currentUser.id,
            careerPathId: topRec.path.id,
            status: 'active',
            sharedWithAdvisors: true,
            targetTimelineMonths: timeline,
            matchScore: topRec.score,
            matchExplanation: topRec.templateExplanation,
          },
          topRec.steps
        );
      }
    }

    setResultsReady(true);
  };

  const handleEmailResults = () => {
    if (!userEmail) return;
    db.outbox.list().unshift({
      id: `obx_quiz_${Date.now()}`,
      channel: 'email',
      toName: 'Prospective Student',
      toAddress: userEmail,
      subject: 'Your Tech-Moms Career Pathway Recommendations',
      body: `Thank you for taking the Tech-Moms "Find Your Path" quiz!\n\nYour top recommended pathway is Web Development (94% match) based on your interest in ${selectedFun.join(', ')} and target ${weeklyHours} hrs/week.\n\nNext Step: Applications are open for our upcoming cohorts in Lehi, Sandy, St. George, and Online.`,
      relatedModule: 'find_your_path',
      createdAt: new Date().toISOString(),
    });
    setEmailSent(true);
  };

  const recInput: RecommendationInput = {
    soundsFunTags: selectedFun,
    generatedInterestTags: tags,
    transferableSkills: skills,
    targetTimelineMonths: timeline,
    locationPreference: locationMode,
    employmentTarget,
    valueDriver,
    weeklyHoursAvailable: weeklyHours,
    preferredScheduleWindows: schedules,
    inPersonOk: locationMode !== 'remote',
    preferredCity: city,
  };
  const recommendations = scoreCareerPaths(recInput, paths, catalog);

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-6">
      {/* Quiz Progress Bar */}
      {!resultsReady && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Find Your Path in Tech • Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>
      )}

      {/* QUIZ SCREENS */}
      {!resultsReady && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-md space-y-6">
          {/* STEP 1: WHAT SOUNDS FUN */}
          {step === 1 && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Question 1 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                What sounds fun and energizing to you?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Select all that spark your curiosity:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {funOptions.map((opt) => {
                  const isChecked = selectedFun.includes(opt.key);
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleToggleFun(opt.key)}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        isChecked ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-background hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-sm">
                        <span>{opt.title}</span>
                        {isChecked && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: FREE TEXT & TAGS */}
          {step === 2 && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Question 2 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Anything else you're curious about or enjoy doing?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Share hobbies, creative projects, or topics you like researching:
              </p>

              <textarea
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="e.g. I love organizing photo albums, helping seniors with smart devices, or graphic design..."
                className="w-full rounded-2xl border border-border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">Identified Interest Tags (Click to remove):</span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="rounded-full bg-primary/10 hover:bg-red-500/10 hover:text-red-600 text-primary text-xs font-semibold px-3 py-1 transition flex items-center gap-1"
                    >
                      <span>#{t}</span>
                      <span>✕</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXPERIENCE & TRANSFERABLE SKILLS */}
          {step === 3 && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Question 3 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                What skills do you bring from past roles or caregiving?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tech-Moms values real life experience! Household management, teaching, retail, and volunteering count:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Budgeting & Financial Auditing',
                  'Event Coordination & Logistics',
                  'Teaching / Training / Mentoring',
                  'Customer Service & Empathy',
                  'Healthcare Administration & Scheduling',
                  'Problem Solving & Debugging',
                ].map((s) => {
                  const isChecked = skills.includes(s);
                  return (
                    <label key={s} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSkills([...skills, s]);
                          else setSkills(skills.filter((x) => x !== s));
                        }}
                        className="rounded border-border text-primary"
                      />
                      <span className="font-semibold text-foreground">{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: GOALS & TIMELINE */}
          {step === 4 && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Question 4 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                What is your target career transition timeline?
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { m: 3, label: '3 Months', sub: 'Fast Track' },
                  { m: 6, label: '6 Months', sub: 'Balanced' },
                  { m: 12, label: '12+ Months', sub: 'Deep Mastery' },
                ].map(({ m, label, sub }) => (
                  <div
                    key={m}
                    onClick={() => setTimeline(m)}
                    className={`p-4 rounded-2xl border text-center cursor-pointer transition ${
                      timeline === m ? 'border-primary bg-primary/10 ring-2 ring-primary/20 font-bold' : 'border-border bg-background'
                    }`}
                  >
                    <div className="text-base sm:text-lg text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <label className="block font-semibold text-foreground">What matters most in your next role?</label>
                <select
                  value={valueDriver}
                  onChange={(e) => setValueDriver(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                >
                  <option value="Flexibility for family & children">Flexibility for family & children</option>
                  <option value="High earning potential & wage lift">High earning potential & wage lift</option>
                  <option value="Long-term job stability & security">Long-term job stability & security</option>
                  <option value="Creativity & visual building">Creativity & visual building</option>
                  <option value="Helping people & nonprofit impact">Helping people & nonprofit impact</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: AVAILABILITY & HOURS */}
          {step === 5 && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Question 5 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                How many hours per week can you realistically dedicate?
              </h2>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { h: 4, label: '4–5 Hours', sub: 'Paced Study' },
                  { h: 7, label: '6–8 Hours', sub: 'Standard Cohort' },
                  { h: 12, label: '10–12 Hours', sub: 'Intensive Track' },
                ].map(({ h, label, sub }) => (
                  <div
                    key={h}
                    onClick={() => setWeeklyHours(h)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      weeklyHours === h ? 'border-primary bg-primary/10 ring-2 ring-primary/20 font-bold' : 'border-border bg-background'
                    }`}
                  >
                    <div className="text-sm sm:text-base text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs">
                <label className="block font-semibold text-foreground mb-1">Which schedule window fits your routine best?</label>
                <div className="space-y-2">
                  {['Saturday mornings (9:00 AM – 1:00 PM)', 'Weekday evenings (6:00 PM – 9:00 PM)', 'Daytime during school hours'].map((sc) => (
                    <label key={sc} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-background border border-border">
                      <input
                        type="checkbox"
                        checked={schedules.includes(sc)}
                        onChange={(e) => {
                          if (e.target.checked) setSchedules([...schedules, sc]);
                          else setSchedules(schedules.filter((x) => x !== sc));
                        }}
                        className="rounded border-border text-primary"
                      />
                      <span>{sc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: EMAIL & REVIEW */}
          {step === 6 && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Question 6 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Where should we save your career roadmap?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter your email address to receive a copy in Dev Outbox and save your progress if you apply.
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Your Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-4 rounded-2xl border border-border bg-accent/20 text-xs text-muted-foreground leading-relaxed">
                <strong>Privacy Promise:</strong> Tech-Moms never shares your personal information. Our quiz uses only your skills, goals, and schedule to build your career recommendations.
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishQuiz}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>Calculate My Career Pathways</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUIZ RESULTS VIEW */}
      {resultsReady && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              ✓ Analysis Complete
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
              Your Top 3 Career Pathways
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Based on your goals and schedule, here is your customized roadmap to entering Utah's technology sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.path.id}
                className={`rounded-3xl border p-6 shadow-sm flex flex-col justify-between space-y-4 ${
                  idx === 0 ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Rank #{idx + 1} Pathway
                    </span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 font-black text-xs px-2.5 py-0.5">
                      {rec.score}% Match
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground">{rec.path.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{rec.path.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <strong className="text-foreground">Salary Estimate:</strong>{' '}
                      <span className="text-primary font-bold">{rec.path.salaryRangeEstimate}</span>
                    </div>
                    <div>
                      <strong className="text-foreground">Typical Entry Roles:</strong>{' '}
                      <span className="text-muted-foreground">{rec.path.entryRoles.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>

                  {/* Starter Roadmap Sequence */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Starter Sequence</span>
                    <div className="space-y-1 text-xs">
                      {rec.steps.map((st, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{catalog.find((c) => c.id === st.catalogItemId)?.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <NextLink
                    href="/roadmap"
                    className="w-full text-center block rounded-xl bg-primary text-primary-foreground font-bold text-xs py-2.5 hover:bg-primary/90 transition shadow-sm"
                  >
                    Open Full Interactive Roadmap
                  </NextLink>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-base text-foreground">Want to save these recommendations?</h4>
              <p className="text-xs text-muted-foreground">Send a copy directly to your inbox (viewable in Dev Outbox).</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEmailResults}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent transition"
              >
                <Mail className="h-4 w-4" />
                <span>{emailSent ? '✓ Emailed to Outbox' : 'Email My Results'}</span>
              </button>

              <NextLink
                href="/roadmap"
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-bold hover:bg-primary/90 transition shadow-sm"
              >
                <span>Launch Interactive Roadmap</span>
                <ArrowRight className="h-4 w-4" />
              </NextLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
