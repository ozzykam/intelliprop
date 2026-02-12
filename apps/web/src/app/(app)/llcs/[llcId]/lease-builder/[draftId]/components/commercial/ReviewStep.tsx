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

function dollars(val?: number) {
  if (!val) return '$0';
  return `$${val.toLocaleString()}`;
}

export default function ReviewStep({ draft, llcId }: StepProps) {
  const [preview, setPreview] = useState<{ documents: { title: string; type: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const structure = draft.commercial?.leaseStructure;
  const financial = draft.commercial?.financial;
  const deposit = draft.commercial?.deposit;
  const use = draft.commercial?.useAndBuildout;
  const ops = draft.commercial?.operations;
  const risk = draft.commercial?.risk;

  async function handleAssemblePreview() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draft.id}/assemble`, { method: 'POST' });
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
          <dt className="text-muted-foreground">Space Type</dt>
          <dd className="capitalize">{draft.propertyProfile?.commercialSpaceType || '—'}</dd>
          <dt className="text-muted-foreground">Square Feet</dt>
          <dd>{draft.propertyProfile?.premisesSqft?.toLocaleString() ?? '—'}</dd>
          <dt className="text-muted-foreground">Zoning Confirmed</dt>
          <dd>{draft.propertyProfile?.zoningConfirmed ? 'Yes' : 'No'}</dd>
        </dl>
      </section>

      {/* Lease Structure */}
      {structure && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Lease Structure</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Lease Type</dt>
            <dd className="uppercase">{structure.leaseType}</dd>
            <dt className="text-muted-foreground">Start Date</dt>
            <dd>{structure.startDate || '—'}</dd>
            <dt className="text-muted-foreground">End Date</dt>
            <dd>{structure.endDate || 'Month-to-month'}</dd>
            <dt className="text-muted-foreground">Renewal Options</dt>
            <dd>{structure.renewalOptions ?? 0}</dd>
          </dl>
        </section>
      )}

      {/* Financial */}
      {financial && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Financial Terms</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Base Rent (monthly)</dt>
            <dd>{cents(financial.baseRentMonthly)}</dd>
            <dt className="text-muted-foreground">Escalation</dt>
            <dd className="capitalize">{financial.escalationType?.replace(/_/g, ' ') ?? 'None'}</dd>
            <dt className="text-muted-foreground">Late Fee</dt>
            <dd>{cents(financial.lateFeeAmount)}</dd>
            <dt className="text-muted-foreground">CAM Enabled</dt>
            <dd>{financial.camEnabled ? `Yes (${financial.camProRataShare}%)` : 'No'}</dd>
          </dl>
        </section>
      )}

      {/* Deposit */}
      {deposit && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Security Deposit</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Amount</dt>
            <dd>{cents(deposit.securityDeposit)}</dd>
            <dt className="text-muted-foreground">Return Period</dt>
            <dd>{deposit.depositReturnDays} days</dd>
          </dl>
        </section>
      )}

      {/* Use & Buildout */}
      {use && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Use & Buildout</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Permitted Use</dt>
            <dd>{use.permittedUse || '—'}</dd>
            <dt className="text-muted-foreground">Exclusive Use</dt>
            <dd>{use.exclusiveUse ? 'Yes' : 'No'}</dd>
            <dt className="text-muted-foreground">TI Type</dt>
            <dd className="capitalize">{use.tiType?.replace(/_/g, ' ') ?? 'None'}</dd>
            {use.tiAllowance && <>
              <dt className="text-muted-foreground">TI Allowance</dt>
              <dd>{cents(use.tiAllowance)}</dd>
            </>}
            <dt className="text-muted-foreground">Signage</dt>
            <dd>{use.signageAllowed ? 'Allowed' : 'Not allowed'}</dd>
            <dt className="text-muted-foreground">Premises Condition</dt>
            <dd className="capitalize">{use.premisesCondition?.replace(/_/g, ' ') ?? '—'}</dd>
          </dl>
        </section>
      )}

      {/* Operations */}
      {ops && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Operations</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Utilities</dt>
            <dd className="capitalize">{ops.utilityResponsibility?.replace(/_/g, ' ')}</dd>
            <dt className="text-muted-foreground">GL Insurance</dt>
            <dd>{dollars(ops.insuranceGLAmount)}</dd>
            <dt className="text-muted-foreground">ADA Responsibility</dt>
            <dd className="capitalize">{ops.adaResponsibility}</dd>
          </dl>
        </section>
      )}

      {/* Risk */}
      {risk && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium border-b pb-1">Risk & Default</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Monetary Cure</dt>
            <dd>{risk.monetaryDefaultCureDays} days</dd>
            <dt className="text-muted-foreground">Non-Monetary Cure</dt>
            <dd>{risk.nonMonetaryDefaultCureDays} days</dd>
            <dt className="text-muted-foreground">Holdover Rent</dt>
            <dd>{risk.holdoverRentPercent}%</dd>
            <dt className="text-muted-foreground">Personal Guarantee</dt>
            <dd>{risk.personalGuaranteeRequired ? `Yes (${risk.personalGuaranteeType})` : 'No'}</dd>
            <dt className="text-muted-foreground">Indemnification</dt>
            <dd>{risk.indemnificationMutual ? 'Mutual' : 'Tenant-Only'}</dd>
          </dl>
        </section>
      )}

      {/* Package Preview */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium border-b pb-1">Package Documents</h3>
        <button
          onClick={handleAssemblePreview}
          disabled={loading}
          className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {loading ? 'Assembling...' : 'Preview Package Contents'}
        </button>
        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
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
