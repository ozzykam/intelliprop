'use client';

import { useState, useEffect } from 'react';
import type { LeaseBuilderDraft, PropertyProfile, CommercialSpaceType } from '@shared/types/leaseBuilder';

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
  { value: 'mixed', label: 'Mixed Use' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'medical', label: 'Medical' },
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

  const isMinneapolisOrStPaul =
    profile.city.toLowerCase() === 'minneapolis' ||
    profile.city.toLowerCase() === 'st. paul' ||
    profile.city.toLowerCase() === 'saint paul';

  const showLiquorLicense =
    profile.commercialSpaceType === 'restaurant' ||
    profile.commercialSpaceType === 'medical';

  const showOutdoorPatio =
    profile.commercialSpaceType === 'restaurant' ||
    profile.commercialSpaceType === 'retail';

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
              type="number"
              value={profile.premisesSqft || ''}
              onChange={(e) =>
                updateProfile({
                  premisesSqft: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="e.g. 2500"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Space Type */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Commercial Space Type</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Space Type</label>
          <select
            value={profile.commercialSpaceType || ''}
            onChange={(e) =>
              updateProfile({
                commercialSpaceType: e.target.value as CommercialSpaceType || undefined,
              })
            }
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select space type</option>
            {COMMERCIAL_SPACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
