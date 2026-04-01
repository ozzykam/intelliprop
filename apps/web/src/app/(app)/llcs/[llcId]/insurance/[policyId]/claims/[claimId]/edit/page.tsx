'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import {
  InsuranceClaim,
  ClaimAdjuster,
  ClaimExpert,
  ClaimAttorney,
  INSURANCE_CAUSE_OF_LOSS,
  INSURANCE_CAUSE_OF_LOSS_LABELS,
  InsuranceCauseOfLoss,
} from '@shared/types';

interface EditClaimPageProps {
  params: Promise<{ llcId: string; policyId: string; claimId: string }>;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function EditClaimPage({ params }: EditClaimPageProps) {
  const { llcId, policyId, claimId } = use(params);
  const router = useRouter();
  const basePath = `/llcs/${llcId}/insurance/${policyId}/claims/${claimId}`;

  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [loading, setLoading] = useState(true);

  // Core fields
  const [claimNumber, setClaimNumber] = useState('');
  const [causeOfLoss, setCauseOfLoss] = useState<InsuranceCauseOfLoss | ''>('');
  const [dateOfLoss, setDateOfLoss] = useState('');
  const [dateFiled, setDateFiled] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('open');
  const [disputeType, setDisputeType] = useState('');

  // Financials
  const [reportedAmount, setReportedAmount] = useState('');
  const [offeredAmount, setOfferedAmount] = useState('');
  const [settledAmount, setSettledAmount] = useState('');
  const [rcv, setRcv] = useState('');
  const [acv, setAcv] = useState('');
  const [depreciation, setDepreciation] = useState('');
  const [notes, setNotes] = useState('');

  // People
  const [adjusters, setAdjusters] = useState<ClaimAdjuster[]>([]);
  const [experts, setExperts] = useState<ClaimExpert[]>([]);
  const [attorneys, setAttorneys] = useState<ClaimAttorney[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchClaim = useCallback(async () => {
    const res = await fetch(`/api/llcs/${llcId}/insurance/claims/${claimId}`);
    const data = await res.json();
    if (data.ok) {
      const c: InsuranceClaim = data.data;
      setClaim(c);
      setClaimNumber(c.claimNumber ?? '');
      setCauseOfLoss(c.causeOfLoss ?? '');
      setDateOfLoss(c.dateOfLoss);
      setDateFiled(c.dateFiled ?? '');
      setDescription(c.description);
      setStatus(c.status);
      setDisputeType(c.disputeType ?? '');
      setReportedAmount(c.reportedAmount !== undefined ? (c.reportedAmount / 100).toString() : '');
      setOfferedAmount(c.offeredAmount !== undefined ? (c.offeredAmount / 100).toString() : '');
      setSettledAmount(c.settledAmount !== undefined ? (c.settledAmount / 100).toString() : '');
      setRcv(c.replacementCostValue !== undefined ? (c.replacementCostValue / 100).toString() : '');
      setAcv(c.actualCashValue !== undefined ? (c.actualCashValue / 100).toString() : '');
      setDepreciation(c.depreciation !== undefined ? (c.depreciation / 100).toString() : '');
      setNotes(c.notes ?? '');
      setAdjusters(c.adjusters ?? []);
      setExperts(c.experts ?? []);
      setAttorneys(c.attorneys ?? []);
    }
    setLoading(false);
  }, [llcId, claimId]);

  useEffect(() => { fetchClaim(); }, [fetchClaim]);

  function addAdjuster() {
    setAdjusters(prev => [...prev, { id: generateId(), type: 'staff', represents: 'insurer', name: '' }]);
  }
  function removeAdjuster(id: string) {
    setAdjusters(prev => prev.filter(a => a.id !== id));
  }
  function updateAdjuster(id: string, field: keyof ClaimAdjuster, value: string) {
    setAdjusters(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  function addExpert() {
    setExperts(prev => [...prev, { id: generateId(), specialty: 'general_contractor', retainedBy: 'insured', name: '' }]);
  }
  function removeExpert(id: string) {
    setExperts(prev => prev.filter(e => e.id !== id));
  }
  function updateExpert(id: string, field: keyof ClaimExpert, value: string) {
    setExperts(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function addAttorney() {
    setAttorneys(prev => [...prev, { id: generateId(), represents: 'insured', name: '' }]);
  }
  function removeAttorney(id: string) {
    setAttorneys(prev => prev.filter(a => a.id !== id));
  }
  function updateAttorney(id: string, field: keyof ClaimAttorney, value: string) {
    setAttorneys(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        claimNumber: claimNumber || null,
        causeOfLoss: causeOfLoss || null,
        dateOfLoss,
        dateFiled: dateFiled || null,
        description,
        status,
        disputeType: disputeType || null,
        adjusters,
        experts,
        attorneys,
        notes: notes || null,
      };

      if (reportedAmount) body.reportedAmount = Math.round(parseFloat(reportedAmount) * 100);
      if (offeredAmount) body.offeredAmount = Math.round(parseFloat(offeredAmount) * 100);
      if (settledAmount) body.settledAmount = Math.round(parseFloat(settledAmount) * 100);
      if (rcv) body.replacementCostValue = Math.round(parseFloat(rcv) * 100);
      if (acv) body.actualCashValue = Math.round(parseFloat(acv) * 100);
      if (depreciation) body.depreciation = Math.round(parseFloat(depreciation) * 100);

      const res = await fetch(`/api/llcs/${llcId}/insurance/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        router.push(basePath);
      } else {
        setError(data.error?.message ?? 'Failed to update claim');
      }
    } catch {
      setError('Failed to update claim');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">← Claim</Link>
        <h1 className="text-2xl font-semibold mt-2">Edit Claim</h1>
        {claim && <p className="text-sm text-muted-foreground mt-0.5">{claim.carrier} · #{claim.policyNumber}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Claim Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Claim Number</label>
              <input type="text" value={claimNumber} onChange={e => setClaimNumber(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="settled">Settled</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cause of Loss</label>
              <select value={causeOfLoss} onChange={e => setCauseOfLoss(e.target.value as InsuranceCauseOfLoss | '')}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">— Select —</option>
                {Object.values(INSURANCE_CAUSE_OF_LOSS).map(c => (
                  <option key={c} value={c}>{INSURANCE_CAUSE_OF_LOSS_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dispute Type</label>
              <select value={disputeType} onChange={e => setDisputeType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">— None —</option>
                <option value="coverage">Coverage Dispute</option>
                <option value="payment">Payment Dispute</option>
                <option value="appraisal">Appraisal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Loss <span className="text-destructive">*</span></label>
              <input type="date" value={dateOfLoss} onChange={e => setDateOfLoss(e.target.value)} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Filed</label>
              <input type="date" value={dateFiled} onChange={e => setDateFiled(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description <span className="text-destructive">*</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>

        {/* Financials */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-sm">Financials</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Reported (Claimed)', val: reportedAmount, set: setReportedAmount },
              { label: 'Insurer Offer', val: offeredAmount, set: setOfferedAmount },
              { label: 'Settled Amount', val: settledAmount, set: setSettledAmount },
              { label: 'RCV (Replacement Cost)', val: rcv, set: setRcv },
              { label: 'ACV (Actual Cash Value)', val: acv, set: setAcv },
              { label: 'Depreciation', val: depreciation, set: setDepreciation },
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
          </div>
        </div>

        {/* Adjusters */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Adjusters</h2>
            <button type="button" onClick={addAdjuster} className="text-sm text-primary hover:underline">+ Add</button>
          </div>
          {adjusters.map(adj => (
            <div key={adj.id} className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Name *</label>
                  <input value={adj.name} onChange={e => updateAdjuster(adj.id, 'name', e.target.value)} required
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Firm</label>
                  <input value={adj.firm ?? ''} onChange={e => updateAdjuster(adj.id, 'firm', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Type</label>
                  <select value={adj.type} onChange={e => updateAdjuster(adj.id, 'type', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none">
                    <option value="staff">Staff</option>
                    <option value="independent">Independent</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Represents</label>
                  <select value={adj.represents} onChange={e => updateAdjuster(adj.id, 'represents', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none">
                    <option value="insurer">Insurer</option>
                    <option value="insured">Insured</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Phone</label>
                  <input value={adj.phone ?? ''} onChange={e => updateAdjuster(adj.id, 'phone', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={adj.email ?? ''} onChange={e => updateAdjuster(adj.id, 'email', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
              </div>
              <button type="button" onClick={() => removeAdjuster(adj.id)} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
          ))}
        </div>

        {/* Experts */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Experts & Consultants</h2>
            <button type="button" onClick={addExpert} className="text-sm text-primary hover:underline">+ Add</button>
          </div>
          {experts.map(exp => (
            <div key={exp.id} className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Name *</label>
                  <input value={exp.name} onChange={e => updateExpert(exp.id, 'name', e.target.value)} required
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Specialty</label>
                  <select value={exp.specialty} onChange={e => updateExpert(exp.id, 'specialty', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none">
                    <option value="general_contractor">General Contractor</option>
                    <option value="engineer">Engineer</option>
                    <option value="fire_investigator">Fire Investigator</option>
                    <option value="building_consultant">Building Consultant</option>
                    <option value="estimator">Estimator</option>
                    <option value="cost_consultant">Cost Consultant</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Retained By</label>
                  <select value={exp.retainedBy} onChange={e => updateExpert(exp.id, 'retainedBy', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none">
                    <option value="insured">Insured</option>
                    <option value="insurer">Insurer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Firm</label>
                  <input value={exp.firm ?? ''} onChange={e => updateExpert(exp.id, 'firm', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Phone</label>
                  <input value={exp.phone ?? ''} onChange={e => updateExpert(exp.id, 'phone', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={exp.email ?? ''} onChange={e => updateExpert(exp.id, 'email', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
              </div>
              <button type="button" onClick={() => removeExpert(exp.id)} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
          ))}
        </div>

        {/* Attorneys */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Attorneys</h2>
            <button type="button" onClick={addAttorney} className="text-sm text-primary hover:underline">+ Add</button>
          </div>
          {attorneys.map(att => (
            <div key={att.id} className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Name *</label>
                  <input value={att.name} onChange={e => updateAttorney(att.id, 'name', e.target.value)} required
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Firm</label>
                  <input value={att.firmName ?? ''} onChange={e => updateAttorney(att.id, 'firmName', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium">Represents</label>
                  <select value={att.represents} onChange={e => updateAttorney(att.id, 'represents', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none">
                    <option value="insured">Insured</option>
                    <option value="insurer">Insurer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Phone</label>
                  <input value={att.phone ?? ''} onChange={e => updateAttorney(att.id, 'phone', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={att.email ?? ''} onChange={e => updateAttorney(att.id, 'email', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none" />
                </div>
              </div>
              <button type="button" onClick={() => removeAttorney(att.id)} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
          ))}
        </div>

        {/* Notes */}
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
