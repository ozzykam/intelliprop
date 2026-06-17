import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { getOrg, updateOrg, listOrgMembers } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { accountId } = await params;

    const [account, members] = await Promise.all([
      getOrg(accountId),
      listOrgMembers(accountId),
    ]);

    if (!account) {
      return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Account not found' } }, { status: 404 });
    }

    // Enrich members with user profile data from the global users collection
    const userRefs = members.map(m => adminDb.collection('users').doc(m.userId));
    const userDocs = userRefs.length > 0 ? await adminDb.getAll(...userRefs) : [];

    const enrichedMembers = members.map(m => {
      const userDoc = userDocs.find(d => d.id === m.userId);
      const user = userDoc?.exists ? userDoc.data() : {};
      return {
        ...m,
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
        phoneNumber: user?.phoneNumber ?? null,
        photoURL: user?.photoURL ?? null,
      };
    });

    return NextResponse.json({ ok: true, data: { ...account, members: enrichedMembers } });
  } catch (error) {
    console.error('GET /api/admin/accounts/[accountId] error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get account' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { accountId } = await params;
    const body = await request.json() as { name?: string; status?: string };
    const authUser = await getAuthUser();

    await updateOrg(
      accountId,
      { name: body.name, status: body.status as 'active' | 'suspended' | undefined },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/admin/accounts/[accountId] error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update account' } }, { status: 500 });
  }
}
