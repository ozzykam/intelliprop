'use client';

import { Fragment, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import TimesheetSummaryPanel from '@/components/TimesheetSummaryPanel';
import {
  TimesheetClockSession,
  TimesheetEntry,
  TimesheetStaffSummary,
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

function formatDuration(minutes: number | undefined): string {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Compute elapsed seconds from timer segments (handles live running segment) */
function computeElapsedSeconds(
  segments: Array<{ startedAt: string; endedAt?: string }>
): number {
  let totalMs = 0;
  for (const seg of segments) {
    const start = new Date(seg.startedAt).getTime();
    const end = seg.endedAt ? new Date(seg.endedAt).getTime() : Date.now();
    totalMs += Math.max(0, end - start);
  }
  return Math.floor(totalMs / 1000);
}

/** Compute net worked seconds for a clock session (subtracts breaks) */
function computeClockWorkedSeconds(session: TimesheetClockSession): number {
  const clockIn = new Date(session.clockedInAt).getTime();
  const now = Date.now();

  const breakMs = session.breaks.reduce((sum, b) => {
    const bStart = new Date(b.startedAt).getTime();
    const bEnd = b.endedAt ? new Date(b.endedAt).getTime() : now;
    return sum + Math.max(0, bEnd - bStart);
  }, 0);

  return Math.max(0, Math.floor((now - clockIn - breakMs) / 1000));
}

function formatTimeCDT(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMESHEET_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

function formatDateCDT(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number) as [number, number, number];
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function entryStartTime(entry: TimesheetEntry): string {
  if (entry.isManualEntry && entry.manualStartTime) return formatTime12h(entry.manualStartTime);
  const first = entry.segments[0];
  if (first) return formatTimeCDT(first.startedAt);
  return '—';
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ClockData {
  todaySessions: TimesheetClockSession[];
  activeSession: TimesheetClockSession | null;
}

interface EntriesData {
  entries: TimesheetEntry[];
  activeTimer: TimesheetEntry | null;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function TimesheetsDashboard() {
  const [clockData, setClockData] = useState<ClockData | null>(null);
  const [entriesData, setEntriesData] = useState<EntriesData | null>(null);
  const [staffList, setStaffList] = useState<TimesheetStaffSummary[] | null>(null);
  const [isPlatformSuperAdmin, setIsPlatformSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Timer live display
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [clockElapsed, setClockElapsed] = useState(0);

  // New entry form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'timer' | 'manual'>('timer');
  const [formDate, setFormDate] = useState(getTodayCDT());
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formBreakMins, setFormBreakMins] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Session detail toggle
  const [showSessionDetail, setShowSessionDetail] = useState(false);

  // Action states
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [timerActionLoading, setTimerActionLoading] = useState(false);

  // Row expand/collapse
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Data fetching ──────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [clockRes, entriesRes, staffRes, settingsRes] = await Promise.all([
        fetch('/api/timesheets/clock'),
        fetch('/api/timesheets/entries?limit=10&includeActive=true'),
        fetch('/api/timesheets/staff'),
        fetch('/api/timesheets/settings'),
      ]);

      const [clockJson, entriesJson, staffJson, settingsJson] = await Promise.all([
        clockRes.json(),
        entriesRes.json(),
        staffRes.json(),
        settingsRes.json(),
      ]);

      if (clockJson.ok) setClockData(clockJson.data);
      if (entriesJson.ok) setEntriesData(entriesJson.data);
      if (staffJson.ok) setStaffList(staffJson.data);
      // staff 403 is expected for non-admin/manager — silently ignore
      setIsPlatformSuperAdmin(settingsJson.ok === true);
    } catch {
      setError('Failed to load timesheet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Live timer tick ────────────────────────

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timer = entriesData?.activeTimer;
    if (!timer || timer.timerStatus !== 'running') {
      if (timer) setTimerElapsed(computeElapsedSeconds(timer.segments));
      return;
    }
    setTimerElapsed(computeElapsedSeconds(timer.segments));
    intervalRef.current = setInterval(() => {
      setTimerElapsed(computeElapsedSeconds(timer.segments));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [entriesData?.activeTimer]);

  // ── Live clock tick ────────────────────────

  useEffect(() => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    const session = clockData?.activeSession;
    if (!session || session.status === 'clocked_out') return;
    setClockElapsed(computeClockWorkedSeconds(session));
    clockIntervalRef.current = setInterval(() => {
      setClockElapsed(computeClockWorkedSeconds(session));
    }, 1000);
    return () => { if (clockIntervalRef.current) clearInterval(clockIntervalRef.current); };
  }, [clockData?.activeSession]);

  // ── Clock actions ──────────────────────────

  async function handleClockIn() {
    setClockActionLoading(true);
    try {
      const res = await fetch('/api/timesheets/clock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const json = await res.json();
      if (json.ok) await fetchAll();
      else setError(json.error?.message ?? 'Failed to clock in');
    } finally {
      setClockActionLoading(false);
    }
  }

  async function handleClockAction(action: 'clock_out' | 'start_break' | 'end_break') {
    const sessionId = clockData?.activeSession?.id;
    if (!sessionId) return;
    setClockActionLoading(true);
    try {
      const res = await fetch(`/api/timesheets/clock/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) await fetchAll();
      else setError(json.error?.message ?? 'Action failed');
    } finally {
      setClockActionLoading(false);
    }
  }

  // ── Timer actions ──────────────────────────

  async function handleTimerAction(entryId: string, action: 'pause' | 'resume' | 'stop') {
    setTimerActionLoading(true);
    try {
      const res = await fetch(`/api/timesheets/entries/${entryId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) await fetchAll();
      else setError(json.error?.message ?? 'Timer action failed');
    } finally {
      setTimerActionLoading(false);
    }
  }

  // ── New entry form ─────────────────────────

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formCategory || !formTitle.trim()) {
      setFormError('Category and title are required');
      return;
    }
    setFormSubmitting(true);
    setFormError('');

    try {
      const body =
        formMode === 'timer'
          ? { date: formDate, category: formCategory, title: formTitle.trim(), notes: formNotes || undefined, startTimerImmediately: true }
          : { date: formDate, category: formCategory, title: formTitle.trim(), notes: formNotes || undefined, isManualEntry: true, manualStartTime: formStartTime, manualEndTime: formEndTime, manualBreakMinutes: formBreakMins ? parseInt(formBreakMins) : undefined };

      const res = await fetch('/api/timesheets/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        resetForm();
        await fetchAll();
      } else {
        setFormError(json.error?.message ?? 'Failed to create entry');
      }
    } finally {
      setFormSubmitting(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setFormMode('timer');
    setFormDate(getTodayCDT());
    setFormCategory('');
    setFormTitle('');
    setFormNotes('');
    setFormStartTime('');
    setFormEndTime('');
    setFormBreakMins('');
    setFormError('');
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  const activeSession = clockData?.activeSession ?? null;
  const activeTimer = entriesData?.activeTimer ?? null;

  // Expand / collapse helpers
  const entriesWithNotes = entriesData?.entries.filter((e) => e.notes) ?? [];
  const allExpanded =
    entriesWithNotes.length > 0 && entriesWithNotes.every((e) => expandedIds.has(e.id));

  function toggleRow(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(entriesWithNotes.map((e) => e.id)));
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 bg-secondary rounded w-48 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-32 bg-secondary rounded-lg animate-pulse" />
          <div className="h-32 bg-secondary rounded-lg animate-pulse" />
        </div>
        <div className="h-64 bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timesheets</h1>
          <p className="text-sm text-muted-foreground">Track and log your work activity</p>
        </div>
        {isPlatformSuperAdmin && (
          <Link
            href="/timesheets/settings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 hover:bg-secondary/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Privacy Settings
          </Link>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Top row: Clock Status + Active Timer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock Status Card */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Today&apos;s Clock
            </h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              !activeSession ? 'bg-secondary text-muted-foreground'
              : activeSession.status === 'on_break' ? 'bg-orange-100 text-orange-800'
              : 'bg-green-100 text-green-800'
            }`}>
              {!activeSession ? 'Not Clocked In'
                : activeSession.status === 'on_break' ? 'On Break'
                : 'Clocked In'}
            </span>
          </div>

          {activeSession && activeSession.status !== 'clocked_out' && (
            <div className="mb-3">
              <div className="text-3xl font-mono font-bold tabular-nums">
                {formatElapsed(clockElapsed)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Since {formatTimeCDT(activeSession.clockedInAt)}
                {activeSession.status === 'on_break' && (
                  <span className="ml-1 text-orange-600">· On Break</span>
                )}
              </div>
            </div>
          )}

          {(() => {
            const clockedOutSessions = clockData?.todaySessions.filter(s => s.status === 'clocked_out') ?? [];
            if (clockedOutSessions.length === 0) return null;
            const totalWorkedToday = clockedOutSessions.reduce((s, x) => s + (x.totalWorkedMinutes ?? 0), 0);
            const totalBreaksToday = clockedOutSessions.reduce((s, x) => s + (x.totalBreakMinutes ?? 0), 0);
            return (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {formatDuration(totalWorkedToday)} worked
                    {totalBreaksToday > 0 ? ` · ${formatDuration(totalBreaksToday)} breaks` : ''}
                    {' · '}{clockedOutSessions.length} session{clockedOutSessions.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowSessionDetail(v => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showSessionDetail ? 'Collapse session detail' : 'Expand session detail'}
                  >
                    {showSessionDetail ? '▲' : '▼'}
                  </button>
                </div>

                {showSessionDetail && (
                  <div className="mt-2 space-y-2">
                    {clockedOutSessions.map((s, i) => {
                      const breakDurationMin = (b: { startedAt: string; endedAt?: string }) => {
                        if (!b.endedAt) return 0;
                        return Math.round((new Date(b.endedAt).getTime() - new Date(b.startedAt).getTime()) / 60_000);
                      };
                      return (
                        <div key={s.id} className="text-xs border rounded p-2 bg-secondary/30">
                          <div className="font-medium text-foreground">
                            Session {i + 1} &nbsp;·&nbsp;
                            {formatTimeCDT(s.clockedInAt)} → {formatTimeCDT(s.clockedOutAt!)}
                            &nbsp;·&nbsp;{formatDuration(s.totalWorkedMinutes)}
                          </div>
                          {s.breaks.length > 0 ? (
                            <div className="mt-1 space-y-0.5 pl-3 text-muted-foreground">
                              {s.breaks.map((b, j) => (
                                <div key={j}>
                                  Break {j + 1} &nbsp;{formatTimeCDT(b.startedAt)}
                                  {b.endedAt ? ` – ${formatTimeCDT(b.endedAt)}` : ''}
                                  &nbsp;·&nbsp;{formatDuration(breakDurationMin(b))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 pl-3 text-muted-foreground italic">No breaks</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex flex-wrap gap-2">
            {!activeSession || activeSession.status === 'clocked_out' ? (
              <button
                onClick={handleClockIn}
                disabled={clockActionLoading}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                Clock In
              </button>
            ) : (
              <>
                {activeSession.status === 'clocked_in' && (
                  <button
                    onClick={() => handleClockAction('start_break')}
                    disabled={clockActionLoading}
                    className="px-3 py-1.5 text-sm border rounded hover:bg-secondary disabled:opacity-50"
                  >
                    Take Break
                  </button>
                )}
                {activeSession.status === 'on_break' && (
                  <button
                    onClick={() => handleClockAction('end_break')}
                    disabled={clockActionLoading}
                    className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:opacity-90 disabled:opacity-50"
                  >
                    End Break
                  </button>
                )}
                <button
                  onClick={() => handleClockAction('clock_out')}
                  disabled={clockActionLoading}
                  className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50"
                >
                  Clock Out
                </button>
              </>
            )}
          </div>

          <div className="mt-3 pt-3 border-t">
            <Link href="/timesheets/clock-report" className="text-sm text-primary hover:underline">
              View clock report →
            </Link>
          </div>
        </div>

        {/* Active Timer Card */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Activity Timer
            </h2>
            {activeTimer && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTimer.timerStatus === 'running' ? 'bg-blue-100 text-blue-800'
                : activeTimer.timerStatus === 'paused' ? 'bg-yellow-100 text-yellow-800'
                : 'bg-secondary text-muted-foreground'
              }`}>
                {activeTimer.timerStatus === 'running' ? 'Running'
                  : activeTimer.timerStatus === 'paused' ? 'Paused'
                  : 'Stopped'}
              </span>
            )}
          </div>

          {activeTimer ? (
            <>
              <div className="mb-1">
                <div className="text-3xl font-mono font-bold tabular-nums">
                  {formatElapsed(timerElapsed)}
                </div>
                <div className="text-sm text-muted-foreground truncate mt-0.5" title={activeTimer.title}>
                  {activeTimer.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {TIMESHEET_CATEGORY_LABELS[activeTimer.category as keyof typeof TIMESHEET_CATEGORY_LABELS] ?? activeTimer.category}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {activeTimer.timerStatus === 'running' ? (
                  <button
                    onClick={() => handleTimerAction(activeTimer.id, 'pause')}
                    disabled={timerActionLoading}
                    className="px-3 py-1.5 text-sm border rounded hover:bg-secondary disabled:opacity-50"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleTimerAction(activeTimer.id, 'resume')}
                    disabled={timerActionLoading}
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleTimerAction(activeTimer.id, 'stop')}
                  disabled={timerActionLoading}
                  className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50"
                >
                  Stop
                </button>
                <Link
                  href={`/timesheets/my-activity/${activeTimer.id}`}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-secondary"
                >
                  Edit
                </Link>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No active timer. Log an activity to start tracking time.
            </div>
          )}
        </div>
      </div>

      {/* My Recent Activity */}
      <div className="border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">My Recent Activity</h2>
          <div className="flex items-center gap-2">
            {entriesWithNotes.length > 0 && (
              <button
                onClick={toggleAll}
                className="px-2.5 py-1.5 text-xs text-muted-foreground border rounded hover:bg-secondary transition-colors"
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            )}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              {showForm ? 'Cancel' : '+ Log Activity'}
            </button>
          </div>
        </div>

        {/* Inline Log Form */}
        {showForm && (
          <form onSubmit={handleFormSubmit} className="p-4 border-b bg-secondary/30 space-y-3">
            {formError && (
              <div className="text-sm text-destructive">{formError}</div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mode" checked={formMode === 'timer'} onChange={() => setFormMode('timer')} />
                <span>Start Timer</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mode" checked={formMode === 'manual'} onChange={() => setFormMode('manual')} />
                <span>Manual Entry</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                  required
                >
                  <option value="">Select category…</option>
                  {Object.entries(TIMESHEET_CATEGORIES).map(([key, val]) => (
                    <option key={key} value={val}>
                      {TIMESHEET_CATEGORY_LABELS[val as keyof typeof TIMESHEET_CATEGORY_LABELS]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Title / Description</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Filed tenant documents for Unit 3B"
                className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                maxLength={200}
                required
              />
            </div>

            {formMode === 'manual' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Start Time (CDT)</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">End Time (CDT)</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Break (min)</label>
                  <input
                    type="number"
                    value={formBreakMins}
                    onChange={(e) => setFormBreakMins(e.target.value)}
                    placeholder="0"
                    min={0}
                    max={480}
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Add any relevant notes…"
                className="w-full border rounded px-2 py-1.5 text-sm bg-background resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                {formSubmitting
                  ? 'Saving…'
                  : formMode === 'timer'
                  ? 'Create & Start Timer'
                  : 'Save Entry'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-1.5 text-sm border rounded hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Recent entries table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="w-8" />
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Start</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {entriesData?.entries && entriesData.entries.length > 0 ? (
                entriesData.entries.map((entry) => (
                  <Fragment key={entry.id}>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="w-8 px-2 text-center">
                        {entry.notes && (
                          <button
                            onClick={() => toggleRow(entry.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={expandedIds.has(entry.id) ? 'Collapse' : 'Expand'}
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform ${expandedIds.has(entry.id) ? 'rotate-90' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDateCDT(entry.date)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                          {TIMESHEET_CATEGORY_LABELS[entry.category as keyof typeof TIMESHEET_CATEGORY_LABELS] ?? entry.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/timesheets/my-activity/${entry.id}`}
                          className="hover:underline text-foreground"
                        >
                          {entry.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap tabular-nums">
                        {entryStartTime(entry)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">
                        {entry.timerStatus === 'running' ? (
                          <span className="text-blue-600 font-mono text-xs">{formatElapsed(timerElapsed)}</span>
                        ) : (
                          formatDuration(entry.durationMinutes)
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <EntryStatusBadge entry={entry} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {entry.timerStatus === 'running' && (
                            <button
                              onClick={() => handleTimerAction(entry.id, 'pause')}
                              disabled={timerActionLoading}
                              aria-label="Pause"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-amber-500 text-amber-500 hover:border-amber-600 hover:text-amber-600 disabled:opacity-40 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            </button>
                          )}
                          {entry.timerStatus === 'paused' && (
                            <button
                              onClick={() => handleTimerAction(entry.id, 'resume')}
                              disabled={timerActionLoading}
                              aria-label="Resume"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                          )}
                          {entry.status !== 'completed' && (
                            <button
                              onClick={() => handleTimerAction(entry.id, 'stop')}
                              disabled={timerActionLoading}
                              aria-label="Stop"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-red-500 text-red-500 hover:border-red-600 hover:text-red-600 disabled:opacity-40 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="5" y="5" width="14" height="14" rx="1" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedIds.has(entry.id) && (
                      <tr className="border-b">
                        <td colSpan={8} className="px-0 pt-0 pb-0">
                          <div className="bg-muted/40 border-l-[10px] border-muted-foreground/30 px-4 py-3 space-y-3">
                            {entry.notes && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                              </div>
                            )}
                            {entry.privateNote && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Private Note</p>
                                <p className="text-sm whitespace-pre-wrap">{entry.privateNote}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No activity logged yet. Click &quot;+ Log Activity&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t">
          <Link
            href="/timesheets/my-activity"
            className="text-sm text-primary hover:underline"
          >
            View all my activity →
          </Link>
        </div>
      </div>

      {/* Staff Activity (admin/manager only) */}
      {staffList && staffList.length > 0 && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Team Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Today&apos;s activity across your team</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Today&apos;s Entries</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Today&apos;s Hours</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.userId} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/timesheets/staff/${staff.userId}`}
                        className="font-medium hover:underline text-primary"
                      >
                        {staff.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">{staff.role}</td>
                    <td className="px-4 py-2.5 tabular-nums">{staff.todayEntryCount}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatDuration(staff.todayDurationMinutes)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {staff.lastActivityAt ? formatTimeCDT(staff.lastActivityAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TimesheetSummaryPanel />
    </div>
  );
}

function EntryStatusBadge({ entry }: { entry: TimesheetEntry }) {
  if (entry.timerStatus === 'running') {
    return (
      <span className="flex items-center gap-1" aria-label="Running">
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    );
  }
  if (entry.timerStatus === 'paused') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 text-amber-500" aria-label="Paused">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </span>
    );
  }
  if (entry.status === 'completed') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500" aria-label="Completed">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">In Progress</span>;
}
