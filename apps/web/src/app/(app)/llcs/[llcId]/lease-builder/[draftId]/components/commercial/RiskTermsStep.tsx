'use client';

import { useState, useEffect } from 'react';
import type { LeaseBuilderDraft, CommercialRiskTerms, GuarantorEntry } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass = 'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';

export default function RiskTermsStep({ draft, updateDraft, llcId }: StepProps) {
  const risk = draft.commercial?.risk ?? {
    monetaryDefaultCureDays: 10,
    nonMonetaryDefaultCureDays: 30,
    remediesTermination: true,
    remediesAcceleration: true,
    remediesReentry: true,
    remediesAttorneyFees: true,
    remediesDefaultInterest: true,
    holdoverRentPercent: 150,
    assignmentAllowed: true,
    assignmentConsentRequired: true,
    assignmentConsentStandard: 'reasonable' as const,
    landlordRecaptureRights: false,
    personalGuaranteeRequired: false,
    indemnificationMutual: true,
    casualtyTerminationRight: 'both' as const,
  };

  const [primaryContact, setPrimaryContact] = useState<{
    name: string; title?: string; phone?: string; email?: string;
  } | null>(null);

  useEffect(() => {
    const tenantId = draft.tenantIds?.[0];
    if (!tenantId) return;
    fetch(`/api/llcs/${llcId}/tenants/${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.data?.type === 'business' && data.data?.primaryContact?.name) {
          setPrimaryContact(data.data.primaryContact);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llcId, draft.tenantIds?.[0]]);

  function update<K extends keyof CommercialRiskTerms>(field: K, value: CommercialRiskTerms[K]) {
    updateDraft({
      commercial: {
        ...draft.commercial!,
        risk: { ...risk, [field]: value },
      },
    } as Partial<LeaseBuilderDraft>);
  }

  function addGuarantor() {
    const current = risk.guarantors ?? [];
    update('guarantors', [...current, { firstName: '', lastName: '' }]);
  }

  function removeGuarantor(index: number) {
    const current = risk.guarantors ?? [];
    update('guarantors', current.filter((_, i) => i !== index));
  }

  function updateGuarantor(index: number, patch: Partial<GuarantorEntry>) {
    const current = risk.guarantors ?? [];
    const updated = current.map((g, i) => i === index ? { ...g, ...patch } : g);
    update('guarantors', updated);
  }

  function updateGuarantorAddress(index: number, patch: Partial<NonNullable<GuarantorEntry['address']>>) {
    const current = risk.guarantors ?? [];
    const g = current[index];
    if (!g) return;
    const updatedAddress = { street1: '', city: '', state: '', zipCode: '', ...g.address, ...patch };
    updateGuarantor(index, { address: updatedAddress });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Risk & Default Terms</h2>

      {/* Default & Cure */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Default & Cure Periods</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Monetary Default Cure (days) *</label>
            <input
              type="number"
              value={risk.monetaryDefaultCureDays ?? ''}
              onChange={(e) => update('monetaryDefaultCureDays', Number(e.target.value))}
              className={inputClass}
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Non-Monetary Default Cure (days) *</label>
            <input
              type="number"
              value={risk.nonMonetaryDefaultCureDays ?? ''}
              onChange={(e) => update('nonMonetaryDefaultCureDays', Number(e.target.value))}
              className={inputClass}
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Remedies */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Available Remedies</h3>
        <div className="space-y-2">
          {([
            { field: 'remediesTermination', label: 'Lease Termination' },
            { field: 'remediesAcceleration', label: 'Rent Acceleration' },
            { field: 'remediesReentry', label: 'Right of Re-Entry' },
            { field: 'remediesAttorneyFees', label: "Attorney's Fees Recovery" },
            { field: 'remediesDefaultInterest', label: 'Default Interest' },
          ] as const).map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!risk[field]}
                onChange={(e) => update(field, e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Holdover */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Holdover</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Holdover Rent (% of last rent) *</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={risk.holdoverRentPercent ?? ''}
              onChange={(e) => update('holdoverRentPercent', Number(e.target.value))}
              className={inputClass}
              min={100}
              max={300}
            />
            <span className="text-sm">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Typically 150% of last month&apos;s rent.</p>
        </div>
      </div>

      {/* Assignment & Subletting */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Assignment & Subletting</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={risk.assignmentAllowed}
            onChange={(e) => update('assignmentAllowed', e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <span className="text-sm">Assignment Allowed</span>
        </label>

        {risk.assignmentAllowed && (
          <div className="ml-6 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={risk.assignmentConsentRequired}
                onChange={(e) => update('assignmentConsentRequired', e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">Landlord Consent Required</span>
            </label>

            {risk.assignmentConsentRequired && (
              <div>
                <label className="block text-sm font-medium mb-2">Consent Standard</label>
                <select
                  value={risk.assignmentConsentStandard ?? 'reasonable'}
                  onChange={(e) => update('assignmentConsentStandard', e.target.value as 'reasonable' | 'sole_discretion')}
                  className={inputClass}
                >
                  <option value="reasonable">Reasonable (shall not be unreasonably withheld)</option>
                  <option value="sole_discretion">Sole Discretion</option>
                </select>
                {risk.assignmentConsentStandard === 'sole_discretion' && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Sole discretion standard may be viewed as one-sided by tenant counsel.
                  </p>
                )}
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={risk.landlordRecaptureRights}
                onChange={(e) => update('landlordRecaptureRights', e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">Landlord Recapture Rights</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Subletting Profit Share (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={risk.sublettingProfitShare ?? ''}
                  onChange={(e) => update('sublettingProfitShare', Number(e.target.value) || undefined)}
                  className={inputClass}
                  min={0}
                  max={100}
                  placeholder="50"
                />
                <span className="text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Percentage of subletting profit payable to Landlord.</p>
            </div>
          </div>
        )}
      </div>

      {/* Personal Guarantee */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Personal Guarantee</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={risk.personalGuaranteeRequired}
            onChange={(e) => update('personalGuaranteeRequired', e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <span className="text-sm">Personal Guarantee Required</span>
        </label>

        {risk.personalGuaranteeRequired && (
          <div className="ml-6 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Guarantee Type *</label>
              <select
                value={risk.personalGuaranteeType ?? 'continuing'}
                onChange={(e) => update('personalGuaranteeType', e.target.value as 'continuing' | 'limited' | 'good_guy')}
                className={inputClass}
              >
                <option value="continuing">Continuing (full term)</option>
                <option value="limited">Limited (capped amount)</option>
                <option value="good_guy">Good Guy (until vacate)</option>
              </select>
            </div>

            {risk.personalGuaranteeType === 'limited' && (
              <div>
                <label className="block text-sm font-medium mb-2">Guarantee Cap ($) *</label>
                <input
                  type="number"
                  value={risk.personalGuaranteeCap ? (risk.personalGuaranteeCap / 100).toFixed(2) : ''}
                  onChange={(e) => update('personalGuaranteeCap', Math.round(parseFloat(e.target.value || '0') * 100))}
                  className={inputClass}
                  step="0.01"
                  min="0"
                  placeholder="50000.00"
                />
              </div>
            )}

            {/* Primary Contact checkbox */}
            {primaryContact && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!risk.includePrimaryContactAsGuarantor}
                  onChange={(e) => update('includePrimaryContactAsGuarantor', e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">
                  Include <strong>{primaryContact.name}</strong>
                  {primaryContact.title && ` (${primaryContact.title})`} as guarantor
                </span>
              </label>
            )}

            {/* Additional guarantors */}
            <div className="space-y-4">
              <label className="block text-sm font-medium">Additional Guarantors</label>

              {(risk.guarantors ?? []).map((g, i) => (
                <div key={i} className="border rounded-md p-4 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removeGuarantor(i)}
                    className="absolute top-2 right-2 text-xs text-destructive underline"
                  >
                    Remove
                  </button>

                  {/* Name row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">First Name *</label>
                      <input
                        type="text"
                        value={g.firstName}
                        onChange={(e) => updateGuarantor(i, { firstName: e.target.value })}
                        className={inputClass}
                        placeholder="First"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">M.I.</label>
                      <input
                        type="text"
                        value={g.middleInitial ?? ''}
                        onChange={(e) => updateGuarantor(i, { middleInitial: e.target.value })}
                        className={inputClass}
                        placeholder="M"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={g.lastName}
                        onChange={(e) => updateGuarantor(i, { lastName: e.target.value })}
                        className={inputClass}
                        placeholder="Last"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={g.title ?? ''}
                      onChange={(e) => updateGuarantor(i, { title: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. President, CEO"
                    />
                  </div>

                  {/* Phone / Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        value={g.phone ?? ''}
                        onChange={(e) => updateGuarantor(i, { phone: e.target.value })}
                        className={inputClass}
                        placeholder="(612) 555-0100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={g.email ?? ''}
                        onChange={(e) => updateGuarantor(i, { email: e.target.value })}
                        className={inputClass}
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Street Address</label>
                      <input
                        type="text"
                        value={g.address?.street1 ?? ''}
                        onChange={(e) => updateGuarantorAddress(i, { street1: e.target.value })}
                        className={inputClass}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Suite / Apt</label>
                      <input
                        type="text"
                        value={g.address?.street2 ?? ''}
                        onChange={(e) => updateGuarantorAddress(i, { street2: e.target.value })}
                        className={inputClass}
                        placeholder="Apt 2B (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">City</label>
                        <input
                          type="text"
                          value={g.address?.city ?? ''}
                          onChange={(e) => updateGuarantorAddress(i, { city: e.target.value })}
                          className={inputClass}
                          placeholder="Minneapolis"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">State</label>
                        <input
                          type="text"
                          value={g.address?.state ?? ''}
                          onChange={(e) => updateGuarantorAddress(i, { state: e.target.value })}
                          className={inputClass}
                          placeholder="MN"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">ZIP</label>
                        <input
                          type="text"
                          value={g.address?.zipCode ?? ''}
                          onChange={(e) => updateGuarantorAddress(i, { zipCode: e.target.value })}
                          className={inputClass}
                          placeholder="55401"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={g.dateOfBirth ?? ''}
                        onChange={(e) => updateGuarantor(i, { dateOfBirth: e.target.value || undefined })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">ID Type</label>
                      <select
                        value={g.idType ?? ''}
                        onChange={(e) => updateGuarantor(i, { idType: (e.target.value || undefined) as GuarantorEntry['idType'] })}
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver&apos;s License</option>
                        <option value="state_id">State ID</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">ID Number</label>
                      <input
                        type="text"
                        value={g.idNumber ?? ''}
                        onChange={(e) => updateGuarantor(i, { idNumber: e.target.value || undefined })}
                        className={inputClass}
                        placeholder="ID number"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addGuarantor}
                className="text-sm text-primary underline"
              >
                + Add Guarantor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Indemnification */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Indemnification</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="indemnification"
              checked={risk.indemnificationMutual === true}
              onChange={() => update('indemnificationMutual', true)}
              className="accent-primary"
            />
            <span className="text-sm">Mutual Indemnification</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="indemnification"
              checked={risk.indemnificationMutual === false}
              onChange={() => update('indemnificationMutual', false)}
              className="accent-primary"
            />
            <span className="text-sm">Tenant-Only Indemnification</span>
          </label>
        </div>
      </div>

      {/* Casualty */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Casualty & Condemnation</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Termination Right *</label>
          <select
            value={risk.casualtyTerminationRight}
            onChange={(e) => update('casualtyTerminationRight', e.target.value as 'landlord' | 'both' | 'neither')}
            className={inputClass}
          >
            <option value="landlord">Landlord Only</option>
            <option value="both">Both Parties</option>
            <option value="neither">Neither (must rebuild)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
