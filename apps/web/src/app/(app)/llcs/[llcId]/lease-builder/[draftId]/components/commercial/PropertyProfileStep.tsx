'use client';

import { useState, useEffect } from 'react';
import type { LeaseBuilderDraft, PropertyProfile, CommercialSpaceType } from '@shared/types/leaseBuilder';

function useIntegerInput(value: number | undefined, onChange: (n: number | undefined) => void) {
  const [raw, setRaw] = useState<string>(() =>
    value ? value.toLocaleString('en-US') : ''
  );
  function handleChange(str: string) {
    const digits = str.replace(/[^0-9]/g, '');
    setRaw(digits);
    onChange(digits ? parseInt(digits, 10) : undefined);
  }
  function handleBlur() {
    const n = parseInt(raw.replace(/,/g, ''), 10);
    setRaw(isNaN(n) ? '' : n.toLocaleString('en-US'));
  }
  return { value: raw, handleChange, handleBlur };
}

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const COMMERCIAL_SPACE_TYPES: { value: CommercialSpaceType; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'medical', label: 'Medical' },
  { value: 'daycare_services', label: 'Daycare Services' },
];

export default function PropertyProfileStep({ draft, llcId, updateDraft }: StepProps) {
  const [profile, setProfile] = useState<PropertyProfile>(
    draft.propertyProfile || {
      city: '',
      county: '',
      hasSharedUtilities: false,
    }
  );

  // Pre-fill from property data when step loads
  useEffect(() => {
    if (!draft.propertyId) return;
    // Skip if profile already has city filled (user already edited)
    if (profile.city) return;

    async function fetchProperty() {
      try {
        const res = await fetch(`/api/llcs/${llcId}/properties/${draft.propertyId}`);
        const data = await res.json();
        if (data.ok && data.data) {
          const prop = data.data;
          const prefilled: Partial<PropertyProfile> = {};
          if (prop.address?.city && !profile.city) prefilled.city = prop.address.city;
          if (prop.county && !profile.county) prefilled.county = prop.county;
          if (prop.yearBuilt && !profile.yearBuilt) prefilled.yearBuilt = prop.yearBuilt;
          if (prop.parcelInfo.parcelAreaSqft && !profile.premisesSqft) prefilled.premisesSqft = prop.parcelInfo.parcelAreaSqft;
          if (Object.keys(prefilled).length > 0) {
            const updated = { ...profile, ...prefilled };
            setProfile(updated);
            updateDraft({ propertyProfile: updated });
          }
        }
      } catch {
        // silent — user can fill manually
      }
    }
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.propertyId, llcId]);

  function updateProfile(updates: Partial<PropertyProfile>) {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    updateDraft({ propertyProfile: updated });
  }

  const sqftInput = useIntegerInput(profile.premisesSqft, (n) =>
    updateProfile({ premisesSqft: n })
  );

  const buildingTotalSqftInput = useIntegerInput(profile.buildingTotalSqft, (n) =>
    updateProfile({ buildingTotalSqft: n })
  );

  const isMinneapolisOrStPaul =
    profile.city.toLowerCase() === 'minneapolis' ||
    profile.city.toLowerCase() === 'st. paul' ||
    profile.city.toLowerCase() === 'saint paul';

  const spaceTypes = profile.commercialSpaceTypes ?? [];

  const showLiquorLicense =
    spaceTypes.includes('restaurant') ||
    spaceTypes.includes('medical');

  const showOutdoorPatio =
    spaceTypes.includes('restaurant') ||
    spaceTypes.includes('retail');

  function toggleSpaceType(type: CommercialSpaceType) {
    const current = profile.commercialSpaceTypes ?? [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateProfile({ commercialSpaceTypes: updated.length > 0 ? updated : undefined });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Property Profile</h2>

      {/* Location */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => updateProfile({ city: e.target.value })}
              placeholder="e.g. Minneapolis"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">County</label>
            <input
              type="text"
              value={profile.county}
              onChange={(e) => updateProfile({ county: e.target.value })}
              placeholder="e.g. Hennepin"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {isMinneapolisOrStPaul && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            City-specific overlays for {profile.city} will be applied to this lease.
            Additional disclosures and addenda may be required.
          </div>
        )}
      </div>

      {/* Building Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Building Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Year Built</label>
            <input
              type="number"
              value={profile.yearBuilt || ''}
              onChange={(e) =>
                updateProfile({
                  yearBuilt: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="e.g. 1990"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Premises Sq Ft</label>
            <input
              type="text"
              value={sqftInput.value}
              onChange={(e) => sqftInput.handleChange(e.target.value)}
              onBlur={sqftInput.handleBlur}
              placeholder="e.g. 2,500"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Building Total Sq Ft</label>
            <input
              type="text"
              value={buildingTotalSqftInput.value}
              onChange={(e) => buildingTotalSqftInput.handleChange(e.target.value)}
              onBlur={buildingTotalSqftInput.handleBlur}
              placeholder="e.g. 50,000"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Landlord Address (Principal Office)</label>
            <input
              type="text"
              value={profile.landlordAddress || ''}
              onChange={(e) => updateProfile({ landlordAddress: e.target.value })}
              placeholder="e.g. 123 Main St, Minneapolis, MN 55401"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Used in the Parties clause as Landlord&apos;s mailing address.</p>
          </div>
        </div>
      </div>

      {/* Space Type */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Commercial Space Type</h2>
        <p className="text-sm text-muted-foreground">Select all that apply.</p>
        <div className="grid grid-cols-3 gap-3">
          {COMMERCIAL_SPACE_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={spaceTypes.includes(t.value)}
                onChange={() => toggleSpaceType(t.value)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zoning & Compliance */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Zoning & Compliance</h2>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={profile.zoningConfirmed || false}
            onChange={(e) => updateProfile({ zoningConfirmed: e.target.checked })}
            className="w-4 h-4 rounded border-input mt-0.5"
          />
          <span className="text-sm">
            I confirm the intended use complies with local zoning
          </span>
        </label>

        {showLiquorLicense && (
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={profile.liquorLicenseRequired || false}
              onChange={(e) => updateProfile({ liquorLicenseRequired: e.target.checked })}
              className="w-4 h-4 rounded border-input mt-0.5"
            />
            <span className="text-sm">Liquor license required</span>
          </label>
        )}

        {showOutdoorPatio && (
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={profile.outdoorPatioUse || false}
              onChange={(e) => updateProfile({ outdoorPatioUse: e.target.checked })}
              className="w-4 h-4 rounded border-input mt-0.5"
            />
            <span className="text-sm">Outdoor patio use</span>
          </label>
        )}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={profile.hasSharedUtilities}
            onChange={(e) => updateProfile({ hasSharedUtilities: e.target.checked })}
            className="w-4 h-4 rounded border-input mt-0.5"
          />
          <span className="text-sm">Has shared utilities</span>
        </label>
      </div>
    </div>
  );
}
