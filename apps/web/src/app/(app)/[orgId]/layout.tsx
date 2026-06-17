import { redirect } from 'next/navigation';
import { requirePermissionContext } from '@/lib/auth/permissionContext';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  let context;
  try {
    context = await requirePermissionContext();
  } catch {
    redirect('/login');
  }

  const { orgId } = await params;

  // Platform roles bypass org membership check
  if (!context.isPlatformSuperAdmin && !context.isPlatformAdmin) {
    const hasAccess =
      context.memberOfAccountIds.includes(orgId) ||
      context.accountAdminLlcIds.length > 0 ||
      context.adminOfLlcIds.length > 0 ||
      context.assignedLlcIds.length > 0;

    if (!hasAccess) {
      redirect('/llcs');
    }
  }

  return <>{children}</>;
}
