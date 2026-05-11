import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { timerAction } from '@/lib/services/timesheetEntry.service';
import { timerActionSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ entryId: string }>;
}

/**
 * POST /api/timesheets/entries/[entryId]/timer
 * Execute a timer action: start | pause | resume | stop
 *
 * State machine:
 *   not_started → start  → running
 *   running     → pause  → paused
 *   paused      → resume → running
 *   running|paused → stop → stopped (durationMinutes computed)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { entryId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = timerActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid input' } },
        { status: 400 }
      );
    }

    const entry = await timerAction(entryId, user.uid, parsed.data.action);
    return NextResponse.json({ ok: true, data: entry });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }
    if (msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Not your entry' } },
        { status: 403 }
      );
    }
    if (msg.includes('INVALID_STATE')) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_STATE', message: msg.split(': ')[1] ?? 'Invalid timer state' } },
        { status: 422 }
      );
    }
    console.error('[POST /api/timesheets/entries/[entryId]/timer]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update timer' } },
      { status: 500 }
    );
  }
}
