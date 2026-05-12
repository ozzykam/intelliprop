'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
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

function formatDuration(minutes: number | undefined): string {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateTimeCDT(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMESHEET_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

function formatTimeCDT(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMESHEET_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

/** Converts a stored "HH:MM" 24-hour string to 12-hour AM/PM display */
function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function formatDateCDT(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function computeSegmentDuration(
  segments: Array<{ startedAt: string; endedAt?: string }>
): number {
  return Math.round(
    segments.reduce((sum, s) => {
      if (s.endedAt) {
        return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime());
      }
      return sum;
    }, 0) / 60_000
  );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface Props {
  params: Promise<{ entryId: string }>;
}

export default function EntryDetailPage({ params }: Props) {
  const { entryId } = use(params);
  const router = useRouter();

  const [entry, setEntry] = useState<TimesheetEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsManual, setEditIsManual] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreakMins, setEditBreakMins] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Private note state
  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Timer action state
  const [timerLoading, setTimerLoading] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const fetchEntry = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/timesheets/entries/${entryId}`);
      const json = await res.json();
      if (json.ok) {
        setEntry(json.data);
      } else {
        setError(json.error?.message ?? 'Entry not found');
      }
    } catch {
      setError('Failed to load entry');
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  function startEditingNote() {
    setNoteInput(entry?.privateNote ?? '');
    setNoteError('');
    setEditingNote(true);
  }

  async function handleNoteSave() {
    setNoteSaving(true);
    setNoteError('');
    try {
      const res = await fetch(`/api/timesheets/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateNote: noteInput || null }),
      });
      const json = await res.json();
      if (json.ok) {
        setEntry(json.data);
        setEditingNote(false);
      } else {
        setNoteError(json.error?.message ?? 'Failed to save');
      }
    } catch {
      setNoteError('Failed to save');
    } finally {
      setNoteSaving(false);
    }
  }

  function startEditing() {
    if (!entry) return;
    setEditDate(entry.date);
    setEditCategory(entry.category);
    setEditTitle(entry.title);
    setEditNotes(entry.notes ?? '');
    setEditIsManual(entry.isManualEntry);
    setEditStartTime(entry.manualStartTime ?? '');
    setEditEndTime(entry.manualEndTime ?? '');
    setEditBreakMins(entry.manualBreakMinutes != null ? String(entry.manualBreakMinutes) : '');
    setEditDuration(entry.durationMinutes != null ? String(entry.durationMinutes) : '');
    setEditError('');
    setEditing(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editCategory || !editTitle.trim()) {
      setEditError('Category and title are required');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      const body: Record<string, unknown> = {
        date: editDate,
        category: editCategory,
        title: editTitle.trim(),
        notes: editNotes || undefined,
        isManualEntry: editIsManual,
      };
      if (editIsManual) {
        if (editStartTime) body.manualStartTime = editStartTime;
        if (editEndTime) body.manualEndTime = editEndTime;
        if (editBreakMins) body.manualBreakMinutes = parseInt(editBreakMins);
      }
      if (editDuration && !editIsManual) {
        body.durationMinutes = parseInt(editDuration);
      }

      const res = await fetch(`/api/timesheets/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setEntry(json.data);
        setEditing(false);
      } else {
        setEditError(json.error?.message ?? 'Failed to update');
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleTimerAction(action: 'start' | 'pause' | 'resume' | 'stop') {
    setTimerLoading(true);
    try {
      const res = await fetch(`/api/timesheets/entries/${entryId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) setEntry(json.data);
      else setError(json.error?.message ?? 'Timer action failed');
    } finally {
      setTimerLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/timesheets/entries/${entryId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) router.push('/timesheets/my-activity');
      else setError(json.error?.message ?? 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-6 bg-secondary rounded w-64 animate-pulse" />
        <div className="h-48 bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-destructive mb-4">{error || 'Entry not found'}</div>
        <Link href="/timesheets/my-activity" className="text-sm text-primary hover:underline">
          ← Back to My Activity
        </Link>
      </div>
    );
  }

  const categoryLabel = TIMESHEET_CATEGORY_LABELS[entry.category as keyof typeof TIMESHEET_CATEGORY_LABELS] ?? entry.category;
  const segmentDuration = computeSegmentDuration(entry.segments);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/timesheets" className="hover:text-foreground">Timesheets</Link>
        <span>/</span>
        <Link href="/timesheets/my-activity" className="hover:text-foreground">My Activity</Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{entry.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{entry.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded">{categoryLabel}</span>
            <span className="text-sm text-muted-foreground">{formatDateCDT(entry.date)}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!editing && (
            <>
              <button
                onClick={startEditing}
                className="px-3 py-1.5 text-sm border rounded hover:bg-secondary"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded hover:bg-destructive/10 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Timer Controls (if not completed and not editing) */}
      {!editing && entry.timerStatus !== 'stopped' && !entry.isManualEntry && (
        <div className="border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Timer</div>
            <div className="text-2xl font-mono font-bold tabular-nums mt-0.5">
              {formatDuration(segmentDuration)}
            </div>
          </div>
          <div className="flex gap-2">
            {entry.timerStatus === 'not_started' && (
              <button
                onClick={() => handleTimerAction('start')}
                disabled={timerLoading}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                Start Timer
              </button>
            )}
            {entry.timerStatus === 'running' && (
              <>
                <button onClick={() => handleTimerAction('pause')} disabled={timerLoading} className="px-4 py-2 text-sm border rounded hover:bg-secondary disabled:opacity-50">Pause</button>
                <button onClick={() => handleTimerAction('stop')} disabled={timerLoading} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50">Stop</button>
              </>
            )}
            {entry.timerStatus === 'paused' && (
              <>
                <button onClick={() => handleTimerAction('resume')} disabled={timerLoading} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">Resume</button>
                <button onClick={() => handleTimerAction('stop')} disabled={timerLoading} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50">Stop</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editing ? (
        <form onSubmit={handleEditSubmit} className="border rounded-lg p-4 bg-card space-y-4">
          <h2 className="font-semibold">Edit Entry</h2>
          {editError && <div className="text-sm text-destructive">{editError}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Date</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm bg-background" required />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Category</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm bg-background" required>
                <option value="">Select…</option>
                {Object.entries(TIMESHEET_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={val}>{TIMESHEET_CATEGORY_LABELS[val as keyof typeof TIMESHEET_CATEGORY_LABELS]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Title</label>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} className="w-full border rounded px-2 py-1.5 text-sm bg-background" required />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes</label>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} maxLength={2000} className="w-full border rounded px-2 py-1.5 text-sm bg-background resize-none" />
          </div>

          <div className="flex items-center gap-2">
            <input id="manual-toggle" type="checkbox" checked={editIsManual} onChange={(e) => setEditIsManual(e.target.checked)} />
            <label htmlFor="manual-toggle" className="text-sm">Override with manual start/end times</label>
          </div>

          {editIsManual && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Start Time (CDT)</label>
                <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">End Time (CDT)</label>
                <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Break (min)</label>
                <input type="number" value={editBreakMins} onChange={(e) => setEditBreakMins(e.target.value)} min={0} max={480} className="w-full border rounded px-2 py-1.5 text-sm bg-background" />
              </div>
            </div>
          )}

          {!editIsManual && entry.timerStatus === 'stopped' && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Duration Override (minutes)</label>
              <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} min={0} max={1440} className="w-full border rounded px-2 py-1.5 text-sm bg-background" placeholder="Leave blank to keep computed duration" />
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={editSubmitting} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-1.5 text-sm border rounded hover:bg-secondary">Cancel</button>
          </div>
        </form>
      ) : (
        /* Detail view */
        <div className="border rounded-lg bg-card divide-y">
          {/* Duration / Time summary */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="font-semibold mt-0.5">{formatDuration(entry.durationMinutes)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-0.5">
                {entry.timerStatus === 'running' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Running</span>}
                {entry.timerStatus === 'paused' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Paused</span>}
                {entry.timerStatus === 'stopped' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Completed</span>}
                {entry.timerStatus === 'not_started' && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">Not Started</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Entry Type</div>
              <div className="font-medium mt-0.5 text-sm">{entry.isManualEntry ? 'Manual' : 'Timer'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Logged</div>
              <div className="text-sm mt-0.5 text-muted-foreground">{formatDateTimeCDT(entry.createdAt)}</div>
            </div>
          </div>

          {/* Manual time details */}
          {entry.isManualEntry && (entry.manualStartTime || entry.manualEndTime) && (
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Start Time (CDT)</div>
                <div className="font-medium mt-0.5">{entry.manualStartTime ? formatTime12h(entry.manualStartTime) : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">End Time (CDT)</div>
                <div className="font-medium mt-0.5">{entry.manualEndTime ? formatTime12h(entry.manualEndTime) : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Break</div>
                <div className="font-medium mt-0.5">{entry.manualBreakMinutes ? `${entry.manualBreakMinutes} min` : '—'}</div>
              </div>
            </div>
          )}

          {/* Timer segments */}
          {!entry.isManualEntry && entry.segments.length > 0 && (
            <div className="p-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Timer Segments ({entry.segments.length})
              </div>
              <div className="space-y-1.5">
                {entry.segments.map((seg, i) => {
                  const durMs = seg.endedAt
                    ? new Date(seg.endedAt).getTime() - new Date(seg.startedAt).getTime()
                    : null;
                  const durMin = durMs !== null ? Math.round(durMs / 60_000) : null;
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                      <span>{formatTimeCDT(seg.startedAt)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{seg.endedAt ? formatTimeCDT(seg.endedAt) : <span className="text-blue-600">Running…</span>}</span>
                      {durMin !== null && (
                        <span className="text-muted-foreground text-xs">({formatDuration(durMin)})</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="p-4">
              <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}

          {/* Private Note */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Private Note</span>
                <span className="text-xs text-muted-foreground/60 normal-case tracking-normal">— only visible to you</span>
              </div>
              {!editingNote && (
                <button
                  onClick={startEditingNote}
                  className="text-xs text-primary hover:underline"
                >
                  {entry.privateNote ? 'Edit' : 'Add'}
                </button>
              )}
            </div>

            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Write a private note…"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background resize-none"
                />
                {noteError && <p className="text-xs text-destructive">{noteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleNoteSave}
                    disabled={noteSaving}
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                  >
                    {noteSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingNote(false)}
                    className="px-3 py-1.5 text-sm border rounded hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  {entry.privateNote && (
                    <button
                      onClick={async () => {
                        setNoteInput('');
                        setNoteSaving(true);
                        setNoteError('');
                        try {
                          const res = await fetch(`/api/timesheets/entries/${entryId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ privateNote: null }),
                          });
                          const json = await res.json();
                          if (json.ok) {
                            setEntry(json.data);
                            setEditingNote(false);
                          } else {
                            setNoteError(json.error?.message ?? 'Failed to clear');
                          }
                        } catch {
                          setNoteError('Failed to clear');
                        } finally {
                          setNoteSaving(false);
                        }
                      }}
                      disabled={noteSaving}
                      className="px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded hover:bg-destructive/10 disabled:opacity-50 ml-auto"
                    >
                      Clear note
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {entry.privateNote ?? <span className="italic text-muted-foreground/60">No private note</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
