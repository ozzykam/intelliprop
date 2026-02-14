import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { addSignedDocument, removeSignedDocument } from '@/lib/services/publishedLease.service';
import { confirmUploadInputSchema } from '@shared/validators/publishedLease';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string; documentId: string }>;
}

/**
 * POST /api/llcs/[llcId]/published-leases/[publishedLeaseId]/documents/[documentId]
 * Confirm upload — add signed document metadata after file is uploaded to Storage
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
    const parsed = confirmUploadInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    const signedDoc = await addSignedDocument(llcId, publishedLeaseId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: signedDoc }, { status: 201 });
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
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error confirming document upload:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm upload' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/published-leases/[publishedLeaseId]/documents/[documentId]
 * Remove a signed document
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, publishedLeaseId, documentId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    await removeSignedDocument(llcId, publishedLeaseId, documentId, user.uid);
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
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete document' } },
      { status: 500 }
    );
  }
}
