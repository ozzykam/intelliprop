import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import {
  listUsers,
  searchUsersByEmail,
  getOrCreateUser,
} from '@/lib/services/user.service';
import { listUserAssignments } from '@/lib/services/assignment.service';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Resolve the set of user IDs associated with an org account:
 * - org account members (admins/owners)
 * - staff with active assignments to any of the org's LLCs
 */
async function getOrgUserIds(accountId: string): Promise<Set<string>> {
  const userIds = new Set<string>();

  const [orgLlcsSnap, accountMembersSnap, allAssignmentsSnap] = await Promise.all([
    adminDb.collection('llcs').where('accountId', '==', accountId).get(),
    adminDb.collection('accounts').doc(accountId).collection('accountMembers').where('status', '==', 'active').get(),
    adminDb.collection('userAssignments').where('status', '==', 'active').get(),
  ]);

  // Account members
  for (const doc of accountMembersSnap.docs) {
    const uid = doc.data().userId as string;
    if (uid) userIds.add(uid);
  }

  // Staff assigned to org's LLCs
  const orgLlcIds = new Set(orgLlcsSnap.docs.map(d => d.id));
  for (const doc of allAssignmentsSnap.docs) {
    const data = doc.data();
    const llcIds: string[] = data.llcIds || [];
    if (llcIds.some(id => orgLlcIds.has(id))) {
      const uid = data.userId as string;
      if (uid) userIds.add(uid);
    }
  }

  return userIds;
}

/**
 * GET /api/admin/users?accountId=<id>
 * List users scoped to the given org account.
 * Query params:
 * - accountId: required — org to scope results to
 * - search: search by email prefix
 * - superAdminsOnly: only return super-admins
 * - userType: filter by user type ('staff' | 'tenant')
 * - limit: max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const search = searchParams.get('search');
    const superAdminsOnly = searchParams.get('superAdminsOnly') === 'true';
    const userType = searchParams.get('userType') as 'staff' | 'tenant' | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!accountId) {
      return NextResponse.json({ ok: true, data: [] });
    }

    let users;
    if (search) {
      // For search, resolve org user IDs and post-filter
      const orgUserIds = await getOrgUserIds(accountId);
      if (orgUserIds.size === 0) return NextResponse.json({ ok: true, data: [] });
      users = await searchUsersByEmail(search, limit);
      users = users.filter(u => orgUserIds.has(u.id));
    } else {
      // Use the accountIds index for direct org-scoped listing
      users = await listUsers({
        accountId,
        limit,
        superAdminsOnly,
        userType: userType || undefined,
      });
    }

    // Optionally fetch assignments for each user
    const includeAssignments = searchParams.get('includeAssignments') === 'true';
    if (includeAssignments) {
      const usersWithAssignments = await Promise.all(
        users.map(async user => {
          const assignments = await listUserAssignments(user.id);
          return { ...user, assignments };
        })
      );
      return NextResponse.json({ ok: true, data: usersWithAssignments });
    }

    return NextResponse.json({ ok: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED') || message.includes('Super-admin')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Super-admin access required' } },
        { status: 403 }
      );
    }
    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
        { status: 401 }
      );
    }
    console.error('Error listing users:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create/sync a user from Firebase Auth (super-admin only)
 * Body: { userId: string, userType?: 'staff' | 'tenant' }
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const { userId, userType } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'userId is required' } },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(userId, {
      userType: userType || 'staff', // Default to staff when created by admin
    });
    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED') || message.includes('Super-admin')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Super-admin access required' } },
        { status: 403 }
      );
    }
    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
        { status: 401 }
      );
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
      { status: 500 }
    );
  }
}
