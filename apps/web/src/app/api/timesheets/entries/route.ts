import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { getUser } from '@/lib/services/user.service';
import {
  listTimesheetEntries,
  createTimesheetEntry,
  getActiveTimer,
} from '@/lib/services/timesheetEntry.service';
import { createTimesheetEntrySchema } from '@shared/types';

/**
 * GET /api/timesheets/entries
 * Query params: limit, dateFrom, dateTo, category, includeActive
 * Returns the user's own entries + optionally flags the active timer.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const includeActive = searchParams.get('includeActive') === 'true';

    const [entries, activeTimer] = await Promise.all([
      listTimesheetEntries(user.uid, { limit, dateFrom, dateTo, category }),
      includeActive ? getActiveTimer(user.uid) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        entries,
        activeTimer: includeActive ? activeTimer : undefined,
      },
    });
  } catch (error) {
    console.error('[GET /api/timesheets/entries]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch entries' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/timesheets/entries
 * Create a new timesheet entry.
 * Set startTimerImmediately: true to start the timer on creation.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createTimesheetEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid input' } },
        { status: 400 }
      );
    }

    const userRecord = await getUser(user.uid);
    const displayName = userRecord?.displayName ?? user.email ?? user.uid;

    const entry = await createTimesheetEntry(parsed.data, user.uid, displayName);
    return NextResponse.json({ ok: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/timesheets/entries]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create entry' } },
      { status: 500 }
    );
  }
}
