'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TimesheetClockSession, TIMESHEET_TIMEZONE } from '@shared/types';

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function getTodayCDT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getPresetRange(preset: 'week' | 'month' | 'lastMonth'): { dateFrom: string; dateTo: string } {
  const today = getTodayCDT();
  const [y, mo, d] = today.split('-').map(Number) as [number, number, number];

  if (preset === 'week') {
    const todayDate = new Date(y, mo - 1, d);
    const dayOfWeek = todayDate.getDay(); // 0=Sun … 6=Sat
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(y, mo - 1, d - daysSinceMonday);
    const mondayStr = [
      monday.getFullYear(),
      String(monday.getMonth() + 1).padStart(2, '0'),
      String(monday.getDate()).padStart(2, '0'),
    ].join('-');
    return { dateFrom: mondayStr, dateTo: today };
  }

  if (preset === 'month') {
    return { dateFrom: `${y}-${String(mo).padStart(2, '0')}-01`, dateTo: today };
  }

  // lastMonth
  const lastMonth = mo === 1 ? 12 : mo - 1;
  const lastMonthYear = mo === 1 ? y - 1 : y;
  const lastDay = new Date(y, mo - 1, 0).getDate();
  return {
    dateFrom: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
    dateTo: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeCDT(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMESHEET_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

function breakLabel(b: { startedAt: string; endedAt?: string }, idx: number): string {
  const durMin = b.endedAt
    ? Math.round((new Date(b.endedAt).getTime() - new Date(b.startedAt).getTime()) / 60_000)
    : 0;
  const endStr = b.endedAt ? formatTimeCDT(b.endedAt) : '?';
  return `Break ${idx + 1}: ${formatTimeCDT(b.startedAt)}–${endStr} (${durMin}m)`;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Preset = 'week' | 'month' | 'lastMonth' | 'custom';

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function ClockReportPage() {
  const initialRange = getPresetRange('month');

  const [preset, setPreset]     = useState<Preset>('month');
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo]     = useState(initialRange.dateTo);
  const [sessions, setSessions] = useState<TimesheetClockSession[] | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    setError('');
    fetch(`/api/timesheets/clock/sessions?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setSessions(json.data.sessions);
        } else {
          setError(json.error?.message ?? 'Failed to load sessions');
        }
      })
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  function applyPreset(p: 'week' | 'month' | 'lastMonth') {
    const range = getPresetRange(p);
    setPreset(p);
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
  }

  function handleDateFromChange(val: string) {
    setPreset('custom');
    setDateFrom(val);
  }

  function handleDateToChange(val: string) {
    setPreset('custom');
    setDateTo(val);
  }

  const completedSessions = sessions?.filter((s) => s.status === 'clocked_out') ?? [];
  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.totalWorkedMinutes ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Link href="/timesheets" className="hover:underline">Timesheets</Link>
        <span>/</span>
        <span className="text-foreground">Clock Report</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Clock Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Total hours worked from clock sessions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {(['week', 'month', 'lastMonth'] as const).map((p) => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              preset === p
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-secondary border-border'
            }`}
          >
            {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Last Month'}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Total Hours Stat */}
      {!loading && !error && (
        <div className="border rounded-lg p-5 bg-card inline-block">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
            Total Hours Worked
          </div>
          <div className="text-3xl font-bold tabular-nums">
            {totalMinutes > 0 ? formatDuration(totalMinutes) : '0m'}
          </div>
          {completedSessions.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-24 bg-secondary rounded-lg animate-pulse w-48" />
          <div className="h-48 bg-secondary rounded-lg animate-pulse" />
        </div>
      )}

      {/* Sessions Table */}
      {!loading && !error && (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Clock In</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Clock Out</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Worked</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Breaks</th>
              </tr>
            </thead>
            <tbody>
              {completedSessions.length > 0 ? (
                completedSessions.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDateDisplay(s.date)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                      {formatTimeCDT(s.clockedInAt)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                      {s.clockedOutAt ? formatTimeCDT(s.clockedOutAt) : '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums font-medium">
                      {s.totalWorkedMinutes != null ? formatDuration(s.totalWorkedMinutes) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {s.breaks.length > 0
                        ? s.breaks.map((b, i) => breakLabel(b, i)).join(' · ')
                        : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No sessions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
