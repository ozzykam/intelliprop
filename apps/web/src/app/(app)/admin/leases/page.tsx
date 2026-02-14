'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AdminPublishedLease {
  id: string;
  llcId: string;
  llcName: string;
  propertyAddress: string;
  unitNumbers: string;
  tenantNames: string[];
  leaseClass: string;
  monthlyRent: number;
  startDate: string;
  endDate?: string;
  leaseType: string;
  accepted: boolean;
  status: string;
  publishedAt: string;
  daysUntilExpiry: number | null;
}

interface LLC {
  id: string;
  legalName: string;
}

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  terminated: 'bg-red-100 text-red-800',
};

const LEASE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
];

const ACCEPTED_FILTERS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Accepted' },
  { value: 'false', label: 'Pending' },
];

export default function AdminLeasesPage() {
  const [leases, setLeases] = useState<AdminPublishedLease[]>([]);
  const [llcs, setLlcs] = useState<LLC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [llcFilter, setLlcFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [acceptedFilter, setAcceptedFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLlcs = async () => {
    try {
      const res = await fetch('/api/llcs');
      const data = await res.json();
      if (data.ok) {
        setLlcs(data.data);
      }
    } catch {
      console.error('Failed to fetch LLCs');
    }
  };

  const fetchLeases = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (llcFilter) params.set('llcId', llcFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (acceptedFilter) params.set('accepted', acceptedFilter);

      const res = await fetch(`/api/admin/published-leases?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setLeases(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch leases');
      }
    } catch {
      setError('Failed to fetch leases');
    } finally {
      setLoading(false);
    }
  }, [llcFilter, statusFilter, acceptedFilter]);

  useEffect(() => {
    fetchLlcs();
  }, []);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  // Client-side search filter
  const filteredLeases = leases.filter(lease => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lease.tenantNames.some(n => n.toLowerCase().includes(search)) ||
      lease.propertyAddress.toLowerCase().includes(search) ||
      lease.unitNumbers.toLowerCase().includes(search) ||
      lease.llcName.toLowerCase().includes(search)
    );
  });

  // Summary stats
  const totalPublished = filteredLeases.length;
  const acceptedCount = filteredLeases.filter(l => l.accepted).length;
  const pendingAcceptance = filteredLeases.filter(l => !l.accepted).length;
  const totalMonthlyRent = filteredLeases
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.monthlyRent, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Admin
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">All Published Leases</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Published</div>
          <div className="text-2xl font-bold">{totalPublished}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Accepted</div>
          <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pending Acceptance</div>
          <div className={`text-2xl font-bold ${pendingAcceptance > 0 ? 'text-yellow-600' : ''}`}>
            {pendingAcceptance}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Monthly Rent (Active)</div>
          <div className="text-2xl font-bold">{formatMoney(totalMonthlyRent)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tenant, property, unit..."
            className="px-3 py-2 border rounded-md text-sm w-48"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">LLC</label>
          <select
            value={llcFilter}
            onChange={(e) => setLlcFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All LLCs</option>
            {llcs.map(llc => (
              <option key={llc.id} value={llc.id}>{llc.legalName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {LEASE_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Accepted</label>
          <select
            value={acceptedFilter}
            onChange={(e) => setAcceptedFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {ACCEPTED_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">Loading published leases...</div>
      )}

      {/* Table */}
      {!loading && filteredLeases.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">LLC</th>
                  <th className="text-left px-4 py-3 font-medium">Property</th>
                  <th className="text-left px-4 py-3 font-medium">Unit(s)</th>
                  <th className="text-left px-4 py-3 font-medium">Tenant(s)</th>
                  <th className="text-right px-4 py-3 font-medium">Rent</th>
                  <th className="text-left px-4 py-3 font-medium">Term</th>
                  <th className="text-center px-4 py-3 font-medium">Accepted</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeases.map((lease) => (
                  <tr key={`${lease.llcId}-${lease.id}`} className="border-t hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <Link
                        href={`/llcs/${lease.llcId}`}
                        className="text-primary hover:underline"
                      >
                        {lease.llcName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/llcs/${lease.llcId}/published-leases/${lease.id}`}
                        className="hover:underline"
                      >
                        {lease.propertyAddress}
                      </Link>
                      <div className="text-xs text-muted-foreground capitalize">{lease.leaseClass}</div>
                    </td>
                    <td className="px-4 py-3">{lease.unitNumbers || '—'}</td>
                    <td className="px-4 py-3">
                      {lease.tenantNames.length > 0 ? lease.tenantNames.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(lease.monthlyRent)}</td>
                    <td className="px-4 py-3">
                      <div>{formatDate(lease.startDate)} – {lease.endDate ? formatDate(lease.endDate) : 'MTM'}</div>
                      {lease.daysUntilExpiry !== null && lease.daysUntilExpiry <= 60 && (
                        <div className={`text-xs ${lease.daysUntilExpiry <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {lease.daysUntilExpiry} days left
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lease.accepted ? (
                        <span className="text-green-600 text-xs font-medium">Yes</span>
                      ) : (
                        <span className="text-yellow-600 text-xs font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[lease.status] || 'bg-gray-100'}`}>
                        {lease.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLeases.length === 0 && (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No published leases found</p>
        </div>
      )}
    </div>
  );
}
