import { NextResponse } from 'next/server';
import { getPermissionContext } from '@/lib/auth/permissionContext';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const context = await getPermissionContext();
    if (!context || context.memberOfAccountIds.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const orgRefs = context.memberOfAccountIds.map(id =>
      adminDb.collection('accounts').doc(id)
    );
    const orgDocs = await adminDb.getAll(...orgRefs);

    const orgs = orgDocs
      .filter(d => d.exists)
      .map(d => ({ id: d.id, name: d.data()?.name as string }));

    return NextResponse.json({ ok: true, data: orgs });
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
