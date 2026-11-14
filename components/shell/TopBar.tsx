'use client';

import React, { useState } from 'react';
import Link from 'next/router';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Bell,
  Globe,
  RotateCcw,
  Mail,
  User as UserIcon,
  ChevronDown,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export function TopBar() {
  const { currentUser, isGuest, featuredPersonas, switchUser } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notifications = currentUser ? db.notifications.listForUser(currentUser.id) : [];
  const unreadNotifs = notifications.filter((n) => !n.readAt);
  const outboxCount = db.outbox.list().length;

  const handleResetData = () => {
    db.resetDemoData();
    setUserMenuOpen(false);
    setToastMessage(t('common.resetSuccess', 'Demo data reset to initial state.'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-4">
          <NextLink href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-xl tracking-tight text-primary transition-colors group-hover:text-primary/90">
              Motherboard
            </span>
            <span className="hidden md:inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Tech-Moms Prototype
            </span>
          </NextLink>
        </div>

        {/* Global Controls: Persona Switcher, Lang Toggle, Dev Outbox, Notifications, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition hover:bg-accent"
              aria-expanded={personaMenuOpen}
              aria-label="Demo Persona Switcher"
            >
              <span className="hidden lg:inline text-muted-foreground">{t('common.viewingAs')}:</span>
              {isGuest ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">Guest Donor</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${currentUser?.avatarColor ?? 'bg-primary'}`} />
                  <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-[160px]">
                    {currentUser?.name}
                  </span>
                </div>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {personaMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPersonaMenuOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover p-2 shadow-xl">
                  <div className="px-3 py-2 border-b border-border text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Select Demo Persona
                  </div>
                  <div className="max-h-96 overflow-y-auto py-1 divide-y divide-border/40">
                    {featuredPersonas.map((persona) => {
                      const active = currentUser?.id === persona.id;
                      return (
                        <button
                          key={persona.id}
                          type="button"
                          onClick={() => {
                            switchUser(persona.id);
                            setPersonaMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition hover:bg-accent ${
                            active ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${persona.avatarColor}`}>
                            {persona.avatarInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs sm:text-sm text-foreground">{persona.name}</span>
                              {active && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {locale === 'es' ? persona.personaSubtitleEs || persona.personaSubtitle : persona.personaSubtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {/* Guest Donor Option */}
                    <button
                      type="button"
                      onClick={() => {
                        switchUser(null);
                        setPersonaMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition hover:bg-accent ${
                        isGuest ? 'bg-amber-500/10 text-amber-600' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                        GD
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs sm:text-sm text-foreground">
                            {t('common.guestDonor')}
                          </span>
                          {isGuest && <Check className="h-4 w-4 text-amber-600" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Public visitor — tests guest donation checkout, receipts and campaigns with zero login.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs sm:text-sm font-semibold hover:bg-accent transition"
            title="Toggle English / Español"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{locale === 'en' ? 'ES' : 'EN'}</span>
          </button>

          {/* Dev Outbox Link */}
          <NextLink
            href="/dev/outbox"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs sm:text-sm font-medium hover:bg-accent transition"
            title="Dev Outbox (Simulated Email & SMS)"
          >
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Outbox</span>
            {outboxCount > 0 && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {outboxCount}
              </span>
            )}
          </NextLink>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg border border-border bg-card hover:bg-accent transition"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover p-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => db.notifications.markAllRead(currentUser.id)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border/40 py-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <NextLink
                          key={n.id}
                          href={n.href}
                          onClick={() => {
                            db.notifications.markRead(n.id);
                            setNotifOpen(false);
                          }}
                          className={`block p-2.5 rounded-lg transition hover:bg-accent ${
                            !n.readAt ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              {n.urgent && <ShieldAlert className="h-3.5 w-3.5 text-red-600" />}
                              {n.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.body}</p>
                        </NextLink>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu & Reset Demo Data */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card hover:bg-accent transition"
              aria-label="User Menu"
            >
              <UserIcon className="h-4 w-4" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-border bg-popover p-2 shadow-xl">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="font-semibold text-sm truncate">{currentUser?.name ?? 'Guest Donor'}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.email ?? 'No login active'}</p>
                  </div>
                  <div className="py-1">
                    <NextLink
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-3 py-2 text-xs sm:text-sm rounded-lg hover:bg-accent transition"
                    >
                      {t('nav.profile')}
                    </NextLink>
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t('common.resetDemoData')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reset Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs text-center py-1.5 font-medium animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}
    </header>
  );
}
