import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { generateLeasePackage } from '@/lib/services/leaseBuilder.service';
import { buildPrintableHtml } from '@/lib/services/pdfGenerator';

interface RouteParams {
  params: Promise<{ llcId: string; draftId: string }>;
}

/**
 * POST /api/llcs/[llcId]/lease-builder/[draftId]/generate-pdf
 * Generate the final lease package and return it with printable HTML.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    // Assemble and save the lease package
    const leasePackage = await generateLeasePackage(llcId, draftId, user.uid);

    // Build printable HTML from assembled documents
    const printableHtml = buildPrintableHtml(leasePackage.documents);

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...leasePackage,
          printableHtml,
        },
      },
      { status: 201 }
    );
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
    if (message.includes('Assembly failed')) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_FAILED', message } },
        { status: 422 }
      );
    }
    console.error('Error generating lease package:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate lease package' } },
      { status: 500 }
    );
  }
}
