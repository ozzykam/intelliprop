import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import { getOwnerAlerts, acknowledgeAlert } from '@/lib/services/alerts.service';

/**
 * POST /api/alerts
 * Acknowledge an alert so it no longer surfaces for this user.
 * Body: { alertId: string }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { alertId } = body as { alertId?: string };

  if (!alertId || typeof alertId !== 'string') {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'alertId is required' } },
      { status: 400 }
    );
  }

  try {
    await acknowledgeAlert(user.uid, alertId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to acknowledge alert' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alerts?orgId=<accountId>
 * Get alerts scoped to an org. orgId is required; users must be a member of that org.
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
    const orgId = new URL(request.url).searchParams.get('orgId') ?? undefined;

    if (orgId) {
      const context = await requirePermissionContext();
      const hasAccess =
        context.isPlatformSuperAdmin ||
        context.isPlatformAdmin ||
        context.memberOfAccountIds.includes(orgId);
      if (!hasAccess) {
        return NextResponse.json(
          { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access to this organization' } },
          { status: 403 }
        );
      }
    }

    const alerts = await getOwnerAlerts(user.uid, orgId);
    return NextResponse.json({ ok: true, data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch alerts' } },
      { status: 500 }
    );
  }
}
