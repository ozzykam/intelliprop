import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { getDraft, updateDraft, deleteDraft } from '@/lib/services/leaseBuilder.service';
import { updateLeaseBuilderDraftSchema } from '@shared/validators/leaseBuilder';

interface RouteParams {
  params: Promise<{ llcId: string; draftId: string }>;
}

/**
 * GET /api/llcs/[llcId]/lease-builder/[draftId]
 * Get a specific draft
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const draft = await getDraft(llcId, draftId);
    if (!draft) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: draft });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access to this LLC' } },
        { status: 403 }
      );
    }
    console.error('Error getting draft:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get draft' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/llcs/[llcId]/lease-builder/[draftId]
 * Update a draft (wizard step save)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { llcId, draftId } = await params;

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
    const parsed = updateLeaseBuilderDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    await updateDraft(llcId, draftId, parsed.data, user.uid);

    const updated = await getDraft(llcId, draftId);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    if (message.includes('not found')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update draft' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/lease-builder/[draftId]
 * Delete a draft
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, draftId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    await deleteDraft(llcId, draftId, user.uid);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    if (message.includes('not found')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete draft' } },
      { status: 500 }
    );
  }
}
