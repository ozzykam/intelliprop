import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';

interface StatCardProps {
  label: string;
  value: number | string;
  href?: string;
  description?: string;
}

function StatCard({ label, value, href, description }: StatCardProps) {
  const inner = (
    <div className={`p-5 border rounded-xl bg-card ${href ? 'hover:bg-muted/50 transition-colors' : ''}`}>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

async function getPlatformStats() {
  const [accountsSnap, usersSnap, llcsSnap, propertiesSnap] = await Promise.all([
    adminDb.collection('accounts').where('status', '==', 'active').get(),
    adminDb.collection('users').where('status', '==', 'active').get(),
    adminDb.collection('llcs').where('status', '!=', 'archived').get(),
    adminDb.collectionGroup('properties').get(),
  ]);

  return {
    activeOrgs: accountsSnap.size,
    totalUsers: usersSnap.size,
    totalLlcs: llcsSnap.size,
    totalProperties: propertiesSnap.size,
  };
}

async function getRecentOrgs() {
  const snap = await adminDb
    .collection('accounts')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const orgs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as {
    id: string;
    name: string;
    ownerUserId: string;
    status: string;
    createdAt: { seconds: number } | null;
  }[];

  // Enrich with LLC count
  const llcCounts = await Promise.all(
    orgs.map(org =>
      adminDb.collection('llcs').where('accountId', '==', org.id).get().then(s => s.size)
    )
  );

  return orgs.map((org, i) => ({ ...org, llcCount: llcCounts[i] ?? 0 }));
}

export default async function PlatformDashboard() {
  const [stats, orgs] = await Promise.all([getPlatformStats(), getRecentOrgs()]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your SaaS business at a glance</p>
        </div>
        <Link
          href="/main/organizations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Organization
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Organizations"
          value={stats.activeOrgs}
          href="/admin/organizations"
          description="Client accounts"
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          href="/main/users"
          description="Across all orgs"
        />
        <StatCard
          label="Total LLCs"
          value={stats.totalLlcs}
          description="Across all orgs"
        />
        <StatCard
          label="Total Properties"
          value={stats.totalProperties}
          description="Across all LLCs"
        />
      </div>

      {/* Recent Organizations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Organizations</h2>
          <Link href="/admin/organizations" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">LLCs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
                    <td className="px-4 py-3 text-muted-foreground">{org.llcCount}</td>
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
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
