import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { getUser } from '@/lib/services/user.service';
import {
  getTodayClockSession,
  getActiveClockSession,
  clockIn,
} from '@/lib/services/timesheetClock.service';
import { clockInSchema } from '@shared/types';

/**
 * GET /api/timesheets/clock
 * Returns today's clock session (CDT date) and any active session.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const [todaySession, activeSession] = await Promise.all([
      getTodayClockSession(user.uid),
      getActiveClockSession(user.uid),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        todaySession,
        activeSession,
      },
    });
  } catch (error) {
    console.error('[GET /api/timesheets/clock]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clock status' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/timesheets/clock
 * Clock in. Creates a new clock session for today (CDT).
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
    const body = await request.json().catch(() => ({}));
    const parsed = clockInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid input' } },
        { status: 400 }
      );
    }

    const userRecord = await getUser(user.uid);
    const displayName = userRecord?.displayName ?? user.email ?? user.uid;

    const session = await clockIn(user.uid, displayName, parsed.data.notes);
    return NextResponse.json({ ok: true, data: session }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('ALREADY_CLOCKED_IN')) {
      return NextResponse.json(
        { ok: false, error: { code: 'CONFLICT', message: 'You are already clocked in' } },
        { status: 409 }
      );
    }
    console.error('[POST /api/timesheets/clock]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to clock in' } },
      { status: 500 }
    );
  }
}
