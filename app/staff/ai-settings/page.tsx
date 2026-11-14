'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function StaffAiSettingsPage() {
  const { can } = useAuth();
  const { t } = useI18n();

  const settings = db.ai.listSettings();
  const usageLogs = db.ai.listUsageLogs();

  const [toggles, setToggles] = useState<Record<string, boolean>>(
    settings.reduce((acc, s) => ({ ...acc, [s.featureKey]: s.enabled }), {})
  );

  if (!can('staff:manage_roles')) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Admin Access Restricted</h2>
        <NextLink href="/" className="text-xs font-bold text-primary hover:underline">
          Return to Landing
        </NextLink>
      </div>
    );
  }

  const handleToggle = (featureKey: string) => {
    const nextVal = !toggles[featureKey];
    setToggles({ ...toggles, [featureKey]: nextVal });
    db.ai.updateSetting(featureKey, nextVal);
  };

  const totalTokens = usageLogs.reduce((acc, l) => acc + l.tokenCount, 0);
  const avgLatency = usageLogs.length > 0 ? Math.round(usageLogs.reduce((acc, l) => acc + l.latencyMs, 0) / usageLogs.length) : 0;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <NextLink href="/staff" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </NextLink>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              <span>Gemini AI Control & Usage Logs</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Toggle features on/off and audit token counts and latency metrics. (No private prompt content is logged).
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-bold">
          Server-Side GEMINI_API_KEY Active
        </span>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Requests Logged</span>
          <div className="text-2xl font-black text-foreground">{usageLogs.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Tokens Processed</span>
          <div className="text-2xl font-black text-primary">{totalTokens.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Latency</span>
          <div className="text-2xl font-black text-emerald-600">{avgLatency} ms</div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground">AI Feature Activation Toggles</h3>
        <p className="text-xs text-muted-foreground">
          Admins can immediately disable individual features if needed. Disabled features fall back to manual workflows.
        </p>

        <div className="divide-y divide-border/60">
          {settings.map((s) => {
            const isEnabled = toggles[s.featureKey] ?? s.enabled;
            return (
              <div key={s.featureKey} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{s.description}</h4>
                  <p className="text-[11px] font-mono text-muted-foreground">{s.featureKey}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(s.featureKey)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-accent text-muted-foreground border border-border'
                  }`}
                >
                  <span>{isEnabled ? 'Active' : 'Disabled'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Log Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-foreground">Audit Log (Anonymized Telemetry)</h3>
        <p className="text-xs text-muted-foreground">
          Tracks feature name, user role, token count, and latency. Personal names and prompt bodies are strictly excluded.
        </p>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/50 border-b border-border font-bold text-muted-foreground">
              <tr>
                <th className="p-3">Feature Key</th>
                <th className="p-3">Role</th>
                <th className="p-3">Tokens</th>
                <th className="p-3">Latency</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {usageLogs.map((log) => (
                <tr key={log.id}>
                  <td className="p-3 font-semibold text-foreground">{log.featureName}</td>
                  <td className="p-3 capitalize text-muted-foreground">{log.userRole}</td>
                  <td className="p-3 text-primary">{log.tokenCount}</td>
                  <td className="p-3 text-muted-foreground">{log.latencyMs} ms</td>
                  <td className="p-3 text-right text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
