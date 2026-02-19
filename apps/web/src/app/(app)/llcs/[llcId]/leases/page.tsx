'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchFilter,
  LEASE_FILTERS,
  FilterValues,
  filterByField,
} from '@/components/SearchFilter';
import type { LeaseClass } from '@shared/types/leaseBuilder';

interface LeaseItem {
  id: string;
  propertyId: string;
  unitId: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: string;
}

interface PropertyItem {
  id: string;
  name?: string;
  address?: { street1?: string };
}

interface UnitItem {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface TenantItem {
  id: string;
  type: 'individual' | 'business';
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

interface DraftItem {
  id: string;
  leaseClass: LeaseClass;
  status: string;
  currentStep?: string;
  createdAt: unknown;
  reviewedAt?: unknown;
  published?: boolean;
  publishedLeaseId?: string;
  // Identifying attributes
  propertyId?: string;
  unitIds?: string[];
  tenantIds?: string[];
  leaseType?: string;
  residential?: {
    rent?: {
      monthlyRent?: number;
      startDate?: string;
      endDate?: string;
    };
  };
  commercial?: {
    leaseStructure?: {
      startDate?: string;
      endDate?: string;
    };
    financial?: {
      baseRentMonthly?: number;
    };
  };
}

interface PublishedLeaseItem {
  id: string;
  leaseClass: string;
  propertyId: string;
  unitIds: string[];
  tenantIds: string[];
  leaseType: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  accepted: boolean;
  status: string;
  publishedAt: string;
}

interface LeasesPageProps {
  params: Promise<{ llcId: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  ended: 'bg-blue-100 text-blue-800',
  eviction: 'bg-red-100 text-red-800',
  terminated: 'bg-orange-100 text-orange-800',
  expired: 'bg-gray-100 text-gray-800',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso.split('T')[0] + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  const month = d.toLocaleDateString('en-US', { month: '2-digit' });
  const day = d.toLocaleDateString('en-US', { day: '2-digit' });
  const year = d.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

function formatDraftDate(value: unknown): string {
  try {
    let date: Date;
    if (typeof value === 'string') {
      date = new Date(value);
    } else if (value && typeof value === 'object' && '_seconds' in value) {
      date = new Date((value as { _seconds: number })._seconds * 1000);
    } else if (value && typeof value === 'object' && 'seconds' in value) {
      date = new Date((value as { seconds: number }).seconds * 1000);
    } else {
      return String(value);
    }
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function getDraftStartDate(draft: DraftItem): string {
  return draft.residential?.rent?.startDate || draft.commercial?.leaseStructure?.startDate || '';
}

function getDraftEndDate(draft: DraftItem): string {
  return draft.residential?.rent?.endDate || draft.commercial?.leaseStructure?.endDate || '';
}

function getDraftMonthlyRent(draft: DraftItem): number | undefined {
  return draft.residential?.rent?.monthlyRent ?? draft.commercial?.financial?.baseRentMonthly;
}

export default function LeasesPage({ params }: LeasesPageProps) {
  const { llcId } = use(params);
  const router = useRouter();
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [propertiesMap, setPropertiesMap] = useState<Map<string, PropertyItem>>(new Map());
  const [unitsMap, setUnitsMap] = useState<Map<string, UnitItem>>(new Map());
  const [tenantsMap, setTenantsMap] = useState<Map<string, TenantItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
  });

  // Lease builder drafts state
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [creating, setCreating] = useState(false);

  // Published leases state
  const [publishedLeases, setPublishedLeases] = useState<PublishedLeaseItem[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(true);

  const fetchLeases = useCallback(async () => {
    try {
      const [resLeases, resProperties, resTenants] = await Promise.all([
        fetch(`/api/llcs/${llcId}/leases`),
        fetch(`/api/llcs/${llcId}/properties`),
        fetch(`/api/llcs/${llcId}/tenants`),
      ]);

      const [dataLeases, dataProperties, dataTenants] = await Promise.all([
        resLeases.json(),
        resProperties.json(),
        resTenants.json(),
      ]);

      if (!dataLeases.ok) {
        setError(dataLeases.error?.message || 'Failed to load leases');
        return;
      }

      setLeases(dataLeases.data);

      if (dataProperties.ok) {
        const propMap = new Map<string, PropertyItem>();
        dataProperties.data.forEach((p: PropertyItem) => propMap.set(p.id, p));
        setPropertiesMap(propMap);

        const unitPromises = dataProperties.data.map((p: PropertyItem) =>
          fetch(`/api/llcs/${llcId}/properties/${p.id}/units`).then((r) => r.json())
        );
        const unitsResults = await Promise.all(unitPromises);

        const unitMap = new Map<string, UnitItem>();
        unitsResults.forEach((result) => {
          if (result.ok) {
            result.data.forEach((u: UnitItem) => unitMap.set(u.id, u));
          }
        });
        setUnitsMap(unitMap);
      }

      if (dataTenants.ok) {
        const tenantMap = new Map<string, TenantItem>();
        dataTenants.data.forEach((t: TenantItem) => tenantMap.set(t.id, t));
        setTenantsMap(tenantMap);
      }
    } catch {
      setError('Failed to load leases');
    } finally {
      setLoading(false);
    }
  }, [llcId]);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder`);
      const data = await res.json();
      if (data.ok) {
        setDrafts(data.data);
      }
    } catch {
      // silent
    } finally {
      setLoadingDrafts(false);
    }
  }, [llcId]);

  const fetchPublishedLeases = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases`);
      const data = await res.json();
      if (data.ok) {
        setPublishedLeases(data.data);
      }
    } catch {
      // silent
    } finally {
      setLoadingPublished(false);
    }
  }, [llcId]);

  useEffect(() => {
    fetchLeases();
    fetchDrafts();
    fetchPublishedLeases();
  }, [fetchLeases, fetchDrafts, fetchPublishedLeases]);

  const getPropertyName = useCallback((propertyId: string): string => {
    const property = propertiesMap.get(propertyId);
    if (!property) return '—';
    return property.name || property.address?.street1 || propertyId;
  }, [propertiesMap]);

  const getUnitNumber = useCallback((unitId: string): string => {
    const unit = unitsMap.get(unitId);
    return unit?.unitNumber || '—';
  }, [unitsMap]);

  const getUnitNumbers = useCallback((unitIds: string[]): string => {
    if (!unitIds?.length) return '—';
    return unitIds.map(id => unitsMap.get(id)?.unitNumber || '—').join(', ');
  }, [unitsMap]);

  const getTenantNames = useCallback((tenantIds: string[]): string => {
    if (!tenantIds || tenantIds.length === 0) return '—';

    const names = tenantIds.map((id) => {
      const tenant = tenantsMap.get(id);
      if (!tenant) return null;

      if (tenant.type === 'business') {
        return tenant.businessName || '—';
      }

      const lastName = tenant.lastName || '';
      const firstName = tenant.firstName || '';
      if (lastName && firstName) {
        return `${lastName}, ${firstName}`;
      }
      return lastName || firstName || '—';
    }).filter(Boolean);

    return names.length > 0 ? names.join('; ') : '—';
  }, [tenantsMap]);

  const filteredLeases = useMemo(() => {
    let result = leases;

    if (filters.search.trim()) {
      const lowerSearch = filters.search.toLowerCase();
      result = result.filter((lease) => {
        const propertyName = getPropertyName(lease.propertyId).toLowerCase();
        const unitNumber = getUnitNumber(lease.unitId).toLowerCase();
        const tenantNames = getTenantNames(lease.tenantIds).toLowerCase();
        const rentStr = formatMoney(lease.rentAmount).toLowerCase();
        const dateRange = `${formatDate(lease.startDate)} ${formatDate(lease.endDate)}`.toLowerCase();

        return (
          propertyName.includes(lowerSearch) ||
          unitNumber.includes(lowerSearch) ||
          tenantNames.includes(lowerSearch) ||
          rentStr.includes(lowerSearch) ||
          dateRange.includes(lowerSearch)
        );
      });
    }

    result = filterByField(result, 'status', filters.status);

    return result;
  }, [leases, filters, getPropertyName, getUnitNumber, getTenantNames]);

  const handleDelete = async (leaseId: string) => {
    if (!confirm('Are you sure you want to delete this draft lease?')) {
      return;
    }

    try {
      const res = await fetch(`/api/llcs/${llcId}/leases/${leaseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setLeases((prev) => prev.filter((l) => l.id !== leaseId));
      } else {
        alert(data.error?.message || 'Failed to delete lease');
      }
    } catch {
      alert('Failed to delete lease');
    }
  };

  async function createDraft(leaseClass: LeaseClass) {
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseClass }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/llcs/${llcId}/lease-builder/${data.data.id}`);
      } else {
        setError(data.error?.message || 'Failed to create draft');
      }
    } catch {
      setError('Failed to create draft');
    } finally {
      setCreating(false);
    }
  }

  async function deleteDraft(draftId: string) {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draftId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      }
    } catch {
      // silent
    }
  }

  const inProgressDrafts = drafts.filter((d) => d.status === 'in_progress');
  const completedDrafts = drafts.filter((d) => d.status === 'completed' && !d.published);

  if (loading) {
    return <div className="text-muted-foreground">Loading leases...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leases</h1>
        <div className="flex gap-2">
          <button
            onClick={() => createDraft('residential')}
            disabled={creating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            + New Residential
          </button>
          <button
            onClick={() => createDraft('commercial')}
            disabled={creating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            + New Commercial
          </button>
          <Link
            href={`/llcs/${llcId}/leases/new`}
            className="px-4 py-2 border border-input rounded-md hover:bg-secondary transition-colors text-sm"
          >
            + Express Lease
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* Published Leases */}
      {(loadingPublished || publishedLeases.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Published Leases</h2>
          {loadingPublished ? (
            <p className="text-sm text-muted-foreground">Loading published leases...</p>
          ) : publishedLeases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published leases yet.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Tenant(s)</th>
                    <th className="text-left px-4 py-3 font-medium">Property</th>
                    <th className="text-left px-4 py-3 font-medium">Unit(s)</th>
                    <th className="text-left px-4 py-3 font-medium">Term</th>
                    <th className="text-left px-4 py-3 font-medium">Rent</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-center px-4 py-3 font-medium">Accepted</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {publishedLeases.map((pl) => (
                    <tr key={pl.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{getTenantNames(pl.tenantIds)}</td>
                      <td className="px-4 py-3">{getPropertyName(pl.propertyId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getUnitNumbers(pl.unitIds)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(pl.startDate)} – {pl.endDate ? formatDate(pl.endDate) : 'MTM'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatMoney(pl.monthlyRent)}</td>
                      <td className="px-4 py-3 capitalize">{pl.leaseClass}</td>
                      <td className="px-4 py-3 text-center">
                        {pl.accepted ? (
                          <span className="text-green-600 text-xs font-medium">Yes</span>
                        ) : (
                          <span className="text-yellow-600 text-xs font-medium">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[pl.status] || 'bg-gray-100 text-gray-800'}`}>
                          {pl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/llcs/${llcId}/published-leases/${pl.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lease Builder Drafts */}
      {(loadingDrafts || inProgressDrafts.length > 0 || completedDrafts.length > 0) && (
        <div className="mb-8">
          {loadingDrafts ? (
            <p className="text-sm text-muted-foreground">Loading drafts...</p>
          ) : (
            <>
              {inProgressDrafts.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-medium mb-3">In Progress Drafts</h2>
                  <div className="space-y-2">
                    {inProgressDrafts.map((draft) => {
                      const startDate = getDraftStartDate(draft);
                      const endDate = getDraftEndDate(draft);
                      const rent = getDraftMonthlyRent(draft);
                      const hasDetails = draft.propertyId || (draft.tenantIds && draft.tenantIds.length > 0);
                      return (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between p-4 border border-input rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {draft.tenantIds && draft.tenantIds.length > 0 && (
                                <span className="font-medium capitalize">{getTenantNames(draft.tenantIds)}</span>
                              )}
                              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                                  In Progress
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">{draft.leaseClass}</span>
                              {draft.leaseType && (
                                <span className="text-xs text-muted-foreground">
                                  - {draft.leaseType === 'fixed_term' ? 'Fixed Term' : 'Month-to-Month'}
                                </span>
                              )}
                            </div>
                            {hasDetails && (
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm">
                                {draft.propertyId && (
                                  <span className="text-muted-foreground">{getPropertyName(draft.propertyId)}</span>
                                )}
                                {draft.unitIds && draft.unitIds.length > 0 && (
                                  <span className="text-muted-foreground">Unit {getUnitNumbers(draft.unitIds)}</span>
                                )}
                                {rent !== undefined && (
                                  <span>{formatMoney(rent)}/mo</span>
                                )}
                                {startDate && (
                                  <span>
                                    {formatDate(startDate)}{endDate ? ` – ${formatDate(endDate)}` : ' – MTM'}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Step: {draft.currentStep?.replace(/_/g, ' ')} | Created: {formatDraftDate(draft.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Link
                              href={`/llcs/${llcId}/lease-builder/${draft.id}`}
                              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                            >
                              Continue
                            </Link>
                            <button
                              onClick={() => deleteDraft(draft.id)}
                              className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {completedDrafts.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-medium mb-3">Completed Drafts (Unpublished)</h2>
                  <div className="space-y-2">
                    {completedDrafts.map((draft) => {
                      const startDate = getDraftStartDate(draft);
                      const endDate = getDraftEndDate(draft);
                      const rent = getDraftMonthlyRent(draft);
                      return (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between p-4 border border-input rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">{draft.leaseClass}</span>
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                Completed
                              </span>
                              {draft.leaseType && (
                                <span className="text-xs text-muted-foreground">
                                  {draft.leaseType === 'fixed_term' ? 'Fixed Term' : 'Month-to-Month'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                              {draft.propertyId && (
                                <span>{getPropertyName(draft.propertyId)}</span>
                              )}
                              {draft.unitIds && draft.unitIds.length > 0 && (
                                <span>Unit {getUnitNumbers(draft.unitIds)}</span>
                              )}
                              {draft.tenantIds && draft.tenantIds.length > 0 && (
                                <span>{getTenantNames(draft.tenantIds)}</span>
                              )}
                              {rent !== undefined && (
                                <span>{formatMoney(rent)}/mo</span>
                              )}
                              {startDate && (
                                <span>
                                  {formatDate(startDate)}{endDate ? ` – ${formatDate(endDate)}` : ' – MTM'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed: {draft.reviewedAt ? formatDraftDate(draft.reviewedAt) : 'N/A'}
                            </p>
                          </div>
                          <Link
                            href={`/llcs/${llcId}/lease-builder/${draft.id}`}
                            className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors ml-4 shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Active Leases Section */}
      <div>
        <h2 className="text-lg font-medium mb-3">Legacy Leases</h2>

        {/* Search & Filters */}
        <SearchFilter
          filters={LEASE_FILTERS}
          values={filters}
          onChange={setFilters}
          searchPlaceholder="Search by property, unit, tenant, rent..."
          className="mb-4"
        />

        {/* Results count */}
        {leases.length > 0 && (
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredLeases.length} of {leases.length} leases
          </div>
        )}

        {leases.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              No legacy leases. Use the buttons above to create a new residential or commercial lease.
            </p>
          </div>
        ) : filteredLeases.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              No leases match your filters.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Property</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 font-medium">Tenant(s)</th>
                  <th className="text-left px-4 py-3 font-medium">Period Start</th>
                  <th className="text-left px-4 py-3 font-medium">Period End</th>
                  <th className="text-left px-4 py-3 font-medium">Rent</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/llcs/${llcId}/leases/${lease.id}`}
                        className="hover:underline font-medium"
                      >
                        {getPropertyName(lease.propertyId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getUnitNumber(lease.unitId)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getTenantNames(lease.tenantIds)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lease.startDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lease.endDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMoney(lease.rentAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[lease.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/llcs/${llcId}/leases/${lease.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground mr-3"
                      >
                        Edit
                      </Link>
                      {lease.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(lease.id)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
