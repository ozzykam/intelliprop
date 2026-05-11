import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getUser } from '@/lib/services/user.service';

/**
 * GET /api/timesheets/settings
 * Returns the super-admin's current sharing list with resolved user names.
 * 403 for non-super-admins.
 */
export async function GET() {
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

    const sharedWith: string[] = userDoc.data()?.timesheetSharedWith ?? [];

    // Resolve display names for each shared user
    const resolvedUsers = await Promise.all(
      sharedWith.map(async (uid) => {
        const u = await getUser(uid);
        return {
          userId: uid,
          displayName: u?.displayName ?? u?.email ?? uid,
          email: u?.email ?? '',
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: { sharedWith: resolvedUsers },
    });
  } catch (error) {
    console.error('[GET /api/timesheets/settings]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load settings' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/timesheets/settings
 * Add or remove a user from the super-admin's sharing list.
 * Body: { action: 'add' | 'remove', userId: string }
 * 403 for non-super-admins.
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { action, userId: targetUserId } = body;

    if (!action || !targetUserId || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'action (add|remove) and userId are required' } },
        { status: 400 }
      );
    }

    // Cannot share with yourself
    if (targetUserId === caller.uid) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'Cannot share with yourself' } },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await getUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const docRef = adminDb.collection('users').doc(caller.uid);

    if (action === 'add') {
      await docRef.update({
        timesheetSharedWith: FieldValue.arrayUnion(targetUserId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        timesheetSharedWith: FieldValue.arrayRemove(targetUserId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        userId: targetUserId,
        displayName: targetUser.displayName ?? targetUser.email ?? targetUserId,
        email: targetUser.email ?? '',
        action,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/timesheets/settings]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } },
      { status: 500 }
    );
  }
}
