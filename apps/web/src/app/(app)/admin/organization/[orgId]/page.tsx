'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRole } from '@/lib/contexts/RoleContext';
import UserSearchInput, { UserOption } from '@/components/UserSearchInput';

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

export default function OrgAdminDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const { isPlatformSuperAdmin } = useRole();

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [llcs, setLlcs] = useState<OrgLlc[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberUserDisplay, setMemberUserDisplay] = useState('');
  const [memberRole, setMemberRole] = useState<'owner' | 'admin'>('admin');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [orgRes, llcsRes, meRes] = await Promise.all([
        fetch(`/api/admin/organizations/${orgId}`),
        fetch(`/api/admin/organizations/${orgId}/llcs`),
        fetch('/api/me/context'),
      ]);
      const [orgData, llcsData, meData] = await Promise.all([orgRes.json(), llcsRes.json(), meRes.json()]);
      if (!orgData.ok) throw new Error(orgData.error?.message ?? 'Access denied or organization not found');
      setOrg(orgData.data);
      setLlcs(llcsData.ok ? llcsData.data : []);
      if (meData.ok) setCurrentUserId(meData.data?.userId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isOwner = org ? (currentUserId === org.ownerUserId || isPlatformSuperAdmin) : false;

  function handleMemberSelect(user: UserOption) {
    setMemberUserId(user.id);
    setMemberUserDisplay(user.displayName ? `${user.displayName} (${user.email})` : user.email);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError('');
    if (!memberUserId) { setMemberError('Please select a user.'); return; }
    setAddingMember(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberUserId, role: memberRole }),
      });
      const data = await res.json();
      if (!data.ok) { setMemberError(data.error?.message ?? 'Failed to add member'); return; }
      setShowAddMember(false);
      setMemberUserId(''); setMemberUserDisplay(''); setMemberRole('admin');
      fetchData();
    } catch { setMemberError('Failed to add member'); }
    finally { setAddingMember(false); }
  }

  async function handleRoleChange(userId: string, role: 'owner' | 'admin') {
    try {
      await fetch(`/api/admin/organizations/${orgId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      fetchData();
    } catch { /* silent */ }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member from the organization?')) return;
    try {
      await fetch(`/api/admin/organizations/${orgId}/members/${userId}`, { method: 'DELETE' });
      fetchData();
    } catch { /* silent */ }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!org) return <div className="p-8 text-center text-muted-foreground">Organization not found</div>;

  const activeMembers = org.members.filter(m => m.status === 'active');
  const myMembership = activeMembers.find(m => m.userId === currentUserId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {org.status}
            </span>
            {myMembership && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                myMembership.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {myMembership.role}
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <Link
            href={`/admin/organization/${orgId}/edit`}
            className="px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            Edit Organization
          </Link>
        )}
      </div>

      {/* LLCs */}
      <section>
        <h2 className="text-base font-semibold mb-3">LLCs ({llcs.length})</h2>
        <div className="border rounded-xl divide-y overflow-hidden">
          {llcs.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No LLCs assigned yet</div>
          ) : (
            llcs.map(llc => (
              <div key={llc.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{llc.legalName}</span>
                <div className="flex items-center gap-3">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    llc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{llc.status}</span>
                  <Link href={`/llcs/${llc.id}`} className="text-xs text-primary hover:underline">Open →</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Members */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Members ({activeMembers.length})</h2>
          {isOwner && (
            <button
              onClick={() => { setShowAddMember(v => !v); setMemberError(''); }}
              className="text-sm text-primary hover:underline"
            >
              {showAddMember ? 'Cancel' : '+ Add Member'}
            </button>
          )}
        </div>

        {showAddMember && isOwner && (
          <form onSubmit={handleAddMember} className="mb-4 p-4 border rounded-lg bg-muted/20 space-y-3">
            {memberError && <p className="text-sm text-destructive">{memberError}</p>}
            <UserSearchInput
              label="User"
              onSelect={handleMemberSelect}
              onClear={() => { setMemberUserId(''); setMemberUserDisplay(''); }}
              selectedDisplay={memberUserId ? memberUserDisplay : undefined}
            />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
              <select value={memberRole} onChange={e => setMemberRole(e.target.value as 'owner' | 'admin')}
                className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <button type="submit" disabled={addingMember}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-md font-medium hover:opacity-90 disabled:opacity-50">
              {addingMember ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        )}

        <div className="border rounded-xl divide-y overflow-hidden">
          {activeMembers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No members</div>
          ) : (
            activeMembers.map(m => (
              <div key={m.userId} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.displayName ?? m.email ?? m.userId}</span>
                    {m.userId === currentUserId && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  {m.email && <div className="text-xs text-muted-foreground mt-0.5">{m.email}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOwner ? (
                    <>
                      <select value={m.role} onChange={e => handleRoleChange(m.userId, e.target.value as 'owner' | 'admin')}
                        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button onClick={() => handleRemoveMember(m.userId)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1.5 py-1 rounded hover:bg-destructive/10">
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      m.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>{m.role}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
