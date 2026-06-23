import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import EnterOrgButton from '@/components/EnterOrgButton'

async function getAllOrgs() {
  const snap = await adminDb.collection('accounts').orderBy('createdAt', 'desc').get();
  const orgs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as {
    id: string;
    name: string;
    ownerUserId: string;
    status: string;
    createdAt: { seconds: number } | null;
  }[];

  // Enrich: LLC count + member count + owner email in parallel
  const [llcCounts, memberCounts, ownerDocs] = await Promise.all([
    Promise.all(orgs.map(o => adminDb.collection('llcs').where('accountId', '==', o.id).get().then(s => s.size))),
    Promise.all(orgs.map(o => adminDb.collection('accounts').doc(o.id).collection('accountMembers').where('status', '==', 'active').get().then(s => s.size))),
    adminDb.getAll(...orgs.map(o => adminDb.collection('users').doc(o.ownerUserId))),
  ]);

  return orgs.map((org, i) => ({
    ...org,
    llcCount: llcCounts[i] ?? 0,
    memberCount: memberCounts[i] ?? 0,
    ownerEmail: ownerDocs[i]?.exists ? (ownerDocs[i].data()?.email as string) : org.ownerUserId,
    ownerName: ownerDocs[i]?.exists ? (ownerDocs[i].data()?.displayName as string | undefined) : undefined,
  }));
}

export default async function OrganizationsPage() {
  const orgs = await getAllOrgs();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{orgs.length} client account{orgs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/main/organizations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Organization
        </Link>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organization</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">LLCs</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Members</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No organizations yet.{' '}
                  <Link href="/main/organizations/new" className="text-primary hover:underline">
                    Create the first one
                  </Link>
                </td>
              </tr>
            ) : (
              orgs.map(org => (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{org.ownerName ?? org.ownerEmail}</div>
                    {org.ownerName && <div className="text-xs">{org.ownerEmail}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{org.llcCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.memberCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      org.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.createdAt
                      ? new Date(org.createdAt.seconds * 1000).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/main/organizations/${org.id}`}
                      className="text-primary hover:underline"
                    >
                      Manage
                    </Link>
                    <EnterOrgButton orgId={org.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
