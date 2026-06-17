import { NextRequest, NextResponse } from 'next/server';
import { requireOrgEditAccess } from '@/lib/auth/checkPermission';
import { getOrg, updateOrg, listOrgMembers } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgEditAccess(orgId);

    const [organization, members] = await Promise.all([
      getOrg(orgId),
      listOrgMembers(orgId),
    ]);

    if (!organization) {
      return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } }, { status: 404 });
    }

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

    return NextResponse.json({ ok: true, data: { ...organization, members: enrichedMembers } });
  } catch (error) {
    console.error('GET /api/admin/organizations/[orgId] error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get organization' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgEditAccess(orgId);
    const body = await request.json() as { name?: string; status?: string };
    const authUser = await getAuthUser();

    await updateOrg(
      orgId,
      { name: body.name, status: body.status as 'active' | 'suspended' | undefined },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/admin/organizations/[orgId] error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update organization' } }, { status: 500 });
  }
}
