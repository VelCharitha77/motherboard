'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  Pin,
  Send,
  Users,
  Search,
  MessageSquare,
  Building2,
  Sparkles,
} from 'lucide-react';
import { AnnouncementPriority, AudienceFilter, Role } from '@/lib/data/types';

export default function AnnouncementsPage() {
  const { currentUser, can } = useAuth();
  const { locale, t } = useI18n();

  const [activeTab, setActiveTab] = useState<'feed' | 'compose' | 'partner_request' | 'archive'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [bodyEs, setBodyEs] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [requiresAck, setRequiresAck] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Partner Request fields
  const [reqTitle, setReqTitle] = useState('');
  const [reqBody, setReqBody] = useState('');
  const [reqAudience, setReqAudience] = useState('');

  // Comment state
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const announcements = db.announcements.list();
  const cohorts = db.cohorts.list();

  const audienceFilter: AudienceFilter = {
    roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    cohortIds: selectedCohortIds.length > 0 ? selectedCohortIds : undefined,
    cities: selectedCities.length > 0 ? selectedCities : undefined,
  };

  const recipientCount = db.announcements.resolveRecipients(audienceFilter).length;
  const canPost = can('announcement:post');
  const canRequest = can('announcement:request');

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title || !body) return;
    db.announcements.create({
      authorId: currentUser.id,
      title,
      body,
      titleEs: titleEs || undefined,
      bodyEs: bodyEs || undefined,
      priority,
      audienceFilter,
      requiresAck,
      commentsEnabled,
      pinned,
    });
    setTitle('');
    setBody('');
    setTitleEs('');
    setBodyEs('');
    setActiveTab('feed');
  };

  const handleSendPartnerRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reqTitle || !reqBody) return;
    db.announcements.requestAnnouncement({
      requesterId: currentUser.id,
      orgId: 'org_northpeak',
      title: reqTitle,
      body: reqBody,
      audienceNote: reqAudience,
    });
    setReqTitle('');
    setReqBody('');
    setReqAudience('');
    alert('Announcement request submitted to Tech-Moms staff for review.');
    setActiveTab('feed');
  };

  const handleAcknowledge = (ancId: string) => {
    if (!currentUser) return;
    db.announcements.acknowledge(ancId, currentUser.id);
  };

  const handleNudge = (ancId: string) => {
    if (!currentUser) return;
    const count = db.announcements.nudgeUnacknowledged(currentUser.id, ancId);
    alert(`Sent email reminders to ${count} unacknowledged recipients.`);
  };

  const handleAddComment = (ancId: string) => {
    if (!currentUser || !newCommentText) return;
    db.announcements.addComment(ancId, currentUser.id, newCommentText);
    setNewCommentText('');
    setActiveCommentId(null);
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            <span>{t('announcements.title', 'Announcements')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Targeted announcements with delivery simulation to Dev Outbox, receipts, and required acknowledgements.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'feed' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Announcement Feed
          </button>
          {canPost && (
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'compose' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Compose
            </button>
          )}
          {canRequest && (
            <button
              type="button"
              onClick={() => setActiveTab('partner_request')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'partner_request' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Request Post
            </button>
          )}
        </div>
      </div>

      {/* TAB: COMPOSE ANNOUNCEMENT */}
      {activeTab === 'compose' && canPost && (
        <form onSubmit={handlePostAnnouncement} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 max-w-4xl">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-foreground">Compose Targeted Announcement</h2>
            <p className="text-xs text-muted-foreground">Select priority to determine in-app, email, and SMS delivery channels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Title (English)</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update for In-Person Saturday"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Title (Spanish Optional)</label>
              <input
                type="text"
                value={titleEs}
                onChange={(e) => setTitleEs(e.target.value)}
                placeholder="Título en Español..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Message Body (English)</label>
              <textarea
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement details here..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Message Body (Spanish Optional)</label>
              <textarea
                rows={4}
                value={bodyEs}
                onChange={(e) => setBodyEs(e.target.value)}
                placeholder="Contenido en Español..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Priority Levels */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Delivery Priority</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { p: 'normal' as const, label: 'Normal Priority', desc: 'In-app feed + daily digest email' },
                { p: 'important' as const, label: 'Important', desc: 'In-app feed + immediate direct email' },
                { p: 'urgent' as const, label: 'URGENT', desc: 'In-app banner + email + SMS alert' },
              ].map(({ p, label, desc }) => (
                <div
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    priority === p ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${p === 'urgent' ? 'text-red-600' : 'text-primary'}`}>
                      {label}
                    </span>
                    {priority === p && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audience Filter Builder */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-accent/20">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">Stack Audience Filters</span>
              <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-bold shadow-sm">
                {recipientCount} recipients selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Roles</label>
                <select
                  multiple
                  value={selectedRoles}
                  onChange={(e) => setSelectedRoles(Array.from(e.target.selectedOptions, (o) => o.value as Role))}
                  className="w-full rounded-lg border border-border bg-background p-1.5 h-20"
                >
                  <option value="student">Students</option>
                  <option value="alumni">Alumni</option>
                  <option value="applicant">Applicants</option>
                  <option value="instructor">Instructors & TAs</option>
                  <option value="employer">Employers</option>
                  <option value="mentor">Mentors</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Cohorts</label>
                <select
                  multiple
                  value={selectedCohortIds}
                  onChange={(e) => setSelectedCohortIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className="w-full rounded-lg border border-border bg-background p-1.5 h-20"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Utah Cities</label>
                <select
                  multiple
                  value={selectedCities}
                  onChange={(e) => setSelectedCities(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className="w-full rounded-lg border border-border bg-background p-1.5 h-20"
                >
                  <option value="Salt Lake City">Salt Lake City</option>
                  <option value="Lehi">Lehi</option>
                  <option value="Sandy">Sandy</option>
                  <option value="St. George">St. George</option>
                  <option value="Orem">Orem</option>
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-foreground pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="font-semibold">Require "I've read this" Acknowledgement</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="font-semibold">Pin to top of Cohort Home</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(e) => setCommentsEnabled(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="font-semibold">Allow Student Questions & Comments</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
            >
              <Send className="h-4 w-4" />
              <span>Publish & Dispatch ({recipientCount} recipients)</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB: PARTNER REQUEST FORM */}
      {activeTab === 'partner_request' && (
        <form onSubmit={handleSendPartnerRequest} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-2xl">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-foreground">Request an Announcement</h2>
            <p className="text-xs text-muted-foreground">
              To keep student notifications focused, employer and sponsor announcements are reviewed by Tech-Moms staff before posting.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Proposed Title</label>
            <input
              type="text"
              required
              value={reqTitle}
              onChange={(e) => setReqTitle(e.target.value)}
              placeholder="e.g. Hiring Returnship Showcase Invitation"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Announcement Body</label>
            <textarea
              rows={4}
              required
              value={reqBody}
              onChange={(e) => setReqBody(e.target.value)}
              placeholder="Provide full description, dates, and application links..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Target Audience Notes</label>
            <input
              type="text"
              value={reqAudience}
              onChange={(e) => setReqAudience(e.target.value)}
              placeholder="e.g. Alumnae seeking data analytics or front-end jobs"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
          >
            Submit for Staff Approval
          </button>
        </form>
      )}

      {/* TAB: FEED & ARCHIVE */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements by title or content..."
              className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-4">
            {filteredAnnouncements.map((anc) => {
              const receipts = db.announcements.getReceipts(anc.id);
              const myReceipt = currentUser ? db.announcements.getUserReceipt(anc.id, currentUser.id) : undefined;
              const acks = receipts.filter((r) => r.acknowledgedAt);
              const comments = db.announcements.listComments(anc.id);
              const isAuthor = currentUser?.id === anc.authorId;

              return (
                <div
                  key={anc.id}
                  className={`rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 transition hover:border-primary/40 ${
                    anc.priority === 'urgent'
                      ? 'border-red-500/40 bg-red-500/5'
                      : anc.pinned
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                      {anc.priority === 'urgent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 dark:bg-red-950 px-2.5 py-0.5 rounded-full uppercase">
                          <AlertTriangle className="h-3 w-3" /> URGENT
                        </span>
                      ) : anc.priority === 'important' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full uppercase">
                          Important
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-accent px-2.5 py-0.5 rounded-full uppercase">
                          Normal
                        </span>
                      )}
                      {anc.pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(anc.createdAt).toLocaleDateString()} at {new Date(anc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {locale === 'es' && anc.titleEs ? anc.titleEs : anc.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {locale === 'es' && anc.bodyEs ? anc.bodyEs : anc.body}
                    </p>
                  </div>

                  {/* Actions & Acknowledgement */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      {anc.requiresAck && (
                        <>
                          {myReceipt?.acknowledgedAt ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Confirmed {new Date(myReceipt.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAcknowledge(anc.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs px-3.5 py-1.5 hover:bg-primary/90 transition shadow-sm"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{t('home.acknowledge', "I've read this")}</span>
                            </button>
                          )}
                        </>
                      )}

                      {anc.commentsEnabled && (
                        <button
                          type="button"
                          onClick={() => setActiveCommentId(activeCommentId === anc.id ? null : anc.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{comments.length} Comments</span>
                        </button>
                      )}
                    </div>

                    {/* Author Delivery Stats */}
                    {isAuthor && receipts.length > 0 && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          <strong>{receipts.length}</strong> delivered • <strong>{acks.length}</strong> acknowledged
                        </span>
                        {receipts.length > acks.length && (
                          <button
                            type="button"
                            onClick={() => handleNudge(anc.id)}
                            className="rounded-lg bg-accent hover:bg-border text-foreground font-semibold px-2.5 py-1 text-[11px] transition"
                          >
                            Nudge Unacknowledged
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Section Drawer */}
                  {activeCommentId === anc.id && (
                    <div className="pt-3 border-t border-border/50 space-y-3 animate-in fade-in">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {comments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No questions yet. Ask anything below!</p>
                        ) : (
                          comments.map((c) => {
                            const author = db.users.getById(c.authorId);
                            return (
                              <div key={c.id} className="p-2.5 rounded-xl bg-accent/40 text-xs space-y-1">
                                <div className="flex items-center justify-between font-semibold text-foreground">
                                  <span>{author?.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-muted-foreground">{c.body}</p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Ask a question or leave feedback..."
                          className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(anc.id)}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
