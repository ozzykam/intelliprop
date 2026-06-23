import { adminDb } from '@/lib/firebase/admin';
import { requireUser, AuthenticatedUser } from './requireUser';
import { MemberRole } from '@shared/types';

export interface LlcMemberContext {
  user: AuthenticatedUser;
  llcId: string;
  role: MemberRole;
  propertyScopes?: string[];
  caseScopes?: string[];
}

/**
 * Verify that the current user has access to the specified LLC.
 * Platform super admins and platform admins are granted access unconditionally.
 * All others must have an active membership document.
 */
export async function requireLlcMember(llcId: string): Promise<LlcMemberContext> {
  const user = await requireUser();

  // Platform-level admins bypass LLC membership checks
  const userDoc = await adminDb.collection('users').doc(user.uid).get();
  const userData = userDoc.data();
  if (userData?.isPlatformSuperAdmin || userData?.isPlatformAdmin) {
    return { user, llcId, role: 'admin' as MemberRole };
  }

  const memberDoc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('members')
    .doc(user.uid)
    .get();

  if (!memberDoc.exists) {
    throw new Error('PERMISSION_DENIED: Not a member of this LLC');
  }

  const member = memberDoc.data();

  if (member?.status !== 'active') {
    throw new Error('PERMISSION_DENIED: Membership is not active');
  }

  return {
    user,
    llcId,
    role: member.role as MemberRole,
    propertyScopes: member.propertyScopes,
    caseScopes: member.caseScopes,
  };
}

/**
 * Require specific role(s) for the LLC.
 */
export async function requireLlcRole(
  llcId: string,
  allowedRoles: MemberRole[]
): Promise<LlcMemberContext> {
  const context = await requireLlcMember(llcId);

  if (!allowedRoles.includes(context.role)) {
    throw new Error(
      `PERMISSION_DENIED: Role '${context.role}' not in allowed roles [${allowedRoles.join(', ')}]`
    );
  }

  return context;
}
