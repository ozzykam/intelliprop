'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft, OccupancyTerms } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass =
  'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'block text-sm font-medium mb-2';

export default function OccupancyTermsStep({ draft, updateDraft }: StepProps) {
  const existing = draft.residential?.occupancy;

  const [occupancy, setOccupancy] = useState<Partial<OccupancyTerms>>({
    namedOccupants: existing?.namedOccupants ?? [],
    maxOccupants: existing?.maxOccupants ?? 1,
    guestMaxConsecutiveDays: existing?.guestMaxConsecutiveDays ?? 14,
    guestMaxDaysPerYear: existing?.guestMaxDaysPerYear,
    sublettingAllowed: existing?.sublettingAllowed ?? false,
    sublettingRequiresConsent: existing?.sublettingRequiresConsent ?? true,
    assignmentAllowed: existing?.assignmentAllowed ?? false,
  });

  function update(changes: Partial<OccupancyTerms>) {
    const updated = { ...occupancy, ...changes };
    setOccupancy(updated);
    updateDraft({
      residential: {
        ...draft.residential,
        occupancy: updated as OccupancyTerms,
      },
    });
  }

  function addOccupant() {
    const occupants = [...(occupancy.namedOccupants || []), ''];
    update({ namedOccupants: occupants });
  }

  function updateOccupant(index: number, value: string) {
    const occupants = [...(occupancy.namedOccupants || [])];
    occupants[index] = value;
    update({ namedOccupants: occupants });
  }

  function removeOccupant(index: number) {
    const occupants = (occupancy.namedOccupants || []).filter((_, i) => i !== index);
    update({ namedOccupants: occupants });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Occupancy & Guests</h2>

      {/* Named Occupants */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Named Occupants</h2>
        <p className="text-sm text-muted-foreground">
          List all persons who will occupy the premises. This includes the tenant(s) and
          any additional occupants such as family members.
        </p>

        {(occupancy.namedOccupants || []).map((occupant, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="text"
              className={inputClass}
              value={occupant}
              onChange={(e) => updateOccupant(index, e.target.value)}
              placeholder="Full name of occupant"
            />
            <button
              type="button"
              onClick={() => removeOccupant(index)}
              className="px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 whitespace-nowrap"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addOccupant}
          className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
        >
          + Add Occupant
        </button>
      </div>

      {/* Max Occupants */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Maximum Occupants</label>
          <input
            type="number"
            className={inputClass}
            value={occupancy.maxOccupants ?? ''}
            onChange={(e) =>
              update({ maxOccupants: parseInt(e.target.value, 10) || 1 })
            }
            min={1}
          />
        </div>
      </div>

      {/* Guest Policy */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Guest Policy</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Max Consecutive Guest Days</label>
            <input
              type="number"
              className={inputClass}
              value={occupancy.guestMaxConsecutiveDays ?? ''}
              onChange={(e) =>
                update({
                  guestMaxConsecutiveDays: parseInt(e.target.value, 10) || 0,
                })
              }
              min={0}
            />
          </div>
          <div>
            <label className={labelClass}>Max Guest Days Per Year (optional)</label>
            <input
              type="number"
              className={inputClass}
              value={occupancy.guestMaxDaysPerYear ?? ''}
              onChange={(e) =>
                update({
                  guestMaxDaysPerYear: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              min={0}
              placeholder="Leave blank for no limit"
            />
          </div>
        </div>
      </div>

      {/* Subletting & Assignment */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Subletting & Assignment</h2>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={occupancy.sublettingAllowed ?? false}
            onChange={(e) => update({ sublettingAllowed: e.target.checked })}
          />
          <span className="text-sm">Subletting is allowed</span>
        </label>

        {occupancy.sublettingAllowed && (
          <label className="flex items-center gap-3 ml-6">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-input"
              checked={occupancy.sublettingRequiresConsent ?? true}
              onChange={(e) => update({ sublettingRequiresConsent: e.target.checked })}
            />
            <span className="text-sm">Subletting requires landlord consent</span>
          </label>
        )}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={occupancy.assignmentAllowed ?? false}
            onChange={(e) => update({ assignmentAllowed: e.target.checked })}
          />
          <span className="text-sm">Lease assignment is allowed</span>
        </label>
      </div>
    </div>
  );
}
