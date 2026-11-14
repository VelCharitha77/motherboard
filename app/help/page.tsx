'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  HelpCircle,
  Plus,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { HelpQueue, HelpTicket } from '@/lib/data/types';

export default function HelpPage() {
  const { currentUser, can } = useAuth();
  const { t } = useI18n();

  const isStaff = can('help:manage_tickets');
  const tickets = isStaff
    ? db.help.listTickets()
    : currentUser
    ? db.help.listTickets({ requesterId: currentUser.id })
    : [];

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id ?? null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New ticket state
  const [newQueue, setNewQueue] = useState<HelpQueue>('funding');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? tickets[0];
  const ticketMessages = selectedTicket ? db.help.getMessages(selectedTicket.id) : [];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSubject || !newBody) return;
    const ticket = db.help.createTicket({
      requesterId: currentUser.id,
      queue: newQueue,
      subject: newSubject,
      body: newBody,
    });
    setCreateModalOpen(false);
    setNewSubject('');
    setNewBody('');
    setSelectedTicketId(ticket.id);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTicket || !replyBody) return;
    db.help.replyTicket({
      ticketId: selectedTicket.id,
      authorId: currentUser.id,
      body: replyBody,
      internalNote: isInternalNote && isStaff,
    });
    setReplyBody('');
    setIsInternalNote(false);
  };

  const handleStatusChange = (status: HelpTicket['status']) => {
    if (!currentUser || !selectedTicket) return;
    db.help.updateTicket(currentUser.id, selectedTicket.id, { status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary" />
            <span>{t('nav.askStaff', 'Ask Staff Help Desk')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Direct communication with Tech-Moms admissions, funding, careers, and technical staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Help Ticket</span>
        </button>
      </div>

      {/* Main Ticket Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Ticket List Column */}
        <div className="border-r border-border bg-accent/20 flex flex-col justify-between">
          <div className="p-3 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isStaff ? 'All Queues' : 'My Tickets'} ({tickets.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No tickets open.</div>
            ) : (
              tickets.map((tkt) => {
                const isSelected = selectedTicket?.id === tkt.id;
                const requester = db.users.getById(tkt.requesterId);
                return (
                  <div
                    key={tkt.id}
                    onClick={() => setSelectedTicketId(tkt.id)}
                    className={`p-3.5 cursor-pointer transition ${
                      isSelected ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
                      <span className="rounded bg-accent px-1.5 py-0.2 uppercase font-bold text-[10px]">
                        {tkt.queue.replace('_', ' ')}
                      </span>
                      <span className={`font-bold capitalize text-[10px] ${
                        tkt.status === 'resolved' ? 'text-emerald-600' : tkt.status === 'in_progress' ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        {tkt.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">{tkt.subject}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isStaff ? `By ${requester?.name}` : new Date(tkt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Ticket Conversation View */}
        <div className="md:col-span-2 flex flex-col justify-between bg-background">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Ticket #{selectedTicket.id.substring(4)} • Queue: {selectedTicket.queue.toUpperCase()}
                  </span>
                  <h3 className="font-bold text-base text-foreground mt-0.5">{selectedTicket.subject}</h3>
                </div>

                {isStaff && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Status:</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value as any)}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticketMessages.map((msg) => {
                  const author = db.users.getById(msg.authorId);
                  const isStaffMember = db.users.getRoles(msg.authorId).some((r) => r.role === 'staff' || r.role === 'admin');

                  // Hide internal notes from non-staff
                  if (msg.internalNote && !isStaff) return null;

                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm space-y-1 ${
                        msg.internalNote
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200'
                          : isStaffMember
                          ? 'border-primary/30 bg-primary/5 text-foreground'
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-xs">
                        <span className="flex items-center gap-1.5">
                          {msg.internalNote && <Lock className="h-3.5 w-3.5 text-amber-600" />}
                          {author?.name}{' '}
                          {isStaffMember && <span className="text-[10px] text-primary font-bold">(Staff)</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{msg.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-card space-y-2">
                {isStaff && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-border text-amber-600 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Add as Internal Staff Note (Hidden from Student)
                    </span>
                  </label>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={isInternalNote ? 'Write internal note for staff review...' : 'Reply to student...'}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!replyBody}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground text-sm">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <span>Select a ticket on the left or create a new request.</span>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Ask Staff Help Desk</h3>
            <p className="text-xs text-muted-foreground">Select a queue to route your question to the dedicated coordinator.</p>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Queue</label>
                <select
                  value={newQueue}
                  onChange={(e) => setNewQueue(e.target.value as HelpQueue)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                >
                  <option value="admissions">Admissions & Applications</option>
                  <option value="funding">Funding, Scholarships & Utah DWS</option>
                  <option value="careers">Careers, Resumes & Placements</option>
                  <option value="tech_support">Technical Support & Zoom/Tools</option>
                  <option value="general">General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Question about DWS childcare voucher paperwork"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Details</label>
                <textarea
                  rows={4}
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Describe your situation in detail..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
