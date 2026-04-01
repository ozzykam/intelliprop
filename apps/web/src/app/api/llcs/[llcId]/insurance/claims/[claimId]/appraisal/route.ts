import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  createAppraisalProcess,
  getAppraisalProcessForClaim,
} from '@/lib/services/appraisal.service';
import { createAppraisalProcessSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal
 * Get the appraisal process for this claim (if one exists).
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

    const process = await getAppraisalProcessForClaim(llcId, claimId);
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
 * POST /api/llcs/[llcId]/insurance/claims/[claimId]/appraisal
 * Initiate an appraisal process on this claim.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const parsed = createAppraisalProcessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const process = await createAppraisalProcess(llcId, claimId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: process }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error creating appraisal process:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create appraisal process' } },
      { status: 500 }
    );
  }
}
