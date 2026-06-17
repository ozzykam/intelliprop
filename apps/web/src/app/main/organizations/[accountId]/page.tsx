'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrgMember {
  userId: string;
  role: 'owner' | 'admin';
  status: 'active' | 'disabled';
  displayName?: string | null;
  email?: string | null;
}

interface OrgLlc {
  id: string;
  legalName: string;
  status: string;
}

interface OrgDetail {
  id: string;
  name: string;
  ownerUserId: string;
  status: 'active' | 'suspended';
  createdAt: { seconds: number } | null;
  members: OrgMember[];
}

function setCookie(name: string, value: string, days = 14) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export default function PlatformOrgDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const router = useRouter();

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [llcs, setLlcs] = useState<OrgLlc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgRes, llcsRes] = await Promise.all([
          fetch(`/api/admin/organizations/${accountId}`),
          fetch(`/api/admin/organizations/${accountId}/llcs`),
        ]);
        const [orgData, llcsData] = await Promise.all([orgRes.json(), llcsRes.json()]);
        if (!orgData.ok) throw new Error(orgData.error?.message || 'Failed to load org');
        setOrg(orgData.data);
        setLlcs(llcsData.ok ? llcsData.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [accountId]);

  function handleEnterOrg() {
    setCookie('__platform_view_org', accountId);
    router.push('/llcs');
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!org) return <div className="p-8 text-center text-muted-foreground">Organization not found</div>;

  const activeMembers = org.members.filter(m => m.status === 'active');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/main/organizations" className="text-sm text-muted-foreground hover:text-foreground">
              Organizations
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm">{org.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {org.status}
            </span>
            {org.createdAt && (
              <span className="text-sm text-muted-foreground">
                Created {new Date(org.createdAt.seconds * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/organizations/${accountId}/edit`}
            className="px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleEnterOrg}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Enter Organization
          </button>
        </div>
      </div>

      {/* Members */}
      <section>
        <h2 className="text-base font-semibold mb-3">Members ({activeMembers.length})</h2>
        <div className="border rounded-xl divide-y overflow-hidden">
          {activeMembers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No members</div>
          ) : (
            activeMembers.map(m => (
              <div key={m.userId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.displayName ?? m.email ?? m.userId}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      m.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                  {m.email && <div className="text-xs text-muted-foreground mt-0.5">{m.email}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* LLCs */}
      <section>
        <h2 className="text-base font-semibold mb-3">LLCs ({llcs.length})</h2>
        <div className="border rounded-xl divide-y overflow-hidden">
          {llcs.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No LLCs assigned yet</div>
          ) : (
            llcs.map(llc => (
              <div key={llc.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{llc.legalName}</span>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{llc.id}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  llc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {llc.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
