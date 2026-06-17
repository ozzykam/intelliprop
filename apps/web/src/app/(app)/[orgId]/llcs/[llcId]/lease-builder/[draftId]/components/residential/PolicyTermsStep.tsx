'use client';

import { useState } from 'react';
import type {
  LeaseBuilderDraft,
  ResidentialPolicyTerms,
  PetRestrictions,
  TenantMaintenance,
  ProhibitedActivity,
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

const TENANT_MAINTENANCE_OPTIONS: { value: TenantMaintenance; label: string }[] = [
  { value: 'lawn_care', label: 'Lawn Care' },
  { value: 'snow_removal', label: 'Snow Removal' },
  { value: 'hvac_filters', label: 'HVAC Filter Replacement' },
  { value: 'smoke_detector_batteries', label: 'Smoke Detector Batteries' },
  { value: 'gutter_cleaning', label: 'Gutter Cleaning' },
  { value: 'pest_control', label: 'Pest Control' },
];

const PROHIBITED_ACTIVITIES_OPTIONS: { value: ProhibitedActivity; label: string }[] = [
  { value: 'short_term_rental', label: 'Short-Term Rental (Airbnb, etc.)' },
  { value: 'illegal_activity', label: 'Illegal Activity' },
  { value: 'home_business', label: 'Home Business' },
  { value: 'vehicle_repair', label: 'Vehicle Repair on Premises' },
  { value: 'outdoor_storage', label: 'Outdoor Storage' },
  { value: 'satellite_dish_without_approval', label: 'Satellite Dish Without Approval' },
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

export default function PolicyTermsStep({ draft, updateDraft }: StepProps) {
  const existing = draft.residential?.policies;

  const [policies, setPolicies] = useState<Partial<ResidentialPolicyTerms>>({
    smokingPolicy: existing?.smokingPolicy ?? 'no_smoking',
    smokingDesignatedAreas: existing?.smokingDesignatedAreas,
    petPolicy: existing?.petPolicy ?? 'no_pets',
    petRestrictions: existing?.petRestrictions,
    rentersInsuranceRequired: existing?.rentersInsuranceRequired ?? false,
    rentersInsuranceMinCoverage: existing?.rentersInsuranceMinCoverage,
    parkingIncluded: existing?.parkingIncluded ?? false,
    parkingSpaces: existing?.parkingSpaces,
    parkingFeePerMonth: existing?.parkingFeePerMonth,
    guestParkingAvailable: existing?.guestParkingAvailable ?? false,
    storageIncluded: existing?.storageIncluded ?? false,
    storageFeePerMonth: existing?.storageFeePerMonth,
    quietHoursEnabled: existing?.quietHoursEnabled ?? false,
    quietHoursStart: existing?.quietHoursStart,
    quietHoursEnd: existing?.quietHoursEnd,
    tenantResponsibilities: existing?.tenantResponsibilities ?? [],
    prohibitedActivities: existing?.prohibitedActivities ?? [],
    lockChangePolicy: existing?.lockChangePolicy ?? 'landlord_only',
  });

  function update(changes: Partial<ResidentialPolicyTerms>) {
    const updated = { ...policies, ...changes };
    setPolicies(updated);
    updateDraft({
      residential: {
        ...draft.residential,
        policies: updated as ResidentialPolicyTerms,
      },
    });
  }

  function updatePetRestrictions(changes: Partial<PetRestrictions>) {
    const currentRestrictions = policies.petRestrictions || {
      maxPets: 1,
      allowedTypes: [],
      requiresDocumentation: false,
    };
    const updated = { ...currentRestrictions, ...changes };
    update({ petRestrictions: updated as PetRestrictions });
  }

  function toggleMaintenance(item: TenantMaintenance) {
    const current = policies.tenantResponsibilities || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    update({ tenantResponsibilities: updated });
  }

  function toggleProhibited(item: ProhibitedActivity) {
    const current = policies.prohibitedActivities || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    update({ prohibitedActivities: updated });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Policies</h2>

      {/* Smoking */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Smoking Policy</h2>
        <div className="space-y-2">
          {([
            { value: 'no_smoking', label: 'No Smoking' },
            { value: 'designated_areas', label: 'Designated Areas Only' },
            { value: 'allowed', label: 'Allowed' },
          ] as const).map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="radio"
                name="smokingPolicy"
                className="w-4 h-4 border-input"
                checked={policies.smokingPolicy === option.value}
                onChange={() => update({ smokingPolicy: option.value })}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        {policies.smokingPolicy === 'designated_areas' && (
          <div>
            <label className={labelClass}>Designated Smoking Areas</label>
            <input
              type="text"
              className={inputClass}
              value={policies.smokingDesignatedAreas || ''}
              onChange={(e) => update({ smokingDesignatedAreas: e.target.value })}
              placeholder="Describe designated smoking areas"
            />
          </div>
        )}
      </div>

      {/* Pets */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Pet Policy</h2>
        <div className="space-y-2">
          {([
            { value: 'no_pets', label: 'No Pets' },
            { value: 'allowed_with_restrictions', label: 'Allowed with Restrictions' },
            { value: 'allowed', label: 'Allowed' },
          ] as const).map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="radio"
                name="petPolicy"
                className="w-4 h-4 border-input"
                checked={policies.petPolicy === option.value}
                onChange={() => update({ petPolicy: option.value })}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        {(policies.petPolicy === 'allowed_with_restrictions' || policies.petPolicy === 'allowed') && (
          <div className="ml-6 p-4 border border-input rounded-md space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Maximum Pets</label>
                <input
                  type="number"
                  className={inputClass}
                  value={policies.petRestrictions?.maxPets ?? ''}
                  onChange={(e) =>
                    updatePetRestrictions({ maxPets: parseInt(e.target.value, 10) || 1 })
                  }
                  min={1}
                />
              </div>
              <div>
                <label className={labelClass}>Allowed Types</label>
                <input
                  type="text"
                  className={inputClass}
                  value={policies.petRestrictions?.allowedTypes?.join(', ') || ''}
                  onChange={(e) => {
                    const types = e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean) as PetRestrictions['allowedTypes'];
                    updatePetRestrictions({ allowedTypes: types });
                  }}
                  placeholder="dog, cat, fish, bird, small_animal, reptile"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated: dog, cat, bird, fish, small_animal, reptile
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Weight Limit (lbs)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={policies.petRestrictions?.weightLimitLbs ?? ''}
                  onChange={(e) =>
                    updatePetRestrictions({
                      weightLimitLbs: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="No limit"
                  min={0}
                />
              </div>
              <div>
                <label className={labelClass}>Breed Restrictions</label>
                <input
                  type="text"
                  className={inputClass}
                  value={policies.petRestrictions?.restrictedBreeds?.join(', ') || ''}
                  onChange={(e) => {
                    const breeds = e.target.value
                      .split(',')
                      .map((b) => b.trim())
                      .filter(Boolean);
                    updatePetRestrictions({
                      restrictedBreeds: breeds.length > 0 ? breeds : undefined,
                    });
                  }}
                  placeholder="Comma-separated breeds"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Pet Rent ($/month)</label>
              <DollarInput
                className={inputClass}
                cents={policies.petRestrictions?.petRentPerMonth}
                onChange={(c) => updatePetRestrictions({ petRentPerMonth: c || undefined })}
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input"
                checked={policies.petRestrictions?.requiresDocumentation ?? false}
                onChange={(e) =>
                  updatePetRestrictions({ requiresDocumentation: e.target.checked })
                }
              />
              <span className="text-sm">Require pet documentation (vaccination records, etc.)</span>
            </label>
          </div>
        )}
      </div>

      {/* Renters Insurance */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Renters Insurance</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={policies.rentersInsuranceRequired ?? false}
            onChange={(e) => update({ rentersInsuranceRequired: e.target.checked })}
          />
          <span className="text-sm">Renters insurance is required</span>
        </label>

        {policies.rentersInsuranceRequired && (
          <div>
            <label className={labelClass}>Minimum Coverage Amount ($)</label>
            <input
              type="number"
              className={inputClass}
              value={policies.rentersInsuranceMinCoverage ?? ''}
              onChange={(e) =>
                update({
                  rentersInsuranceMinCoverage: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              placeholder="e.g. 100000"
              min={0}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dollar amount (not cents) for minimum coverage.
            </p>
          </div>
        )}
      </div>

      {/* Parking */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Parking</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={policies.parkingIncluded ?? false}
            onChange={(e) => update({ parkingIncluded: e.target.checked })}
          />
          <span className="text-sm">Parking is included</span>
        </label>

        {policies.parkingIncluded && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Number of Spaces</label>
              <input
                type="number"
                className={inputClass}
                value={policies.parkingSpaces ?? ''}
                onChange={(e) =>
                  update({ parkingSpaces: parseInt(e.target.value, 10) || undefined })
                }
                min={0}
              />
            </div>
            <div>
              <label className={labelClass}>Parking Fee ($/month)</label>
              <DollarInput
                className={inputClass}
                cents={policies.parkingFeePerMonth}
                onChange={(c) => update({ parkingFeePerMonth: c || undefined })}
                placeholder="0.00 (included in rent)"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={policies.guestParkingAvailable ?? false}
            onChange={(e) => update({ guestParkingAvailable: e.target.checked })}
          />
          <span className="text-sm">Guest parking is available</span>
        </label>
      </div>

      {/* Storage */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Storage</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={policies.storageIncluded ?? false}
            onChange={(e) => update({ storageIncluded: e.target.checked })}
          />
          <span className="text-sm">Storage is included</span>
        </label>

        {policies.storageIncluded && (
          <div>
            <label className={labelClass}>Storage Fee ($/month)</label>
            <DollarInput
              className={inputClass}
              cents={policies.storageFeePerMonth}
              onChange={(c) => update({ storageFeePerMonth: c || undefined })}
              placeholder="0.00 (included in rent)"
            />
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Quiet Hours</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={policies.quietHoursEnabled ?? false}
            onChange={(e) => update({ quietHoursEnabled: e.target.checked })}
          />
          <span className="text-sm">Enforce quiet hours</span>
        </label>

        {policies.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quiet Hours Start</label>
              <input
                type="time"
                className={inputClass}
                value={policies.quietHoursStart || '22:00'}
                onChange={(e) => update({ quietHoursStart: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Quiet Hours End</label>
              <input
                type="time"
                className={inputClass}
                value={policies.quietHoursEnd || '08:00'}
                onChange={(e) => update({ quietHoursEnd: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tenant Maintenance Responsibilities */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Tenant Maintenance Responsibilities</h2>
        <div className="grid grid-cols-2 gap-2">
          {TENANT_MAINTENANCE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input"
                checked={policies.tenantResponsibilities?.includes(option.value) ?? false}
                onChange={() => toggleMaintenance(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Prohibited Activities */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Prohibited Activities</h2>
        <div className="grid grid-cols-2 gap-2">
          {PROHIBITED_ACTIVITIES_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input"
                checked={policies.prohibitedActivities?.includes(option.value) ?? false}
                onChange={() => toggleProhibited(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Lock Change Policy */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Lock Change Policy</h2>
        <select
          className={inputClass}
          value={policies.lockChangePolicy || 'landlord_only'}
          onChange={(e) =>
            update({
              lockChangePolicy: e.target.value as ResidentialPolicyTerms['lockChangePolicy'],
            })
          }
        >
          <option value="landlord_only">Landlord Only</option>
          <option value="tenant_with_copy">Tenant May Change (Must Provide Copy)</option>
          <option value="either_party">Either Party</option>
        </select>
      </div>
    </div>
  );
}
