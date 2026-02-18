import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { getRecentActivity, getPaginatedActivity } from '@/lib/services/activity.service';

/**
 * GET /api/activity
 * Dashboard mode (no page param): returns ActivityItem[]
 * Paginated mode (page param):    returns PaginatedActivityResult
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
    const pageParam = searchParams.get('page');

    if (pageParam) {
      // Paginated mode
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

      const data = await getPaginatedActivity(user.uid, { page, limit });
      return NextResponse.json({ ok: true, data });
    }

    // Dashboard mode — backward compatible
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const clampedLimit = Math.min(Math.max(1, limit), 100);

    const activity = await getRecentActivity(user.uid, clampedLimit);
    return NextResponse.json({ ok: true, data: activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity' } },
      { status: 500 }
    );
  }
}
