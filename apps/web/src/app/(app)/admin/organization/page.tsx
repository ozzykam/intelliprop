import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import { adminDb } from '@/lib/firebase/admin';

export default async function OrgAdminLandingPage() {
  const context = await requirePermissionContext();

  if (context.memberOfAccountIds.length === 0) {
    redirect('/llcs');
  }

  if (context.memberOfAccountIds.length === 1) {
    redirect(`/admin/organization/${context.memberOfAccountIds[0]}`);
  }

  // Multiple orgs — show picker
  const orgDocs = await Promise.all(
    context.memberOfAccountIds.map(id => adminDb.collection('accounts').doc(id).get())
  );

  const orgs = orgDocs
    .filter(d => d.exists)
    .map(d => ({ id: d.id, name: d.data()?.name as string, status: d.data()?.status as string }));

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Select Organization</h1>
      <p className="text-sm text-muted-foreground mb-6">You belong to multiple organizations. Choose one to manage.</p>
      <div className="space-y-2">
        {orgs.map(org => (
          <Link
            key={org.id}
            href={`/admin/organization/${org.id}`}
            className="flex items-center justify-between px-4 py-3 border rounded-xl hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">{org.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {org.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
