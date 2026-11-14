'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  FolderGit2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Award,
  ExternalLink,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Pause,
  Star,
  Check,
  Send,
  Kanban,
} from 'lucide-react';
import { Project, ProjectJoinMode, ProjectOpenRole, ProjectStatus, ProjectType, ProjectVisibility } from '@/lib/data/types';

export default function ProjectsPage() {
  const router = useRouter();
  const { currentUser, can } = useAuth();
  const { locale, t } = useI18n();

  const projects = db.projects.list();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [openSpotsOnly, setOpenSpotsOnly] = useState(false);

  // Selected project modal / detail
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  // Create Project Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('portfolio');
  const [skillsText, setSkillsText] = useState('HTML/CSS, JavaScript');
  const [timeCommitment, setTimeCommitment] = useState('3–5 hrs/week');
  const [schedule, setSchedule] = useState<Project['schedule']>('evenings');
  const [endDate, setEndDate] = useState('2027-05-01');
  const [maxMembers, setMaxMembers] = useState(4);
  const [joinMode, setJoinMode] = useState<ProjectJoinMode>('open');
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [allowQuestions, setAllowQuestions] = useState(true);
  const [beginnerFriendly, setBeginnerFriendly] = useState(true);
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  // Ask owner modal
  const [askOwnerModalOpen, setAskOwnerModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');

  // Request to join modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [desiredRole, setDesiredRole] = useState('');
  const [joinNote, setJoinNote] = useState('');

  // Project updates & tasks
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (beginnerOnly && !p.beginnerFriendly) return false;
    if (openSpotsOnly) {
      const openCount = p.openRoles.reduce((acc, r) => acc + (r.count - r.filled), 0);
      if (openCount <= 0) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const recommendedProjects = projects.filter((p) => p.featured || p.status === 'recruiting').slice(0, 3);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title || !description) return;
    const isMentorOrSponsor = can('sponsor:view_portal') || db.users.getRoles(currentUser.id).some((r) => r.role === 'mentor');
    const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    const newProject = db.projects.create(currentUser.id, {
      ownerId: currentUser.id,
      title,
      description,
      type,
      skills,
      openRoles: [
        { title: 'Front-End Contributor', count: 2, filled: 0 },
        { title: 'QA / Documentation', count: 1, filled: 0 },
      ],
      timeCommitment,
      schedule,
      endDate,
      maxMembers,
      beginnerFriendly,
      joinMode,
      visibility,
      allowQuestions,
      faq: faqQ && faqA ? [{ question: faqQ, answer: faqA }] : [],
      links: {},
      requiresApproval: isMentorOrSponsor,
    });
    setCreateModalOpen(false);
    setSelectedProjectId(newProject.id);
  };

  const handleAskOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject || !questionText) return;
    db.projects.askProjectOwner(selectedProject.id, currentUser.id, questionText);
    setAskOwnerModalOpen(false);
    setQuestionText('');
    alert('Your question has been sent directly to the project owner via Messages.');
  };

  const handleJoinProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject) return;
    if (selectedProject.joinMode === 'open') {
      db.projects.joinOpenProject(selectedProject.id, currentUser.id, desiredRole || 'Project Contributor');
      setJoinModalOpen(false);
      alert('You have joined the project team! Check Messages for the project channel.');
    } else {
      db.projects.requestToJoin(selectedProject.id, currentUser.id, desiredRole || 'Project Contributor', joinNote);
      setJoinModalOpen(false);
      alert('Your request to join has been submitted to the owner for approval.');
    }
  };

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProject || !newUpdateText) return;
    db.projects.postUpdate(selectedProject.id, currentUser.id, newUpdateText);
    setNewUpdateText('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle) return;
    db.projects.createTask(selectedProject.id, { title: newTaskTitle });
    setNewTaskTitle('');
  };

  const handleConfirmRole = (confirmedRoleTitle: string) => {
    if (!currentUser || !selectedProject) return;
    db.projects.confirmMemberRole(selectedProject.id, currentUser.id, confirmedRoleTitle);
    alert('Confirmed! Your project contribution is now featured on your Talent Profile in Careers.');
  };

  const handleEndorseMember = (memberUserId: string) => {
    if (!currentUser || !selectedProject) return;
    const note = prompt('Add instructor endorsement note for this student:');
    if (note) {
      db.projects.endorseMember(currentUser.id, selectedProject.id, memberUserId, note);
      alert('Endorsement added to member profile.');
    }
  };

  const handleFeatureToggle = () => {
    if (!currentUser || !selectedProject) return;
    db.projects.toggleFeatured(currentUser.id, selectedProject.id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FolderGit2 className="h-7 w-7 text-primary" />
            <span>{t('projects.title', 'Community Projects Board')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Build hands-on portfolio work, collaborate with cohort peers, and showcase verified skills to hiring employers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t('projects.startProject', 'Start a Project')}</span>
        </button>
      </div>

      {/* Recommended For You Row */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Recommended For You</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedProjects.map((prj) => (
            <div
              key={prj.id}
              onClick={() => setSelectedProjectId(prj.id)}
              className="p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:border-primary cursor-pointer transition flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  {prj.type.replace('_', ' ')}
                </span>
                <h4 className="font-bold text-sm text-foreground mt-1 line-clamp-1">{prj.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{prj.description}</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                <span>{prj.timeCommitment}</span>
                <span className="font-bold text-primary">Open Workspace →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, description, or skill (e.g. SQL, React, CSS)..."
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="portfolio">Portfolio</option>
            <option value="capstone">Capstone</option>
            <option value="nonprofit_client">Nonprofit Client</option>
            <option value="study_group">Study Group</option>
            <option value="sponsored">Sponsored Project</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="recruiting">Recruiting</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused (30d inactive)</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-2 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={beginnerOnly}
              onChange={(e) => setBeginnerOnly(e.target.checked)}
              className="rounded border-border text-primary"
            />
            <span>Beginner Friendly</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-2 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={openSpotsOnly}
              onChange={(e) => setOpenSpotsOnly(e.target.checked)}
              className="rounded border-border text-primary"
            />
            <span>Has Open Spots</span>
          </label>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((prj) => {
          const owner = db.users.getById(prj.ownerId);
          const members = db.projects.listMembers(prj.id);
          const totalSpots = prj.openRoles.reduce((s, r) => s + r.count, 0);
          const filledSpots = prj.openRoles.reduce((s, r) => s + r.filled, 0);
          const spotsLeft = Math.max(0, totalSpots - filledSpots);

          return (
            <div
              key={prj.id}
              onClick={() => setSelectedProjectId(prj.id)}
              className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 ${
                prj.status === 'paused'
                  ? 'border-border bg-accent/20 opacity-80'
                  : prj.featured
                  ? 'border-primary/40 bg-card hover:border-primary'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    {prj.type.replace('_', ' ')}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                      prj.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : prj.status === 'in_progress'
                        ? 'bg-blue-500/10 text-blue-600'
                        : prj.status === 'paused'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {prj.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground leading-snug line-clamp-1">{prj.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{prj.description}</p>
                </div>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {prj.skills.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {s}
                    </span>
                  ))}
                  {prj.skills.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{prj.skills.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold ${owner?.avatarColor ?? 'bg-primary'}`}>
                    {owner?.avatarInitials ?? 'U'}
                  </div>
                  <span className="truncate max-w-[100px]">{owner?.name.split(' ')[0]}</span>
                </div>

                <div className="flex items-center gap-2">
                  {prj.status === 'paused' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                      <Pause className="h-3 w-3" /> Inactive
                    </span>
                  ) : (
                    <span className="font-semibold text-foreground">{spotsLeft} spots left</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT DETAIL & WORKSPACE MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {selectedProject.type.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold capitalize">
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                  {selectedProject.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Star className="h-3 w-3" /> Featured Project
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">{selectedProject.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Led by {db.users.getById(selectedProject.ownerId)?.name} • Commitment: {selectedProject.timeCommitment} ({selectedProject.schedule})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Description & Skill Tags */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {selectedProject.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.skills.map((s) => (
                  <span key={s} className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Inactivity Warning if Paused */}
            {selectedProject.status === 'paused' && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>This project was automatically marked Paused due to 30 days of inactivity. The owner can post an update to reactivate it.</span>
              </div>
            )}

            {/* Action Bar: Ask Owner, Join, Project Channel */}
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-border bg-accent/20">
              {/* Ask About This Project Button */}
              {selectedProject.allowQuestions && (
                <button
                  type="button"
                  disabled={!can('project:ask_owner', { project: selectedProject })}
                  onClick={() => setAskOwnerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent transition disabled:opacity-50"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Ask Owner a Question</span>
                </button>
              )}

              {/* Join / Request to Join */}
              <button
                type="button"
                disabled={!can('project:join')}
                onClick={() => setJoinModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
              >
                <Users className="h-3.5 w-3.5" />
                <span>{selectedProject.joinMode === 'open' ? 'Join Project Team' : 'Request to Join'}</span>
              </button>

              <NextLink
                href="/messages"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-accent text-primary transition"
              >
                <span>Go to #prj-{selectedProject.id.substring(4)} in Messages →</span>
              </NextLink>

              {can('project:moderate') && (
                <button
                  type="button"
                  onClick={handleFeatureToggle}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground ml-auto"
                >
                  {selectedProject.featured ? 'Unfeature' : 'Feature on Public Impact'}
                </button>
              )}
            </div>

            {/* Team Members & Open Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Project Team</h4>
                <div className="space-y-2">
                  {db.projects.listMembers(selectedProject.id).map((m) => {
                    const u = db.users.getById(m.userId);
                    return (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${u?.avatarColor}`}>
                            {u?.avatarInitials}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{u?.name}</span>
                            <p className="text-[10px] text-muted-foreground">{m.roleTitle}</p>
                          </div>
                        </div>

                        {/* Role confirmation & Endorsement controls */}
                        <div className="flex items-center gap-1.5">
                          {currentUser?.id === m.userId && !m.confirmedRole && (
                            <button
                              type="button"
                              onClick={() => handleConfirmRole(m.roleTitle)}
                              className="text-[10px] text-primary font-bold hover:underline"
                            >
                              Confirm for Talent Profile
                            </button>
                          )}
                          {can('project:endorse') && currentUser?.id !== m.userId && (
                            <button
                              type="button"
                              onClick={() => handleEndorseMember(m.userId)}
                              className="text-[10px] text-emerald-600 font-bold hover:underline"
                            >
                              Endorse
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Open Roles</h4>
                <div className="space-y-2">
                  {selectedProject.openRoles.map((r) => (
                    <div key={r.title} className="flex items-center justify-between text-xs p-2 rounded-lg bg-accent/30">
                      <span className="font-semibold text-foreground">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.filled} / {r.count} filled
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Member Workspace: Kanban Task Board & Updates */}
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Kanban className="h-4 w-4 text-primary" />
                  <span>Team Task Board (Kanban)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['todo', 'doing', 'done'] as const).map((statusKey) => {
                  const tasks = db.projects.listTasks(selectedProject.id).filter((t) => t.status === statusKey);
                  return (
                    <div key={statusKey} className="rounded-xl border border-border bg-accent/20 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>{statusKey}</span>
                        <span className="rounded bg-accent px-1.5 py-0.2">{tasks.length}</span>
                      </div>
                      <div className="space-y-2">
                        {tasks.map((tsk) => (
                          <div key={tsk.id} className="p-2.5 rounded-lg border border-border bg-card text-xs space-y-1 shadow-sm">
                            <span className="font-medium text-foreground">{tsk.title}</span>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                              <span>Due: {tsk.dueDate || 'Flexible'}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  db.projects.updateTaskStatus(
                                    tsk.id,
                                    statusKey === 'todo' ? 'doing' : statusKey === 'doing' ? 'done' : 'todo'
                                  )
                                }
                                className="text-primary font-bold hover:underline"
                              >
                                {statusKey === 'todo' ? 'Start →' : statusKey === 'doing' ? 'Complete ✓' : 'Restart'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Task input */}
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task for the project team..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Add Task
                </button>
              </form>
            </div>

            {/* Updates Feed */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Project Updates</h4>
              <div className="space-y-2">
                {db.projects.listUpdates(selectedProject.id).map((upd) => {
                  const author = db.users.getById(upd.authorId);
                  return (
                    <div key={upd.id} className="p-3 rounded-xl bg-accent/30 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>{author?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(upd.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground">{upd.body}</p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handlePostUpdate} className="flex gap-2">
                <input
                  type="text"
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="Post progress update to project feed..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!newUpdateText}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Post Update
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ASK OWNER QUESTION MODAL */}
      {askOwnerModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Ask About {selectedProject.title}</h3>
            <p className="text-xs text-muted-foreground">
              This sends a direct message to the project lead with this project attached as context. Limited to 1 unanswered ping.
            </p>

            <form onSubmit={handleAskOwner} className="space-y-3">
              <textarea
                rows={4}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ask about time commitment, tools used, or how you can contribute..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAskOwnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN / REQUEST TO JOIN MODAL */}
      {joinModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">
              {selectedProject.joinMode === 'open' ? 'Join Project Team' : 'Request to Join Project'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedProject.joinMode === 'open'
                ? 'This is an open project! Select your desired role to join immediately.'
                : 'Send a note to the project lead explaining your interest and skills.'}
            </p>

            <form onSubmit={handleJoinProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Desired Role</label>
                <input
                  type="text"
                  required
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  placeholder="e.g. Front-End Contributor or QA Tester"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {selectedProject.joinMode !== 'open' && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Note for Project Owner</label>
                  <textarea
                    rows={3}
                    required
                    value={joinNote}
                    onChange={(e) => setJoinNote(e.target.value)}
                    placeholder="Tell the owner why you are excited to collaborate..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Confirm & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Start a New Project</h3>
            <p className="text-xs text-muted-foreground">Collaborate with fellow Tech-Moms on real portfolio applications.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bilingual Children's Audio Reader"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are we building, why does it matter, and what will members learn?"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Project Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProjectType)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                  >
                    <option value="portfolio">Portfolio Build</option>
                    <option value="capstone">Cohort Capstone</option>
                    <option value="nonprofit_client">Nonprofit Client</option>
                    <option value="study_group">Certification Study Group</option>
                    <option value="open_source">Open Source Contribution</option>
                    <option value="hackathon">Hackathon Team</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Join Mode</label>
                  <select
                    value={joinMode}
                    onChange={(e) => setJoinMode(e.target.value as ProjectJoinMode)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                  >
                    <option value="open">Open (Anyone joins instantly)</option>
                    <option value="request">Request to Join (Owner approves)</option>
                    <option value="invite">Invite Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Skills Needed (Comma separated)</label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="HTML/CSS, JavaScript, SQL, Figma"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-6 text-xs text-foreground pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={beginnerFriendly}
                    onChange={(e) => setBeginnerFriendly(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>Beginner Friendly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowQuestions}
                    onChange={(e) => setAllowQuestions(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  <span>Allow Non-Member Questions</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
