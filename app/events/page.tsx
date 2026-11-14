'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  Download,
  QrCode,
  Sparkles,
  Building2,
  Award,
} from 'lucide-react';
import { EventItem } from '@/lib/data/types';

export default function EventsPage() {
  const { currentUser, can } = useAuth();
  const { locale, t } = useI18n();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [qrModalEvent, setQrModalEvent] = useState<EventItem | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const events = db.events.list();
  const rsvps = db.events.listRsvps();

  const handleToggleRsvp = (eventId: string) => {
    if (!currentUser) return;
    db.events.toggleRsvp(eventId, currentUser.id);
  };

  const handleDownloadIcs = (event: EventItem) => {
    const startDate = new Date(event.startsAt).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(event.endsAt).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tech-Moms//Motherboard Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@motherboard.tech-moms.org`,
      `DTSTAMP:${startDate}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
      `LOCATION:${event.zoomOrAddress}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isStaff = can('staff:manage_admissions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            <span>{t('events.title', 'Events & Meetups')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quarterly meetups, virtual workshops, Better Way Thursday panels, and info sessions.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Calendar Grid
          </button>
        </div>
      </div>

      {/* Events List / Grid */}
      <div className="space-y-4">
        {events.map((evt) => {
          const evtRsvps = rsvps.filter((r) => r.eventId === evt.id && r.status === 'going');
          const isGoing = currentUser ? evtRsvps.some((r) => r.userId === currentUser.id) : false;
          const isFull = evtRsvps.length >= evt.capacity;
          const isPast = mounted ? new Date(evt.endsAt).getTime() < Date.now() : false;

          return (
            <div
              key={evt.id}
              className={`rounded-2xl border p-5 sm:p-6 shadow-sm transition hover:border-primary/40 flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                isPast ? 'bg-accent/20 border-border/60' : 'bg-card border-border'
              }`}
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                    {evt.type.replace('_', ' ')}
                  </span>
                  {evt.isVirtual ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium">
                      <Video className="h-3 w-3" /> Virtual
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                      <MapPin className="h-3 w-3" /> In Person
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[11px] font-bold text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                      Past Event
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-bold text-foreground">
                    {locale === 'es' && evt.titleEs ? evt.titleEs : evt.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                    {evt.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {new Date(evt.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    {evt.locationLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    {evtRsvps.length} / {evt.capacity} Attending
                  </span>
                  {evt.hostOrgName && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Award className="h-3.5 w-3.5" />
                      Sponsored by {evt.hostOrgName}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                {!isPast && (
                  <button
                    type="button"
                    onClick={() => handleToggleRsvp(evt.id)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                      isGoing
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : isFull
                        ? 'bg-accent text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isGoing ? '✓ RSVP Confirmed' : isFull ? 'Event Full' : 'RSVP to Attend'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadIcs(evt)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent transition"
                  title="Download .ics Calendar Invite"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Add to Calendar</span>
                </button>

                {isStaff && (
                  <button
                    type="button"
                    onClick={() => setQrModalEvent(evt)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Check-in QR</span>
                  </button>
                )}

                {evt.recordingResourceId && (
                  <NextLink
                    href="/learn"
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                  >
                    <span>Watch Recording →</span>
                  </NextLink>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Check-in QR Modal */}
      {qrModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center">
            <h3 className="font-bold text-base text-foreground">Attendee Check-In QR</h3>
            <p className="text-xs text-muted-foreground">{qrModalEvent.title}</p>
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl bg-white border border-border shadow-inner p-2">
              {/* Simulated QR block */}
              <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-[2px] ${
                      (i * 7) % 3 === 0 ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-primary">
              Check-In Code: {qrModalEvent.checkInCode}
            </div>
            <button
              type="button"
              onClick={() => setQrModalEvent(null)}
              className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-xs py-2 hover:bg-primary/90 transition"
            >
              Close QR Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
