import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createAppraisalEstimate, listAppraisalEstimates } from '@/lib/services/appraisal.service';
import { createAppraisalEstimateSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string; processId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]/estimates
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, processId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'accounting']);

    const estimates = await listAppraisalEstimates(llcId, claimId, processId);
    return NextResponse.json({ ok: true, data: estimates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error listing appraisal estimates:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list estimates' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]/estimates
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, processId } = await params;

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
    const parsed = createAppraisalEstimateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const estimate = await createAppraisalEstimate(llcId, claimId, processId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: estimate }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error creating appraisal estimate:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create estimate' } },
      { status: 500 }
    );
  }
}
