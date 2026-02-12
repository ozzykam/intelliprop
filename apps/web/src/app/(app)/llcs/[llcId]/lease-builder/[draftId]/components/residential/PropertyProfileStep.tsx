'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft, PropertyProfile } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass =
  'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'block text-sm font-medium mb-2';

const UNIT_TYPES: { value: NonNullable<PropertyProfile['unitType']>; label: string }[] = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhome', label: 'Townhome' },
  { value: 'condo', label: 'Condo' },
];

export default function PropertyProfileStep({ draft, updateDraft }: StepProps) {
  const [profile, setProfile] = useState<PropertyProfile>(
    draft.propertyProfile || {
      city: '',
      county: '',
      hasSharedUtilities: false,
    }
  );

  function update(changes: Partial<PropertyProfile>) {
    const updated = { ...profile, ...changes };
    setProfile(updated);
    updateDraft({ propertyProfile: updated });
  }

  const isMinneapolis = profile.city.toLowerCase().trim() === 'minneapolis';
  const isStPaul = profile.city.toLowerCase().trim() === 'st. paul' || profile.city.toLowerCase().trim() === 'saint paul';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Property Profile</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              className={inputClass}
              value={profile.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="e.g. Minneapolis, St. Paul"
            />
          </div>
          <div>
            <label className={labelClass}>County</label>
            <input
              type="text"
              className={inputClass}
              value={profile.county}
              onChange={(e) => update({ county: e.target.value })}
              placeholder="e.g. Hennepin"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Year Built</label>
            <input
              type="number"
              className={inputClass}
              value={profile.yearBuilt ?? ''}
              onChange={(e) =>
                update({ yearBuilt: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              placeholder="e.g. 1985"
            />
          </div>
          <div>
            <label className={labelClass}>Unit Type</label>
            <select
              className={inputClass}
              value={profile.unitType || ''}
              onChange={(e) =>
                update({
                  unitType: (e.target.value || undefined) as PropertyProfile['unitType'],
                })
              }
            >
              <option value="">Select type</option>
              {UNIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-input"
              checked={profile.isFurnished ?? false}
              onChange={(e) => update({ isFurnished: e.target.checked })}
            />
            <span className="text-sm">Property is furnished</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-input"
              checked={profile.hasSharedUtilities}
              onChange={(e) => update({ hasSharedUtilities: e.target.checked })}
            />
            <span className="text-sm">Property has shared utilities</span>
          </label>
        </div>
      </div>

      {/* Minneapolis-specific fields */}
      {isMinneapolis && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Minneapolis Requirements</h2>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-input"
              checked={profile.hasRentalLicense ?? false}
              onChange={(e) => update({ hasRentalLicense: e.target.checked })}
            />
            <span className="text-sm">Property has a Minneapolis rental license</span>
          </label>

          <div>
            <label className={labelClass}>Minneapolis License Status</label>
            <select
              className={inputClass}
              value={profile.minneapolisLicenseStatus || ''}
              onChange={(e) =>
                update({
                  minneapolisLicenseStatus: (e.target.value || undefined) as PropertyProfile['minneapolisLicenseStatus'],
                })
              }
            >
              <option value="">Select status</option>
              <option value="yes">Yes - Licensed</option>
              <option value="no">No - Not Licensed</option>
              <option value="unsure">Unsure</option>
            </select>
          </div>
        </div>
      )}

      {/* St. Paul-specific fields */}
      {isStPaul && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">St. Paul Requirements</h2>

          <div>
            <label className={labelClass}>Rent Stabilization Status</label>
            <select
              className={inputClass}
              value={profile.stPaulRentStabilization || ''}
              onChange={(e) =>
                update({
                  stPaulRentStabilization: (e.target.value || undefined) as PropertyProfile['stPaulRentStabilization'],
                })
              }
            >
              <option value="">Select status</option>
              <option value="subject">Subject to Rent Stabilization</option>
              <option value="exempt">Exempt from Rent Stabilization</option>
              <option value="unsure">Unsure</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              St. Paul limits annual rent increases to 3% unless an exemption applies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
