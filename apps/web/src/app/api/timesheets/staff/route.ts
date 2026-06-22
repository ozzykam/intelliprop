import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { getTodayEntries } from '@/lib/services/timesheetEntry.service';
import { getTimesheetAccessTier, getVisibleStaffMap } from '../_helpers/accessTier';
import { TimesheetStaffSummary, TIMESHEET_TIMEZONE } from '@shared/types';

/**
 * GET /api/timesheets/staff
 * Returns a list of visible staff members with their today's activity summary.
 *
 * Access:
 *   admin   — all non-superAdmin staff
 *   manager — staff-level members (accounting, maintenance, legal, readOnly)
 *   others  — 403
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
    const accountId = new URL(request.url).searchParams.get('accountId') ?? undefined;
    const tier = await getTimesheetAccessTier(user.uid);

    if (tier === 'superAdmin' || tier === 'employee') {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Staff overview not available for your role' } },
        { status: 403 }
      );
    }

    const staffMap = await getVisibleStaffMap(user.uid, tier, accountId);
    if (staffMap.size === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMESHEET_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    // Fetch today's entries for all visible staff in parallel
    const staffIds = Array.from(staffMap.keys());
    const entriesByUser = await Promise.all(
      staffIds.map((uid) => getTodayEntries(uid))
    );

    const summaries: TimesheetStaffSummary[] = staffIds.map((uid, i) => {
      const info = staffMap.get(uid)!;
      const entries = entriesByUser[i]!;
      const todayEntries = entries.filter((e) => e.date === today);

      const todayDurationMinutes = todayEntries.reduce(
        (sum, e) => sum + (e.durationMinutes ?? 0),
        0
      );

      const lastActivityAt = todayEntries[0]?.createdAt;

      return {
        userId: uid,
        displayName: info.displayName,
        email: info.email,
        role: info.role,
        todayEntryCount: todayEntries.length,
        todayDurationMinutes,
        lastActivityAt,
      };
    });

    // Sort: most active today first
    summaries.sort((a, b) => b.todayDurationMinutes - a.todayDurationMinutes);

    return NextResponse.json({ ok: true, data: summaries });
  } catch (error) {
    console.error('[GET /api/timesheets/staff]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch staff list' } },
      { status: 500 }
    );
  }
}
