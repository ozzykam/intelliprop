import { NextRequest, NextResponse } from 'next/server';
import { requireOrgEditAccess } from '@/lib/auth/checkPermission';
import { updateOrgMember, removeOrgMember } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const { orgId, userId } = await params;
    await requireOrgEditAccess(orgId);
    const body = await request.json() as { role?: string; status?: string };
    const authUser = await getAuthUser();

    await updateOrgMember(
      orgId,
      userId,
      {
        role: body.role as 'owner' | 'admin' | undefined,
        status: body.status as 'active' | 'disabled' | undefined,
      },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/admin/organizations/[orgId]/members/[userId] error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update member' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const { orgId, userId } = await params;
    await requireOrgEditAccess(orgId);
    const authUser = await getAuthUser();

    await removeOrgMember(orgId, userId, authUser?.uid ?? '');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/organizations/[orgId]/members/[userId] error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove member' } }, { status: 500 });
  }
}
