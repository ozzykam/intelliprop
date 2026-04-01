'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import {
  InsurancePolicy,
  INSURANCE_POLICY_TYPE_LABELS,
  InsurancePolicyType,
} from '@shared/types';

interface EditPolicyPageProps {
  params: Promise<{ llcId: string; policyId: string }>;
}

const PROPERTY_POLICY_TYPES: InsurancePolicyType[] = [
  'property', 'general_liability', 'flood', 'umbrella', 'earthquake', 'builders_risk', 'other',
];
const TENANT_POLICY_TYPES: InsurancePolicyType[] = [
  'renters', 'commercial_liability', 'other',
];

export default function EditPolicyPage({ params }: EditPolicyPageProps) {
  const { llcId, policyId } = use(params);
  const router = useRouter();
  const basePath = `/llcs/${llcId}/insurance/${policyId}`;

  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const [policyType, setPolicyType] = useState<InsurancePolicyType>('property');
  const [status, setStatus] = useState('active');
  const [carrier, setCarrier] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [entityName, setEntityName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [deductible, setDeductible] = useState('');
  const [premium, setPremium] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPolicy = useCallback(async () => {
    const res = await fetch(`/api/llcs/${llcId}/insurance/policies/${policyId}`);
    const data = await res.json();
    if (data.ok) {
      const p: InsurancePolicy = data.data;
      setPolicy(p);
      setPolicyType(p.policyType);
      setStatus(p.status);
      setCarrier(p.carrier);
      setPolicyNumber(p.policyNumber);
      setEntityName(p.entityName);
      setPropertyName(p.propertyName ?? '');
      setUnitLabel(p.unitLabel ?? '');
      setEffectiveDate(p.effectiveDate);
      setExpirationDate(p.expirationDate);
      setCoverageAmount(p.coverageAmount !== undefined ? (p.coverageAmount / 100).toString() : '');
      setDeductible(p.deductible !== undefined ? (p.deductible / 100).toString() : '');
      setPremium(p.premium !== undefined ? (p.premium / 100).toString() : '');
      setPremiumFrequency(p.premiumFrequency ?? '');
      setAgentName(p.agentName ?? '');
      setAgentPhone(p.agentPhone ?? '');
      setAgentEmail(p.agentEmail ?? '');
      setNotes(p.notes ?? '');
    }
    setLoading(false);
  }, [llcId, policyId]);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  const availablePolicyTypes = policy?.entityType === 'property' ? PROPERTY_POLICY_TYPES : TENANT_POLICY_TYPES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        entityName,
        policyType,
        status,
        carrier,
        policyNumber,
        effectiveDate,
        expirationDate,
      };

      if (policy?.entityType === 'tenant') {
        body.propertyName = propertyName || null;
        body.unitLabel = unitLabel || null;
      }

      if (coverageAmount) body.coverageAmount = Math.round(parseFloat(coverageAmount) * 100);
      if (deductible) body.deductible = Math.round(parseFloat(deductible) * 100);
      if (premium) body.premium = Math.round(parseFloat(premium) * 100);
      if (premiumFrequency) body.premiumFrequency = premiumFrequency;
      body.agentName = agentName || null;
      body.agentPhone = agentPhone || null;
      body.agentEmail = agentEmail || null;
      body.notes = notes || null;

      const res = await fetch(`/api/llcs/${llcId}/insurance/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        router.push(basePath);
      } else {
        setError(data.error?.message ?? 'Failed to update policy');
      }
    } catch {
      setError('Failed to update policy');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">
          ← Policy
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Edit Policy</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Coverage Target</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              {policy?.entityType === 'property' ? 'Property Name / Address' : 'Tenant Name'} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={entityName}
              onChange={e => setEntityName(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {policy?.entityType === 'tenant' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Property Name</label>
                <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input type="text" value={unitLabel} onChange={e => setUnitLabel(e.target.value)} placeholder="e.g. 2B"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Policy Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Policy Type <span className="text-destructive">*</span></label>
              <select value={policyType} onChange={e => setPolicyType(e.target.value as InsurancePolicyType)} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {availablePolicyTypes.map(t => (
                  <option key={t} value={t}>{INSURANCE_POLICY_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carrier <span className="text-destructive">*</span></label>
              <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Number <span className="text-destructive">*</span></label>
              <input type="text" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Effective Date <span className="text-destructive">*</span></label>
              <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date <span className="text-destructive">*</span></label>
              <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Coverage & Premium</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Coverage Amount', val: coverageAmount, set: setCoverageAmount },
              { label: 'Deductible', val: deductible, set: setDeductible },
              { label: 'Premium', val: premium, set: setPremium },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={val} onChange={e => set(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select value={premiumFrequency} onChange={e => setPremiumFrequency(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">—</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Insurance Agent</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Agent Name</label>
              <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input type="tel" value={agentPhone} onChange={e => setAgentPhone(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={basePath} className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
