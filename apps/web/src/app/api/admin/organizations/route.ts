import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/checkPermission';
import { listOrgs, createOrg } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';

export async function GET() {
  try {
    await requirePlatformAdmin();
    const organizations = await listOrgs();
    return NextResponse.json({ ok: true, data: organizations });
  } catch (error) {
    console.error('GET /api/admin/organizations error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list organizations' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await request.json() as { name?: string; ownerUserId?: string };

    if (!body.name?.trim() || !body.ownerUserId?.trim()) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'name and ownerUserId are required' } }, { status: 400 });
    }

    const authUser = await getAuthUser();
    const organization = await createOrg(
      { name: body.name.trim(), ownerUserId: body.ownerUserId.trim() },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true, data: organization }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/organizations error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create organization' } }, { status: 500 });
  }
}
