'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

interface PolicyPageProps {
  params: Promise<{ llcId: string; policyId: string }>;
}

function formatCents(cents?: number) {
  if (cents === undefined || cents === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function PolicyDetailPage({ params }: PolicyPageProps) {
  const { llcId, policyId } = use(params);
  const router = useRouter();
  const basePath = `/llcs/${llcId}/insurance`;

  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [policyRes, claimsRes] = await Promise.all([
        fetch(`/api/llcs/${llcId}/insurance/policies/${policyId}`),
        fetch(`/api/llcs/${llcId}/insurance/claims?policyId=${policyId}`),
      ]);
      const [policyData, claimsData] = await Promise.all([policyRes.json(), claimsRes.json()]);

      if (policyData.ok) setPolicy(policyData.data);
      else setError(policyData.error?.message ?? 'Policy not found');

      if (claimsData.ok) setClaims(claimsData.data);
    } catch {
      setError('Failed to load policy');
    } finally {
      setLoading(false);
    }
  }, [llcId, policyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/insurance/policies/${policyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/llcs/${llcId}/insurance`);
      } else {
        alert(data.error?.message ?? 'Failed to delete policy');
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch {
      alert('Failed to delete policy');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (error || !policy) {
    return (
      <div className="p-6">
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">← Insurance</Link>
        <p className="mt-4 text-sm text-destructive">{error || 'Policy not found'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">
          ← Insurance
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">{policy.carrier}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSURANCE_POLICY_STATUS_COLORS[policy.status]}`}>
                {INSURANCE_POLICY_STATUS_LABELS[policy.status]}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              #{policy.policyNumber} · {INSURANCE_POLICY_TYPE_LABELS[policy.policyType]}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`${basePath}/${policyId}/edit`}
              className="px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-secondary/50"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 border border-destructive text-destructive text-sm font-medium rounded-md hover:bg-destructive/5"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Policy Info */}
      <div className="border rounded-lg p-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <InfoField label="Covered Entity" value={`${policy.entityName}${policy.unitLabel ? ` · Unit ${policy.unitLabel}` : ''}`} />
        <InfoField label="Entity Type" value={policy.entityType === 'property' ? 'Property' : 'Tenant'} />
        <InfoField label="Policy Type" value={INSURANCE_POLICY_TYPE_LABELS[policy.policyType]} />
        <InfoField label="Effective Date" value={policy.effectiveDate} />
        <InfoField label="Expiration Date" value={policy.expirationDate} />
        <InfoField label="Coverage Amount" value={formatCents(policy.coverageAmount)} />
        <InfoField label="Deductible" value={formatCents(policy.deductible)} />
        {policy.premium !== undefined && (
          <InfoField
            label="Premium"
            value={`${formatCents(policy.premium)}${policy.premiumFrequency ? ` / ${policy.premiumFrequency}` : ''}`}
          />
        )}
        {policy.agentName && <InfoField label="Agent" value={policy.agentName} />}
        {policy.agentPhone && <InfoField label="Agent Phone" value={policy.agentPhone} />}
        {policy.agentEmail && <InfoField label="Agent Email" value={policy.agentEmail} />}
      </div>

      {policy.notes && (
        <div className="border rounded-lg p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{policy.notes}</p>
        </div>
      )}

      {/* Claims */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Claims</h2>
          <Link
            href={`${basePath}/${policyId}/claims/new`}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
          >
            File Claim
          </Link>
        </div>

        {claims.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">No claims filed on this policy.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {claims.map(claim => (
              <Link
                key={claim.id}
                href={`${basePath}/${policyId}/claims/${claim.id}`}
                className="block border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {claim.claimNumber && (
                        <span className="font-medium text-sm">Claim #{claim.claimNumber}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSURANCE_CLAIM_STATUS_COLORS[claim.status]}`}>
                        {INSURANCE_CLAIM_STATUS_LABELS[claim.status]}
                      </span>
                      {claim.causeOfLoss && (
                        <span className="text-xs text-muted-foreground">
                          {INSURANCE_CAUSE_OF_LOSS_LABELS[claim.causeOfLoss]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{claim.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Date of Loss: {claim.dateOfLoss}</span>
                      {claim.reportedAmount !== undefined && (
                        <span>Claimed: {formatCents(claim.reportedAmount)}</span>
                      )}
                      {claim.settledAmount !== undefined && (
                        <span>Settled: {formatCents(claim.settledAmount)}</span>
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
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Delete Policy?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete this insurance policy. Claims linked to this policy will not be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-secondary/50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-destructive text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
