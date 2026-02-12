'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

function cents(val?: number) {
  if (!val) return '$0.00';
  return `$${(val / 100).toFixed(2)}`;
}

export default function ReviewStep({ draft, llcId }: StepProps) {
  const [preview, setPreview] = useState<{ documents: { title: string; type: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rent = draft.residential?.rent;
  const deposit = draft.residential?.deposit;
  const utilities = draft.residential?.utilities;
  const occupancy = draft.residential?.occupancy;
  const policies = draft.residential?.policies;
  const entry = draft.residential?.entry;

  async function handleAssemblePreview() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draft.id}/assemble`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        setPreview(data.data);
      } else {
        setError(data.error?.message || 'Assembly failed');
      }
    } catch {
      setError('Failed to assemble preview');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Review Lease Summary</h2>

      {/* Property */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium border-b pb-1">Property & Location</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">City</dt>
          <dd>{draft.propertyProfile?.city || '—'}</dd>
          <dt className="text-muted-foreground">County</dt>
          <dd>{draft.propertyProfile?.county || '—'}</dd>
          <dt className="text-muted-foreground">Year Built</dt>
          <dd>{draft.propertyProfile?.yearBuilt || '—'}</dd>
          <dt className="text-muted-foreground">Lease Type</dt>
          <dd className="capitalize">{draft.leaseType?.replace('_', ' ') || '—'}</dd>
        </dl>
      </section>

      {/* Rent */}
      {rent && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Rent & Payment</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Monthly Rent</dt>
            <dd>{cents(rent.monthlyRent)}</dd>
            <dt className="text-muted-foreground">Due Day</dt>
            <dd>{rent.dueDay}</dd>
            <dt className="text-muted-foreground">Grace Period</dt>
            <dd>{rent.gracePeriodDays} days</dd>
            <dt className="text-muted-foreground">Late Fee</dt>
            <dd>
              {rent.lateFeeType === 'none' ? 'None' :
               rent.lateFeeType === 'flat' ? cents(rent.lateFeeAmount) :
               `${rent.lateFeeAmount}%`}
            </dd>
            <dt className="text-muted-foreground">Start Date</dt>
            <dd>{rent.startDate || '—'}</dd>
            <dt className="text-muted-foreground">End Date</dt>
            <dd>{rent.endDate || 'Month-to-month'}</dd>
          </dl>
        </section>
      )}

      {/* Deposit */}
      {deposit && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Deposits & Fees</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Security Deposit</dt>
            <dd>{cents(deposit.securityDeposit)}</dd>
            {deposit.petDeposit && <>
              <dt className="text-muted-foreground">Pet Deposit</dt>
              <dd>{cents(deposit.petDeposit)}</dd>
            </>}
            <dt className="text-muted-foreground">Move-in Checklist</dt>
            <dd>{deposit.useMoveinChecklist ? 'Yes' : 'No'}</dd>
          </dl>
        </section>
      )}

      {/* Utilities */}
      {utilities && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Utilities</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Landlord Pays</dt>
            <dd>{utilities.landlordPays?.join(', ') || 'None'}</dd>
            <dt className="text-muted-foreground">Tenant Pays</dt>
            <dd>{utilities.tenantPays?.join(', ') || 'None'}</dd>
          </dl>
        </section>
      )}

      {/* Occupancy */}
      {occupancy && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Occupancy</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Max Occupants</dt>
            <dd>{occupancy.maxOccupants}</dd>
            <dt className="text-muted-foreground">Guest Limit</dt>
            <dd>{occupancy.guestMaxConsecutiveDays} consecutive days</dd>
            <dt className="text-muted-foreground">Subletting</dt>
            <dd>{occupancy.sublettingAllowed ? 'Allowed (with consent)' : 'Not allowed'}</dd>
          </dl>
        </section>
      )}

      {/* Policies */}
      {policies && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Policies</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Smoking</dt>
            <dd className="capitalize">{policies.smokingPolicy?.replace(/_/g, ' ')}</dd>
            <dt className="text-muted-foreground">Pets</dt>
            <dd className="capitalize">{policies.petPolicy?.replace(/_/g, ' ')}</dd>
            <dt className="text-muted-foreground">Renters Insurance</dt>
            <dd>{policies.rentersInsuranceRequired ? 'Required' : 'Not required'}</dd>
            <dt className="text-muted-foreground">Parking</dt>
            <dd>{policies.parkingIncluded ? `Yes (${policies.parkingSpaces} spaces)` : 'Not included'}</dd>
          </dl>
        </section>
      )}

      {/* Entry */}
      {entry && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Entry & Repairs</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Notice Required</dt>
            <dd>{entry.noticeHours} hours</dd>
            <dt className="text-muted-foreground">Maintenance Requests</dt>
            <dd className="capitalize">{entry.maintenanceRequestMethod?.replace(/_/g, ' ')}</dd>
          </dl>
        </section>
      )}

      {/* Package Documents */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium border-b pb-1">Package Documents</h3>
        <p className="text-sm text-muted-foreground">
          {draft.triggeredDisclosures?.length ?? 0} disclosures + {draft.triggeredOverlays?.length ?? 0} addenda will be included.
        </p>
        <button
          onClick={handleAssemblePreview}
          disabled={loading}
          className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {loading ? 'Assembling...' : 'Preview Package Contents'}
        </button>
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
        )}
        {preview && (
          <ul className="space-y-1">
            {preview.documents.map((doc, idx) => (
              <li key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm">
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded capitalize">{doc.type.replace('_', ' ')}</span>
                {doc.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
