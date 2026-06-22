import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { getOwnerDashboardStats } from '@/lib/services/dashboard.service';

/**
 * GET /api/dashboard?accountId=<id>
 * Get aggregated dashboard stats scoped to the given org account.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  const accountId = new URL(request.url).searchParams.get('accountId') ?? undefined;

  try {
    const stats = await getOwnerDashboardStats(user.uid, accountId);
    return NextResponse.json({ ok: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard stats' } },
      { status: 500 }
    );
  }
}
