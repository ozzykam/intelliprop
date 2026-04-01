import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createInsurancePolicy, listInsurancePolicies } from '@/lib/services/insurance.service';
import { createInsurancePolicySchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/policies
 * List all insurance policies for an LLC.
 * Query params: entityType, entityId, propertyId
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
    const entityType = searchParams.get('entityType') as 'property' | 'tenant' | null;
    const entityId = searchParams.get('entityId') ?? undefined;
    const propertyId = searchParams.get('propertyId') ?? undefined;

    const policies = await listInsurancePolicies(llcId, {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(propertyId && { propertyId }),
    });

    return NextResponse.json({ ok: true, data: policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error listing insurance policies:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list policies' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/insurance/policies
 * Create a new insurance policy.
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
    const parsed = createInsurancePolicySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    const policy = await createInsurancePolicy(llcId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: policy }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error creating insurance policy:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create policy' } },
      { status: 500 }
    );
  }
}
