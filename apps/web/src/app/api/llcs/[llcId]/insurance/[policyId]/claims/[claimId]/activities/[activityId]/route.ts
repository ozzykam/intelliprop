import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { updateClaimActivity, deleteClaimActivity } from '@/lib/services/claimActivity.service';
import { updateClaimActivitySchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; policyId: string; claimId: string; activityId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, activityId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    const body = await request.json();
    const parsed = updateClaimActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const activity = await updateClaimActivity(llcId, claimId, activityId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: activity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating claim activity:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update activity' } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, activityId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);
    await deleteClaimActivity(llcId, claimId, activityId, user.uid);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting claim activity:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete activity' } },
      { status: 500 }
    );
  }
}
