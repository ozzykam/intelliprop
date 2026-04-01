'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  AppraisalProcess,
  AppraisalEstimate,
  Appraiser,
  Umpire,
  APPRAISAL_PROCESS_STATUS_LABELS,
  APPRAISAL_PROCESS_STATUS_COLORS,
} from '@shared/types';

interface AppraisalPageProps {
  params: Promise<{ llcId: string; policyId: string; claimId: string }>;
}

function formatCents(cents?: number) {
  if (cents === undefined || cents === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AppraisalPage({ params }: AppraisalPageProps) {
  const { llcId, policyId, claimId } = use(params);
  const basePath = `/llcs/${llcId}/insurance/${policyId}/claims/${claimId}`;

  const [process, setProcess] = useState<AppraisalProcess | null>(null);
  const [estimates, setEstimates] = useState<AppraisalEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Panel edit state
  const [showPanelEdit, setShowPanelEdit] = useState(false);
  const [insuredAppraiserName, setInsuredAppraiserName] = useState('');
  const [insuredAppraiserFirm, setInsuredAppraiserFirm] = useState('');
  const [insuredAppraiserPhone, setInsuredAppraiserPhone] = useState('');
  const [insuredAppraiserEmail, setInsuredAppraiserEmail] = useState('');
  const [insuredAppraiserLicense, setInsuredAppraiserLicense] = useState('');
  const [insuredAppraiserDate, setInsuredAppraiserDate] = useState('');
  const [insurerAppraiserName, setInsurerAppraiserName] = useState('');
  const [insurerAppraiserFirm, setInsurerAppraiserFirm] = useState('');
  const [insurerAppraiserPhone, setInsurerAppraiserPhone] = useState('');
  const [insurerAppraiserEmail, setInsurerAppraiserEmail] = useState('');
  const [insurerAppraiserLicense, setInsurerAppraiserLicense] = useState('');
  const [insurerAppraiserDate, setInsurerAppraiserDate] = useState('');
  const [umpireName, setUmpireName] = useState('');
  const [umpireFirm, setUmpireFirm] = useState('');
  const [umpirePhone, setUmpirePhone] = useState('');
  const [umpireEmail, setUmpireEmail] = useState('');
  const [umpireLicense, setUmpireLicense] = useState('');
  const [umpireAppointedBy, setUmpireAppointedBy] = useState<'agreement' | 'court'>('agreement');
  const [umpireAppointmentDate, setUmpireAppointmentDate] = useState('');
  const [umpireFeeSplit, setUmpireFeeSplit] = useState('50/50');

  // Status update
  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Award state
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [awardDate, setAwardDate] = useState('');
  const [awardSignedBy, setAwardSignedBy] = useState<AppraisalProcess['award'] extends undefined ? never : NonNullable<AppraisalProcess['award']>['signedBy']>('both_appraisers');
  const [awardAmount, setAwardAmount] = useState('');
  const [awardRCV, setAwardRCV] = useState('');
  const [awardACV, setAwardACV] = useState('');
  const [awardDepreciation, setAwardDepreciation] = useState('');
  const [awardConditions, setAwardConditions] = useState('');

  // New estimate form
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [estimateSide, setEstimateSide] = useState<'insured' | 'insurer'>('insured');
  const [estimateDate, setEstimateDate] = useState('');
  const [estimateRCV, setEstimateRCV] = useState('');
  const [estimateACV, setEstimateACV] = useState('');
  const [estimateDepreciation, setEstimateDepreciation] = useState('');
  const [estimateNotes, setEstimateNotes] = useState('');
  const [creatingEstimate, setCreatingEstimate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const appraisalRes = await fetch(`/api/llcs/${llcId}/insurance/claims/${claimId}/appraisal`);
      const appraisalData = await appraisalRes.json();

      if (!appraisalData.ok || !appraisalData.data) {
        setError('No appraisal process found for this claim.');
        setLoading(false);
        return;
      }

      const proc: AppraisalProcess = appraisalData.data;
      setProcess(proc);
      setNewStatus(proc.status);

      // Pre-fill panel edit forms
      if (proc.panel?.insuredAppraiser) {
        const a = proc.panel.insuredAppraiser;
        setInsuredAppraiserName(a.name ?? '');
        setInsuredAppraiserFirm(a.firm ?? '');
        setInsuredAppraiserPhone(a.phone ?? '');
        setInsuredAppraiserEmail(a.email ?? '');
        setInsuredAppraiserLicense(a.licenseNumber ?? '');
        setInsuredAppraiserDate(a.appointedDate ?? '');
      }
      if (proc.panel?.insurerAppraiser) {
        const a = proc.panel.insurerAppraiser;
        setInsurerAppraiserName(a.name ?? '');
        setInsurerAppraiserFirm(a.firm ?? '');
        setInsurerAppraiserPhone(a.phone ?? '');
        setInsurerAppraiserEmail(a.email ?? '');
        setInsurerAppraiserLicense(a.licenseNumber ?? '');
        setInsurerAppraiserDate(a.appointedDate ?? '');
      }
      if (proc.panel?.umpire) {
        const u = proc.panel.umpire;
        setUmpireName(u.name ?? '');
        setUmpireFirm(u.firm ?? '');
        setUmpirePhone(u.phone ?? '');
        setUmpireEmail(u.email ?? '');
        setUmpireLicense(u.licenseNumber ?? '');
        setUmpireAppointedBy(u.appointedBy ?? 'agreement');
        setUmpireAppointmentDate(u.appointmentDate ?? '');
        setUmpireFeeSplit(u.feeSplit ?? '50/50');
      }

      // Fetch estimates
      const estimatesRes = await fetch(
        `/api/llcs/${llcId}/insurance/claims/${claimId}/appraisal/${proc.id}/estimates`
      );
      const estimatesData = await estimatesRes.json();
      if (estimatesData.ok) setEstimates(estimatesData.data);
    } catch {
      setError('Failed to load appraisal process');
    } finally {
      setLoading(false);
    }
  }, [llcId, claimId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function savePanel(e: React.FormEvent) {
    e.preventDefault();
    if (!process) return;
    setSaving(true);

    const panel: Partial<AppraisalProcess['panel']> = { status: process.panel.status };

    if (insuredAppraiserName) {
      panel.insuredAppraiser = {
        id: process.panel.insuredAppraiser?.id ?? generateId(),
        side: 'insured',
        name: insuredAppraiserName,
        firm: insuredAppraiserFirm || undefined,
        phone: insuredAppraiserPhone || undefined,
        email: insuredAppraiserEmail || undefined,
        licenseNumber: insuredAppraiserLicense || undefined,
        appointedDate: insuredAppraiserDate || undefined,
      } as Appraiser;
    }

    if (insurerAppraiserName) {
      panel.insurerAppraiser = {
        id: process.panel.insurerAppraiser?.id ?? generateId(),
        side: 'insurer',
        name: insurerAppraiserName,
        firm: insurerAppraiserFirm || undefined,
        phone: insurerAppraiserPhone || undefined,
        email: insurerAppraiserEmail || undefined,
        licenseNumber: insurerAppraiserLicense || undefined,
        appointedDate: insurerAppraiserDate || undefined,
      } as Appraiser;
    }

    if (umpireName) {
      panel.umpire = {
        id: process.panel.umpire?.id ?? generateId(),
        name: umpireName,
        firm: umpireFirm || undefined,
        phone: umpirePhone || undefined,
        email: umpireEmail || undefined,
        licenseNumber: umpireLicense || undefined,
        appointedBy: umpireAppointedBy,
        appointmentDate: umpireAppointmentDate || undefined,
        feeSplit: umpireFeeSplit || undefined,
      } as Umpire;
    }

    // Auto-update panel status
    const hasAll = panel.insuredAppraiser && panel.insurerAppraiser && panel.umpire;
    const hasBothAppraisers = panel.insuredAppraiser && panel.insurerAppraiser;
    if (hasAll) panel.status = 'active';
    else if (hasBothAppraisers) panel.status = 'forming';

    try {
      const res = await fetch(`/api/llcs/${llcId}/insurance/claims/${claimId}/appraisal/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel }),
      });
      const data = await res.json();
      if (data.ok) {
        setProcess(data.data);
        setShowPanelEdit(false);
      } else {
        alert(data.error?.message ?? 'Failed to save panel');
      }
    } catch {
      alert('Failed to save panel');
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus() {
    if (!process || newStatus === process.status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/insurance/claims/${claimId}/appraisal/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setProcess(data.data);
        setShowStatusEdit(false);
      } else {
        alert(data.error?.message ?? 'Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function saveAward(e: React.FormEvent) {
    e.preventDefault();
    if (!process) return;
    setSaving(true);
    try {
      const award = {
        awardDate,
        signedBy: awardSignedBy,
        awardAmount: Math.round(parseFloat(awardAmount) * 100),
        replacementCostValue: awardRCV ? Math.round(parseFloat(awardRCV) * 100) : undefined,
        actualCashValue: awardACV ? Math.round(parseFloat(awardACV) * 100) : undefined,
        depreciation: awardDepreciation ? Math.round(parseFloat(awardDepreciation) * 100) : undefined,
        conditions: awardConditions || undefined,
        status: 'signed' as const,
      };

      const res = await fetch(`/api/llcs/${llcId}/insurance/claims/${claimId}/appraisal/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ award, status: 'awarded' }),
      });
      const data = await res.json();
      if (data.ok) {
        setProcess(data.data);
        setShowAwardForm(false);
      } else {
        alert(data.error?.message ?? 'Failed to save award');
      }
    } catch {
      alert('Failed to save award');
    } finally {
      setSaving(false);
    }
  }

  async function createEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!process) return;
    setCreatingEstimate(true);
    try {
      const body: Record<string, unknown> = {
        preparedBySide: estimateSide,
        status: 'draft',
        scopeItems: [],
      };
      if (estimateDate) body.date = estimateDate;
      if (estimateRCV) body.replacementCostValue = Math.round(parseFloat(estimateRCV) * 100);
      if (estimateACV) body.actualCashValue = Math.round(parseFloat(estimateACV) * 100);
      if (estimateDepreciation) body.depreciation = Math.round(parseFloat(estimateDepreciation) * 100);
      if (estimateNotes) body.notes = estimateNotes;

      const res = await fetch(
        `/api/llcs/${llcId}/insurance/claims/${claimId}/appraisal/${process.id}/estimates`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setEstimates(prev => [...prev, data.data]);
        setShowEstimateForm(false);
        setEstimateDate('');
        setEstimateRCV('');
        setEstimateACV('');
        setEstimateDepreciation('');
        setEstimateNotes('');
      } else {
        alert(data.error?.message ?? 'Failed to create estimate');
      }
    } catch {
      alert('Failed to create estimate');
    } finally {
      setCreatingEstimate(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  if (error || !process) {
    return (
      <div className="p-6">
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">← Claim</Link>
        <p className="mt-4 text-sm text-destructive">{error || 'Appraisal process not found'}</p>
        <Link href={basePath} className="mt-3 inline-block text-sm text-primary hover:underline">
          Return to claim
        </Link>
      </div>
    );
  }

  const panel = process.panel;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">
          ← Claim
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Appraisal Process</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Demanded by: <span className="capitalize">{process.demandedBy}</span> · {process.demandDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPRAISAL_PROCESS_STATUS_COLORS[process.status]}`}>
              {APPRAISAL_PROCESS_STATUS_LABELS[process.status]}
            </span>
            <button
              onClick={() => setShowStatusEdit(v => !v)}
              className="text-xs text-muted-foreground border rounded-md px-2 py-1 hover:bg-secondary/50"
            >
              Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Important note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Appraisal determines <strong>Amount of Loss only</strong> — not coverage, payment conditions, or policy interpretation.
          Any two of the three panel members (appraisers or umpire) may sign a binding award.
        </p>
      </div>

      {/* Status Edit */}
      {showStatusEdit && (
        <div className="border rounded-lg p-4 flex items-center gap-3">
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none"
          >
            {Object.entries(APPRAISAL_PROCESS_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            onClick={saveStatus}
            disabled={saving}
            className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
          <button onClick={() => setShowStatusEdit(false)} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      )}

      {/* Appraisal Panel */}
      <div className="border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Appraisal Panel</h2>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              Status: {panel.status}{panel.panelFormedDate ? ` · Formed ${panel.panelFormedDate}` : ''}
            </p>
          </div>
          <button
            onClick={() => setShowPanelEdit(v => !v)}
            className="text-sm text-primary hover:underline"
          >
            {showPanelEdit ? 'Cancel' : 'Edit Panel'}
          </button>
        </div>

        {!showPanelEdit ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PanelMemberCard
              title="Insured's Appraiser"
              subtitle="Chosen by policyholder"
              member={panel.insuredAppraiser}
            />
            <PanelMemberCard
              title="Insurer's Appraiser"
              subtitle="Chosen by carrier"
              member={panel.insurerAppraiser}
            />
            <PanelMemberCard
              title="Umpire"
              subtitle={panel.umpire ? `Appointed by ${panel.umpire.appointedBy}` : 'Neutral third party'}
              member={panel.umpire}
              isUmpire
            />
          </div>
        ) : (
          <form onSubmit={savePanel} className="space-y-6">
            <AppraiserForm
              title="Insured's Appraiser"
              name={insuredAppraiserName} onName={setInsuredAppraiserName}
              firm={insuredAppraiserFirm} onFirm={setInsuredAppraiserFirm}
              phone={insuredAppraiserPhone} onPhone={setInsuredAppraiserPhone}
              email={insuredAppraiserEmail} onEmail={setInsuredAppraiserEmail}
              license={insuredAppraiserLicense} onLicense={setInsuredAppraiserLicense}
              date={insuredAppraiserDate} onDate={setInsuredAppraiserDate}
            />
            <AppraiserForm
              title="Insurer's Appraiser"
              name={insurerAppraiserName} onName={setInsurerAppraiserName}
              firm={insurerAppraiserFirm} onFirm={setInsurerAppraiserFirm}
              phone={insurerAppraiserPhone} onPhone={setInsurerAppraiserPhone}
              email={insurerAppraiserEmail} onEmail={setInsurerAppraiserEmail}
              license={insurerAppraiserLicense} onLicense={setInsurerAppraiserLicense}
              date={insurerAppraiserDate} onDate={setInsurerAppraiserDate}
            />
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm mb-3">Umpire</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Name" value={umpireName} onChange={setUmpireName} />
                <FormField label="Firm" value={umpireFirm} onChange={setUmpireFirm} />
                <FormField label="Phone" value={umpirePhone} onChange={setUmpirePhone} />
                <FormField label="Email" value={umpireEmail} onChange={setUmpireEmail} type="email" />
                <FormField label="License #" value={umpireLicense} onChange={setUmpireLicense} />
                <div>
                  <label className="block text-sm font-medium mb-1">Appointed By</label>
                  <select
                    value={umpireAppointedBy}
                    onChange={e => setUmpireAppointedBy(e.target.value as 'agreement' | 'court')}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="agreement">Agreement of Appraisers</option>
                    <option value="court">Court Order</option>
                  </select>
                </div>
                <FormField label="Appointment Date" value={umpireAppointmentDate} onChange={setUmpireAppointmentDate} type="date" />
                <FormField label="Fee Split" value={umpireFeeSplit} onChange={setUmpireFeeSplit} placeholder="e.g. 50/50" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Panel'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Estimates */}
      <div className="border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Damage Estimates</h2>
          <button
            onClick={() => setShowEstimateForm(v => !v)}
            className="text-sm text-primary hover:underline"
          >
            {showEstimateForm ? 'Cancel' : '+ Add Estimate'}
          </button>
        </div>

        {showEstimateForm && (
          <form onSubmit={createEstimate} className="border rounded-lg p-4 space-y-4 bg-secondary/20">
            <h3 className="font-medium text-sm">New Estimate</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Prepared By <span className="text-destructive">*</span></label>
                <select
                  value={estimateSide}
                  onChange={e => setEstimateSide(e.target.value as 'insured' | 'insurer')}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="insured">Insured&apos;s Appraiser</option>
                  <option value="insurer">Insurer&apos;s Appraiser</option>
                </select>
              </div>
              <FormField label="Date" value={estimateDate} onChange={setEstimateDate} type="date" />
              <div>
                <label className="block text-sm font-medium mb-1">RCV (Replacement Cost)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={estimateRCV} onChange={e => setEstimateRCV(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ACV (Actual Cash Value)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={estimateACV} onChange={e => setEstimateACV(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Depreciation</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={estimateDepreciation} onChange={e => setEstimateDepreciation(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={estimateNotes} onChange={e => setEstimateNotes(e.target.value)} rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={creatingEstimate}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
              {creatingEstimate ? 'Saving...' : 'Save Estimate'}
            </button>
          </form>
        )}

        {estimates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No estimates yet.</p>
        ) : (
          <div className="space-y-3">
            {estimates.map(est => (
              <div key={est.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm capitalize">
                      {est.preparedBySide === 'insured' ? "Insured's" : "Insurer's"} Estimate
                    </p>
                    {est.date && <p className="text-xs text-muted-foreground">{est.date}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                    {est.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">RCV</p>
                    <p className="font-medium">{formatCents(est.replacementCostValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ACV</p>
                    <p className="font-medium">{formatCents(est.actualCashValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Depreciation</p>
                    <p className="font-medium">{formatCents(est.depreciation)}</p>
                  </div>
                </div>
                {est.notes && <p className="text-sm text-muted-foreground mt-2">{est.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Award */}
      <div className="border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Appraisal Award</h2>
          {!process.award && (
            <button
              onClick={() => setShowAwardForm(v => !v)}
              className="text-sm text-primary hover:underline"
            >
              {showAwardForm ? 'Cancel' : 'Record Award'}
            </button>
          )}
        </div>

        {process.award ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 capitalize">
                {process.award.status}
              </span>
              <span className="text-sm text-muted-foreground">{process.award.awardDate}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Award Amount</p>
                <p className="text-lg font-semibold">{formatCents(process.award.awardAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RCV</p>
                <p className="font-medium">{formatCents(process.award.replacementCostValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ACV</p>
                <p className="font-medium">{formatCents(process.award.actualCashValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Depreciation</p>
                <p className="font-medium">{formatCents(process.award.depreciation)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              Signed by: {process.award.signedBy.replace(/_/g, ' ')}
            </p>
            {process.award.conditions && (
              <p className="text-sm text-muted-foreground">{process.award.conditions}</p>
            )}
          </div>
        ) : showAwardForm ? (
          <form onSubmit={saveAward} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Award Date *" value={awardDate} onChange={setAwardDate} type="date" required />
              <div>
                <label className="block text-sm font-medium mb-1">Signed By <span className="text-destructive">*</span></label>
                <select
                  value={awardSignedBy}
                  onChange={e => setAwardSignedBy(e.target.value as typeof awardSignedBy)}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="both_appraisers">Both Appraisers</option>
                  <option value="insured_appraiser_and_umpire">Insured&apos;s Appraiser + Umpire</option>
                  <option value="insurer_appraiser_and_umpire">Insurer&apos;s Appraiser + Umpire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Award Amount <span className="text-destructive">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={awardAmount} onChange={e => setAwardAmount(e.target.value)} required placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RCV</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={awardRCV} onChange={e => setAwardRCV(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ACV</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={awardACV} onChange={e => setAwardACV(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Depreciation</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={awardDepreciation} onChange={e => setAwardDepreciation(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conditions</label>
              <textarea value={awardConditions} onChange={e => setAwardConditions(e.target.value)} rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Record Award'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">No award recorded yet.</p>
        )}
      </div>

      {/* Notes */}
      {process.notes && (
        <div className="border rounded-lg p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{process.notes}</p>
        </div>
      )}
    </div>
  );
}

function PanelMemberCard({
  title,
  subtitle,
  member,
  isUmpire = false,
}: {
  title: string;
  subtitle: string;
  member?: Appraiser | Umpire | null;
  isUmpire?: boolean;
}) {
  return (
    <div className={`border rounded-lg p-4 ${member ? 'bg-card' : 'bg-secondary/20 border-dashed'}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
      {member ? (
        <>
          <p className="font-medium text-sm">{member.name}</p>
          {member.firm && <p className="text-sm text-muted-foreground">{member.firm}</p>}
          {member.phone && <p className="text-xs text-muted-foreground mt-1">{member.phone}</p>}
          {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
          {member.licenseNumber && (
            <p className="text-xs text-muted-foreground">Lic #{member.licenseNumber}</p>
          )}
          {isUmpire && (member as Umpire).feeSplit && (
            <p className="text-xs text-muted-foreground mt-1">Fee split: {(member as Umpire).feeSplit}</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not yet appointed</p>
      )}
    </div>
  );
}

function AppraiserForm({
  title,
  name, onName,
  firm, onFirm,
  phone, onPhone,
  email, onEmail,
  license, onLicense,
  date, onDate,
}: {
  title: string;
  name: string; onName: (v: string) => void;
  firm: string; onFirm: (v: string) => void;
  phone: string; onPhone: (v: string) => void;
  email: string; onEmail: (v: string) => void;
  license: string; onLicense: (v: string) => void;
  date: string; onDate: (v: string) => void;
}) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-medium text-sm mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" value={name} onChange={onName} />
        <FormField label="Firm" value={firm} onChange={onFirm} />
        <FormField label="Phone" value={phone} onChange={onPhone} />
        <FormField label="Email" value={email} onChange={onEmail} type="email" />
        <FormField label="License #" value={license} onChange={onLicense} />
        <FormField label="Appointed Date" value={date} onChange={onDate} type="date" />
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
