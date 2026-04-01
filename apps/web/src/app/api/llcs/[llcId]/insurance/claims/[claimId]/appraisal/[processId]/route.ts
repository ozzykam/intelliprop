import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { getAppraisalProcess, updateAppraisalProcess } from '@/lib/services/appraisal.service';
import { updateAppraisalProcessSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string; processId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]
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

    const process = await getAppraisalProcess(llcId, claimId, processId);
    if (!process) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Appraisal process not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: process });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error fetching appraisal process:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch appraisal process' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal/[processId]
 * Update status, panel members, disputed items, award, or court actions.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const parsed = updateAppraisalProcessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const process = await updateAppraisalProcess(llcId, claimId, processId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: process });
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Appraisal process not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating appraisal process:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update appraisal process' } },
      { status: 500 }
    );
  }
}
