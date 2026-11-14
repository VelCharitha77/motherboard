'use client';

import React from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  TrendingUp,
  ArrowLeft,
  Users,
  Compass,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function StaffDemandPage() {
  const { can } = useAuth();
  const { t } = useI18n();

  const allProfiles = db.roadmap.listAllInterestProfiles();
  const waitlist = db.cohorts.listWaitlist();
  const paths = db.roadmap.listCareerPaths();

  if (!can('nav:staff')) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Staff Access Restricted</h2>
        <NextLink href="/" className="text-xs font-bold text-primary hover:underline">
          Return to Landing
        </NextLink>
      </div>
    );
  }

  // Aggregate interest by career path (no personal names)
  const pathCounts: Record<string, number> = {};
  paths.forEach((p) => {
    pathCounts[p.title] = 0;
  });

  allProfiles.forEach((prof) => {
    const tag = prof.soundsFunTags[0] ?? '';
    const match = paths.find((p) => tag.toLowerCase().includes(p.slug.replace('-', ' ')) || p.title.toLowerCase().includes(tag.toLowerCase()));
    const key = match?.title ?? 'Web Development';
    pathCounts[key] = (pathCounts[key] || 0) + 1;
  });

  const pathChartData = Object.entries(pathCounts).map(([name, count]) => ({
    name: name.replace(' / Agile & Scrum', ''),
    count,
  }));

  // Aggregate location interest
  const locationCounts: Record<string, number> = {
    'Salt Lake City': 0,
    'Lehi': 0,
    'Sandy': 0,
    'St. George': 0,
    'Online Statewide': 0,
  };
  allProfiles.forEach((prof) => {
    if (prof.locationPreference === 'remote') {
      locationCounts['Online Statewide'] = (locationCounts['Online Statewide'] || 0) + 1;
    } else {
      const city = prof.preferredCity || 'Salt Lake City';
      locationCounts[city] = (locationCounts[city] || 0) + 1;
    }
  });

  const locationChartData = Object.entries(locationCounts).map(([name, value], i) => ({
    name,
    value,
    color: ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][i % 5],
  }));

  // Aggregate preferred schedules
  const scheduleCounts: Record<string, number> = {
    'Saturday Mornings': 0,
    'Weekday Evenings': 0,
    'School Hours (Daytime)': 0,
  };
  allProfiles.forEach((prof) => {
    (prof.preferredScheduleWindows || []).forEach((sc) => {
      if (sc.toLowerCase().includes('saturday')) scheduleCounts['Saturday Mornings']++;
      else if (sc.toLowerCase().includes('evening')) scheduleCounts['Weekday Evenings']++;
      else scheduleCounts['School Hours (Daytime)']++;
    });
  });

  const scheduleChartData = Object.entries(scheduleCounts).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <NextLink href="/staff" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </NextLink>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Curriculum Demand Dashboard</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Aggregated, anonymous learner interest metrics to inform upcoming cohort scheduling and regional expansion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
            {allProfiles.length} Learner Quiz Submissions
          </span>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Inquiries</span>
          <div className="text-3xl font-black text-primary">{allProfiles.length}</div>
          <p className="text-xs text-muted-foreground">Prospective & active student interest profiles</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Waitlists</span>
          <div className="text-3xl font-black text-amber-600">{waitlist.length}</div>
          <p className="text-xs text-muted-foreground">Students waiting for upcoming regional seats</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Requested Path</span>
          <div className="text-2xl font-black text-emerald-600 truncate">Web Development</div>
          <p className="text-xs text-muted-foreground">Followed closely by Data & Cyber 2.0</p>
        </div>
      </div>

      {/* Chart 1: Interest by Career Path */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground">Interest by Career Pathway</h3>
        <p className="text-xs text-muted-foreground">Anonymous distribution of top path selections.</p>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pathChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" name="Interested Learners" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Location & Schedule Fit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Regional Location Demand</h3>
          <p className="text-xs text-muted-foreground">Campus vs. statewide online preferences.</p>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={locationChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {locationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
            {locationChartData.map((loc) => (
              <div key={loc.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: loc.color }} />
                <span className="truncate text-muted-foreground">{loc.name} ({loc.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Preferred Schedule Windows</h3>
          <p className="text-xs text-muted-foreground">Times mothers and working learners can attend.</p>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scheduleChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Learner Preferences" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
