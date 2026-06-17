import { NextRequest, NextResponse } from 'next/server';
import { requireOrgEditAccess } from '@/lib/auth/checkPermission';
import { listOrgMembers, addOrgMember } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgEditAccess(orgId);
    const members = await listOrgMembers(orgId);
    return NextResponse.json({ ok: true, data: members });
  } catch (error) {
    console.error('GET /api/admin/organizations/[orgId]/members error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list members' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgEditAccess(orgId);
    const body = await request.json() as { userId?: string; role?: string };

    if (!body.userId?.trim() || !body.role) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'userId and role are required' } }, { status: 400 });
    }

    if (!['owner', 'admin'].includes(body.role)) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'role must be owner or admin' } }, { status: 400 });
    }

    const authUser = await getAuthUser();
    await addOrgMember(
      orgId,
      { userId: body.userId.trim(), role: body.role as 'owner' | 'admin' },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/organizations/[orgId]/members error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add member' } }, { status: 500 });
  }
}
