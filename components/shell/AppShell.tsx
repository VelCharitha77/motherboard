'use client';

import React, { Suspense } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isGuest, can } = useAuth();
  const { locale, t } = useI18n();

  // Check if active user has permission for the current route
  const isAllowed = React.useMemo(() => {
    if (!pathname) return true;
    if (pathname.startsWith('/staff')) return can('nav:staff');
    if (pathname.startsWith('/employer')) return can('nav:employer');
    if (pathname.startsWith('/sponsor')) return can('nav:sponsor');
    if (pathname.startsWith('/funding/my')) return can('nav:funding_my');
    if (pathname.startsWith('/help')) return can('nav:help');
    if (pathname.startsWith('/learn') || pathname.startsWith('/roadmap')) return can('nav:learn');
    if (pathname.startsWith('/messages')) return can('nav:messages');
    if (pathname.startsWith('/projects')) return can('nav:projects');
    if (pathname.startsWith('/careers')) return can('nav:careers');
    if (pathname.startsWith('/home') && isGuest) return false;
    return true;
  }, [pathname, isGuest, can]);

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
          <div className="max-w-7xl mx-auto">
            {!isAllowed ? (
              <div className="rounded-3xl border-2 border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xl animate-in fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Your current persona does not have permission to access this module. Please switch to an authorized role in the top bar.
                </p>
                <div className="pt-2">
                  <NextLink
                    href={isGuest ? '/give' : '/home'}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs px-5 py-2.5 hover:bg-primary/90 transition shadow-sm"
                  >
                    <span>Return to {isGuest ? 'Public Funding Board' : 'Dashboard'}</span>
                  </NextLink>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
