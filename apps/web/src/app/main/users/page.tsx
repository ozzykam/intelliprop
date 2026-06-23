'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  displayName?: string;
  userType: 'staff' | 'tenant';
  status: string;
  isPlatformSuperAdmin?: boolean;
  isPlatformAdmin?: boolean;
  isSuperAdmin?: boolean;
  accountIds?: string[];
  createdAt?: { seconds: number } | null;
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orgMap, setOrgMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'staff' | 'tenant'>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filter !== 'all') params.set('userType', filter);

        const [usersRes, orgsRes] = await Promise.all([
          fetch(`/api/admin/users?${params}`),
          fetch('/api/admin/organizations'),
        ]);
        const [usersData, orgsData] = await Promise.all([usersRes.json(), orgsRes.json()]);

        if (!usersData.ok) throw new Error(usersData.error?.message || 'Failed to fetch users');
        setUsers(usersData.data);

        if (orgsData.ok) {
          const map = new Map<string, string>();
          for (const org of orgsData.data) map.set(org.id, org.name);
          setOrgMap(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [search, filter]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All users across the platform</p>
        </div>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New User
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex border rounded-md overflow-hidden text-sm">
          {(['all', 'staff', 'tenant'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organization(s)</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.displayName ?? user.email}</div>
                    {user.displayName && <div className="text-xs text-muted-foreground">{user.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {user.isPlatformSuperAdmin || user.isPlatformAdmin ? (
                      <span className="text-xs text-muted-foreground italic">Platform</span>
                    ) : user.accountIds && user.accountIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.accountIds.map(id => (
                          <span key={id} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                            {orgMap.get(id) ?? id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.userType === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.userType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isPlatformSuperAdmin && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Platform Admin
                      </span>
                    )}
                    {user.isSuperAdmin && !user.isPlatformSuperAdmin && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Org Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : user.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/users/${user.id}`} className="text-primary hover:underline">
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
  );
}
