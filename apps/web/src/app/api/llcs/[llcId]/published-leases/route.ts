import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { publishLease, listPublishedLeases } from '@/lib/services/publishedLease.service';
import { publishLeaseInputSchema } from '@shared/validators/publishedLease';

interface RouteParams {
  params: Promise<{ llcId: string }>;
}

/**
 * GET /api/llcs/[llcId]/published-leases
 * List published leases for this LLC
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
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const accepted = searchParams.get('accepted');

    const leases = await listPublishedLeases(llcId, {
      status,
      accepted: accepted !== null ? accepted === 'true' : undefined,
    });

    return NextResponse.json({ ok: true, data: leases });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Access denied' } },
        { status: 403 }
      );
    }
    console.error('Error listing published leases:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list published leases' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/published-leases
 * Publish a lease from a completed draft
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
    const parsed = publishLeaseInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    const publishedLease = await publishLease(
      llcId,
      parsed.data.draftId,
      parsed.data.packageId,
      user.uid
    );

    return NextResponse.json({ ok: true, data: publishedLease }, { status: 201 });
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
    console.error('Error publishing lease:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to publish lease' } },
      { status: 500 }
    );
  }
}
