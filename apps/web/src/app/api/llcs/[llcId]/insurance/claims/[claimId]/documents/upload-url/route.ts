import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import {
  generateClaimDocumentUploadUrl,
  CLAIM_DOCUMENT_ALLOWED_CONTENT_TYPES,
} from '@/lib/services/insuranceDocument.service';

interface RouteParams {
  params: Promise<{ llcId: string; claimId: string }>;
}

/**
 * POST /api/llcs/[llcId]/insurance/claims/[claimId]/documents/upload-url
 * Generate a signed upload URL for a claim document.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId, claimId } = await params;

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
    const { fileName, contentType } = body as { fileName?: string; contentType?: string };

    if (!fileName || !contentType) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'fileName and contentType are required' } },
        { status: 400 }
      );
    }

    if (!CLAIM_DOCUMENT_ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Content type not allowed. Allowed: ${CLAIM_DOCUMENT_ALLOWED_CONTENT_TYPES.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    const result = await generateClaimDocumentUploadUrl(llcId, claimId, fileName, contentType);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
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
