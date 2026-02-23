import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { getDefaultTemplate, deleteDefaultTemplate } from '@/lib/services/leaseBuilder.service';

interface RouteParams {
  params: Promise<{ llcId: string; leaseClass: string }>;
}

/**
 * GET /api/llcs/[llcId]/lease-defaults/[leaseClass]
 * Check if a default template exists for the given lease class.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, leaseClass } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    const template = await getDefaultTemplate(llcId, leaseClass);
    return NextResponse.json({ ok: true, data: { exists: template !== null } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error checking lease default template:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check template' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/lease-defaults/[leaseClass]
 * Remove the default template for the given lease class.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, leaseClass } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager']);

    await deleteDefaultTemplate(llcId, leaseClass);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error deleting lease default template:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete template' } },
      { status: 500 }
    );
  }
}
