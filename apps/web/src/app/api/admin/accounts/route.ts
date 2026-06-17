import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { listOrgs, createOrg } from '@/lib/services/account.service';
import { getAuthUser } from '@/lib/auth/requireUser';

export async function GET() {
  try {
    await requireSuperAdmin();
    const accounts = await listOrgs();
    return NextResponse.json({ ok: true, data: accounts });
  } catch (error) {
    console.error('GET /api/admin/accounts error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list accounts' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json() as { name?: string; ownerUserId?: string };

    if (!body.name?.trim() || !body.ownerUserId?.trim()) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'name and ownerUserId are required' } }, { status: 400 });
    }

    const authUser = await getAuthUser();
    const account = await createOrg(
      { name: body.name.trim(), ownerUserId: body.ownerUserId.trim() },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true, data: account }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/accounts error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create account' } }, { status: 500 });
  }
}
