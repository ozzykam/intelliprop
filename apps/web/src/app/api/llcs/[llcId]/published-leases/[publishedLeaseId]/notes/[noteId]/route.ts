import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { deleteNote } from '@/lib/services/publishedLease.service';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string; noteId: string }>;
}

/**
 * DELETE /api/llcs/[llcId]/published-leases/[publishedLeaseId]/notes/[noteId]
 * Delete a note (only the author can delete their own notes)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, publishedLeaseId, noteId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    await deleteNote(llcId, publishedLeaseId, noteId, user.uid);
    return NextResponse.json({ ok: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: message.replace('NOT_FOUND: ', '') } },
        { status: 404 }
      );
    }
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: message.replace('PERMISSION_DENIED: ', '') } },
        { status: 403 }
      );
    }
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete note' } },
      { status: 500 }
    );
  }
}
