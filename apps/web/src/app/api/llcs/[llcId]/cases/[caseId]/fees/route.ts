import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createCaseFee, listCaseFees } from '@/lib/services/caseFee.service';
import { createLegalFeeSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; caseId: string }>;
}

/**
 * GET /api/llcs/[llcId]/cases/[caseId]/fees
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, caseId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const fees = await listCaseFees(llcId, caseId);
    return NextResponse.json({ ok: true, data: fees });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error listing fees:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list fees' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/cases/[caseId]/fees
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId, caseId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'legal']);

    const body = await request.json();
    const parsed = createLegalFeeSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]?.message ?? 'Invalid input';
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: firstIssue } },
        { status: 400 }
      );
    }

    const fee = await createCaseFee(llcId, caseId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: fee }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or legal access required' } },
        { status: 403 }
      );
    }
    console.error('Error creating fee:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create fee' } },
      { status: 500 }
    );
  }
}
