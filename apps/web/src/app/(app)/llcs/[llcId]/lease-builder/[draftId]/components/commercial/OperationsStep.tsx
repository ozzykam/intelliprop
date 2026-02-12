'use client';

import type { LeaseBuilderDraft, CommercialMaintenanceItem, CommercialOperationsTerms } from '@shared/types/leaseBuilder';

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
              type="number"
              value={ops.insuranceGLAmount ?? ''}
              onChange={(e) => update('insuranceGLAmount', Number(e.target.value))}
              className={inputClass}
              placeholder="1000000"
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
