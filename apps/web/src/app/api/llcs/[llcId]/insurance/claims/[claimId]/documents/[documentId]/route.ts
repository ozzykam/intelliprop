import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  generateClaimDocumentDownloadUrl,
  deleteClaimDocument,
} from '@/lib/services/insuranceDocument.service';
import { adminDb } from '@/lib/firebase/admin';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string; documentId: string }>;
}

/**
 * GET /api/llcs/[llcId]/insurance/claims/[claimId]/documents/[documentId]
 * Returns a signed download URL for the document.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, documentId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'accounting']);

    const docSnap = await adminDb
      .collection('llcs')
      .doc(llcId)
      .collection('insuranceClaims')
      .doc(claimId)
      .collection('documents')
      .doc(documentId)
      .get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    if (!data?.storagePath) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }

    const downloadUrl = await generateClaimDocumentDownloadUrl(data.storagePath as string);
    return NextResponse.json({ ok: true, data: { downloadUrl } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate download URL' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/insurance/claims/[claimId]/documents/[documentId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId, documentId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    await deleteClaimDocument(llcId, claimId, documentId, user.uid);
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting claim document:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete document' } },
      { status: 500 }
    );
  }
}
