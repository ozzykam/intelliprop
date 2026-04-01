import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  getInsuranceClaim,
  updateInsuranceClaim,
  deleteInsuranceClaim,
} from '@/lib/services/insurance.service';
import { updateInsuranceClaimSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims/[claimId]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'accounting']);

    const claim = await getInsuranceClaim(llcId, claimId);
    if (!claim) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Claim not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: claim });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error fetching insurance claim:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch claim' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llcs/[llcId]/insurance/claims/[claimId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId } = await params;

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
    const parsed = updateInsuranceClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const claim = await updateInsuranceClaim(llcId, claimId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: claim });
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Claim not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating insurance claim:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update claim' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/insurance/claims/[claimId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin']);

    await deleteInsuranceClaim(llcId, claimId, user.uid);
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Claim not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting insurance claim:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete claim' } },
      { status: 500 }
    );
  }
}
