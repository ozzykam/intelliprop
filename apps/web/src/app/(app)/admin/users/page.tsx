'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlatformUser, UserAssignment } from '@shared/types';

interface UserWithAssignments extends PlatformUser {
  assignments?: UserAssignment[];
}

interface PendingActivation {
  id: string;
  type: 'individual' | 'business';
  role: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  llcIds: string[];
  status: string;
  createdAt: { seconds: number } | null;
  expiresAt: { seconds: number } | null;
}

interface OverrideState {
  activationId: string;
  name: string;
  email: string;
  password: string;
  saving: boolean;
  error: string;
}

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pending activations
  const [pendingActivations, setPendingActivations] = useState<PendingActivation[]>([]);
  const [activationsLoading, setActivationsLoading] = useState(false);
  const [override, setOverride] = useState<OverrideState | null>(null);

  const orgId = searchParams.get('orgId') ?? undefined;
  const superAdminsOnly = searchParams.get('superAdminsOnly') === 'true';
  const filter = searchParams.get('filter');
  const created = searchParams.get('created');
  const showPending = filter === 'pending';

  // Helper to build filter tab hrefs preserving orgId
  const filterHref = (extra: string) => {
    const parts = [orgId ? `orgId=${orgId}` : '', extra].filter(Boolean).join('&');
    return `/admin/users${parts ? `?${parts}` : ''}`;
  };

  const fetchUsers = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('accountId', orgId);
      params.set('includeAssignments', 'true');
      if (superAdminsOnly) params.set('superAdminsOnly', 'true');
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (!data.ok) {
        if (data.error?.code === 'PERMISSION_DENIED') {
          router.push('/llcs');
          return;
        }
        throw new Error(data.error?.message || 'Failed to fetch users');
      }

      let filteredUsers = data.data as UserWithAssignments[];

      // Apply client-side filters
      if (filter === 'tenants') {
        filteredUsers = filteredUsers.filter(u => u.userType === 'tenant');
      } else if (filter === 'admins') {
        filteredUsers = filteredUsers.filter(u =>
          u.assignments?.some(a => a.role === 'admin' && a.status === 'active')
        );
      } else if (filter === 'managers') {
        filteredUsers = filteredUsers.filter(u =>
          u.assignments?.some(a => a.role === 'manager' && a.status === 'active')
        );
      } else if (filter === 'employees') {
        filteredUsers = filteredUsers.filter(u =>
          u.assignments?.some(a => a.role === 'employee' && a.status === 'active')
        );
      } else if (filter === 'assignments') {
        filteredUsers = filteredUsers.filter(u =>
          u.assignments && u.assignments.length > 0
        );
      }

      setUsers(filteredUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [router, superAdminsOnly, filter, searchQuery, orgId]);

  const fetchPendingActivations = useCallback(async () => {
    setActivationsLoading(true);
    try {
      const res = await fetch('/api/activations?status=pending&limit=100');
      const data = await res.json();
      if (data.ok) {
        setPendingActivations(data.data as PendingActivation[]);
      }
    } catch {
      // silently fail
    } finally {
      setActivationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showPending) {
      fetchPendingActivations();
    } else {
      fetchUsers();
    }
  }, [showPending, fetchUsers, fetchPendingActivations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openOverride = (activation: PendingActivation) => {
    const name = activation.middleInitial
      ? `${activation.firstName} ${activation.middleInitial}. ${activation.lastName}`
      : `${activation.firstName} ${activation.lastName}`;
    setOverride({ activationId: activation.id, name, email: '', password: '', saving: false, error: '' });
  };

  const submitOverride = async () => {
    if (!override) return;
    setOverride(prev => prev && { ...prev, saving: true, error: '' });

    try {
      const res = await fetch(`/api/admin/activations/${override.activationId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: override.email, password: override.password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOverride(prev => prev && { ...prev, saving: false, error: data.error?.message || 'Failed to activate' });
        return;
      }
      setOverride(null);
      fetchPendingActivations();
    } catch {
      setOverride(prev => prev && { ...prev, saving: false, error: 'Failed to activate' });
    }
  };

  const getRoleBadge = (user: UserWithAssignments) => {
    if (user.isSuperAdmin) {
      return (
        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          Super Admin
        </span>
      );
    }

    if (user.userType === 'tenant') {
      return (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
          Tenant
        </span>
      );
    }

    const activeAssignments = user.assignments?.filter(a => a.status === 'active') || [];
    if (activeAssignments.length === 0) {
      return (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
          No Role
        </span>
      );
    }

    const hasAdmin = activeAssignments.some(a => a.role === 'admin');
    const hasManager = activeAssignments.some(a => a.role === 'manager');
    const hasEmployee = activeAssignments.some(a => a.role === 'employee');

    if (hasAdmin) {
      return (
        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
          Admin
        </span>
      );
    }
    if (hasManager) {
      return (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          Manager
        </span>
      );
    }
    if (hasEmployee) {
      return (
        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
          Employee
        </span>
      );
    }

    return null;
  };

  const getRoleActivationBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800',
      tenant: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role] ?? 'bg-gray-100 text-gray-700'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const filterLinkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm ${active ? 'bg-primary text-primary-foreground' : 'border hover:bg-secondary'}`;

  if (!orgId) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <div className="text-center py-16 border rounded-lg text-muted-foreground">
          Select an organization to view users.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            Admin
          </Link>
          <span className="text-sm text-muted-foreground mx-2">/</span>
          <h1 className="text-2xl font-bold inline">Users</h1>
        </div>
        <Link
          href={`/admin/users/new${orgId ? `?orgId=${orgId}` : ''}`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href={filterHref('')} className={filterLinkClass(!superAdminsOnly && !filter)}>
          All Users
        </Link>
        <Link href={filterHref('superAdminsOnly=true')} className={filterLinkClass(superAdminsOnly)}>
          Super Admins
        </Link>
        <Link href={filterHref('filter=admins')} className={filterLinkClass(filter === 'admins')}>
          Admins
        </Link>
        <Link href={filterHref('filter=managers')} className={filterLinkClass(filter === 'managers')}>
          Managers
        </Link>
        <Link href={filterHref('filter=employees')} className={filterLinkClass(filter === 'employees')}>
          Employees
        </Link>
        <Link href={filterHref('filter=tenants')} className={filterLinkClass(filter === 'tenants')}>
          Tenants
        </Link>
        <Link href={filterHref('filter=pending')} className={filterLinkClass(filter === 'pending')}>
          Pending Activations
        </Link>
      </div>

      {/* Success message */}
      {created === 'staff' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          Staff member created successfully. They can now activate their account at /activate using their date of birth and SSN — or a super admin can override activate below.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* ============ PENDING ACTIVATIONS VIEW ============ */}
      {showPending && (
        <>
          {activationsLoading && (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          )}

          {!activationsLoading && pendingActivations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No pending activations</div>
          )}

          {!activationsLoading && pendingActivations.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Created</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Expires</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingActivations.map((activation) => {
                    const isExpanded = override?.activationId === activation.id;
                    const createdDate = activation.createdAt?.seconds
                      ? new Date(activation.createdAt.seconds * 1000).toLocaleDateString()
                      : '—';
                    const expiresDate = activation.expiresAt?.seconds
                      ? new Date(activation.expiresAt.seconds * 1000).toLocaleDateString()
                      : '—';
                    const displayName = activation.middleInitial
                      ? `${activation.firstName} ${activation.middleInitial}. ${activation.lastName}`
                      : `${activation.firstName} ${activation.lastName}`;

                    return (
                      <React.Fragment key={activation.id}>
                        <tr className="hover:bg-secondary/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{displayName}</div>
                            <div className="text-xs text-muted-foreground">{activation.type}</div>
                          </td>
                          <td className="px-4 py-3">
                            {getRoleActivationBadge(activation.role)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {createdDate}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {expiresDate}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => isExpanded ? setOverride(null) : openOverride(activation)}
                              className="text-sm text-primary hover:underline"
                            >
                              {isExpanded ? 'Cancel' : 'Override Activate'}
                            </button>
                          </td>
                        </tr>

                        {/* Inline override form */}
                        {isExpanded && override && (
                          <tr key={`${activation.id}-override`} className="bg-secondary/20">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="max-w-md space-y-3">
                                <p className="text-sm font-medium">
                                  Override activate: <span className="text-muted-foreground">{override.name}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  This bypasses the activation flow and immediately creates an account. The user will be able to sign in with these credentials.
                                </p>
                                {override.error && (
                                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                                    {override.error}
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium mb-1">Email</label>
                                    <input
                                      type="email"
                                      value={override.email}
                                      onChange={(e) => setOverride(prev => prev && { ...prev, email: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      placeholder="user@example.com"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1">Temporary Password</label>
                                    <input
                                      type="password"
                                      value={override.password}
                                      onChange={(e) => setOverride(prev => prev && { ...prev, password: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      placeholder="Min 8 characters"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={submitOverride}
                                    disabled={override.saving || !override.email || override.password.length < 8}
                                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50"
                                  >
                                    {override.saving ? 'Activating...' : 'Confirm Activation'}
                                  </button>
                                  <button
                                    onClick={() => setOverride(null)}
                                    className="px-4 py-1.5 border border-input rounded-md text-sm hover:bg-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ============ USERS VIEW ============ */}
      {!showPending && (
        <>
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
              >
                Search
              </button>
            </div>
          </form>

          {loading && (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          )}

          {!loading && users.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Assignments</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">
                          {user.displayName || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {user.assignments?.filter(a => a.status === 'active').length || 0} active
                        </div>
                        {user.assignments && user.assignments.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {user.assignments
                              .filter(a => a.status === 'active')
                              .map(a => `${a.llcIds.length} LLC${a.llcIds.length !== 1 ? 's' : ''}`)
                              .join(', ') || 'None'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
