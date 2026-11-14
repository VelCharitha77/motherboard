'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  MessageSquare,
  Hash,
  Lock,
  Send,
  HelpCircle,
  CheckCircle2,
  Smile,
  Code2,
  Paperclip,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Archive,
  Volume2,
  VolumeX,
  Moon,
  Users,
} from 'lucide-react';
import { Message, NotifyLevel, Space } from '@/lib/data/types';

export default function MessagesPage() {
  const { currentUser, can } = useAuth();
  const { t } = useI18n();

  const userSpaces = currentUser ? db.messages.listSpacesForUser(currentUser.id) : [];
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(userSpaces[0]?.id ?? 'spc_online_w27');

  const selectedSpace = db.messages.getSpace(selectedSpaceId) ?? userSpaces[0];
  const messages = selectedSpace ? db.messages.listMessages(selectedSpace.id) : [];

  const [messageText, setMessageText] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [threadParentMessage, setThreadParentMessage] = useState<Message | null>(null);

  // Subchannel creation modal
  const [subchannelModalOpen, setSubchannelModalOpen] = useState(false);
  const [newSubchannelName, setNewSubchannelName] = useState('');
  const [newSubchannelDesc, setNewSubchannelDesc] = useState('');

  // DM Preference
  const dmPref = currentUser ? db.users.getDmPreference(currentUser.id) : undefined;
  const [isQuiet, setIsQuiet] = useState(false);

  React.useEffect(() => {
    const hours = new Date().getHours();
    setIsQuiet(hours >= 21 || hours < 7);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedSpace || (!messageText && !codeSnippet)) return;

    db.messages.sendMessage({
      spaceId: selectedSpace.id,
      authorId: currentUser.id,
      body: messageText,
      isQuestion,
      codeSnippet: codeSnippet ? { language: codeLanguage || 'javascript', code: codeSnippet } : undefined,
      parentId: threadParentMessage?.id,
    });

    setMessageText('');
    setIsQuestion(false);
    setCodeSnippet('');
    setShowCodeInput(false);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    db.messages.toggleReaction(messageId, currentUser.id, emoji);
  };

  const handleResolveQuestion = (messageId: string) => {
    if (!currentUser) return;
    db.messages.markQuestionResolved(messageId, currentUser.id);
  };

  const handleSimulateReply = () => {
    if (!currentUser || !selectedSpace) return;
    db.messages.simulateIncomingReply(selectedSpace.id, currentUser.id);
  };

  const handleCreateSubchannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSubchannelName || !selectedSpace?.cohortId) return;
    const space = db.messages.createSubchannel(currentUser.id, selectedSpace.cohortId, newSubchannelName, newSubchannelDesc);
    setSubchannelModalOpen(false);
    setNewSubchannelName('');
    setNewSubchannelDesc('');
    setSelectedSpaceId(space.id);
  };

  const handleReportMessage = (msg: Message) => {
    if (!currentUser) return;
    const reason = prompt('Please describe why you are reporting this message to staff moderation:');
    if (reason) {
      db.moderation.report({
        targetType: 'message',
        targetId: msg.id,
        reportedByUserId: currentUser.id,
        reason,
        previewText: msg.body.substring(0, 100),
      });
      alert('Message reported to staff moderation queue for review.');
    }
  };

  const canCreateSubchannel = can('learn:manage_cohort', { cohortId: selectedSpace?.cohortId });
  const isStaffOrInstructor = can('message:resolve_question', { space: selectedSpace });

  return (
    <div className="h-[calc(100vh-10rem)] rounded-2xl border border-border bg-card shadow-sm flex overflow-hidden">
      {/* Spaces & Channels Sidebar */}
      <div className="w-64 sm:w-72 shrink-0 border-r border-border bg-accent/20 flex flex-col justify-between">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Spaces & Channels</span>
          {canCreateSubchannel && (
            <button
              type="button"
              onClick={() => setSubchannelModalOpen(true)}
              className="text-xs text-primary font-bold hover:underline"
              title="Add cohort sub-channel"
            >
              + Subchannel
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {userSpaces.map((spc) => {
            const isSelected = selectedSpace?.id === spc.id;
            return (
              <button
                key={spc.id}
                type="button"
                onClick={() => {
                  setSelectedSpaceId(spc.id);
                  setThreadParentMessage(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-2 transition ${
                  isSelected ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {spc.type === 'dm' || spc.type === 'group_dm' ? (
                    <Users className="h-4 w-4 shrink-0" />
                  ) : spc.type === 'staff' || spc.type === 'instructor_staff' ? (
                    <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                  ) : spc.readOnly ? (
                    <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Hash className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{spc.name}</span>
                </div>
                {spc.readOnly && <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground">Archived</span>}
              </button>
            );
          })}
        </div>

        {/* Quiet Hours Status Notice */}
        {isQuiet && (
          <div className="p-3 border-t border-border bg-accent/30 text-[11px] text-muted-foreground flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>Quiet hours active (9pm–7am). Urgent alerts still deliver.</span>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Channel Header */}
        <div className="h-14 border-b border-border px-4 sm:px-6 flex items-center justify-between gap-3 bg-card/50">
          <div className="flex items-center gap-2 truncate">
            <h2 className="font-bold text-sm sm:text-base text-foreground truncate">{selectedSpace?.name}</h2>
            {selectedSpace?.description && (
              <span className="text-xs text-muted-foreground hidden md:inline truncate">• {selectedSpace.description}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateReply}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold hover:bg-accent text-primary transition"
              title="Simulate incoming reply"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Simulate Reply</span>
            </button>
          </div>
        </div>

        {/* Read-Only Notice for >90 Day Archived Cohort */}
        {selectedSpace?.readOnly && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Archive className="h-4 w-4 shrink-0" />
            <span>{selectedSpace.archivedReason || 'This channel is archived and read-only.'}</span>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No messages in this space yet. Say hello or ask a question!
            </div>
          ) : (
            messages.map((msg) => {
              const author = db.users.getById(msg.authorId);
              const isMe = currentUser?.id === msg.authorId;
              const hasCode = !!msg.codeSnippet;

              return (
                <div key={msg.id} className="group flex items-start gap-3 text-xs sm:text-sm">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs ${author?.avatarColor ?? 'bg-primary'}`}>
                    {author?.avatarInitials ?? 'U'}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs">{author?.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.isQuestion && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          msg.resolvedBy ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          <HelpCircle className="h-3 w-3" />
                          {msg.resolvedBy ? 'Resolved Q&A' : 'Question'}
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{msg.body}</p>

                    {/* Code Snippet Box */}
                    {hasCode && (
                      <div className="rounded-xl border border-border/80 bg-zinc-950 p-3 text-xs font-mono text-zinc-100 overflow-x-auto my-1.5 shadow-sm">
                        <div className="text-[10px] text-zinc-400 pb-1 border-b border-zinc-800 uppercase font-bold tracking-wider">
                          {msg.codeSnippet?.language}
                        </div>
                        <pre className="pt-2">{msg.codeSnippet?.code}</pre>
                      </div>
                    )}

                    {/* Reactions Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {Object.entries(msg.reactions || {}).map(([emoji, uids]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/50 px-2 py-0.5 text-xs hover:bg-accent transition"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{uids.length}</span>
                        </button>
                      ))}

                      {/* Add Reaction Triggers */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {['❤️', '💡', '🙌', '🎉'].map((emo) => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => handleReaction(msg.id, emo)}
                            className="hover:scale-110 transition p-1 text-xs"
                            title={`React with ${emo}`}
                          >
                            {emo}
                          </button>
                        ))}

                        {msg.isQuestion && !msg.resolvedBy && isStaffOrInstructor && (
                          <button
                            type="button"
                            onClick={() => handleResolveQuestion(msg.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline px-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleReportMessage(msg)}
                          className="text-[11px] text-muted-foreground hover:text-red-600 px-1"
                          title="Report message"
                        >
                          <ShieldAlert className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Bar (Disabled if read-only) */}
        {!selectedSpace?.readOnly && (
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card space-y-2">
            {showCodeInput && (
              <div className="space-y-1.5 bg-accent/30 p-2.5 rounded-xl border border-border">
                <input
                  type="text"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  placeholder="Language (e.g. css, html, sql, js)"
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono focus:outline-none"
                />
                <textarea
                  rows={3}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste code snippet here..."
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs font-mono focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${selectedSpace?.name}...`}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className={`p-2 rounded-xl border border-border hover:bg-accent transition ${
                  showCodeInput ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
                title="Attach code snippet"
              >
                <Code2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsQuestion(!isQuestion)}
                className={`p-2 rounded-xl border border-border hover:bg-accent transition ${
                  isQuestion ? 'bg-amber-500/10 text-amber-600 font-bold' : 'text-muted-foreground'
                }`}
                title="Mark as question"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              <button
                type="submit"
                disabled={!messageText && !codeSnippet}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SUBCHANNEL CREATION MODAL */}
      {subchannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Create Cohort Sub-channel</h3>
            <p className="text-xs text-muted-foreground">e.g. #homework-help, #week-4-css, #project-brainstorm</p>
            <form onSubmit={handleCreateSubchannel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Subchannel Name</label>
                <input
                  type="text"
                  required
                  value={newSubchannelName}
                  onChange={(e) => setNewSubchannelName(e.target.value)}
                  placeholder="homework-help-javascript"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <input
                  type="text"
                  value={newSubchannelDesc}
                  onChange={(e) => setNewSubchannelDesc(e.target.value)}
                  placeholder="Collaborative coding and debugging assistance"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubchannelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
