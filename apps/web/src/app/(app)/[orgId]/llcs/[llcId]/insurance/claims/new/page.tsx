'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import {
  INSURANCE_CAUSE_OF_LOSS,
  INSURANCE_CAUSE_OF_LOSS_LABELS,
  InsuranceCauseOfLoss,
} from '@shared/types';

interface NewStandaloneClaimPageProps {
  params: Promise<{ orgId: string; llcId: string }>;
}

interface Property {
  id: string;
  name?: string | null;
  address: { street1: string; city: string; state: string; zipCode: string };
}

function propertyLabel(p: Property) {
  return p.name ? `${p.name} — ${p.address.street1}, ${p.address.city}` : `${p.address.street1}, ${p.address.city}, ${p.address.state}`;
}

export default function NewStandaloneClaimPage({ params }: NewStandaloneClaimPageProps) {
  const { orgId, llcId } = use(params);
  const router = useRouter();
  const basePath = `/${orgId}/llcs/${llcId}/insurance`;

  // What's being claimed
  const [claimTarget, setClaimTarget] = useState<'property' | 'person'>('property');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [personName, setPersonName] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  // Policy info
  const [carrier, setCarrier] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insuredName, setInsuredName] = useState('');
  const [insuredPhone, setInsuredPhone] = useState('');
  const [insuredEmail, setInsuredEmail] = useState('');

  // Claim details
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

  useEffect(() => {
    fetch(`/api/llcs/${llcId}/properties`)
      .then(r => r.json())
      .then(data => { if (data.ok) setProperties(data.data); })
      .catch(() => {})
      .finally(() => setPropertiesLoading(false));
  }, [llcId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const selectedProperty = claimTarget === 'property'
      ? properties.find(p => p.id === selectedPropertyId)
      : null;

    if (claimTarget === 'property' && !selectedPropertyId) {
      setError('Please select a property.');
      return;
    }
    if (claimTarget === 'person' && !personName.trim()) {
      setError('Please enter a name.');
      return;
    }

    setSaving(true);
    try {
      const entityName = claimTarget === 'property' && selectedProperty
        ? propertyLabel(selectedProperty)
        : personName.trim();

      const body: Record<string, unknown> = {
        entityName,
        entityType: claimTarget === 'property' ? 'property' : 'tenant',
        dateOfLoss,
        description,
        status,
      };

      if (claimTarget === 'property' && selectedPropertyId) body.entityId = selectedPropertyId;
      if (carrier) body.carrier = carrier;
      if (policyNumber) body.policyNumber = policyNumber;
      if (insuredName) body.insuredName = insuredName;
      if (insuredPhone) body.insuredPhone = insuredPhone;
      if (insuredEmail) body.insuredEmail = insuredEmail;
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
        router.push(`${basePath}/claims/${data.data.id}`);
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
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">
          ← Insurance
        </Link>
        <h1 className="text-2xl font-semibold mt-2">File a Claim</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          You can file a claim without a policy on file. Add policy details later if needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* What's being claimed */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">What&apos;s Being Claimed</h2>

          {/* Toggle */}
          <div className="flex gap-2">
            {(['property', 'person'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setClaimTarget(opt);
                  setSelectedPropertyId('');
                  setPersonName('');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  claimTarget === opt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-secondary/50'
                }`}
              >
                {opt === 'property' ? 'Property' : 'Person / Tenant'}
              </button>
            ))}
          </div>

          {/* Property dropdown */}
          {claimTarget === 'property' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Property <span className="text-destructive">*</span>
              </label>
              {propertiesLoading ? (
                <p className="text-sm text-muted-foreground">Loading properties...</p>
              ) : properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No properties found for this LLC.</p>
              ) : (
                <select
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Select a property —</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{propertyLabel(p)}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Person name input */}
          {claimTarget === 'person' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                placeholder="Name of Tenant(s) or Individual(s) harmed"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        {/* Policy info (optional) */}
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h2 className="font-medium text-sm">Policy Info</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Optional — fill in if known. You can link a policy later.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Insurance Carrier</label>
              <input
                type="text"
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                placeholder="e.g. State Farm"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Number</label>
              <input
                type="text"
                value={policyNumber}
                onChange={e => setPolicyNumber(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Insured</label>
              <input
                type="text"
                value={insuredName}
                onChange={e => setInsuredName(e.target.value)}
                placeholder="Policyholder name"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={insuredPhone}
                onChange={e => setInsuredPhone(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={insuredEmail}
                onChange={e => setInsuredEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

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
              <label className="block text-sm font-medium mb-1">
                Date of Loss <span className="text-destructive">*</span>
              </label>
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
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-destructive">*</span>
            </label>
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
            href={basePath}
            className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
