'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  INSURANCE_CLAIM_STATUS_LABELS,
  INSURANCE_CLAIM_STATUS_COLORS,
  INSURANCE_CAUSE_OF_LOSS_LABELS,
} from '@shared/types';

interface AdminClaim {
  id: string;
  llcId: string;
  llcName: string;
  policyId: string | null;
  policyNumber: string | null;
  carrier: string | null;
  entityName: string;
  propertyName: string;
  claimNumber: string | null;
  causeOfLoss: string | null;
  dateOfLoss: string | null;
  dateFiled: string | null;
  status: string;
  reportedAmount: number | null;
  settledAmount: number | null;
  description: string;
  createdAt: string;
}

interface LLC {
  id: string;
  legalName: string;
}

function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const OPEN_STATUSES = new Set(['open', 'under_review', 'approved']);
const CLOSED_STATUSES = new Set(['denied', 'settled', 'closed']);

export default function AdminClaimsPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') ?? undefined;

  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [llcs, setLlcs] = useState<LLC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [llcFilter, setLlcFilter] = useState('');
  const [statusGroup, setStatusGroup] = useState<'all' | 'open' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const url = orgId ? `/api/llcs?accountId=${orgId}` : '/api/llcs';
    fetch(url).then(r => r.json()).then(d => { if (d.ok) setLlcs(d.data); }).catch(() => {});
  }, [orgId]);

  const fetchClaims = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('accountId', orgId);
      if (llcFilter) params.set('llcId', llcFilter);
      if (statusGroup !== 'all') params.set('statusGroup', statusGroup);

      const res = await fetch(`/api/admin/claims?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setClaims(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch claims');
      }
    } catch {
      setError('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  }, [llcFilter, statusGroup, orgId]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  // Client-side search
  const filtered = claims.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (c.claimNumber || '').toLowerCase().includes(s) ||
      (c.carrier || '').toLowerCase().includes(s) ||
      c.propertyName.toLowerCase().includes(s) ||
      c.llcName.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s)
    );
  });

  // Summary stats
  const totalOpen = claims.filter(c => OPEN_STATUSES.has(c.status)).length;
  const totalClosed = claims.filter(c => CLOSED_STATUSES.has(c.status)).length;
  const totalReported = claims.reduce((sum, c) => sum + (c.reportedAmount ?? 0), 0);

  if (!orgId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Insurance Claims</h1>
        <div className="text-center py-16 border rounded-lg text-muted-foreground">
          Select an organization to view claims.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          ← Admin
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">All Insurance Claims</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold">{claims.length}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Open</div>
          <div className="text-2xl font-bold text-yellow-600">{totalOpen}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Closed</div>
          <div className="text-2xl font-bold text-gray-500">{totalClosed}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Reported</div>
          <div className="text-lg font-bold">{formatCents(totalReported)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Claim #, carrier, property..."
            className="px-3 py-2 border rounded-md text-sm w-52"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">LLC</label>
          <select
            value={llcFilter}
            onChange={e => setLlcFilter(e.target.value)}
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
          <div className="flex rounded-md border overflow-hidden text-sm">
            {(['all', 'open', 'closed'] as const).map(v => (
              <button
                key={v}
                onClick={() => setStatusGroup(v)}
                className={`px-3 py-2 capitalize transition-colors ${
                  statusGroup === v
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary/50 text-muted-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading claims...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No claims found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date of Loss</th>
                  <th className="text-left px-4 py-3 font-medium">Carrier</th>
                  <th className="text-left px-4 py-3 font-medium">Claim #</th>
                  <th className="text-left px-4 py-3 font-medium">Property</th>
                  <th className="text-left px-4 py-3 font-medium">Cause of Loss</th>
                  <th className="text-right px-4 py-3 font-medium">Reported</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">LLC</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(claim => {
                  const href = claim.policyId
                    ? `/llcs/${claim.llcId}/insurance/${claim.policyId}/claims/${claim.id}`
                    : `/llcs/${claim.llcId}/insurance/claims/${claim.id}`;

                  return (
                    <tr key={claim.id} className="border-t hover:bg-secondary/20">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(claim.dateOfLoss)}
                      </td>
                      <td className="px-4 py-3">
                        {claim.carrier || '—'}
                        {claim.policyNumber && (
                          <div className="text-xs text-muted-foreground">{claim.policyNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={href} className="text-primary hover:underline font-medium">
                          {claim.claimNumber ? `#${claim.claimNumber}` : 'View →'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{claim.propertyName}</div>
                        <div className="text-xs text-muted-foreground">{claim.llcName}</div>
                      </td>
                      <td className="px-4 py-3">
                        {claim.causeOfLoss
                          ? INSURANCE_CAUSE_OF_LOSS_LABELS[claim.causeOfLoss as keyof typeof INSURANCE_CAUSE_OF_LOSS_LABELS] ?? claim.causeOfLoss
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatCents(claim.reportedAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          INSURANCE_CLAIM_STATUS_COLORS[claim.status as keyof typeof INSURANCE_CLAIM_STATUS_COLORS] ?? 'bg-secondary text-muted-foreground'
                        }`}>
                          {INSURANCE_CLAIM_STATUS_LABELS[claim.status as keyof typeof INSURANCE_CLAIM_STATUS_LABELS] ?? claim.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/llcs/${claim.llcId}`} className="text-primary hover:underline text-xs">
                          {claim.llcName}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t bg-secondary/20 text-xs text-muted-foreground">
            {filtered.length} claim{filtered.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>
      )}
    </div>
  );
}
