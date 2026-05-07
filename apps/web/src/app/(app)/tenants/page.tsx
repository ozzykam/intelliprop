'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  SearchFilter,
  TENANT_FILTERS,
  FilterValues,
  filterByField,
} from '@/components/SearchFilter';

interface TenantItem {
  id: string;
  type: 'individual' | 'business';
  email: string;
  phone?: string;
  createdAt: string;
  userId?: string;
  // Residential
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  ssn4?: string;
  // Commercial
  businessName?: string;
  businessType?: string;
  einLast4?: string;
  primaryContact?: {
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
}

function getPrimaryContactName(contact: TenantItem['primaryContact']): string {
  if (!contact) return '';
  if (contact.firstName || contact.lastName) {
    return [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ');
  }
  return contact.name || '';
}

function getTenantDisplayName(tenant: TenantItem): string {
  if (tenant.type === 'business') {
    return tenant.businessName || 'Unnamed Business';
  }
  return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Unnamed Tenant';
}

export default function GlobalTenantsPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    type: '',
  });

  // Invite modal state
  const [inviteTenant, setInviteTenant] = useState<TenantItem | null>(null);
  const [inviteDateOfBirth, setInviteDateOfBirth] = useState('');
  const [inviteSsn4, setInviteSsn4] = useState('');
  const [inviteEinLast4, setInviteEinLast4] = useState('');
  const [inviteBusinessName, setInviteBusinessName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();

      if (data.ok) {
        setTenants(data.data);
      } else {
        setError(data.error?.message || 'Failed to load tenants');
      }
    } catch {
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const openInviteModal = (tenant: TenantItem) => {
    setInviteTenant(tenant);
    setInviteDateOfBirth(tenant.dateOfBirth || '');
    setInviteSsn4(tenant.ssn4 || '');
    setInviteEinLast4(tenant.einLast4 || '');
    setInviteBusinessName(tenant.businessName || '');
    setInviteError('');
    setInviteSuccess(false);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTenant) return;
    setInviteError('');

    if (inviteTenant.type === 'individual' && inviteSsn4.length !== 4) {
      setInviteError('Please enter exactly 4 digits for SSN');
      return;
    }
    if (inviteTenant.type === 'business' && inviteEinLast4.length !== 4) {
      setInviteError('Please enter exactly 4 digits for EIN');
      return;
    }

    setInviteLoading(true);

    try {
      const contactName = getPrimaryContactName(inviteTenant.primaryContact);
      const base = {
        role: 'tenant' as const,
        firstName: inviteTenant.firstName || contactName.split(' ')[0] || '',
        middleInitial: undefined,
        lastName: inviteTenant.lastName || contactName.split(' ').slice(1).join(' ') || '',
        dateOfBirth: inviteDateOfBirth,
        tenantId: inviteTenant.id,
        llcIds: [],
      };

      const body = inviteTenant.type === 'individual'
        ? { ...base, type: 'individual' as const, ssn4: inviteSsn4 }
        : { ...base, type: 'business' as const, einLast4: inviteEinLast4, businessName: inviteBusinessName };

      const res = await fetch('/api/activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.ok) {
        setInviteError(data.error?.message || data.error || 'Failed to create activation');
        return;
      }

      setInviteSuccess(true);
    } catch {
      setInviteError('Failed to create activation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Apply filters
  const filteredTenants = useMemo(() => {
    let result = tenants;

    // Text search across name, email, phone
    if (filters.search.trim()) {
      const lowerSearch = filters.search.toLowerCase();
      result = result.filter((tenant) => {
        const displayName = getTenantDisplayName(tenant).toLowerCase();
        const email = (tenant.email || '').toLowerCase();
        const phone = (tenant.phone || '').toLowerCase();
        return (
          displayName.includes(lowerSearch) ||
          email.includes(lowerSearch) ||
          phone.includes(lowerSearch)
        );
      });
    }

    // Filter by type
    result = filterByField(result, 'type', filters.type);

    return result;
  }, [tenants, filters]);

  const handleDelete = async (tenantId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setTenants((prev) => prev.filter((t) => t.id !== tenantId));
      } else {
        alert(data.error?.message || 'Failed to delete tenant');
      }
    } catch {
      alert('Failed to delete tenant');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading tenants...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Tenants</h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          + Add Tenant
        </Link>
      </div>

      {/* Search & Filters */}
      <SearchFilter
        filters={TENANT_FILTERS.filter((f) => f.key !== 'hasActiveLease')}
        values={filters}
        onChange={setFilters}
        searchPlaceholder="Search name, email, phone..."
        className="mb-6"
      />

      {/* Results count */}
      {tenants.length > 0 && (
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredTenants.length} of {tenants.length} tenants
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No tenants yet. Add your first tenant to get started.
          </p>
          <Link
            href="/admin/users/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            Add Tenant
          </Link>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            No tenants match your filters.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTenants.map((tenant) => {
                const displayName = getTenantDisplayName(tenant);
                return (
                  <tr key={tenant.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="hover:underline"
                      >
                        <div className="font-medium">{displayName}</div>
                        {tenant.type === 'business' && tenant.primaryContact && (
                          <div className="text-muted-foreground text-xs">
                            Contact: {getPrimaryContactName(tenant.primaryContact)}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          tenant.type === 'business'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {tenant.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          tenant.userId
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tenant.userId ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tenant.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tenant.phone || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {!tenant.userId && (
                        <button
                          onClick={() => openInviteModal(tenant)}
                          className="text-xs text-primary hover:underline mr-3"
                        >
                          Activate
                        </button>
                      )}
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(tenant.id, displayName)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Tenant Modal */}
      {inviteTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {inviteSuccess ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Activation Created</h2>
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm mb-4">
                    Activation created for {getTenantDisplayName(inviteTenant)}. They can now visit <span className="font-mono font-medium">/activate</span> to create their account using their date of birth and {inviteTenant.type === 'individual' ? 'SSN (last 4)' : 'EIN (last 4) + business name'}.
                  </div>
                  <button
                    onClick={() => setInviteTenant(null)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">
                      Activate: {getTenantDisplayName(inviteTenant)}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setInviteTenant(null)}
                      className="text-muted-foreground hover:text-foreground text-lg"
                    >
                      &times;
                    </button>
                  </div>

                  {inviteError && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                      {inviteError}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the verification details this tenant will use at <span className="font-mono">/activate</span> to create their account.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="inviteDateOfBirth" className="block text-sm font-medium mb-2">
                        Date of Birth *
                      </label>
                      <input
                        id="inviteDateOfBirth"
                        type="date"
                        value={inviteDateOfBirth}
                        onChange={(e) => setInviteDateOfBirth(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {inviteTenant.type === 'individual' ? (
                      <div>
                        <label htmlFor="inviteSsn4" className="block text-sm font-medium mb-2">
                          SSN (last 4) *
                        </label>
                        <input
                          id="inviteSsn4"
                          type="text"
                          value={inviteSsn4}
                          onChange={(e) => setInviteSsn4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          required
                          pattern="\d{4}"
                          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="1234"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label htmlFor="inviteEinLast4" className="block text-sm font-medium mb-2">
                            EIN (last 4) *
                          </label>
                          <input
                            id="inviteEinLast4"
                            type="text"
                            value={inviteEinLast4}
                            onChange={(e) => setInviteEinLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            required
                            pattern="\d{4}"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="1234"
                          />
                        </div>
                        <div>
                          <label htmlFor="inviteBusinessName" className="block text-sm font-medium mb-2">
                            Business Name *
                          </label>
                          <input
                            id="inviteBusinessName"
                            type="text"
                            value={inviteBusinessName}
                            onChange={(e) => setInviteBusinessName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4 mb-6">
                    The tenant will visit /activate and verify using these details to create their login.
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={inviteLoading || !inviteDateOfBirth}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                    >
                      {inviteLoading ? 'Creating...' : 'Create Activation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteTenant(null)}
                      className="px-6 py-2 border border-input rounded-md hover:bg-secondary transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
