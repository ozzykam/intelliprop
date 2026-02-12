'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft, CommercialLeaseStructure } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const LEASE_TYPE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  nnn: {
    label: 'Triple Net (NNN)',
    description:
      'Tenant pays base rent plus property taxes, insurance, and maintenance costs (CAM). Most common for commercial leases. Landlord has lower risk.',
  },
  gross: {
    label: 'Gross Lease',
    description:
      'Tenant pays a single rent amount. Landlord covers all property expenses including taxes, insurance, and maintenance. Simpler for tenant.',
  },
  modified_gross: {
    label: 'Modified Gross',
    description:
      'A hybrid structure where some expenses are included in base rent and others are passed through to the tenant. Offers flexibility for both parties.',
  },
};

export default function LeaseStructureStep({ draft, updateDraft }: StepProps) {
  const [structure, setStructure] = useState<CommercialLeaseStructure>(
    draft.commercial?.leaseStructure || {
      leaseType: 'nnn',
      startDate: '',
      renewalOptions: 0,
    }
  );

  function updateStructure(updates: Partial<CommercialLeaseStructure>) {
    const updated = { ...structure, ...updates };
    setStructure(updated);
    updateDraft({
      commercial: {
        ...draft.commercial,
        leaseStructure: updated,
      },
    });
  }

  const isFixedTerm = draft.leaseType === 'fixed_term';
  const isMonthToMonth = draft.leaseType === 'month_to_month';
  const hasRenewalOptions = structure.renewalOptions > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Lease Structure</h2>

      {/* Lease Type */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Lease Type</h2>
        <div className="space-y-3">
          {Object.entries(LEASE_TYPE_DESCRIPTIONS).map(([value, info]) => (
            <label
              key={value}
              className="flex items-start gap-3 p-3 border border-input rounded-md hover:bg-secondary/50 cursor-pointer"
            >
              <input
                type="radio"
                name="commercialLeaseType"
                value={value}
                checked={structure.leaseType === value}
                onChange={() =>
                  updateStructure({
                    leaseType: value as CommercialLeaseStructure['leaseType'],
                  })
                }
                className="w-4 h-4 border-input mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">{info.label}</span>
                <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="p-3 bg-secondary/30 border border-input rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>NNN:</strong> Tenant pays base rent + taxes + insurance + CAM. Most transparent cost structure.
            <br />
            <strong>Gross:</strong> One all-inclusive rent. Landlord absorbs expense variability.
            <br />
            <strong>Modified Gross:</strong> Base rent includes some expenses; others (often utilities, janitorial) are tenant responsibility.
          </p>
        </div>
      </div>

      {/* Term Dates */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Term</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={structure.startDate}
              onChange={(e) => updateStructure({ startDate: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {isFixedTerm && (
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={structure.endDate || ''}
                onChange={(e) => updateStructure({ endDate: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {isMonthToMonth && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Notice to Terminate (days)
              </label>
              <input
                type="number"
                value={structure.noticeToTerminateDays || ''}
                onChange={(e) =>
                  updateStructure({
                    noticeToTerminateDays: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="e.g. 60"
                min={1}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>
      </div>

      {/* Renewal Options */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Renewal Options</h2>
        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Renewal Options (0-5)
          </label>
          <input
            type="number"
            value={structure.renewalOptions}
            onChange={(e) =>
              updateStructure({
                renewalOptions: Math.max(0, Math.min(5, parseInt(e.target.value, 10) || 0)),
              })
            }
            min={0}
            max={5}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {hasRenewalOptions && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Renewal Term Length
              </label>
              <input
                type="text"
                value={structure.renewalTermLength || ''}
                onChange={(e) => updateStructure({ renewalTermLength: e.target.value })}
                placeholder="e.g. 5 years"
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Renewal Notice Period (days)
              </label>
              <input
                type="number"
                value={structure.renewalNoticePeriodDays || ''}
                onChange={(e) =>
                  updateStructure({
                    renewalNoticePeriodDays: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="e.g. 180"
                min={1}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
