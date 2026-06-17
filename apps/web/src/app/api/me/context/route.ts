import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { buildPermissionContext } from '@/lib/auth/permissionContext';

export interface UserRoleContext {
  isAuthenticated: boolean;
  hasStaffRole: boolean;
  hasTenantRole: boolean;
  isPlatformSuperAdmin: boolean;
  isPlatformAdmin: boolean;
  isSuperAdmin: boolean;
  effectiveRole: string | null;
  userType: 'staff' | 'tenant';
  displayName?: string;
  email: string;
}

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({
        ok: true,
        data: {
          isAuthenticated: false,
          hasStaffRole: false,
          hasTenantRole: false,
          isPlatformSuperAdmin: false,
          isPlatformAdmin: false,
          isSuperAdmin: false,
          effectiveRole: null,
          userType: 'tenant',
          email: '',
        } as UserRoleContext,
      });
    }

    const context = await buildPermissionContext(user);

    const hasStaffRole =
      context.userType === 'staff' ||
      context.isPlatformSuperAdmin ||
      context.isPlatformAdmin ||
      context.isSuperAdmin ||
      context.adminOfLlcIds.length > 0 ||
      context.assignments.length > 0;

    const hasTenantRole = context.tenantLinks.length > 0;

    return NextResponse.json({
      ok: true,
      data: {
        isAuthenticated: true,
        hasStaffRole,
        hasTenantRole,
        isPlatformSuperAdmin: context.isPlatformSuperAdmin,
        isPlatformAdmin: context.isPlatformAdmin,
        isSuperAdmin: context.isSuperAdmin,
        effectiveRole: context.effectiveRole,
        userType: context.userType,
        displayName: context.displayName,
        email: context.email,
      } as UserRoleContext,
    });
  } catch (error) {
    console.error('Error fetching user context:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch user context' },
      { status: 500 }
    );
  }
}
