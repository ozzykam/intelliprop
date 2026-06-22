/**
 * Timesheet Access Tier helpers
 *
 * Tier hierarchy (who can view whose timesheet entries):
 *   superAdmin — own only (private by default)
 *   admin      — all non-superAdmin staff
 *   manager    — users with lower LLC roles (non-admin, non-manager)
 *   employee   — own only
 *
 * Role resolution uses the LLC member collection group because
 * that is the active role assignment store for this codebase.
 */

import { adminDb } from '@/lib/firebase/admin';
import { TimesheetAccessTier } from '@shared/types';

/** Roles considered "staff-level" (visible to managers) */
const MANAGER_VISIBLE_ROLES = new Set([
  'accounting',
  'maintenance',
  'legal',
  'readOnly',
]);

/**
 * Determine the timesheet access tier for a given user.
 */
export async function getTimesheetAccessTier(
  userId: string
): Promise<TimesheetAccessTier> {
  // Check super-admin flag
  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (userDoc.exists && userDoc.data()?.isPlatformSuperAdmin === true) {
    return 'superAdmin';
  }

  // Check active LLC memberships for highest role
  const membershipsSnap = await adminDb
    .collectionGroup('members')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const roles = membershipsSnap.docs.map((d) => d.data().role as string);

  if (roles.includes('admin')) return 'admin';
  if (roles.includes('manager')) return 'manager';
  return 'employee';
}

/**
 * Returns the list of userIds whose timesheet entries the caller may read.
 * - superAdmin / employee: [callerId] only
 * - admin: all active LLC member userIds (excluding superAdmins)
 * - manager: all member userIds with manager-visible roles
 */
export async function getVisibleUserIds(
  callerId: string,
  tier: TimesheetAccessTier
): Promise<string[]> {
  if (tier === 'superAdmin' || tier === 'employee') {
    return [callerId];
  }

  const allMembersSnap = await adminDb
    .collectionGroup('members')
    .where('status', '==', 'active')
    .get();

  // Build a map of userId → highest role
  const roleMap = new Map<string, string>();
  for (const doc of allMembersSnap.docs) {
    const d = doc.data();
    const uid: string = d.userId;
    const role: string = d.role;
    if (!uid) continue;

    const existing = roleMap.get(uid);
    // Prefer admin > manager > others
    if (!existing) {
      roleMap.set(uid, role);
    } else if (existing !== 'admin' && role === 'admin') {
      roleMap.set(uid, role);
    } else if (existing !== 'admin' && existing !== 'manager' && role === 'manager') {
      roleMap.set(uid, role);
    }
  }

  const visibleIds = new Set<string>([callerId]);

  if (tier === 'admin') {
    // Admins see everyone who is a member, but not superAdmins
    // We'll filter out superAdmins when building the staff summary
    for (const [uid] of roleMap) {
      visibleIds.add(uid);
    }
  } else if (tier === 'manager') {
    // Managers see users with staff-level (non-admin, non-manager) roles
    for (const [uid, role] of roleMap) {
      if (MANAGER_VISIBLE_ROLES.has(role)) {
        visibleIds.add(uid);
      }
    }
  }

  return Array.from(visibleIds);
}

/**
 * Returns a map of userId → role for building staff summaries.
 * Admins see all (minus superAdmins); managers see lower-role staff.
 */
export async function getVisibleStaffMap(
  callerId: string,
  tier: TimesheetAccessTier,
  accountId?: string
): Promise<Map<string, { role: string; displayName: string; email: string }>> {
  const result = new Map<
    string,
    { role: string; displayName: string; email: string }
  >();

  if (tier === 'superAdmin' || tier === 'employee') {
    return result; // No staff overview for these tiers
  }

  // When scoped to an org, only look at members of that org's LLCs
  let membersSnap: FirebaseFirestore.QuerySnapshot;
  if (accountId) {
    const orgLlcsSnap = await adminDb
      .collection('llcs')
      .where('accountId', '==', accountId)
      .get();
    const orgLlcIds = orgLlcsSnap.docs.map(d => d.id);
    if (orgLlcIds.length === 0) return result;

    const memberSnaps = await Promise.all(
      orgLlcIds.map(llcId =>
        adminDb.collection('llcs').doc(llcId).collection('members').where('status', '==', 'active').get()
      )
    );
    membersSnap = { docs: memberSnaps.flatMap(s => s.docs) } as FirebaseFirestore.QuerySnapshot;
  } else {
    membersSnap = await adminDb
      .collectionGroup('members')
      .where('status', '==', 'active')
      .get();
  }

  // Collect eligible userIds
  const eligible = new Set<string>();
  const roleByUser = new Map<string, string>();

  for (const doc of membersSnap.docs) {
    const d = doc.data();
    const uid: string = d.userId;
    const role: string = d.role;
    if (!uid || uid === callerId) continue;

    if (tier === 'admin') {
      eligible.add(uid);
      // Store best role
      if (!roleByUser.has(uid) || role === 'admin') roleByUser.set(uid, role);
    } else if (tier === 'manager' && MANAGER_VISIBLE_ROLES.has(role)) {
      eligible.add(uid);
      if (!roleByUser.has(uid)) roleByUser.set(uid, role);
    }
  }

  if (eligible.size === 0) return result;

  // Fetch user display names / emails in batches of 30
  const ids = Array.from(eligible);
  const BATCH = 30;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const usersSnap = await adminDb
      .collection('users')
      .where('__name__', 'in', batch)
      .get();

    for (const doc of usersSnap.docs) {
      const ud = doc.data();
      // Skip superAdmins from the staff view
      if (ud.isPlatformSuperAdmin) continue;
      result.set(doc.id, {
        role: roleByUser.get(doc.id) ?? 'staff',
        displayName: ud.displayName ?? ud.email ?? doc.id,
        email: ud.email ?? '',
      });
    }
  }

  return result;
}
