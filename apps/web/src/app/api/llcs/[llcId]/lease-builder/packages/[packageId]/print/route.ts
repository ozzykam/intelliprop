import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { getPackage } from '@/lib/services/leaseBuilder.service';
import { buildPrintableHtml } from '@/lib/services/pdfGenerator';

interface RouteParams {
  params: Promise<{ llcId: string; packageId: string }>;
}

/**
 * GET /api/llcs/[llcId]/lease-builder/packages/[packageId]/print
 * Fetch a lease package and return printable HTML.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, packageId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    const pkg = await getPackage(llcId, packageId);
    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Package not found' } },
        { status: 404 }
      );
    }

    const printableHtml = buildPrintableHtml(pkg.documents);

    return NextResponse.json({ ok: true, data: { printableHtml } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error fetching printable lease package:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch lease package' } },
      { status: 500 }
    );
  }
}
