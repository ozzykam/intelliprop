import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { buildPermissionContext } from '@/lib/auth/permissionContext';
import { adminDb } from '@/lib/firebase/admin';
import { createLlc } from '@/lib/services/llc.service';
import { createLlcSchema } from '@shared/types';

/**
 * GET /api/llcs?accountId=<id>
 * List LLCs the authenticated user has access to, optionally scoped to an org account.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } }, { status: 401 });
  }

  try {
    const accountId = new URL(request.url).searchParams.get('accountId') || undefined;
    const context = await buildPermissionContext(user);

    // Platform super-admin: scope to account when provided, otherwise all active LLCs
    if (context.isPlatformSuperAdmin || context.isPlatformAdmin) {
      const query = accountId
        ? adminDb.collection('llcs').where('accountId', '==', accountId).where('status', '!=', 'archived')
        : adminDb.collection('llcs').where('status', '!=', 'archived');
      const snap = await query.get();
      return NextResponse.json({ ok: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }

    // All other users: union of directly-admined, assigned, and account-scoped LLCs
    const allLlcIds = new Set([
      ...context.adminOfLlcIds,
      ...context.assignedLlcIds,
      ...context.accountAdminLlcIds,
    ]);

    if (allLlcIds.size === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const refs = [...allLlcIds].map(id => adminDb.collection('llcs').doc(id));
    const docs = await adminDb.getAll(...refs);
    const llcs = docs
      .filter(d => {
        if (!d.exists || d.data()?.status === 'archived') return false;
        if (accountId && d.data()?.accountId !== accountId) return false;
        return true;
      })
      .map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ ok: true, data: llcs });
  } catch (error) {
    console.error('Error listing LLCs:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list LLCs' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs
 * Create a new LLC (the creator becomes the admin)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createLlcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    // Auto-assign the new LLC to the creator's account (if they own one)
    const context = await buildPermissionContext(user);
    const accountId = context.ownerOfAccountIds[0] ?? context.memberOfAccountIds[0] ?? undefined;

    const llc = await createLlc({ ...parsed.data, accountId }, user.uid);

    return NextResponse.json({ ok: true, data: llc }, { status: 201 });
  } catch (error) {
    console.error('Error creating LLC:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create LLC' } },
      { status: 500 }
    );
  }
}
