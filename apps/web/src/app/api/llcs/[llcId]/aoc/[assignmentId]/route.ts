import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { getAoc, updateAoc, deleteAoc } from '@/lib/services/aoc.service';
import { updateAssignmentSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; assignmentId: string }>;
}

/**
 * GET /api/llcs/[llcId]/aoc/[assignmentId]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, assignmentId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal', 'accounting']);

    const assignment = await getAoc(llcId, assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: assignment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error getting assignment:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get assignment' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llcs/[llcId]/aoc/[assignmentId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, assignmentId } = await params;

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
    const parsed = updateAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssueMessage = parsed.error.issues?.[0]?.message || 'Invalid input';
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: firstIssueMessage } },
        { status: 400 }
      );
    }

    const updated = await updateAoc(llcId, assignmentId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or legal access required' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }
    if (message.includes('INVALID_TRANSITION')) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_TRANSITION', message: message.replace('INVALID_TRANSITION: ', '') } },
        { status: 400 }
      );
    }
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update assignment' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/aoc/[assignmentId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, assignmentId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'legal']);

    await deleteAoc(llcId, assignmentId, user.uid);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or legal access required' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }
    if (message.includes('CANNOT_DELETE')) {
      return NextResponse.json(
        { ok: false, error: { code: 'CANNOT_DELETE', message: 'Only draft assignments may be deleted' } },
        { status: 409 }
      );
    }
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete assignment' } },
      { status: 500 }
    );
  }
}
