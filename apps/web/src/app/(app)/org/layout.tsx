import { redirect } from 'next/navigation';
import { requirePermissionContext } from '@/lib/auth/permissionContext';

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  let context;
  try {
    context = await requirePermissionContext();
  } catch {
    redirect('/login');
  }

  if (!context.isPlatformSuperAdmin && context.memberOfAccountIds.length === 0) {
    redirect('/llcs');
  }

  return <>{children}</>;
}
