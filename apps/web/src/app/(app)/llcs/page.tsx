import { redirect } from 'next/navigation';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import { adminDb } from '@/lib/firebase/admin';

export default async function LlcListRedirect() {
  const context = await requirePermissionContext();

  // Platform roles go to the organizations list
  if (context.isPlatformSuperAdmin || context.isPlatformAdmin) {
    redirect('/main/organizations');
  }

  // Org admin/owner — redirect to their primary org dashboard
  if (context.memberOfAccountIds.length > 0 && context.memberOfAccountIds[0]) {
    redirect(`/${context.memberOfAccountIds[0]}`);
  }

  // Direct LLC admin — find the accountId for their first LLC and redirect
  if (context.adminOfLlcIds.length > 0 && context.adminOfLlcIds[0]) {
    const llcDoc = await adminDb.collection('llcs').doc(context.adminOfLlcIds[0]).get();
    const accountId = llcDoc.data()?.accountId as string | undefined;
    if (accountId) {
      redirect(`/${accountId}`);
    }
  }

  // Fallback — no org context yet, stay on a placeholder
  return (
    <div className="p-6 text-center text-muted-foreground">
      <p>No organization found. Contact your administrator.</p>
    </div>
  );
}
