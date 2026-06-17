import { redirect } from 'next/navigation';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import { adminDb } from '@/lib/firebase/admin';

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

  if (!context.isPlatformSuperAdmin && !context.isPlatformAdmin) {
    // Org members have direct access
    if (!context.memberOfAccountIds.includes(orgId)) {
      // LLC-level staff: verify at least one of their LLCs actually belongs to this org
      const userLlcIds = [...new Set([
        ...context.adminOfLlcIds,
        ...context.assignedLlcIds,
      ])].slice(0, 30);

      if (userLlcIds.length === 0) {
        redirect('/llcs');
      }

      const docs = await adminDb.getAll(
        ...userLlcIds.map(id => adminDb.collection('llcs').doc(id))
      );
      const hasLlcInOrg = docs.some(d => d.exists && d.data()?.accountId === orgId);

      if (!hasLlcInOrg) {
        redirect('/llcs');
      }
    }
  }

  return <>{children}</>;
}
