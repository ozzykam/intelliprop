import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  getPublishedLease,
  acceptLease,
  updatePublishedLeaseStatus,
} from '@/lib/services/publishedLease.service';
import { updatePublishedLeaseSchema } from '@shared/validators/publishedLease';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string }>;
}

/**
 * GET /api/llcs/[llcId]/published-leases/[publishedLeaseId]
 * Get a single published lease
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, publishedLeaseId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const lease = await getPublishedLease(llcId, publishedLeaseId);
    if (!lease) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Published lease not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: lease });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Access denied' } },
        { status: 403 }
      );
    }
    console.error('Error fetching published lease:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch published lease' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llcs/[llcId]/published-leases/[publishedLeaseId]
 * Update a published lease (accept, change status)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const parsed = updatePublishedLeaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    if (parsed.data.accepted === true) {
      await acceptLease(llcId, publishedLeaseId, user.uid);
    }

    if (parsed.data.status) {
      await updatePublishedLeaseStatus(llcId, publishedLeaseId, parsed.data.status, user.uid);
    }

    const updated = await getPublishedLease(llcId, publishedLeaseId);
    return NextResponse.json({ ok: true, data: updated });
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
        { ok: false, error: { code: 'NOT_FOUND', message: 'Published lease not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating published lease:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update published lease' } },
      { status: 500 }
    );
  }
}
