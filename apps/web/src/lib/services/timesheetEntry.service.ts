/**
 * Timesheet Entry Service
 *
 * Manages individual activity entries with manual and timer-based time tracking.
 * Collection: /timesheetEntries/{entryId}
 *
 * Timezone: All `date` fields are in America/Chicago (CDT).
 * Segment timestamps are stored as JavaScript Date objects (Firestore converts
 * them to Timestamps automatically). They are converted back to UTC ISO strings
 * on read via Timestamp.toDate().toISOString().
 *
 * NOTE: FieldValue.serverTimestamp() cannot be used inside array elements in
 * Firestore. Segment timestamps use `new Date()` instead, which introduces
 * a minor (~1-2ms) discrepancy from serverTimestamp — acceptable for a timer.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  TimesheetEntry,
  TimesheetEntryStatus,
  TimesheetTimerStatus,
  TimesheetTimerAction,
  CreateTimesheetEntryInput,
  UpdateTimesheetEntryInput,
  TIMESHEET_TIMEZONE,
} from '@shared/types';

const COLLECTION = 'timesheetEntries';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function tsToISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function tsToISOOrUndefined(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

/** Convert a Firestore value (Timestamp, Date, or string) to a JS Date */
function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(String(val));
}

function docToEntry(doc: FirebaseFirestore.DocumentSnapshot): TimesheetEntry {
  const d = doc.data()!;
  return {
    id: doc.id,
    userId: d.userId,
    userDisplayName: d.userDisplayName,
    date: d.date,
    category: d.category,
    title: d.title,
    notes: d.notes ?? undefined,
    timerStatus: d.timerStatus as TimesheetTimerStatus,
    segments: (d.segments ?? []).map((s: Record<string, unknown>) => ({
      startedAt: tsToISO(s.startedAt),
      endedAt: tsToISOOrUndefined(s.endedAt),
    })),
    isManualEntry: d.isManualEntry ?? false,
    manualStartTime: d.manualStartTime ?? undefined,
    manualEndTime: d.manualEndTime ?? undefined,
    manualBreakMinutes: d.manualBreakMinutes ?? undefined,
    durationMinutes: d.durationMinutes ?? undefined,
    status: d.status as TimesheetEntryStatus,
    createdAt: tsToISO(d.createdAt),
    updatedAt: tsToISOOrUndefined(d.updatedAt),
  };
}

/**
 * Compute duration (minutes) from manual HH:MM times.
 * Handles overnight (end < start on the same CDT calendar day).
 */
function computeManualDuration(
  date: string,
  startTime: string,
  endTime: string,
  breakMinutes = 0
): number {
  // Build full date-time strings treated as CDT wall-clock times.
  // We use a fixed UTC offset approach: CDT = UTC-5, CST = UTC-6.
  // For simplicity we parse as plain local time and diff — the resulting
  // minute delta is timezone-independent.
  const start = new Date(`${date}T${startTime}:00`);
  let end = new Date(`${date}T${endTime}:00`);
  // Overnight case
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  const total = Math.round((end.getTime() - start.getTime()) / 60_000);
  return Math.max(0, total - breakMinutes);
}

/**
 * Compute total completed segment duration in minutes.
 * Active (no endedAt) segments are excluded.
 */
function computeSegmentDuration(
  segments: { startedAt: Date; endedAt: Date | null }[]
): number {
  const ms = segments.reduce((sum, s) => {
    if (s.startedAt && s.endedAt) {
      return sum + (s.endedAt.getTime() - s.startedAt.getTime());
    }
    return sum;
  }, 0);
  return Math.round(ms / 60_000);
}

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export async function getTimesheetEntry(
  entryId: string
): Promise<TimesheetEntry | null> {
  const snap = await adminDb.collection(COLLECTION).doc(entryId).get();
  if (!snap.exists) return null;
  return docToEntry(snap);
}

/**
 * Get the currently running timer entry for a user, if any.
 */
export async function getActiveTimer(
  userId: string
): Promise<TimesheetEntry | null> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .where('timerStatus', '==', 'running')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return docToEntry(snap.docs[0]);
}

/**
 * List entries for a user ordered by date desc, then createdAt desc.
 */
export async function listTimesheetEntries(
  userId: string,
  options?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }
): Promise<TimesheetEntry[]> {
  let query = adminDb
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .orderBy('date', 'desc')
    .orderBy('createdAt', 'desc');

  if (options?.dateFrom) query = query.where('date', '>=', options.dateFrom);
  if (options?.dateTo) query = query.where('date', '<=', options.dateTo);
  if (options?.category) query = query.where('category', '==', options.category);

  const snap = await query.limit(options?.limit ?? 50).get();
  return snap.docs.map(docToEntry);
}

/**
 * List entries for a specific set of user IDs (admin/manager view).
 * Results are ordered by date desc, then createdAt desc.
 */
export async function listEntriesForUsers(
  userIds: string[],
  options?: { dateFrom?: string; dateTo?: string; limit?: number }
): Promise<TimesheetEntry[]> {
  if (userIds.length === 0) return [];

  // Firestore 'in' supports up to 30 values; batch if needed
  const BATCH = 30;
  const results: TimesheetEntry[] = [];

  for (let i = 0; i < userIds.length; i += BATCH) {
    const batch = userIds.slice(i, i + BATCH);
    let query = adminDb
      .collection(COLLECTION)
      .where('userId', 'in', batch)
      .orderBy('date', 'desc')
      .orderBy('createdAt', 'desc');

    if (options?.dateFrom) query = query.where('date', '>=', options.dateFrom);
    if (options?.dateTo) query = query.where('date', '<=', options.dateTo);

    const snap = await query.limit(options?.limit ?? 100).get();
    results.push(...snap.docs.map(docToEntry));
  }

  // Re-sort merged batches
  results.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return results.slice(0, options?.limit ?? 100);
}

/**
 * Get today's entries for a user (CDT calendar day).
 */
export async function getTodayEntries(
  userId: string
): Promise<TimesheetEntry[]> {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const snap = await adminDb
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .where('date', '==', today)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map(docToEntry);
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * Create a new timesheet entry.
 * If isManualEntry is true and both times are provided, durationMinutes is computed immediately.
 * If startTimerImmediately is true, the first work segment is opened and timerStatus = 'running'.
 */
export async function createTimesheetEntry(
  input: CreateTimesheetEntryInput,
  userId: string,
  userDisplayName: string
): Promise<TimesheetEntry> {
  const now = new Date();
  const docRef = adminDb.collection(COLLECTION).doc();

  let durationMinutes: number | null = null;
  let timerStatus: TimesheetTimerStatus = 'not_started';
  let status: TimesheetEntryStatus = 'in_progress';
  let segments: Array<{ startedAt: Date; endedAt: Date | null }> = [];

  if (input.isManualEntry && input.manualStartTime && input.manualEndTime) {
    durationMinutes = computeManualDuration(
      input.date,
      input.manualStartTime,
      input.manualEndTime,
      input.manualBreakMinutes ?? 0
    );
    status = 'completed';
  } else if (input.startTimerImmediately) {
    timerStatus = 'running';
    status = 'in_progress';
    segments = [{ startedAt: now, endedAt: null }];
  }

  const data: Record<string, unknown> = {
    userId,
    userDisplayName,
    date: input.date,
    category: input.category,
    title: input.title,
    notes: input.notes ?? null,
    timerStatus,
    segments,
    isManualEntry: input.isManualEntry ?? false,
    manualStartTime: input.manualStartTime ?? null,
    manualEndTime: input.manualEndTime ?? null,
    manualBreakMinutes: input.manualBreakMinutes ?? null,
    durationMinutes,
    status,
    createdAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(data);

  return {
    id: docRef.id,
    userId,
    userDisplayName,
    date: input.date,
    category: input.category,
    title: input.title,
    notes: input.notes,
    timerStatus,
    segments: segments.map(s => ({
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString(),
    })),
    isManualEntry: input.isManualEntry ?? false,
    manualStartTime: input.manualStartTime,
    manualEndTime: input.manualEndTime,
    manualBreakMinutes: input.manualBreakMinutes,
    durationMinutes: durationMinutes ?? undefined,
    status,
    createdAt: now.toISOString(),
  };
}

/**
 * Update entry metadata (category, title, notes, dates, manual times).
 * Recomputes durationMinutes if manual times change.
 */
export async function updateTimesheetEntry(
  entryId: string,
  userId: string,
  input: UpdateTimesheetEntryInput
): Promise<TimesheetEntry> {
  const docRef = adminDb.collection(COLLECTION).doc(entryId);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Entry not found');

  const cur = snap.data()!;
  if (cur.userId !== userId) throw new Error('PERMISSION_DENIED: Not your entry');

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.date !== undefined) updateData.date = input.date;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.isManualEntry !== undefined) updateData.isManualEntry = input.isManualEntry;
  if (input.manualStartTime !== undefined) updateData.manualStartTime = input.manualStartTime;
  if (input.manualEndTime !== undefined) updateData.manualEndTime = input.manualEndTime;
  if (input.manualBreakMinutes !== undefined) updateData.manualBreakMinutes = input.manualBreakMinutes;

  // Recompute duration when manual times are set
  const resolvedDate = (input.date ?? cur.date) as string;
  const resolvedStart = (input.manualStartTime ?? cur.manualStartTime) as string | null;
  const resolvedEnd = (input.manualEndTime ?? cur.manualEndTime) as string | null;
  const resolvedBreakMins = (input.manualBreakMinutes ?? cur.manualBreakMinutes ?? 0) as number;
  const resolvedIsManual = (input.isManualEntry ?? cur.isManualEntry) as boolean;

  if (resolvedIsManual && resolvedStart && resolvedEnd) {
    updateData.durationMinutes = computeManualDuration(
      resolvedDate,
      resolvedStart,
      resolvedEnd,
      resolvedBreakMins
    );
    updateData.status = 'completed';
  }

  // Allow direct duration override
  if (input.durationMinutes !== undefined) {
    updateData.durationMinutes = input.durationMinutes;
  }

  await docRef.update(updateData);

  const updated = await docRef.get();
  return docToEntry(updated);
}

/**
 * Delete a timesheet entry. Only the owner can delete their own entry.
 */
export async function deleteTimesheetEntry(
  entryId: string,
  userId: string
): Promise<void> {
  const docRef = adminDb.collection(COLLECTION).doc(entryId);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Entry not found');

  const d = snap.data()!;
  if (d.userId !== userId) throw new Error('PERMISSION_DENIED: Not your entry');

  await docRef.delete();
}

// ─────────────────────────────────────────────
// Timer Actions
// ─────────────────────────────────────────────

/**
 * Execute a timer action (start | pause | resume | stop) on an entry.
 *
 * State machine:
 *   not_started → [start]  → running
 *   running     → [pause]  → paused
 *   paused      → [resume] → running
 *   running|paused → [stop] → stopped (durationMinutes computed)
 *
 * Segment timestamps use `new Date()` because FieldValue.serverTimestamp()
 * is not supported inside Firestore array elements.
 */
export async function timerAction(
  entryId: string,
  userId: string,
  action: TimesheetTimerAction
): Promise<TimesheetEntry> {
  const docRef = adminDb.collection(COLLECTION).doc(entryId);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Entry not found');

  const d = snap.data()!;
  if (d.userId !== userId) throw new Error('PERMISSION_DENIED: Not your entry');

  const now = new Date();
  const currentStatus = d.timerStatus as TimesheetTimerStatus;

  // Deserialize existing segments
  const segments: Array<{ startedAt: Date; endedAt: Date | null }> =
    (d.segments ?? []).map((s: Record<string, unknown>) => ({
      startedAt: toDate(s.startedAt),
      endedAt: s.endedAt ? toDate(s.endedAt) : null,
    }));

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  switch (action) {
    case 'start': {
      if (currentStatus === 'running')
        throw new Error('INVALID_STATE: Timer is already running');
      if (currentStatus === 'stopped')
        throw new Error('INVALID_STATE: Timer has been stopped. Create a new entry to log more time.');
      segments.push({ startedAt: now, endedAt: null });
      updateData.timerStatus = 'running';
      updateData.status = 'in_progress';
      break;
    }

    case 'resume': {
      if (currentStatus !== 'paused')
        throw new Error('INVALID_STATE: Timer is not paused');
      segments.push({ startedAt: now, endedAt: null });
      updateData.timerStatus = 'running';
      updateData.status = 'in_progress';
      break;
    }

    case 'pause': {
      if (currentStatus !== 'running')
        throw new Error('INVALID_STATE: Timer is not running');
      const last = segments[segments.length - 1];
      if (last && !last.endedAt) last.endedAt = now;
      updateData.timerStatus = 'paused';
      updateData.status = 'paused';
      break;
    }

    case 'stop': {
      if (currentStatus !== 'running' && currentStatus !== 'paused')
        throw new Error('INVALID_STATE: No active timer to stop');
      // Close the open segment if running
      if (currentStatus === 'running') {
        const last = segments[segments.length - 1];
        if (last && !last.endedAt) last.endedAt = now;
      }
      updateData.timerStatus = 'stopped';
      updateData.status = 'completed';
      updateData.durationMinutes = computeSegmentDuration(segments);
      break;
    }
  }

  // Firestore stores Date objects as Timestamps automatically
  updateData.segments = segments;

  await docRef.update(updateData);

  const updated = await docRef.get();
  return docToEntry(updated);
}
