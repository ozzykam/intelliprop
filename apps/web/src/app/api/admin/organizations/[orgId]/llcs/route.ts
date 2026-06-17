import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/checkPermission';
import { listOrgLlcs, assignLlcToOrg } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requirePlatformAdmin();
    const { orgId } = await params;
    const llcs = await listOrgLlcs(orgId);
    return NextResponse.json({ ok: true, data: llcs });
  } catch (error) {
    console.error('GET /api/admin/organizations/[orgId]/llcs error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list LLCs' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requirePlatformAdmin();
    const { orgId } = await params;
    const body = await request.json() as { llcId?: string };

    if (!body.llcId?.trim()) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'llcId is required' } }, { status: 400 });
    }

    const authUser = await getAuthUser();
    await assignLlcToOrg(body.llcId.trim(), orgId, authUser?.uid ?? '');

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/organizations/[orgId]/llcs error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assign LLC' } }, { status: 500 });
  }
}
