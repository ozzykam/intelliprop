import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { acceptAddendum, deleteAddendum } from '@/lib/services/publishedLease.service';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string; addendumId: string }>;
}

/**
 * PATCH /api/llcs/[llcId]/published-leases/[publishedLeaseId]/addenda/[addendumId]
 * Accept a pending addendum.
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { llcId, publishedLeaseId, addendumId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    await acceptAddendum(llcId, publishedLeaseId, addendumId, user.uid);

    return NextResponse.json({ ok: true }, { status: 200 });
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
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: message.replace('INVALID_INPUT: ', '') } },
        { status: 400 }
      );
    }
    console.error('Error accepting addendum:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept addendum' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/published-leases/[publishedLeaseId]/addenda/[addendumId]
 * Delete a pending (unaccepted) addendum.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, publishedLeaseId, addendumId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    await deleteAddendum(llcId, publishedLeaseId, addendumId, user.uid);

    return NextResponse.json({ ok: true }, { status: 200 });
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
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: message.replace('INVALID_INPUT: ', '') } },
        { status: 400 }
      );
    }
    console.error('Error deleting addendum:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete addendum' } },
      { status: 500 }
    );
  }
}
