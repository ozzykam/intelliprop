import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { listClockSessions } from '@/lib/services/timesheetClock.service';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo   = searchParams.get('dateTo')   ?? undefined;

  try {
    const sessions = await listClockSessions(user.uid, { dateFrom, dateTo, limit: 200 });
    return NextResponse.json({ ok: true, data: { sessions } });
  } catch (error) {
    console.error('[GET /api/timesheets/clock/sessions]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch sessions' } },
      { status: 500 }
    );
  }
}
