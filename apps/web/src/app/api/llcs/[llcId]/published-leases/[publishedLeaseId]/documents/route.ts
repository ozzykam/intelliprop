import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  getPublishedLease,
  generateDocumentUploadUrl,
  generateDocumentDownloadUrl,
} from '@/lib/services/publishedLease.service';
import { generateUploadUrlInputSchema } from '@shared/validators/publishedLease';

interface RouteParams {
  params: Promise<{ llcId: string; publishedLeaseId: string }>;
}

/**
 * GET /api/llcs/[llcId]/published-leases/[publishedLeaseId]/documents
 * List signed documents with download URLs
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

    // Generate download URLs for each document
    const docsWithUrls = await Promise.all(
      (lease.signedDocuments || []).map(async (doc) => {
        let downloadUrl: string | undefined;
        try {
          downloadUrl = await generateDocumentDownloadUrl(doc.storagePath);
        } catch {
          // File may have been deleted
        }
        return { ...doc, downloadUrl };
      })
    );

    return NextResponse.json({ ok: true, data: docsWithUrls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Access denied' } },
        { status: 403 }
      );
    }
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list documents' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/published-leases/[publishedLeaseId]/documents
 * Generate an upload URL for a signed document
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
    const parsed = generateUploadUrlInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    const result = await generateDocumentUploadUrl(
      llcId,
      publishedLeaseId,
      parsed.data.fileName,
      parsed.data.contentType
    );

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate upload URL' } },
      { status: 500 }
    );
  }
}
