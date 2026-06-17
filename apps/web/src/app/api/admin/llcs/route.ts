import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/checkPermission';
import { createLlc } from '@/lib/services/llc.service';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUser } from '@/lib/auth/requireUser';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const unassigned = searchParams.get('unassigned') === 'true';

    let query = adminDb.collection('llcs').where('status', '!=', 'archived');

    const snap = await query.get();
    const llcs = snap.docs
      .map(d => ({
        id: d.id,
        legalName: d.data().legalName as string,
        status: d.data().status as string,
        accountId: (d.data().accountId as string | null) ?? null,
      }))
      .filter(llc => !unassigned || !llc.accountId);

    return NextResponse.json({ ok: true, data: llcs });
  } catch (error) {
    console.error('GET /api/admin/llcs error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list LLCs' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await request.json() as { legalName?: string; einLast4?: string; orgId?: string };

    if (!body.legalName?.trim()) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'legalName is required' } }, { status: 400 });
    }

    const authUser = await getAuthUser();
    const llc = await createLlc(
      {
        legalName: body.legalName.trim(),
        einLast4: body.einLast4?.trim(),
        accountId: body.orgId?.trim(),
      },
      authUser?.uid ?? ''
    );

    return NextResponse.json({ ok: true, data: { id: llc.id, legalName: llc.legalName } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/llcs error:', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create LLC' } }, { status: 500 });
  }
}
