import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createAddendum } from '@/lib/services/publishedLease.service';
import { finalizeAddendumInputSchema } from '@shared/validators/publishedLease';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string }>;
}

/**
 * POST /api/llcs/[llcId]/published-leases/[publishedLeaseId]/addenda/finalize
 * Finalize an addendum from the amendment draft.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId, publishedLeaseId } = await params;

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
    const parsed = finalizeAddendumInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    const result = await createAddendum(
      llcId,
      publishedLeaseId,
      parsed.data.draftId,
      user.uid
    );

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: message.replace('NOT_FOUND: ', '') } },
        { status: 404 }
      );
    }
    if (message.includes('INVALID_INPUT')) {
      console.warn('Addendum validation error:', message);
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: message.replace('INVALID_INPUT: ', '') } },
        { status: 400 }
      );
    }
    console.error('Error finalizing addendum:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to finalize addendum' } },
      { status: 500 }
    );
  }
}
