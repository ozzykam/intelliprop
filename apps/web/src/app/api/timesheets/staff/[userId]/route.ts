import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { getUser } from '@/lib/services/user.service';
import { listTimesheetEntries } from '@/lib/services/timesheetEntry.service';
import { getTimesheetAccessTier, getVisibleUserIds } from '../../_helpers/accessTier';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/timesheets/staff/[userId]
 * Returns paginated timesheet entries for a specific staff member.
 *
 * Access rules:
 *   - Own entries: always allowed
 *   - admin: can view any non-superAdmin user
 *   - manager: can view staff-level users
 *   - employee/superAdmin: own only
 *
 * Query params: limit, dateFrom, dateTo, category
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId: targetUserId } = await params;

  const caller = await getAuthUser();
  if (!caller) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    // Always allow fetching own entries
    if (caller.uid !== targetUserId) {
      // If the target is a super-admin, only allow if caller is in their sharedWith list
      const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();
      if (targetUserDoc.exists && targetUserDoc.data()?.isSuperAdmin === true) {
        const sharedWith: string[] = targetUserDoc.data()?.timesheetSharedWith ?? [];
        if (!sharedWith.includes(caller.uid)) {
          return NextResponse.json(
            { ok: false, error: { code: 'PERMISSION_DENIED', message: 'This user has not shared their timesheets with you' } },
            { status: 403 }
          );
        }
      } else {
        // Normal tier-based access check
        const tier = await getTimesheetAccessTier(caller.uid);
        const visibleIds = await getVisibleUserIds(caller.uid, tier);
        if (!visibleIds.includes(targetUserId)) {
          return NextResponse.json(
            { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access to this user\'s timesheets' } },
            { status: 403 }
          );
        }
      }
    }

    // Verify target user exists
    const targetUser = await getUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    const category = searchParams.get('category') ?? undefined;

    const entries = await listTimesheetEntries(targetUserId, { limit, dateFrom, dateTo, category });

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          userId: targetUser.id,
          displayName: targetUser.displayName ?? targetUser.email ?? targetUserId,
          email: targetUser.email,
        },
        entries,
      },
    });
  } catch (error) {
    console.error('[GET /api/timesheets/staff/[userId]]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch staff entries' } },
      { status: 500 }
    );
  }
}
