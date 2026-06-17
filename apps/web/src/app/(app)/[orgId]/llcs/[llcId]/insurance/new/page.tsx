'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import {
  INSURANCE_POLICY_TYPE_LABELS,
  InsurancePolicyType,
  InsurancePolicyEntityType,
} from '@shared/types';

interface NewPolicyPageProps {
  params: Promise<{ orgId: string; llcId: string }>;
}

const PROPERTY_POLICY_TYPES: InsurancePolicyType[] = [
  'property', 'general_liability', 'flood', 'umbrella', 'earthquake', 'builders_risk', 'other',
];
const TENANT_POLICY_TYPES: InsurancePolicyType[] = [
  'renters', 'commercial_liability', 'other',
];

export default function NewInsurancePolicyPage({ params }: NewPolicyPageProps) {
  const { orgId, llcId } = use(params);
  const router = useRouter();
  const basePath = `/${orgId}/llcs/${llcId}/insurance`;

  const [entityType, setEntityType] = useState<InsurancePolicyEntityType>('property');
  const [entityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [propertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [unitId] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [policyType, setPolicyType] = useState<InsurancePolicyType>('property');
  const [status, setStatus] = useState('active');
  const [carrier, setCarrier] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
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

  const availablePolicyTypes = entityType === 'property' ? PROPERTY_POLICY_TYPES : TENANT_POLICY_TYPES;

  function handleEntityTypeChange(val: InsurancePolicyEntityType) {
    setEntityType(val);
    setPolicyType(val === 'property' ? 'property' : 'renters');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        entityType,
        entityId: entityId || entityName,
        entityName,
        policyType,
        status,
        carrier,
        policyNumber,
        effectiveDate,
        expirationDate,
      };

      if (entityType === 'tenant') {
        if (propertyId) body.propertyId = propertyId;
        if (propertyName) body.propertyName = propertyName;
        if (unitId) body.unitId = unitId;
        if (unitLabel) body.unitLabel = unitLabel;
      }

      if (coverageAmount) body.coverageAmount = Math.round(parseFloat(coverageAmount) * 100);
      if (deductible) body.deductible = Math.round(parseFloat(deductible) * 100);
      if (premium) body.premium = Math.round(parseFloat(premium) * 100);
      if (premiumFrequency) body.premiumFrequency = premiumFrequency;
      if (agentName) body.agentName = agentName;
      if (agentPhone) body.agentPhone = agentPhone;
      if (agentEmail) body.agentEmail = agentEmail;
      if (notes) body.notes = notes;

      const res = await fetch(`/api/llcs/${llcId}/insurance/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        router.push(`${basePath}/${data.data.id}`);
      } else {
        setError(data.error?.message ?? 'Failed to create policy');
      }
    } catch {
      setError('Failed to create policy');
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
        <h1 className="text-2xl font-semibold mt-2">Add Insurance Policy</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entity Type */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Coverage Target</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Policy covers</label>
            <div className="flex gap-4">
              {(['property', 'tenant'] as InsurancePolicyEntityType[]).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="entityType"
                    value={t}
                    checked={entityType === t}
                    onChange={() => handleEntityTypeChange(t)}
                    className="accent-primary"
                  />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {entityType === 'property' ? 'Property Name / Address' : 'Tenant Name'} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={entityName}
              onChange={e => setEntityName(e.target.value)}
              required
              placeholder={entityType === 'property' ? 'e.g. 123 Main St' : 'e.g. John Smith'}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {entityType === 'tenant' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name</label>
                  <input
                    type="text"
                    value={propertyName}
                    onChange={e => setPropertyName(e.target.value)}
                    placeholder="Property address"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={unitLabel}
                    onChange={e => setUnitLabel(e.target.value)}
                    placeholder="e.g. 2B"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Policy Details */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Policy Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Policy Type <span className="text-destructive">*</span></label>
              <select
                value={policyType}
                onChange={e => setPolicyType(e.target.value as InsurancePolicyType)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {availablePolicyTypes.map(t => (
                  <option key={t} value={t}>{INSURANCE_POLICY_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Carrier <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                required
                placeholder="Insurance company"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Number <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={policyNumber}
                onChange={e => setPolicyNumber(e.target.value)}
                required
                placeholder="e.g. POL-123456"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Effective Date <span className="text-destructive">*</span></label>
              <input
                type="date"
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date <span className="text-destructive">*</span></label>
              <input
                type="date"
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Coverage & Premium</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Coverage Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={coverageAmount}
                  onChange={e => setCoverageAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deductible</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deductible}
                  onChange={e => setDeductible(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Premium</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={premium}
                  onChange={e => setPremium(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={premiumFrequency}
                onChange={e => setPremiumFrequency(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Agent */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Insurance Agent</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Agent Name</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={agentPhone}
                onChange={e => setAgentPhone(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={agentEmail}
                onChange={e => setAgentEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
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
            {saving ? 'Saving...' : 'Save Policy'}
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
