'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  TimesheetEntry,
  TIMESHEET_CATEGORY_LABELS,
  TIMESHEET_CATEGORIES,
  TIMESHEET_TIMEZONE,
} from '@shared/types';

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function getMonthStartCDT(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  return `${year}-${month}-01`;
}

function getTodayCDT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatDuration(minutes: number | undefined): string {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateCDT(dateStr: string): string {
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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface StaffUser {
  userId: string;
  displayName: string;
  email: string;
}

interface Props {
  params: Promise<{ userId: string }>;
}

const LIMIT_OPTIONS = [25, 50, 100];

export default function StaffActivityPage({ params }: Props) {
  const { userId } = use(params);

  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFrom, setDateFrom] = useState(getMonthStartCDT());
  const [dateTo, setDateTo] = useState(getTodayCDT());
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(25);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (category) params.set('category', category);

      const res = await fetch(`/api/timesheets/staff/${userId}?${params}`);
      const json = await res.json();

      if (json.ok) {
        setStaffUser(json.data.user);
        setEntries(json.data.entries ?? []);
      } else {
        setError(json.error?.message ?? 'Failed to load data');
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userId, dateFrom, dateTo, category, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const completedCount = entries.filter((e) => e.status === 'completed').length;

  // Group entries by date for a cleaner view
  const grouped = entries.reduce<Record<string, TimesheetEntry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date]!.push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-6 bg-secondary rounded w-48 animate-pulse" />
        <div className="h-64 bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-destructive mb-4">{error}</div>
        <Link href="/timesheets" className="text-sm text-primary hover:underline">← Back to Timesheets</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/timesheets" className="hover:text-foreground">Timesheets</Link>
        <span>/</span>
        <span>Team Activity</span>
        <span>/</span>
        <span className="text-foreground">{staffUser?.displayName ?? userId}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{staffUser?.displayName ?? userId}</h1>
          {staffUser?.email && (
            <p className="text-sm text-muted-foreground">{staffUser.email}</p>
          )}
        </div>
        <Link href="/timesheets" className="px-3 py-1.5 text-sm border rounded hover:bg-secondary">← Back</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end border rounded-lg p-4 bg-card">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-background" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-background" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-background">
            <option value="">All Categories</option>
            {Object.entries(TIMESHEET_CATEGORIES).map(([key, val]) => (
              <option key={key} value={val}>
                {TIMESHEET_CATEGORY_LABELS[val as keyof typeof TIMESHEET_CATEGORY_LABELS]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Per page</label>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1.5 text-sm bg-background">
            {LIMIT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="flex gap-6 text-sm border rounded-lg px-4 py-3 bg-card">
          <div><span className="text-muted-foreground">Entries: </span><strong>{entries.length}</strong></div>
          <div><span className="text-muted-foreground">Completed: </span><strong>{completedCount}</strong></div>
          <div><span className="text-muted-foreground">Total Time: </span><strong>{formatDuration(totalMinutes)}</strong></div>
        </div>
      )}

      {/* Grouped by date */}
      {sortedDates.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground bg-card">
          No activity found for the selected date range.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dayEntries = grouped[date]!;
            const dayTotal = dayEntries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
            return (
              <div key={date} className="border rounded-lg bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                  <span className="font-medium text-sm">{formatDateCDT(date)}</span>
                  <span className="text-sm text-muted-foreground">{formatDuration(dayTotal)}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Category</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Title</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Start</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Duration</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEntries.map((entry) => {
                      const startTime = entry.segments[0]?.startedAt
                        ? formatTimeCDT(entry.segments[0].startedAt)
                        : entry.manualStartTime ?? '—';
                      return (
                        <tr key={entry.id} className="border-b last:border-b-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5">
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded whitespace-nowrap">
                              {TIMESHEET_CATEGORY_LABELS[entry.category as keyof typeof TIMESHEET_CATEGORY_LABELS] ?? entry.category}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 max-w-xs">
                            <Link href={`/timesheets/entries/${entry.id}`} className="hover:underline">
                              {entry.title}
                            </Link>
                            {entry.notes && (
                              <div className="text-xs text-muted-foreground truncate max-w-[220px]" title={entry.notes}>
                                {entry.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums text-xs">{startTime}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{formatDuration(entry.durationMinutes)}</td>
                          <td className="px-4 py-2.5">
                            {entry.timerStatus === 'running' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Running</span>}
                            {entry.timerStatus === 'paused' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Paused</span>}
                            {entry.status === 'completed' && entry.timerStatus !== 'running' && entry.timerStatus !== 'paused' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Completed</span>}
                            {entry.status !== 'completed' && entry.timerStatus === 'not_started' && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">Draft</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
