import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import {
  clockOut,
  startBreak,
  endBreak,
} from '@/lib/services/timesheetClock.service';
import { clockActionSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * PATCH /api/timesheets/clock/[sessionId]
 * Actions: clock_out | start_break | end_break
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = clockActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid input' } },
        { status: 400 }
      );
    }

    const { action, notes } = parsed.data;
    let session;

    switch (action) {
      case 'clock_out':
        session = await clockOut(sessionId, user.uid, notes);
        break;
      case 'start_break':
        session = await startBreak(sessionId, user.uid);
        break;
      case 'end_break':
        session = await endBreak(sessionId, user.uid);
        break;
    }

    return NextResponse.json({ ok: true, data: session });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Clock session not found' } },
        { status: 404 }
      );
    }
    if (msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Not your session' } },
        { status: 403 }
      );
    }
    if (msg.includes('ALREADY_CLOCKED_OUT')) {
      return NextResponse.json(
        { ok: false, error: { code: 'CONFLICT', message: 'Session already ended' } },
        { status: 409 }
      );
    }
    if (msg.includes('INVALID_STATE')) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_STATE', message: msg.split(': ')[1] ?? 'Invalid state' } },
        { status: 422 }
      );
    }
    console.error('[PATCH /api/timesheets/clock/[sessionId]]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update clock session' } },
      { status: 500 }
    );
  }
}
