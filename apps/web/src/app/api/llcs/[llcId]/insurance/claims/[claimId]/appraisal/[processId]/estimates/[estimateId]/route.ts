import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  getAppraisalEstimate,
  updateAppraisalEstimate,
  deleteAppraisalEstimate,
} from '@/lib/services/appraisal.service';
import { updateAppraisalEstimateSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string; processId: string; estimateId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]/estimates/[estimateId]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, processId, estimateId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'accounting']);

    const estimate = await getAppraisalEstimate(llcId, claimId, processId, estimateId);
    if (!estimate) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: estimate });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error fetching appraisal estimate:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch estimate' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]/estimates/[estimateId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, processId, estimateId } = await params;

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
    const parsed = updateAppraisalEstimateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const estimate = await updateAppraisalEstimate(
      llcId, claimId, processId, estimateId, parsed.data, user.uid
    );
    return NextResponse.json({ ok: true, data: estimate });
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating appraisal estimate:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update estimate' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]/estimates/[estimateId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, processId, estimateId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin']);

    await deleteAppraisalEstimate(llcId, claimId, processId, estimateId, user.uid);
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting appraisal estimate:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete estimate' } },
      { status: 500 }
    );
  }
}
