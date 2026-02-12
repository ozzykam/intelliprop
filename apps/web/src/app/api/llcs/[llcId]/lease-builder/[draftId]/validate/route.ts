import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { validateDraftStep } from '@/lib/services/leaseBuilder.service';

interface RouteParams {
  params: Promise<{ llcId: string; draftId: string }>;
}

/**
 * POST /api/llcs/[llcId]/lease-builder/[draftId]/validate
 * Validate a draft and return validation results
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { llcId, draftId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const result = await validateDraftStep(llcId, draftId);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access to this LLC' } },
        { status: 403 }
      );
    }
    if (message.includes('not found')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }
    console.error('Error validating draft:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to validate draft' } },
      { status: 500 }
    );
  }
}
