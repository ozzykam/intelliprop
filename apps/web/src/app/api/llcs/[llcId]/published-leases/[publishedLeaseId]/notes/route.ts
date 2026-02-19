import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { addNote } from '@/lib/services/publishedLease.service';
import { addNoteInputSchema } from '@shared/validators/publishedLease';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string }>;
}

/**
 * POST /api/llcs/[llcId]/published-leases/[publishedLeaseId]/notes
 * Add a note to a published lease
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
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const body = await request.json();
    const parsed = addNoteInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    const note = await addNote(llcId, publishedLeaseId, parsed.data.text, user.uid);
    return NextResponse.json({ ok: true, data: note }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Published lease not found' } },
        { status: 404 }
      );
    }
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Access denied' } },
        { status: 403 }
      );
    }
    console.error('Error adding note:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add note' } },
      { status: 500 }
    );
  }
}
