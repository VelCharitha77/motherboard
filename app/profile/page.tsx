'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Settings,
  Globe,
  Bell,
  Moon,
  MessageSquare,
  ShieldCheck,
  Share2,
  Lock,
  CheckCircle2,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';
import { DmAllowRule } from '@/lib/data/types';

export default function ProfilePage() {
  const { currentUser, isGuest } = useAuth();
  const { locale, setLocale, t } = useI18n();

  const dmPref = currentUser ? db.users.getDmPreference(currentUser.id) : undefined;

  const [allowFrom, setAllowFrom] = useState<DmAllowRule>(dmPref?.allowFrom ?? 'cohort_and_instructors');
  const [quietStart, setQuietStart] = useState(dmPref?.quietStart ?? '21:00');
  const [quietEnd, setQuietEnd] = useState(dmPref?.quietEnd ?? '07:00');
  const [emailDigests, setEmailDigests] = useState(dmPref?.emailDigests ?? true);
  const [smsUrgent, setSmsUrgent] = useState(dmPref?.smsUrgent ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (isGuest || !currentUser) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Guest Mode Active</h2>
        <p className="text-xs text-muted-foreground">Select a persona from the top bar to configure user preferences.</p>
        <NextLink href="/" className="text-xs font-bold text-primary hover:underline">
          Select a Persona
        </NextLink>
      </div>
    );
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    db.users.updateDmPreference(currentUser.id, {
      allowFrom,
      quietStart,
      quietEnd,
      emailDigests,
      smsUrgent,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          <span>{t('nav.profile', 'Profile & Settings')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your notification channels, quiet hours, direct messaging privacy, and linked services.
        </p>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* User Identity Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-lg shadow-sm ${currentUser.avatarColor}`}>
            {currentUser.avatarInitials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{currentUser.name}</h3>
            <p className="text-xs text-muted-foreground">{currentUser.email} • {currentUser.city}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">
              <ShieldCheck className="h-3 w-3" />
              18+ Age Attested on {new Date(currentUser.ageAttestedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Language Preference */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>Display Language / Idioma de Interfaz</span>
          </h3>
          <p className="text-xs text-muted-foreground">Select your primary language for navigation, buttons, and notifications.</p>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                locale === 'en' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border bg-background'
              }`}
            >
              English (EN)
            </button>
            <button
              type="button"
              onClick={() => setLocale('es')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                locale === 'es' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border bg-background'
              }`}
            >
              Español (ES)
            </button>
          </div>
        </div>

        {/* Messaging & DM Privacy Settings */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Direct Messaging Privacy ("Who can DM me")</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            You decide who can start direct message conversations with you on Motherboard.
          </p>

          <div className="space-y-2 text-xs">
            {[
              { rule: 'everyone' as const, label: 'Everyone in Motherboard (Students, Alumni & Instructors)' },
              { rule: 'cohort_and_instructors' as const, label: 'My Cohorts & Instructors Only (Recommended for parents)' },
              { rule: 'staff_only' as const, label: 'Staff & Program Managers Only' },
            ].map(({ rule, label }) => (
              <label
                key={rule}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  allowFrom === rule ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-border bg-background hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="dmRule"
                  checked={allowFrom === rule}
                  onChange={() => setAllowFrom(rule)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours & Delivery Channels */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span>Quiet Hours & Notification Windows</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Non-urgent emails and notifications pause during your quiet hours so you can rest. Urgent weather/safety announcements will still break through.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Quiet Hours Begin</label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Quiet Hours End</label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailDigests}
                onChange={(e) => setEmailDigests(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span className="font-semibold text-foreground">Include normal announcements in daily email digest</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smsUrgent}
                onChange={(e) => setSmsUrgent(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span className="font-semibold text-foreground">Deliver urgent alerts via SMS text message to cell phone</span>
            </label>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <span>Connected Integrations</span>
          </h3>
          <div className="p-4 rounded-xl border border-border bg-accent/20 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-foreground">Slack Two-Way Channel Bridge</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Mirror cohort channels with Tech-Moms workspace.</p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-muted-foreground">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>Preferences saved successfully!</span>
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition shadow-sm"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
