'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  InsurancePolicy,
  InsuranceClaim,
  INSURANCE_POLICY_STATUS_LABELS,
  INSURANCE_POLICY_STATUS_COLORS,
  INSURANCE_POLICY_TYPE_LABELS,
  INSURANCE_CLAIM_STATUS_LABELS,
  INSURANCE_CLAIM_STATUS_COLORS,
  INSURANCE_CAUSE_OF_LOSS_LABELS,
} from '@shared/types';

interface InsurancePageProps {
  params: Promise<{ orgId: string; llcId: string }>;
}

function formatCents(cents?: number) {
  if (cents === undefined || cents === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function InsurancePage({ params }: InsurancePageProps) {
  const { orgId, llcId } = use(params);
  const basePath = `/${orgId}/llcs/${llcId}/insurance`;

  const [activeTab, setActiveTab] = useState<'policies' | 'claims'>('policies');

  // Policies state
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesError, setPoliciesError] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'property' | 'tenant'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [policySearch, setPolicySearch] = useState('');

  // Claims state
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsFetched, setClaimsFetched] = useState(false);
  const [claimsError, setClaimsError] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');
  const [claimSearch, setClaimSearch] = useState('');

  const fetchPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    setPoliciesError('');
    try {
      const p = new URLSearchParams();
      if (entityTypeFilter !== 'all') p.set('entityType', entityTypeFilter);
      const res = await fetch(`/api/llcs/${llcId}/insurance/policies?${p}`);
      const data = await res.json();
      if (data.ok) {
        setPolicies(data.data);
      } else {
        setPoliciesError(data.error?.message ?? 'Failed to load policies');
      }
    } catch {
      setPoliciesError('Failed to load policies');
    } finally {
      setPoliciesLoading(false);
    }
  }, [llcId, entityTypeFilter]);

  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    setClaimsError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/insurance/claims`);
      const data = await res.json();
      if (data.ok) {
        setClaims(data.data);
      } else {
        setClaimsError(data.error?.message ?? 'Failed to load claims');
      }
    } catch {
      setClaimsError('Failed to load claims');
    } finally {
      setClaimsLoading(false);
      setClaimsFetched(true);
    }
  }, [llcId]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  useEffect(() => {
    if (activeTab === 'claims' && !claimsFetched && !claimsLoading) {
      fetchClaims();
    }
  }, [activeTab, claimsFetched, claimsLoading, fetchClaims]);

  const filteredPolicies = policies.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (policySearch) {
      const q = policySearch.toLowerCase();
      if (
        !p.carrier.toLowerCase().includes(q) &&
        !p.policyNumber.toLowerCase().includes(q) &&
        !p.entityName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const filteredClaims = claims.filter(c => {
    if (claimStatusFilter !== 'all' && c.status !== claimStatusFilter) return false;
    if (claimSearch) {
      const q = claimSearch.toLowerCase();
      const carrier = c.carrier?.toLowerCase() ?? '';
      const policyNumber = c.policyNumber?.toLowerCase() ?? '';
      if (
        !c.entityName.toLowerCase().includes(q) &&
        !carrier.includes(q) &&
        !policyNumber.includes(q) &&
        !(c.claimNumber?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const expiringSoon = filteredPolicies.filter(p => {
    const days = daysUntil(p.expirationDate);
    return days >= 0 && days <= 30 && p.status === 'active';
  });

  function claimHref(claim: InsuranceClaim) {
    if (claim.policyId) {
      return `${basePath}/${claim.policyId}/claims/${claim.id}`;
    }
    return `${basePath}/claims/${claim.id}`;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Insurance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage property and tenant insurance policies and claims</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'claims' ? (
            <Link
              href={`${basePath}/claims/new`}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              New Claim
            </Link>
          ) : (
            <Link
              href={`${basePath}/new`}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Add Policy
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {(['policies', 'claims'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'policies' ? 'Policies' : 'Claims'}
          </button>
        ))}
      </div>

      {/* ── POLICIES TAB ── */}
      {activeTab === 'policies' && (
        <>
          {/* Expiring soon alert */}
          {expiringSoon.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-medium text-orange-800">
                {expiringSoon.length} {expiringSoon.length === 1 ? 'policy expires' : 'policies expire'} within 30 days
              </p>
              <ul className="mt-1 space-y-1">
                {expiringSoon.map(p => (
                  <li key={p.id} className="text-sm text-orange-700">
                    <Link href={`${basePath}/${p.id}`} className="hover:underline">
                      {p.carrier} #{p.policyNumber}
                    </Link>{' '}
                    — {p.entityName} ({daysUntil(p.expirationDate)} days)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search carrier, policy #, name..."
              value={policySearch}
              onChange={e => setPolicySearch(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={entityTypeFilter}
              onChange={e => setEntityTypeFilter(e.target.value as 'all' | 'property' | 'tenant')}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Types</option>
              <option value="property">Property Policies</option>
              <option value="tenant">Tenant Policies</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Policy list */}
          {policiesLoading ? (
            <div className="text-sm text-muted-foreground py-12 text-center">Loading policies...</div>
          ) : policiesError ? (
            <div className="text-sm text-destructive py-12 text-center">{policiesError}</div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-16 border rounded-lg">
              <p className="text-muted-foreground text-sm">No insurance policies found.</p>
              <Link href={`${basePath}/new`} className="mt-3 inline-block text-sm text-primary hover:underline">
                Add your first policy
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(entityTypeFilter === 'all' || entityTypeFilter === 'property') && (
                <>
                  {filteredPolicies.filter(p => p.entityType === 'property').length > 0 && (
                    <div>
                      {entityTypeFilter === 'all' && (
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Property Policies
                        </h2>
                      )}
                      <div className="space-y-2">
                        {filteredPolicies.filter(p => p.entityType === 'property').map(policy => (
                          <PolicyRow key={policy.id} policy={policy} basePath={basePath} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {(entityTypeFilter === 'all' || entityTypeFilter === 'tenant') && (
                <>
                  {filteredPolicies.filter(p => p.entityType === 'tenant').length > 0 && (
                    <div className={entityTypeFilter === 'all' ? 'mt-4' : ''}>
                      {entityTypeFilter === 'all' && (
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Tenant Policies
                        </h2>
                      )}
                      <div className="space-y-2">
                        {filteredPolicies.filter(p => p.entityType === 'tenant').map(policy => (
                          <PolicyRow key={policy.id} policy={policy} basePath={basePath} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!policiesLoading && !policiesError && (
            <p className="text-xs text-muted-foreground">
              {filteredPolicies.length} {filteredPolicies.length === 1 ? 'policy' : 'policies'}
            </p>
          )}
        </>
      )}

      {/* ── CLAIMS TAB ── */}
      {activeTab === 'claims' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search entity, carrier, claim #..."
              value={claimSearch}
              onChange={e => setClaimSearch(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={claimStatusFilter}
              onChange={e => setClaimStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="settled">Settled</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {claimsLoading ? (
            <div className="text-sm text-muted-foreground py-12 text-center">Loading claims...</div>
          ) : claimsError ? (
            <div className="text-sm text-destructive py-12 text-center">{claimsError}</div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-16 border rounded-lg">
              <p className="text-muted-foreground text-sm">No claims found.</p>
              <Link href={`${basePath}/claims/new`} className="mt-3 inline-block text-sm text-primary hover:underline">
                File your first claim
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClaims.map(claim => (
                <Link
                  key={claim.id}
                  href={claimHref(claim)}
                  className="block border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{claim.entityName}</span>
                        {claim.claimNumber && (
                          <span className="text-muted-foreground text-sm">#{claim.claimNumber}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSURANCE_CLAIM_STATUS_COLORS[claim.status]}`}>
                          {INSURANCE_CLAIM_STATUS_LABELS[claim.status]}
                        </span>
                        {!claim.policyId && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800">
                            No policy linked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        {claim.carrier && <span>{claim.carrier}</span>}
                        {claim.carrier && claim.policyNumber && <span>·</span>}
                        {claim.policyNumber && <span>#{claim.policyNumber}</span>}
                        {claim.causeOfLoss && (
                          <>
                            <span>·</span>
                            <span>{INSURANCE_CAUSE_OF_LOSS_LABELS[claim.causeOfLoss]}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Date of Loss: {claim.dateOfLoss}</span>
                        {claim.reportedAmount !== undefined && (
                          <span>Claimed: {formatCents(claim.reportedAmount)}</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!claimsLoading && !claimsError && (
            <p className="text-xs text-muted-foreground">
              {filteredClaims.length} {filteredClaims.length === 1 ? 'claim' : 'claims'}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PolicyRow({ policy, basePath }: { policy: InsurancePolicy; basePath: string }) {
  const days = daysUntil(policy.expirationDate);
  const expiring = days >= 0 && days <= 30 && policy.status === 'active';

  return (
    <Link
      href={`${basePath}/${policy.id}`}
      className="block border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{policy.carrier}</span>
            <span className="text-muted-foreground text-sm">#{policy.policyNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSURANCE_POLICY_STATUS_COLORS[policy.status]}`}>
              {INSURANCE_POLICY_STATUS_LABELS[policy.status]}
            </span>
            {expiring && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800">
                Expires in {days}d
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span>{INSURANCE_POLICY_TYPE_LABELS[policy.policyType]}</span>
            <span>·</span>
            <span>{policy.entityName}</span>
            {policy.unitLabel && <><span>·</span><span>Unit {policy.unitLabel}</span></>}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>Effective {policy.effectiveDate}</span>
            <span>Expires {policy.expirationDate}</span>
            {policy.coverageAmount !== undefined && (
              <span>Coverage: {formatCents(policy.coverageAmount)}</span>
            )}
          </div>
        </div>
        <svg className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
