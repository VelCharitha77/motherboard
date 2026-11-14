'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Users,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { featuredPersonas, switchUser, currentUser, isGuest } = useAuth();
  const { locale, t } = useI18n();
  const [attestationOpen, setAttestationOpen] = useState(false);
  const [adultAgreed, setAdultAgreed] = useState(false);
  const [newLearnerName, setNewLearnerName] = useState('');
  const [newLearnerEmail, setNewLearnerEmail] = useState('');
  const [newLearnerCity, setNewLearnerCity] = useState('Salt Lake City');

  const handleSelectPersona = (id: string | null) => {
    switchUser(id);
    if (id === null) {
      router.push('/give');
    } else {
      router.push('/home');
    }
  };

  const handleCreateLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adultAgreed || !newLearnerName || !newLearnerEmail) return;
    const user = db.users.createAdultAccount({
      name: newLearnerName,
      email: newLearnerEmail,
      city: newLearnerCity,
      locale,
      ageAttested: true,
    });
    switchUser(user.id);
    setAttestationOpen(false);
    router.push('/home');
  };

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive Prototype — Click through as any role</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('landing.title', 'Welcome to Motherboard')}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {t(
            'landing.subtitle',
            'Connecting every step of the Tech-Moms journey: training, community, funding, and career relaunch.'
          )}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSelectPersona(currentUser?.id ?? 'usr_maria')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            <span>{t('landing.enterApp', 'Launch Dashboard')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <NextLink
            href="/give"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
          >
            <HeartHandshake className="h-4 w-4 text-rose-500" />
            <span>{t('landing.publicGive', 'Visit Public Funding Board')}</span>
          </NextLink>
          <button
            type="button"
            onClick={() => setAttestationOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>New Learner 18+ Sign-up</span>
          </button>
        </div>
      </section>

      {/* Persona Selection Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>{t('landing.exploreAs', 'Explore as a Persona')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t(
                'landing.exploreDesc',
                'Select any fictional stakeholder to instantly switch roles, permissions, and dashboards.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredPersonas.map((persona) => {
            const isSelected = currentUser?.id === persona.id;
            return (
              <div
                key={persona.id}
                onClick={() => handleSelectPersona(persona.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm shadow-sm ${persona.avatarColor}`}
                      >
                        {persona.avatarInitials}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                          {persona.name}
                        </h3>
                        <p className="text-xs font-medium text-primary">
                          {persona.city} • {persona.locale.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {locale === 'es' ? persona.personaSubtitleEs || persona.personaSubtitle : persona.personaSubtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Switch and open {persona.name.split(' ')[0]}’s view</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}

          {/* Guest Donor Card */}
          <div
            onClick={() => handleSelectPersona(null)}
            className={`group relative flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              isGuest
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                : 'border-border bg-card hover:border-amber-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm shadow-sm">
                    GD
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-amber-600 transition-colors">
                      {t('common.guestDonor', 'Guest Donor')}
                    </h3>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Public Visitor (No login)</p>
                  </div>
                </div>
                {isGuest && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Test the public-facing Funding Board without logging in. Create individual or company gifts, check out
                with mock Stripe/ACH/Invoice, and get instant tax receipts.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Explore Public Giving</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </section>

      {/* 18+ Adult Learner Sign-Up Modal */}
      {attestationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{t('landing.adultAttestationTitle')}</h3>
                <p className="text-xs text-muted-foreground">Tech-Moms Community Safety Policy</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed bg-accent/50 p-3 rounded-xl border border-border">
              {t('landing.adultAttestationNotice')}
            </p>

            <form onSubmit={handleCreateLearner} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newLearnerName}
                  onChange={(e) => setNewLearnerName(e.target.value)}
                  placeholder="e.g. Veronica Castillo"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newLearnerEmail}
                    onChange={(e) => setNewLearnerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Utah City</label>
                  <input
                    type="text"
                    required
                    value={newLearnerCity}
                    onChange={(e) => setNewLearnerCity(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={adultAgreed}
                    onChange={(e) => setAdultAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground leading-snug">
                    {t('landing.adultCheckbox')}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAttestationOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!adultAgreed}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Create & Launch Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

