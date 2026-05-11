'use client';

import { useState, useEffect, useCallback } from 'react';
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

function getTodayCDT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

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

const LIMIT_OPTIONS = [25, 50, 100];

export default function MyActivityPage() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFrom, setDateFrom] = useState(getMonthStartCDT());
  const [dateTo, setDateTo] = useState(getTodayCDT());
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(25);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (category) params.set('category', category);

      const res = await fetch(`/api/timesheets/entries?${params}`);
      const json = await res.json();
      if (json.ok) setEntries(json.data.entries ?? []);
      else setError(json.error?.message ?? 'Failed to load entries');
    } catch {
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, category, limit]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function handleDelete(entryId: string) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setDeletingId(entryId);
    setDeleteError('');
    try {
      const res = await fetch(`/api/timesheets/entries/${entryId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) setEntries((prev) => prev.filter((e) => e.id !== entryId));
      else setDeleteError(json.error?.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  // Summary stats
  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const completedCount = entries.filter((e) => e.status === 'completed').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
            <Link href="/timesheets" className="hover:text-foreground">Timesheets</Link>
            <span>/</span>
            <span>My Activity</span>
          </div>
          <h1 className="text-2xl font-bold">My Activity</h1>
          <p className="text-sm text-muted-foreground">Full breakdown of your logged work</p>
        </div>
        <Link
          href="/timesheets"
          className="px-3 py-1.5 text-sm border rounded hover:bg-secondary"
        >
          ← Back
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end border rounded-lg p-4 bg-card">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          >
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
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          >
            {LIMIT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && entries.length > 0 && (
        <div className="flex gap-6 text-sm border rounded-lg px-4 py-3 bg-card">
          <div><span className="text-muted-foreground">Entries: </span><strong>{entries.length}</strong></div>
          <div><span className="text-muted-foreground">Completed: </span><strong>{completedCount}</strong></div>
          <div><span className="text-muted-foreground">Total Time: </span><strong>{formatDuration(totalMinutes)}</strong></div>
        </div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}
      {deleteError && <div className="text-sm text-destructive">{deleteError}</div>}

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Start</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-secondary rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : entries.length > 0 ? (
              entries.map((entry) => {
                const startTime = entry.segments[0]?.startedAt
                  ? formatTimeCDT(entry.segments[0].startedAt)
                  : entry.manualStartTime ?? '—';

                return (
                  <tr key={entry.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDateCDT(entry.date)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded whitespace-nowrap">
                        {TIMESHEET_CATEGORY_LABELS[entry.category as keyof typeof TIMESHEET_CATEGORY_LABELS] ?? entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <Link href={`/timesheets/my-activity/${entry.id}`} className="hover:underline">
                        {entry.title}
                      </Link>
                      {entry.notes && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={entry.notes}>
                          {entry.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                      {startTime}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                      {formatDuration(entry.durationMinutes)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge entry={entry} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <Link
                          href={`/timesheets/my-activity/${entry.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="text-xs text-destructive hover:underline disabled:opacity-50"
                        >
                          {deletingId === entry.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No entries found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ entry }: { entry: TimesheetEntry }) {
  if (entry.timerStatus === 'running') return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Running</span>;
  if (entry.timerStatus === 'paused') return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Paused</span>;
  if (entry.status === 'completed') return <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Completed</span>;
  return <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">In Progress</span>;
}
