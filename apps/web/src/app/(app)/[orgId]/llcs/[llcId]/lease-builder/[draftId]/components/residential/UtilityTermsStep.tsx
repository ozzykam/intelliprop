'use client';

import { useState } from 'react';
import type {
  LeaseBuilderDraft,
  ResidentialUtilityTerms,
  SharedUtility,
  LeaseUtilityType,
} from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass =
  'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'block text-sm font-medium mb-2';

const UTILITY_TYPES: { value: LeaseUtilityType; label: string }[] = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'gas', label: 'Gas' },
  { value: 'water', label: 'Water' },
  { value: 'sewer', label: 'Sewer' },
  { value: 'trash', label: 'Trash' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'internet', label: 'Internet' },
  { value: 'cable', label: 'Cable' },
  { value: 'phone', label: 'Phone' },
  { value: 'snow_removal', label: 'Snow Removal' },
  { value: 'lawn_care', label: 'Lawn Care' },
];

const ALLOCATION_METHODS: { value: SharedUtility['allocationMethod']; label: string }[] = [
  { value: 'rubs_sqft', label: 'RUBS - By Square Footage' },
  { value: 'rubs_occupants', label: 'RUBS - By Occupants' },
  { value: 'rubs_equal', label: 'RUBS - Equal Split' },
  { value: 'submeter', label: 'Submeter' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
];

function centsToDisplayStr(cents: number | undefined): string {
  if (cents == null || isNaN(cents) || cents === 0) return '';
  return (cents / 100).toFixed(2);
}

function displayToCents(display: string): number {
  const parsed = parseFloat(display);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

function DollarInput({
  cents,
  onChange,
  placeholder = '0.00',
  className,
}: {
  cents: number | undefined;
  onChange: (cents: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [raw, setRaw] = useState(() => centsToDisplayStr(cents));

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^0-9.]/g, '');
        setRaw(cleaned);
        onChange(displayToCents(cleaned));
      }}
      onBlur={() => {
        const c = displayToCents(raw);
        setRaw(centsToDisplayStr(c));
      }}
    />
  );
}

export default function UtilityTermsStep({ draft, updateDraft }: StepProps) {
  const existing = draft.residential?.utilities;

  const [utilities, setUtilities] = useState<Partial<ResidentialUtilityTerms>>({
    landlordPays: existing?.landlordPays ?? [],
    tenantPays: existing?.tenantPays ?? [],
    sharedUtilities: existing?.sharedUtilities ?? [],
  });

  function update(changes: Partial<ResidentialUtilityTerms>) {
    const updated = { ...utilities, ...changes };
    setUtilities(updated);
    updateDraft({
      residential: {
        ...draft.residential,
        utilities: updated as ResidentialUtilityTerms,
      },
    });
  }

  function toggleLandlordPays(utilityType: LeaseUtilityType) {
    const current = utilities.landlordPays || [];
    const updated = current.includes(utilityType)
      ? current.filter((u) => u !== utilityType)
      : [...current, utilityType];
    // Remove from tenantPays if added to landlordPays
    const tenantPays = (utilities.tenantPays || []).filter((u) => !updated.includes(u));
    update({ landlordPays: updated, tenantPays });
  }

  function toggleTenantPays(utilityType: LeaseUtilityType) {
    const current = utilities.tenantPays || [];
    const updated = current.includes(utilityType)
      ? current.filter((u) => u !== utilityType)
      : [...current, utilityType];
    // Remove from landlordPays if added to tenantPays
    const landlordPays = (utilities.landlordPays || []).filter((u) => !updated.includes(u));
    update({ tenantPays: updated, landlordPays });
  }

  function addSharedUtility() {
    const shared = [
      ...(utilities.sharedUtilities || []),
      { utilityType: 'electricity' as LeaseUtilityType, allocationMethod: 'rubs_equal' as SharedUtility['allocationMethod'] },
    ];
    update({ sharedUtilities: shared });
  }

  function updateSharedUtility(index: number, changes: Partial<SharedUtility>) {
    const shared = [...(utilities.sharedUtilities || [])];
    shared[index] = { ...shared[index], ...changes } as SharedUtility;
    update({ sharedUtilities: shared });
  }

  function removeSharedUtility(index: number) {
    const shared = (utilities.sharedUtilities || []).filter((_, i) => i !== index);
    update({ sharedUtilities: shared });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Utilities & Services</h2>

      {/* Landlord Pays */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Landlord Pays</h2>
        <div className="grid grid-cols-2 gap-2">
          {UTILITY_TYPES.map((ut) => (
            <label key={ut.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input"
                checked={utilities.landlordPays?.includes(ut.value) ?? false}
                onChange={() => toggleLandlordPays(ut.value)}
              />
              <span className="text-sm">{ut.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tenant Pays */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Tenant Pays</h2>
        <div className="grid grid-cols-2 gap-2">
          {UTILITY_TYPES.map((ut) => (
            <label key={ut.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input"
                checked={utilities.tenantPays?.includes(ut.value) ?? false}
                onChange={() => toggleTenantPays(ut.value)}
              />
              <span className="text-sm">{ut.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Shared Utilities */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Shared Utilities</h2>
        <p className="text-sm text-muted-foreground">
          Configure utilities that are shared between landlord and tenant with a specific
          allocation method.
        </p>

        {(utilities.sharedUtilities || []).map((shared, index) => (
          <div key={index} className="p-4 border border-input rounded-md space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Utility Type</label>
                <select
                  className={inputClass}
                  value={shared.utilityType}
                  onChange={(e) =>
                    updateSharedUtility(index, { utilityType: e.target.value as LeaseUtilityType })
                  }
                >
                  {UTILITY_TYPES.map((ut) => (
                    <option key={ut.value} value={ut.value}>
                      {ut.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Allocation Method</label>
                <select
                  className={inputClass}
                  value={shared.allocationMethod}
                  onChange={(e) =>
                    updateSharedUtility(index, {
                      allocationMethod: e.target.value as SharedUtility['allocationMethod'],
                    })
                  }
                >
                  {ALLOCATION_METHODS.map((am) => (
                    <option key={am.value} value={am.value}>
                      {am.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {shared.allocationMethod === 'fixed_amount' && (
              <div>
                <label className={labelClass}>Fixed Amount ($)</label>
                <DollarInput
                  className={inputClass}
                  cents={shared.fixedAmount}
                  onChange={(c) => updateSharedUtility(index, { fixedAmount: c })}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Description (optional)</label>
              <input
                type="text"
                className={inputClass}
                value={shared.description || ''}
                onChange={(e) =>
                  updateSharedUtility(index, { description: e.target.value || undefined })
                }
                placeholder="Additional details about this shared utility"
              />
            </div>

            <button
              type="button"
              onClick={() => removeSharedUtility(index)}
              className="px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSharedUtility}
          className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
        >
          + Add Shared Utility
        </button>
      </div>
    </div>
  );
}
