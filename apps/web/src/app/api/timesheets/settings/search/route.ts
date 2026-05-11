import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { searchUsersByEmail } from '@/lib/services/user.service';

/**
 * GET /api/timesheets/settings/search?q=email
 * Search staff users by email prefix for the sharing picker.
 * Super-admin only.
 * Returns up to 10 matching staff users (excludes tenants and the caller).
 */
export async function GET(request: NextRequest) {
  const caller = await getAuthUser();
  if (!caller) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const userDoc = await adminDb.collection('users').doc(caller.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Super-admin only' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '').trim().toLowerCase();

    if (q.length < 2) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const users = await searchUsersByEmail(q, 10);

    const results = users
      .filter((u) => u.id !== caller.uid)           // Exclude self
      .filter((u) => u.userType !== 'tenant')        // Exclude tenants
      .map((u) => ({
        userId: u.id,
        displayName: u.displayName ?? u.email ?? u.id,
        email: u.email ?? '',
      }));

    return NextResponse.json({ ok: true, data: results });
  } catch (error) {
    console.error('[GET /api/timesheets/settings/search]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } },
      { status: 500 }
    );
  }
}
