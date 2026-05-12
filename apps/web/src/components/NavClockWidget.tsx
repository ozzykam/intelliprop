'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimesheetClockSession } from '@shared/types';

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function formatDuration(minutes: number): string {
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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function NavClockWidget() {
  const [todaySessions, setTodaySessions] = useState<TimesheetClockSession[]>([]);
  const [activeSession, setActiveSession] = useState<TimesheetClockSession | null>(null);
  const [clockElapsed, setClockElapsed] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchClockStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/timesheets/clock');
      const json = await res.json();
      if (json.ok) {
        setTodaySessions(json.data.todaySessions ?? []);
        setActiveSession(json.data.activeSession ?? null);
      }
    } catch {
      // Silently fail — not critical for navbar
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchClockStatus();
  }, [fetchClockStatus]);

  // Live tick for the active session
  useEffect(() => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    if (!activeSession || activeSession.status === 'clocked_out') return;
    setClockElapsed(computeClockWorkedSeconds(activeSession));
    clockIntervalRef.current = setInterval(() => {
      setClockElapsed(computeClockWorkedSeconds(activeSession));
    }, 1000);
    return () => { if (clockIntervalRef.current) clearInterval(clockIntervalRef.current); };
  }, [activeSession]);

  async function handleClockIn() {
    setActionLoading(true);
    try {
      const res = await fetch('/api/timesheets/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.ok) await fetchClockStatus();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClockAction(action: 'clock_out' | 'start_break' | 'end_break') {
    const sessionId = activeSession?.id;
    if (!sessionId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/timesheets/clock/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) await fetchClockStatus();
    } finally {
      setActionLoading(false);
    }
  }

  if (!mounted) return null;

  const completedSessions = todaySessions.filter((s) => s.status === 'clocked_out');
  const completedMinutes = completedSessions.reduce((s, x) => s + (x.totalWorkedMinutes ?? 0), 0);
  const isActive = activeSession && activeSession.status !== 'clocked_out';
  const onBreak = activeSession?.status === 'on_break';

  return (
    <div className="flex items-center gap-2">
      {/* Time display */}
      {isActive ? (
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`font-mono tabular-nums font-medium ${onBreak ? 'text-orange-500' : 'text-foreground'}`}>
            {formatElapsed(clockElapsed)}
          </span>
          {completedMinutes > 0 && (
            <span className="text-muted-foreground">+{formatDuration(completedMinutes)}</span>
          )}
        </div>
      ) : completedMinutes > 0 ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDuration(completedMinutes)} worked
        </span>
      ) : null}

      {/* Action buttons */}
      {!isActive ? (
        <button
          onClick={handleClockIn}
          disabled={actionLoading}
          className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 font-medium"
        >
          Clock In
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          {!onBreak ? (
            <button
              onClick={() => handleClockAction('start_break')}
              disabled={actionLoading}
              className="px-2.5 py-1 text-xs border rounded hover:bg-secondary disabled:opacity-50"
            >
              Break
            </button>
          ) : (
            <button
              onClick={() => handleClockAction('end_break')}
              disabled={actionLoading}
              className="px-2.5 py-1 text-xs bg-orange-500 text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              End Break
            </button>
          )}
          <button
            onClick={() => handleClockAction('clock_out')}
            disabled={actionLoading}
            className="px-2.5 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            Clock Out
          </button>
        </div>
      )}
    </div>
  );
}
