import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  getInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
} from '@/lib/services/insurance.service';
import { updateInsurancePolicySchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; policyId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/policies/[policyId]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, policyId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'accounting']);

    const policy = await getInsurancePolicy(llcId, policyId);
    if (!policy) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Policy not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: policy });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error fetching insurance policy:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch policy' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llcs/[llcId]/insurance/policies/[policyId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, policyId } = await params;

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
    const parsed = updateInsurancePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const policy = await updateInsurancePolicy(llcId, policyId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: policy });
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Policy not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating insurance policy:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update policy' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/insurance/policies/[policyId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, policyId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin']);

    await deleteInsurancePolicy(llcId, policyId, user.uid);
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Policy not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting insurance policy:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete policy' } },
      { status: 500 }
    );
  }
}
