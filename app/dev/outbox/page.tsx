'use client';

import React, { useState } from 'react';
import { db } from '@/lib/data';
import { Mail, Smartphone, Clock, Search } from 'lucide-react';

export default function DevOutboxPage() {
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms' | 'digest' | 'push'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const outbox = db.outbox.list();

  const filtered = outbox.filter((msg) => {
    if (channelFilter !== 'all' && msg.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        msg.toName.toLowerCase().includes(q) ||
        msg.toAddress.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q) ||
        msg.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getChannelBadge = (ch: typeof channelFilter) => {
    switch (ch) {
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Smartphone className="h-3 w-3" />
            SMS
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
            <Mail className="h-3 w-3" />
            Email
          </span>
        );
      case 'digest':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:text-purple-300">
            <Clock className="h-3 w-3" />
            Daily Digest
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-semibold">
            {ch}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" />
            <span>Dev Outbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Simulated dispatch log for all outbound emails, SMS alerts, tax receipts, and daily digest summaries. Zero external API keys needed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            {outbox.length} Dispatched Messages
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient, email, subject, or message content..."
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'email', 'sms', 'digest'] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannelFilter(ch)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                channelFilter === ch
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Outbox Items List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            No dispatched messages match your filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition hover:border-primary/40 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2">
                  {getChannelBadge(item.channel)}
                  <span className="text-xs font-semibold text-foreground">
                    To: {item.toName}{' '}
                    <span className="text-muted-foreground font-normal">({item.toAddress})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded bg-accent px-1.5 py-0.5 uppercase tracking-wider text-[10px] font-bold">
                    {item.relatedModule}
                  </span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">{item.subject}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-accent/30 p-3 rounded-xl border border-border/40 font-mono">
                  {item.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
