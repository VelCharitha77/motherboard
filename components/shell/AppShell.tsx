'use client';

import React, { Suspense } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import NextLink from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { locale, t } = useI18n();

  // Check for any unacknowledged urgent announcements for the active user
  const urgentAnnouncements = db.announcements.list().filter((a) => {
    if (a.priority !== 'urgent' || a.status !== 'sent') return false;
    if (!currentUser) return false;
    const recipients = db.announcements.resolveRecipients(a.audienceFilter);
    const isRecipient = recipients.some((u) => u.id === currentUser.id);
    if (!isRecipient) return false;
    const receipt = db.announcements.getUserReceipt(a.id, currentUser.id);
    return !receipt?.acknowledgedAt;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar />

      {/* Urgent Announcement Alert Banner */}
      {urgentAnnouncements.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center justify-between flex-wrap gap-2 text-sm z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
            <span className="font-semibold">
              {locale === 'es' && urgentAnnouncements[0].titleEs
                ? urgentAnnouncements[0].titleEs
                : urgentAnnouncements[0].title}:
            </span>
            <span className="line-clamp-1">
              {locale === 'es' && urgentAnnouncements[0].bodyEs
                ? urgentAnnouncements[0].bodyEs
                : urgentAnnouncements[0].body}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => currentUser && db.announcements.acknowledge(urgentAnnouncements[0].id, currentUser.id)}
              className="inline-flex items-center gap-1 bg-white text-red-700 px-3 py-1 rounded font-bold text-xs hover:bg-red-50 transition shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('home.acknowledge', "I've read this")}
            </button>
            <NextLink href="/announcements" className="underline text-xs text-white/90 hover:text-white">
              View all
            </NextLink>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full">
        <Suspense fallback={<aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card/60 p-3" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
