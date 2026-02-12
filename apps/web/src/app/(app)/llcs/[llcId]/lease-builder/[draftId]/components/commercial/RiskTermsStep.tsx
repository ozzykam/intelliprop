'use client';

import type { LeaseBuilderDraft, CommercialRiskTerms } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass = 'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';

export default function RiskTermsStep({ draft, updateDraft }: StepProps) {
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

  function update<K extends keyof CommercialRiskTerms>(field: K, value: CommercialRiskTerms[K]) {
    updateDraft({
      commercial: {
        ...draft.commercial!,
        risk: { ...risk, [field]: value },
      },
    } as Partial<LeaseBuilderDraft>);
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
