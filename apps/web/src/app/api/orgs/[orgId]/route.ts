import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const context = await requirePermissionContext();
    if (!context.userId) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
    }

    const { orgId } = await params;
    const orgDoc = await adminDb.collection('accounts').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { id: orgId, name: orgDoc.data()?.name as string } });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
