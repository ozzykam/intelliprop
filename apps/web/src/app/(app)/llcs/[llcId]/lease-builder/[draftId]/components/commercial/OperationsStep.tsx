'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft, CommercialMaintenanceItem, CommercialOperationsTerms } from '@shared/types/leaseBuilder';

/** Formatted integer input — no leading zeros, comma-separated on blur */
function useIntegerInput(
  value: number | undefined,
  onChange: (n: number) => void
) {
  const [raw, setRaw] = useState<string>(() =>
    value ? value.toLocaleString('en-US') : ''
  );

  function handleChange(str: string) {
    const digits = str.replace(/[^0-9]/g, '');
    setRaw(digits);
    onChange(digits ? parseInt(digits, 10) : 0);
  }

  function handleBlur() {
    const n = parseInt(raw.replace(/,/g, ''), 10);
    setRaw(isNaN(n) || n === 0 ? '' : n.toLocaleString('en-US'));
  }

  return { value: raw, handleChange, handleBlur };
}

type UtilityAbatementScope = NonNullable<CommercialOperationsTerms['utilityAbatementScope']>;

const ABATEMENT_SCOPES: {
  value: UtilityAbatementScope;
  label: string;
  description: string;
}[] = [
  {
    value: 'narrow',
    label: 'Narrow — Landlord fault only',
    description: "Abatement only when the interruption was directly caused by Landlord's gross negligence or willful misconduct. Acts of God, utility provider outages, and all force majeure events are excluded.",
  },
  {
    value: 'moderate',
    label: 'Moderate — Landlord control (recommended)',
    description: "Abatement when the interruption was within Landlord's reasonable control to prevent or cure (e.g., maintenance failure, contractor damage). Explicitly excludes acts of God, utility provider outages, government action, and other force majeure events.",
  },
  {
    value: 'broad',
    label: 'Broad — Any cause except Tenant',
    description: "Abatement for any qualifying interruption not caused by Tenant, regardless of whether the cause (act of God, utility outage, etc.) was within Landlord's control.",
  },
];

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass = 'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';

const MAINTENANCE_ITEMS: { value: CommercialMaintenanceItem; label: string }[] = [
  { value: 'structural', label: 'Structural' },
  { value: 'roof', label: 'Roof' },
  { value: 'exterior_walls', label: 'Exterior Walls' },
  { value: 'common_areas', label: 'Common Areas' },
  { value: 'interior', label: 'Interior' },
  { value: 'non_structural', label: 'Non-Structural' },
  { value: 'fixtures_equipment', label: 'Fixtures & Equipment' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
];

export default function OperationsStep({ draft, updateDraft }: StepProps) {
  const ops = draft.commercial?.operations ?? {
    landlordMaintains: ['structural', 'roof', 'exterior_walls', 'common_areas'],
    tenantMaintains: ['interior', 'non_structural', 'fixtures_equipment'],
    utilityResponsibility: 'tenant_all',
    insuranceGLAmount: 1000000,
    insurancePropertyRequired: true,
    insuranceBusinessInterruption: false,
    insuranceWorkersComp: false,
    insuranceLandlordAdditionalInsured: true,
    environmentalComplianceIncluded: true,
    adaResponsibility: 'shared',
  };

  function update<K extends keyof CommercialOperationsTerms>(field: K, value: CommercialOperationsTerms[K]) {
    updateDraft({
      commercial: {
        ...draft.commercial!,
        operations: { ...ops, [field]: value },
      },
    } as Partial<LeaseBuilderDraft>);
  }

  const glInput = useIntegerInput(ops.insuranceGLAmount, (n) => update('insuranceGLAmount', n));

  function toggleMaintenance(who: 'landlordMaintains' | 'tenantMaintains', item: CommercialMaintenanceItem) {
    const current = (ops[who] ?? []) as CommercialMaintenanceItem[];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    update(who, updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Operations</h2>

      {/* Maintenance Split */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Maintenance Responsibilities</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">Landlord Maintains</p>
            <div className="space-y-2">
              {MAINTENANCE_ITEMS.map((item) => (
                <label key={`ll-${item.value}`} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(ops.landlordMaintains ?? []).includes(item.value)}
                    onChange={() => toggleMaintenance('landlordMaintains', item.value)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Tenant Maintains</p>
            <div className="space-y-2">
              {MAINTENANCE_ITEMS.map((item) => (
                <label key={`tn-${item.value}`} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(ops.tenantMaintains ?? []).includes(item.value)}
                    onChange={() => toggleMaintenance('tenantMaintains', item.value)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Utilities */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Utility Responsibility</h3>
        <div className="space-y-2">
          {(['tenant_all', 'landlord_all', 'shared'] as const).map((val) => (
            <label key={val} className="flex items-center gap-2">
              <input
                type="radio"
                name="utilityResponsibility"
                value={val}
                checked={ops.utilityResponsibility === val}
                onChange={() => update('utilityResponsibility', val)}
                className="accent-primary"
              />
              <span className="text-sm capitalize">{val.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
        {ops.utilityResponsibility === 'shared' && (
          <div>
            <label className="block text-sm font-medium mb-2">Shared Utility Allocation Description</label>
            <textarea
              value={ops.sharedUtilityAllocation ?? ''}
              onChange={(e) => update('sharedUtilityAllocation', e.target.value)}
              className={inputClass}
              rows={3}
              placeholder="Describe how shared utilities are allocated..."
            />
          </div>
        )}
      </div>

      {/* Insurance */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Insurance Requirements</h3>
        <div>
          <label className="block text-sm font-medium mb-2">General Liability (per occurrence) *</label>
          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <input
              type="text"
              value={glInput.value}
              onChange={(e) => glInput.handleChange(e.target.value)}
              onBlur={glInput.handleBlur}
              className={inputClass}
              placeholder="1,000,000"
            />
          </div>
          {(ops.insuranceGLAmount ?? 0) < 1000000 && (ops.insuranceGLAmount ?? 0) > 0 && (
            <p className="text-xs text-yellow-600 mt-1">Coverage below recommended minimum of $1,000,000.</p>
          )}
        </div>
        <div className="space-y-2">
          {([
            { field: 'insurancePropertyRequired', label: 'Property Insurance Required' },
            { field: 'insuranceBusinessInterruption', label: 'Business Interruption Insurance' },
            { field: 'insuranceWorkersComp', label: "Workers' Compensation Insurance" },
            { field: 'insuranceLandlordAdditionalInsured', label: 'Landlord Named as Additional Insured' },
          ] as const).map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!ops[field]}
                onChange={(e) => update(field, e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Utility Interruption Abatement */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Utility Interruption Abatement</h3>
        <p className="text-xs text-muted-foreground">
          Optional clause that abates rent when a utility service fails for too long. Leave the threshold blank to omit this clause entirely.
        </p>
        <div>
          <label className="block text-sm font-medium mb-2">
            Abatement Threshold (consecutive calendar days)
          </label>
          <input
            type="number"
            value={ops.utilityInterruptionAbatementDays ?? ''}
            onChange={(e) => {
              const days = e.target.value
                ? Math.max(1, Math.min(14, parseInt(e.target.value, 10)))
                : undefined;
              updateDraft({
                commercial: {
                  ...draft.commercial!,
                  operations: {
                    ...ops,
                    utilityInterruptionAbatementDays: days as number | undefined,
                    // Default scope to moderate when enabling for the first time
                    utilityAbatementScope: days
                      ? (ops.utilityAbatementScope ?? 'moderate')
                      : undefined,
                  },
                },
              } as Partial<LeaseBuilderDraft>);
            }}
            placeholder="e.g. 3"
            min={1}
            max={14}
            className={inputClass}
          />
        </div>

        {ops.utilityInterruptionAbatementDays != null && ops.utilityInterruptionAbatementDays > 0 && (
          <div className="space-y-3 pl-1">
            <label className="block text-sm font-medium">
              Qualifying causes for abatement
            </label>
            <div className="space-y-3">
              {ABATEMENT_SCOPES.map((scope) => (
                <label
                  key={scope.value}
                  className={`flex gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                    (ops.utilityAbatementScope ?? 'moderate') === scope.value
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-secondary/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="utilityAbatementScope"
                    value={scope.value}
                    checked={(ops.utilityAbatementScope ?? 'moderate') === scope.value}
                    onChange={() => update('utilityAbatementScope', scope.value)}
                    className="mt-0.5 accent-primary shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium">{scope.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{scope.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Environmental */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Environmental Compliance</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={true}
            disabled
            className="w-4 h-4 rounded border-input"
          />
          <span className="text-sm">Environmental compliance clause included</span>
          <span className="text-xs text-muted-foreground">(Required — cannot be removed)</span>
        </label>
      </div>

      {/* ADA */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">ADA Compliance Responsibility</h3>
        <div className="space-y-2">
          {(['landlord', 'tenant', 'shared'] as const).map((val) => (
            <label key={val} className="flex items-center gap-2">
              <input
                type="radio"
                name="adaResponsibility"
                value={val}
                checked={ops.adaResponsibility === val}
                onChange={() => update('adaResponsibility', val)}
                className="accent-primary"
              />
              <span className="text-sm capitalize">{val}</span>
            </label>
          ))}
        </div>
        {ops.adaResponsibility === 'shared' && (
          <div>
            <label className="block text-sm font-medium mb-2">Shared ADA Responsibility Description</label>
            <textarea
              value={ops.adaSharedDescription ?? ''}
              onChange={(e) => update('adaSharedDescription', e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Describe how ADA compliance responsibilities are shared..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
