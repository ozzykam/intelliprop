'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  aocStep1Schema,
  aocStep2Schema,
  aocStep3Schema,
  AssignmentOfClaim,
  AocExhibitKey,
  AOC_EXHIBIT_DEFINITIONS,
  ASSIGNMENT_CLAIM_TYPE_LABELS,
  User,
} from '@shared/types';
import { generateAocDocument } from '@shared/assignmentOfClaim/generator';

interface NewAssignmentPageProps {
  params: Promise<{ llcId: string }>;
}

const TODAY = new Date().toISOString().slice(0, 10);

type WizardState = {
  step: 1 | 2 | 3 | 4;
  // Step 1
  claimType: string;
  claimDescription: string;
  claimValueDollars: string;
  tenantName: string;
  tenantStreet: string;
  tenantUnit: string;
  tenantCity: string;
  tenantState: string;
  tenantZip: string;
  tenantSameAsProperty: boolean;
  tenantPhone: string;
  tenantEmail: string;
  propertyStreet: string;
  propertyUnit: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  insuranceClaimNumber: string;
  insurer: string;
  // Step 2
  assigneeName: string;
  assigneeEntityType: 'individual' | 'company';
  assigneeAddress: string;
  assigneePhone: string;
  assigneeEmail: string;
  // Step 3
  considerationDollars: string;
  effectiveDate: string;
  expirationDate: string;
  warrantsGoodTitle: boolean;
  specialConditions: string;
  requiresNotarization: boolean;
  exhibits: AocExhibitKey[];
};

const INITIAL: WizardState = {
  step: 1,
  claimType: 'rent_debt',
  claimDescription: '',
  claimValueDollars: '',
  tenantName: '',
  tenantStreet: '',
  tenantUnit: '',
  tenantCity: '',
  tenantState: '',
  tenantZip: '',
  tenantSameAsProperty: false,
  tenantPhone: '',
  tenantEmail: '',
  propertyStreet: '',
  propertyUnit: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  insuranceClaimNumber: '',
  insurer: '',
  assigneeName: '',
  assigneeEntityType: 'individual',
  assigneeAddress: '',
  assigneePhone: '',
  assigneeEmail: '',
  considerationDollars: '1.00',
  effectiveDate: TODAY,
  expirationDate: '',
  warrantsGoodTitle: true,
  specialConditions: '',
  requiresNotarization: false,
  exhibits: [],
};

function dollarsToCents(val: string): number {
  return Math.round(parseFloat(val || '0') * 100);
}

function formatUserAddress(u: User): string {
  if (!u.mailingAddress) return '';
  const { street1, street2, city, state, zipCode } = u.mailingAddress;
  const parts = [street1];
  if (street2) parts.push(street2);
  const csz = [city, [state, zipCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if (csz) parts.push(csz);
  return parts.join(', ');
}

function buildTenantAddress(s: WizardState): string | undefined {
  if (s.tenantSameAsProperty) return buildPropertyAddress(s);
  const street = s.tenantStreet.trim();
  if (!street) return undefined;
  const parts = [street];
  if (s.tenantUnit.trim()) parts.push(s.tenantUnit.trim());
  const cityStateZip = [
    s.tenantCity.trim(),
    [s.tenantState.trim().toUpperCase(), s.tenantZip.trim()].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');
  if (cityStateZip) parts.push(cityStateZip);
  return parts.join(', ');
}

function buildPropertyAddress(s: WizardState): string | undefined {
  const street = s.propertyStreet.trim();
  if (!street) return undefined;
  const parts = [street];
  if (s.propertyUnit.trim()) parts.push(s.propertyUnit.trim());
  const cityStateZip = [
    s.propertyCity.trim(),
    [s.propertyState.trim().toUpperCase(), s.propertyZip.trim()].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');
  if (cityStateZip) parts.push(cityStateZip);
  return parts.join(', ');
}

function buildPreview(s: WizardState, llcName = 'LLC'): AssignmentOfClaim {
  return {
    id: 'preview',
    llcId: 'preview',
    llcName,
    claimType: s.claimType as AssignmentOfClaim['claimType'],
    claimDescription: s.claimDescription,
    claimValueCents: s.claimValueDollars ? dollarsToCents(s.claimValueDollars) : undefined,
    tenantName: s.tenantName || undefined,
    tenantAddress: buildTenantAddress(s),
    tenantPhone: s.tenantPhone || undefined,
    tenantEmail: s.tenantEmail || undefined,
    propertyAddress: buildPropertyAddress(s),
    insuranceClaimNumber: s.insuranceClaimNumber || undefined,
    insurer: s.insurer || undefined,
    assignee: {
      name: s.assigneeName,
      entityType: s.assigneeEntityType,
      address: s.assigneeAddress,
      phone: s.assigneePhone || undefined,
      email: s.assigneeEmail || undefined,
    },
    considerationCents: dollarsToCents(s.considerationDollars),
    effectiveDate: s.effectiveDate,
    expirationDate: s.expirationDate || undefined,
    warrantsGoodTitle: s.warrantsGoodTitle,
    specialConditions: s.specialConditions || undefined,
    requiresNotarization: s.requiresNotarization || undefined,
    exhibits: s.exhibits.length > 0 ? s.exhibits : undefined,
    status: 'draft',
    createdByUserId: '',
    createdAt: { seconds: 0, nanoseconds: 0 },
  };
}

export default function NewAssignmentPage({ params }: NewAssignmentPageProps) {
  const { llcId } = use(params);
  const router = useRouter();
  const [state, setState] = useState<WizardState>(INITIAL);
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedAssignees, setSavedAssignees] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/assignees')
      .then(r => r.json())
      .then(data => { if (data.ok) setSavedAssignees(data.data); })
      .catch(() => {});
  }, []);

  const set = (patch: Partial<WizardState>) => setState(prev => ({ ...prev, ...patch }));

  const validateStep = (step: 1 | 2 | 3): boolean => {
    setFieldError('');
    if (step === 1) {
      const result = aocStep1Schema.safeParse({
        claimType: state.claimType,
        claimDescription: state.claimDescription,
        claimValueCents: state.claimValueDollars ? dollarsToCents(state.claimValueDollars) : undefined,
        tenantName: state.tenantName || undefined,
        tenantAddress: buildTenantAddress(state),
        tenantPhone: state.tenantPhone || undefined,
        tenantEmail: state.tenantEmail || undefined,
        propertyAddress: buildPropertyAddress(state),
        insuranceClaimNumber: state.insuranceClaimNumber || undefined,
        insurer: state.insurer || undefined,
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? 'Invalid input');
        return false;
      }
    }
    if (step === 2) {
      const result = aocStep2Schema.safeParse({
        assignee: {
          name: state.assigneeName,
          entityType: state.assigneeEntityType,
          address: state.assigneeAddress,
          phone: state.assigneePhone || undefined,
          email: state.assigneeEmail || undefined,
        },
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? 'Invalid input');
        return false;
      }
    }
    if (step === 3) {
      const result = aocStep3Schema.safeParse({
        considerationCents: dollarsToCents(state.considerationDollars),
        effectiveDate: state.effectiveDate,
        expirationDate: state.expirationDate || undefined,
        warrantsGoodTitle: state.warrantsGoodTitle,
        specialConditions: state.specialConditions || undefined,
        requiresNotarization: state.requiresNotarization,
        exhibits: state.exhibits,
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? 'Invalid input');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep(state.step as 1 | 2 | 3)) return;
    set({ step: (state.step + 1) as WizardState['step'] });
  };

  const back = () => {
    setFieldError('');
    set({ step: (state.step - 1) as WizardState['step'] });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFieldError('');
    try {
      const body = {
        claimType: state.claimType,
        claimDescription: state.claimDescription,
        claimValueCents: state.claimValueDollars ? dollarsToCents(state.claimValueDollars) : undefined,
        tenantName: state.tenantName || undefined,
        tenantAddress: buildTenantAddress(state),
        tenantPhone: state.tenantPhone || undefined,
        tenantEmail: state.tenantEmail || undefined,
        propertyAddress: buildPropertyAddress(state),
        insuranceClaimNumber: state.insuranceClaimNumber || undefined,
        insurer: state.insurer || undefined,
        assignee: {
          name: state.assigneeName,
          entityType: state.assigneeEntityType,
          address: state.assigneeAddress,
          phone: state.assigneePhone || undefined,
          email: state.assigneeEmail || undefined,
        },
        considerationCents: dollarsToCents(state.considerationDollars),
        effectiveDate: state.effectiveDate,
        expirationDate: state.expirationDate || undefined,
        warrantsGoodTitle: state.warrantsGoodTitle,
        specialConditions: state.specialConditions || undefined,
        requiresNotarization: state.requiresNotarization || undefined,
        exhibits: state.exhibits.length > 0 ? state.exhibits : undefined,
      };

      const res = await fetch(`/api/llcs/${llcId}/aoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setFieldError(data.error?.message || 'Failed to create assignment');
        return;
      }

      const saved: AssignmentOfClaim = data.data;

      // Store generated document HTML
      const docHtml = generateAocDocument(saved);
      await fetch(`/api/llcs/${llcId}/aoc/${saved.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHtml: docHtml }),
      });

      router.push(`/llcs/${llcId}/assignments/${saved.id}`);
    } catch {
      setFieldError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Claim Details', 'Assignee', 'Terms', 'Review'];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">New Assignment of Claim</h1>
        <div className="flex gap-2 flex-wrap">
          {stepTitles.map((title, i) => (
            <div key={title} className="flex items-center gap-1">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  state.step === i + 1
                    ? 'bg-primary text-primary-foreground'
                    : state.step > i + 1
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {state.step > i + 1 ? '✓' : i + 1}
              </span>
              <span className={`text-xs ${state.step === i + 1 ? 'font-medium' : 'text-muted-foreground'}`}>
                {title}
              </span>
              {i < stepTitles.length - 1 && <span className="text-muted-foreground text-xs mx-1">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {state.step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Claim Type</label>
            <div className="space-y-2">
              {(Object.entries(ASSIGNMENT_CLAIM_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                <label key={value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/30">
                  <input
                    type="radio"
                    name="claimType"
                    value={value}
                    checked={state.claimType === value}
                    onChange={() => set({ claimType: value })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground">
                      {value === 'rent_debt' && 'Assign unpaid rent or tenant debt for collection'}
                      {value === 'insurance_claim' && 'Assign proceeds or rights from an insurance claim'}
                      {value === 'general_monetary' && 'Assign any other monetary claim or right'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {state.claimType === 'rent_debt' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={state.tenantName}
                  onChange={e => set({ tenantName: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Tenant full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property Address</label>
                <input
                  type="text"
                  value={state.propertyStreet}
                  onChange={e => set({ propertyStreet: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Street address (e.g. 1815 E Lake St)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Suite / Unit (optional)</label>
                <input
                  type="text"
                  value={state.propertyUnit}
                  onChange={e => set({ propertyUnit: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Suite 200, Unit 4B, etc."
                />
              </div>
              <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={state.propertyCity}
                    onChange={e => set({ propertyCity: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="Minneapolis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={state.propertyState}
                    onChange={e => set({ propertyState: e.target.value.toUpperCase().slice(0, 2) })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm uppercase"
                    placeholder="MN"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <input
                    type="text"
                    value={state.propertyZip}
                    onChange={e => set({ propertyZip: e.target.value.slice(0, 10) })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="55401"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Tenant Mailing / Current Address</label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.tenantSameAsProperty}
                      onChange={e => set({ tenantSameAsProperty: e.target.checked })}
                    />
                    Same as property address
                  </label>
                </div>
                {state.tenantSameAsProperty ? (
                  <div className="text-sm border rounded-md px-3 py-1.5 bg-secondary/30 text-muted-foreground min-h-[34px]">
                    {buildPropertyAddress(state) ?? <span className="italic">Fill in property address above</span>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={state.tenantStreet}
                      onChange={e => set({ tenantStreet: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="Street address"
                    />
                    <input
                      type="text"
                      value={state.tenantUnit}
                      onChange={e => set({ tenantUnit: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="Suite / Unit (optional)"
                    />
                    <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                      <input
                        type="text"
                        value={state.tenantCity}
                        onChange={e => set({ tenantCity: e.target.value })}
                        className="w-full border rounded-md px-3 py-1.5 text-sm"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={state.tenantState}
                        onChange={e => set({ tenantState: e.target.value.toUpperCase().slice(0, 2) })}
                        className="w-full border rounded-md px-3 py-1.5 text-sm uppercase"
                        placeholder="MN"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={state.tenantZip}
                        onChange={e => set({ tenantZip: e.target.value.slice(0, 10) })}
                        className="w-full border rounded-md px-3 py-1.5 text-sm"
                        placeholder="55401"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant Phone</label>
                  <input
                    type="tel"
                    value={state.tenantPhone}
                    onChange={e => set({ tenantPhone: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="(612) 555-0100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant Email</label>
                  <input
                    type="email"
                    value={state.tenantEmail}
                    onChange={e => set({ tenantEmail: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="tenant@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {state.claimType === 'insurance_claim' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Insurer</label>
                <input
                  type="text"
                  value={state.insurer}
                  onChange={e => set({ insurer: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Claim Number</label>
                <input
                  type="text"
                  value={state.insuranceClaimNumber}
                  onChange={e => set({ insuranceClaimNumber: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Claim #"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Claim Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={state.claimDescription}
              onChange={e => set({ claimDescription: e.target.value })}
              rows={4}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder="Describe the claim in detail (minimum 10 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Claim Value (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.claimValueDollars}
                onChange={e => set({ claimValueDollars: e.target.value })}
                className="w-full border rounded-md pl-7 pr-3 py-1.5 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {state.step === 2 && (
        <div className="space-y-4">
          {savedAssignees.length > 0 && (
            <div className="p-3 border rounded-lg bg-secondary/20">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Saved Assignees</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {savedAssignees.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => set({
                      assigneeName: a.displayName ?? '',
                      assigneeEntityType: a.assigneeEntityType ?? 'individual',
                      assigneeAddress: formatUserAddress(a),
                      assigneePhone: a.phoneNumber ?? '',
                      assigneeEmail: a.email ?? '',
                    })}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary/60 transition-colors"
                  >
                    <span className="font-medium">{a.displayName ?? a.email}</span>
                    {a.assigneeEntityType && (
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{a.assigneeEntityType}</span>
                    )}
                    {a.mailingAddress && (
                      <div className="text-xs text-muted-foreground truncate">{formatUserAddress(a)}</div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to pre-fill. You can edit any field below.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Entity Type</label>
            <div className="flex gap-3">
              {(['individual', 'company'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="entityType"
                    value={t}
                    checked={state.assigneeEntityType === t}
                    onChange={() => set({ assigneeEntityType: t })}
                  />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {state.assigneeEntityType === 'company' ? 'Company Name' : 'Full Name'}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={state.assigneeName}
              onChange={e => set({ assigneeName: e.target.value })}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder={state.assigneeEntityType === 'company' ? 'Company, LLC' : 'First Last'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Address <span className="text-destructive">*</span>
            </label>
            <textarea
              value={state.assigneeAddress}
              onChange={e => set({ assigneeAddress: e.target.value })}
              rows={2}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder="Street, City, State ZIP"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={state.assigneePhone}
                onChange={e => set({ assigneePhone: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
                placeholder="(612) 555-0100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (optional)</label>
              <input
                type="email"
                value={state.assigneeEmail}
                onChange={e => set({ assigneeEmail: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {state.step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Consideration <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.considerationDollars}
                onChange={e => set({ considerationDollars: e.target.value })}
                className="w-full border rounded-md pl-7 pr-3 py-1.5 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter $1.00 for nominal consideration (standard Minnesota practice)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Effective Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={state.effectiveDate}
                onChange={e => set({ effectiveDate: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date (optional)</label>
              <input
                type="date"
                value={state.expirationDate}
                onChange={e => set({ expirationDate: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          {state.expirationDate && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
              <strong>Caution:</strong> Expiration dates are uncommon in assignments of claim and may undermine the irrevocable nature of the assignment. Courts may interpret this as a conditional transfer. Consult legal counsel before including this provision.
            </div>
          )}

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.warrantsGoodTitle}
                onChange={e => set({ warrantsGoodTitle: e.target.checked })}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">Warrant Good Title</div>
                <div className="text-xs text-muted-foreground">
                  Assignor warrants the claim is free and clear of prior assignments. Uncheck for an as-is assignment with no title warranty.
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supporting Documents / Exhibits</label>
            <p className="text-xs text-muted-foreground mb-2">
              Check each document you are attaching. Only checked items will appear as exhibits in the generated document.
              Exhibit A (Notice to Obligor) is always included.
            </p>
            <div className="space-y-2 p-3 border rounded-md">
              {AOC_EXHIBIT_DEFINITIONS.filter(d =>
                (d.claimTypes as string[]).includes(state.claimType)
              ).map(def => (
                <label key={def.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={state.exhibits.includes(def.key)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...state.exhibits, def.key]
                        : state.exhibits.filter(k => k !== def.key);
                      set({ exhibits: next });
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium">{def.label}</div>
                    <div className="text-xs text-muted-foreground">{def.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Special Conditions (optional)</label>
            <textarea
              value={state.specialConditions}
              onChange={e => set({ specialConditions: e.target.value })}
              rows={3}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder="Any additional terms or conditions..."
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.requiresNotarization}
              onChange={e => set({ requiresNotarization: e.target.checked })}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">Include Notarization Block</div>
              <div className="text-xs text-muted-foreground">
                Recommended when the claim involves real property. A notary acknowledgment block will be added to the document. You will need to have the signatures notarized before the document is fully executed.
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Step 4 — Review */}
      {state.step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border rounded-lg p-4 bg-secondary/20">
            <div>
              <div className="text-xs text-muted-foreground">Claim Type</div>
              <div className="font-medium">
                {ASSIGNMENT_CLAIM_TYPE_LABELS[state.claimType as keyof typeof ASSIGNMENT_CLAIM_TYPE_LABELS] ?? state.claimType}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Effective Date</div>
              <div className="font-medium">{state.effectiveDate}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Description</div>
              <div className="font-medium">{state.claimDescription}</div>
            </div>
            {state.claimValueDollars && (
              <div>
                <div className="text-xs text-muted-foreground">Claim Value</div>
                <div className="font-medium">${parseFloat(state.claimValueDollars).toFixed(2)}</div>
              </div>
            )}
            {state.claimType === 'rent_debt' && buildTenantAddress(state) && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Tenant Address</div>
                <div className="font-medium">{buildTenantAddress(state)}</div>
              </div>
            )}
            {state.claimType === 'rent_debt' && (state.tenantPhone || state.tenantEmail) && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Tenant Contact</div>
                <div className="font-medium">
                  {[state.tenantPhone, state.tenantEmail].filter(Boolean).join(' · ')}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Assignee</div>
              <div className="font-medium">{state.assigneeName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Assignee Type</div>
              <div className="font-medium capitalize">{state.assigneeEntityType}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Consideration</div>
              <div className="font-medium">
                ${parseFloat(state.considerationDollars || '0').toFixed(2)}
                {parseFloat(state.considerationDollars || '0') <= 1 && ' (nominal)'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Title Warranty</div>
              <div className="font-medium">{state.warrantsGoodTitle ? 'Yes — Warrants Good Title' : 'No — As-Is'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Document Preview</div>
            <iframe
              srcDoc={generateAocDocument(buildPreview(state))}
              style={{ width: '100%', height: '600px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              title="Assignment of Claim Preview"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {fieldError && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{fieldError}</div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={back}
          disabled={state.step === 1}
          className="px-4 py-2 text-sm border rounded-md hover:bg-secondary/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {state.step < 4 ? (
          <button
            onClick={next}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Save & Create'}
          </button>
        )}
      </div>
    </div>
  );
}
