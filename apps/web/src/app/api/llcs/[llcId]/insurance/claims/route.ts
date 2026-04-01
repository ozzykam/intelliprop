import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createInsuranceClaim, listInsuranceClaims } from '@/lib/services/insurance.service';
import { createInsuranceClaimSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims
 * Query params: policyId, entityId, status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { llcId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'accounting']);

    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId') ?? undefined;
    const entityId = searchParams.get('entityId') ?? undefined;
    const status = searchParams.get('status') ?? undefined;

    const claims = await listInsuranceClaims(llcId, { policyId, entityId, status });
    return NextResponse.json({ ok: true, data: claims });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error listing insurance claims:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list claims' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/insurance/claims
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId } = await params;

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
    const parsed = createInsuranceClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const claim = await createInsuranceClaim(llcId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: claim }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error creating insurance claim:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create claim' } },
      { status: 500 }
    );
  }
}
