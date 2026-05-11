/**
 * Timesheet Clock Service
 *
 * Manages daily clock-in / clock-out sessions.
 * Collection: /timesheetClockSessions/{sessionId}
 *
 * Timezone: All `date` fields are in America/Chicago (CDT).
 * All Firestore Timestamps are converted to UTC ISO strings on read.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { TimesheetClockSession, TimesheetClockStatus, TIMESHEET_TIMEZONE } from '@shared/types';

const COLLECTION = 'timesheetClockSessions';

// ─────────────────────────────────────────────
// Timezone helper
// ─────────────────────────────────────────────

/** Returns today's date string (YYYY-MM-DD) in America/Chicago */
export function getTodayInCDT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// ─────────────────────────────────────────────
// Firestore → domain mapping
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

function docToSession(doc: FirebaseFirestore.DocumentSnapshot): TimesheetClockSession {
  const d = doc.data()!;
  return {
    id: doc.id,
    userId: d.userId,
    userDisplayName: d.userDisplayName,
    date: d.date,
    clockedInAt: tsToISO(d.clockedInAt),
    clockedOutAt: tsToISOOrUndefined(d.clockedOutAt),
    breaks: (d.breaks ?? []).map((b: Record<string, unknown>) => ({
      startedAt: tsToISO(b.startedAt),
      endedAt: tsToISOOrUndefined(b.endedAt),
    })),
    totalWorkedMinutes: d.totalWorkedMinutes ?? undefined,
    totalBreakMinutes: d.totalBreakMinutes ?? undefined,
    status: d.status as TimesheetClockStatus,
    notes: d.notes ?? undefined,
    createdAt: tsToISO(d.createdAt),
    updatedAt: tsToISOOrUndefined(d.updatedAt),
  };
}

// ─────────────────────────────────────────────
// Duration calculation
// ─────────────────────────────────────────────

function computeWorkedMinutes(
  clockedInAt: string,
  clockedOutAt: string,
  breaks: { startedAt: string; endedAt?: string }[]
): { workedMinutes: number; breakMinutes: number } {
  const totalMs =
    new Date(clockedOutAt).getTime() - new Date(clockedInAt).getTime();

  const breakMs = breaks.reduce((sum, b) => {
    if (b.endedAt) {
      return sum + (new Date(b.endedAt).getTime() - new Date(b.startedAt).getTime());
    }
    return sum;
  }, 0);

  return {
    workedMinutes: Math.max(0, Math.round((totalMs - breakMs) / 60_000)),
    breakMinutes: Math.round(breakMs / 60_000),
  };
}

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/**
 * Get today's clock session for a user (by CDT calendar day).
 * Returns null if the user has not clocked in today.
 */
export async function getTodayClockSession(
  userId: string
): Promise<TimesheetClockSession | null> {
  const today = getTodayInCDT();

  const snap = await adminDb
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .where('date', '==', today)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return docToSession(snap.docs[0]!);
}

/**
 * Get the currently active (not clocked-out) session for a user, if any.
 */
export async function getActiveClockSession(
  userId: string
): Promise<TimesheetClockSession | null> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .where('status', 'in', ['clocked_in', 'on_break'])
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return docToSession(snap.docs[0]!);
}

/**
 * Get a single clock session by ID.
 */
export async function getClockSession(
  sessionId: string
): Promise<TimesheetClockSession | null> {
  const snap = await adminDb.collection(COLLECTION).doc(sessionId).get();
  if (!snap.exists) return null;
  return docToSession(snap);
}

/**
 * List clock sessions for a user, ordered by date descending.
 */
export async function listClockSessions(
  userId: string,
  options?: { dateFrom?: string; dateTo?: string; limit?: number }
): Promise<TimesheetClockSession[]> {
  let query = adminDb
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .orderBy('date', 'desc');

  if (options?.dateFrom) query = query.where('date', '>=', options.dateFrom);
  if (options?.dateTo) query = query.where('date', '<=', options.dateTo);

  const snap = await query.limit(options?.limit ?? 60).get();
  return snap.docs.map(docToSession);
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * Clock in. Creates a new session for today (CDT).
 * Throws if the user already has an active session.
 */
export async function clockIn(
  userId: string,
  userDisplayName: string,
  notes?: string
): Promise<TimesheetClockSession> {
  const active = await getActiveClockSession(userId);
  if (active) {
    throw new Error('ALREADY_CLOCKED_IN: An active clock session already exists');
  }

  const now = new Date();
  const date = getTodayInCDT();
  const docRef = adminDb.collection(COLLECTION).doc();

  await docRef.set({
    userId,
    userDisplayName,
    date,
    clockedInAt: now,
    clockedOutAt: null,
    breaks: [],
    totalWorkedMinutes: null,
    totalBreakMinutes: null,
    status: 'clocked_in',
    notes: notes ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: docRef.id,
    userId,
    userDisplayName,
    date,
    clockedInAt: now.toISOString(),
    breaks: [],
    status: 'clocked_in',
    notes: notes ?? undefined,
    createdAt: now.toISOString(),
  };
}

/**
 * Clock out. Computes net worked minutes and total break minutes.
 * Auto-closes any open break before computing.
 */
export async function clockOut(
  sessionId: string,
  userId: string,
  notes?: string
): Promise<TimesheetClockSession> {
  const docRef = adminDb.collection(COLLECTION).doc(sessionId);
  const snap = await docRef.get();

  if (!snap.exists) throw new Error('NOT_FOUND: Clock session not found');

  const d = snap.data()!;
  if (d.userId !== userId) throw new Error('PERMISSION_DENIED: Not your session');
  if (d.status === 'clocked_out') throw new Error('ALREADY_CLOCKED_OUT: Session already ended');

  const now = new Date();
  const clockedInAt = tsToISO(d.clockedInAt);

  // Close any open break before clocking out
  const rawBreaks: Array<{ startedAt: Date; endedAt: Date | null }> =
    (d.breaks ?? []).map((b: Record<string, unknown>) => ({
      startedAt: b.startedAt instanceof Timestamp ? b.startedAt.toDate() : new Date(String(b.startedAt)),
      endedAt: b.endedAt
        ? (b.endedAt instanceof Timestamp ? b.endedAt.toDate() : new Date(String(b.endedAt)))
        : null,
    }));

  const closedBreaks = rawBreaks.map(b =>
    b.endedAt ? b : { ...b, endedAt: now }
  );

  const isoBreaks = closedBreaks.map(b => ({
    startedAt: b.startedAt.toISOString(),
    endedAt: b.endedAt!.toISOString(),
  }));

  const { workedMinutes, breakMinutes } = computeWorkedMinutes(
    clockedInAt,
    now.toISOString(),
    isoBreaks
  );

  const updateData: Record<string, unknown> = {
    clockedOutAt: now,
    breaks: closedBreaks.map(b => ({
      startedAt: b.startedAt,
      endedAt: b.endedAt,
    })),
    totalWorkedMinutes: workedMinutes,
    totalBreakMinutes: breakMinutes,
    status: 'clocked_out',
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (notes) updateData.notes = notes;

  await docRef.update(updateData);

  const updated = await docRef.get();
  return docToSession(updated);
}

/**
 * Start a break. User must currently be clocked in (not on break, not clocked out).
 */
export async function startBreak(
  sessionId: string,
  userId: string
): Promise<TimesheetClockSession> {
  const docRef = adminDb.collection(COLLECTION).doc(sessionId);
  const snap = await docRef.get();

  if (!snap.exists) throw new Error('NOT_FOUND: Clock session not found');

  const d = snap.data()!;
  if (d.userId !== userId) throw new Error('PERMISSION_DENIED: Not your session');
  if (d.status !== 'clocked_in')
    throw new Error('INVALID_STATE: Must be clocked in to start a break');

  const now = new Date();
  const breaks = [...(d.breaks ?? []), { startedAt: now, endedAt: null }];

  await docRef.update({
    breaks,
    status: 'on_break',
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await docRef.get();
  return docToSession(updated);
}

/**
 * End a break. User must currently be on break.
 */
export async function endBreak(
  sessionId: string,
  userId: string
): Promise<TimesheetClockSession> {
  const docRef = adminDb.collection(COLLECTION).doc(sessionId);
  const snap = await docRef.get();

  if (!snap.exists) throw new Error('NOT_FOUND: Clock session not found');

  const d = snap.data()!;
  if (d.userId !== userId) throw new Error('PERMISSION_DENIED: Not your session');
  if (d.status !== 'on_break') throw new Error('INVALID_STATE: Not currently on break');

  const now = new Date();
  const breaks: Array<{ startedAt: unknown; endedAt: Date | null }> =
    [...(d.breaks ?? [])];

  // Close the last open break
  const last = breaks[breaks.length - 1];
  if (last && !last.endedAt) last.endedAt = now;

  await docRef.update({
    breaks,
    status: 'clocked_in',
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await docRef.get();
  return docToSession(updated);
}
