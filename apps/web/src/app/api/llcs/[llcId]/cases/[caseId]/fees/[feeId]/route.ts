import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { updateCaseFee, deleteCaseFee } from '@/lib/services/caseFee.service';
import { updateLegalFeeSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; caseId: string; feeId: string }>;
}

/**
 * PATCH /api/llcs/[llcId]/cases/[caseId]/fees/[feeId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, caseId, feeId } = await params;

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
    const parsed = updateLegalFeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: parsed.error.issues?.[0]?.message || 'Invalid input',
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateCaseFee(llcId, caseId, feeId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: updated });
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Fee not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating fee:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update fee' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/cases/[caseId]/fees/[feeId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, caseId, feeId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'legal']);

    await deleteCaseFee(llcId, caseId, feeId, user.uid);
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Fee not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting fee:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete fee' } },
      { status: 500 }
    );
  }
}
