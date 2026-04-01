'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import {
  InsurancePolicy,
  INSURANCE_CAUSE_OF_LOSS,
  INSURANCE_CAUSE_OF_LOSS_LABELS,
  InsuranceCauseOfLoss,
} from '@shared/types';

interface NewClaimPageProps {
  params: Promise<{ llcId: string; policyId: string }>;
}

export default function NewClaimPage({ params }: NewClaimPageProps) {
  const { llcId, policyId } = use(params);
  const router = useRouter();
  const basePath = `/llcs/${llcId}/insurance`;

  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [claimNumber, setClaimNumber] = useState('');
  const [causeOfLoss, setCauseOfLoss] = useState<InsuranceCauseOfLoss | ''>('');
  const [dateOfLoss, setDateOfLoss] = useState('');
  const [dateFiled, setDateFiled] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('open');
  const [reportedAmount, setReportedAmount] = useState('');
  const [offeredAmount, setOfferedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPolicy = useCallback(async () => {
    const res = await fetch(`/api/llcs/${llcId}/insurance/policies/${policyId}`);
    const data = await res.json();
    if (data.ok) setPolicy(data.data);
  }, [llcId, policyId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!policy) return;
    setError('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        carrier: policy.carrier,
        entityType: policy.entityType,
        entityId: policy.entityId,
        entityName: policy.entityName,
        dateOfLoss,
        description,
        status,
      };

      if (policy.propertyId) body.propertyId = policy.propertyId;
      if (policy.propertyName) body.propertyName = policy.propertyName;
      if (policy.unitId) body.unitId = policy.unitId;
      if (policy.unitLabel) body.unitLabel = policy.unitLabel;
      if (claimNumber) body.claimNumber = claimNumber;
      if (causeOfLoss) body.causeOfLoss = causeOfLoss;
      if (dateFiled) body.dateFiled = dateFiled;
      if (reportedAmount) body.reportedAmount = Math.round(parseFloat(reportedAmount) * 100);
      if (offeredAmount) body.offeredAmount = Math.round(parseFloat(offeredAmount) * 100);
      if (notes) body.notes = notes;

      const res = await fetch(`/api/llcs/${llcId}/insurance/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        router.push(`${basePath}/${policyId}/claims/${data.data.id}`);
      } else {
        setError(data.error?.message ?? 'Failed to file claim');
      }
    } catch {
      setError('Failed to file claim');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`${basePath}/${policyId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {policy ? `${policy.carrier} #${policy.policyNumber}` : 'Policy'}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">File a Claim</h1>
        {policy && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {policy.carrier} · #{policy.policyNumber} · {policy.entityName}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Claim Details */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Claim Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Claim Number</label>
              <input
                type="text"
                value={claimNumber}
                onChange={e => setClaimNumber(e.target.value)}
                placeholder="Assigned by insurer"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="settled">Settled</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cause of Loss</label>
            <select
              value={causeOfLoss}
              onChange={e => setCauseOfLoss(e.target.value as InsuranceCauseOfLoss | '')}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— Select —</option>
              {Object.values(INSURANCE_CAUSE_OF_LOSS).map(c => (
                <option key={c} value={c}>{INSURANCE_CAUSE_OF_LOSS_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date of Loss <span className="text-destructive">*</span></label>
              <input
                type="date"
                value={dateOfLoss}
                onChange={e => setDateOfLoss(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Filed</label>
              <input
                type="date"
                value={dateFiled}
                onChange={e => setDateFiled(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description <span className="text-destructive">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe the loss or damage..."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        {/* Financials */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Financials</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Reported Amount (Claimed)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={reportedAmount}
                  onChange={e => setReportedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Insurer Offer</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offeredAmount}
                  onChange={e => setOfferedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'File Claim'}
          </button>
          <Link
            href={`${basePath}/${policyId}`}
            className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
