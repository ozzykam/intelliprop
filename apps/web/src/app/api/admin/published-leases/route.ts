import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { listAllPublishedLeases } from '@/lib/services/publishedLease.service';

/**
 * GET /api/admin/published-leases
 * Get all published leases across all LLCs (super-admin only)
 * Query params:
 * - llcId: filter by LLC
 * - status: filter by status (active, terminated, expired)
 * - accepted: filter by accepted (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const llcId = searchParams.get('llcId') || undefined;
    const status = searchParams.get('status') || undefined;
    const accepted = searchParams.get('accepted');

    const leases = await listAllPublishedLeases({
      llcId,
      status,
      accepted: accepted !== null ? accepted === 'true' : undefined,
    });

    return NextResponse.json({ ok: true, data: leases });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED') || message.includes('Super-admin')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Super-admin access required' } },
        { status: 403 }
      );
    }
    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
        { status: 401 }
      );
    }
    console.error('Error fetching admin published leases:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch published leases' } },
      { status: 500 }
    );
  }
}
