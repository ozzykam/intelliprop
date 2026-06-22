import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/admin/claims
 * Get all insurance claims across all LLCs (super-admin only)
 * Query params:
 * - llcId: filter by LLC
 * - statusGroup: 'open' | 'closed' (open = open/under_review/approved, closed = denied/settled/closed)
 * - status: filter by exact status value
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const llcIdFilter = searchParams.get('llcId');
    const statusGroupFilter = searchParams.get('statusGroup'); // 'open' | 'closed'
    const statusFilter = searchParams.get('status');

    const OPEN_STATUSES = new Set(['open', 'under_review', 'approved']);
    const CLOSED_STATUSES = new Set(['denied', 'settled', 'closed']);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ ok: true, data: [] });
    }

    // Build LLC map scoped to the given org account
    const llcsSnap = await adminDb.collection('llcs').where('accountId', '==', accountId).get();
    const llcMap = new Map<string, string>();
    llcsSnap.docs.forEach(doc => {
      llcMap.set(doc.id, doc.data().legalName || 'Unknown LLC');
    });

    // Get all claims via collectionGroup
    const claimsSnap = await adminDb.collectionGroup('insuranceClaims').get();

    const claims: object[] = [];

    for (const doc of claimsSnap.docs) {
      const data = doc.data();

      // Only process docs at llcs/{llcId}/insuranceClaims/{claimId}
      const pathParts = doc.ref.path.split('/');
      if (pathParts.length !== 4 || pathParts[0] !== 'llcs' || pathParts[2] !== 'insuranceClaims') continue;

      const llcId = pathParts[1]!;

      // Skip claims not in the org's LLC set
      if (!llcMap.has(llcId)) continue;

      // Apply filters
      if (llcIdFilter && llcId !== llcIdFilter) continue;
      if (statusFilter && data.status !== statusFilter) continue;
      if (statusGroupFilter === 'open' && !OPEN_STATUSES.has(data.status)) continue;
      if (statusGroupFilter === 'closed' && !CLOSED_STATUSES.has(data.status)) continue;

      claims.push({
        id: doc.id,
        llcId,
        llcName: llcMap.get(llcId) ?? 'Unknown LLC',
        policyId: data.policyId || null,
        policyNumber: data.policyNumber || null,
        carrier: data.carrier || null,
        entityName: data.entityName || '',
        propertyName: data.propertyName || data.entityName || '',
        claimNumber: data.claimNumber || null,
        causeOfLoss: data.causeOfLoss || null,
        dateOfLoss: data.dateOfLoss || null,
        dateFiled: data.dateFiled || null,
        status: data.status || 'open',
        reportedAmount: data.reportedAmount ?? null,
        settledAmount: data.settledAmount ?? null,
        description: data.description || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      });
    }

    // Sort by dateOfLoss desc
    (claims as { dateOfLoss: string | null }[]).sort((a, b) => {
      if (!a.dateOfLoss && !b.dateOfLoss) return 0;
      if (!a.dateOfLoss) return 1;
      if (!b.dateOfLoss) return -1;
      return b.dateOfLoss.localeCompare(a.dateOfLoss);
    });

    return NextResponse.json({ ok: true, data: claims });
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
    console.error('Error fetching admin claims:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch claims' } },
      { status: 500 }
    );
  }
}
