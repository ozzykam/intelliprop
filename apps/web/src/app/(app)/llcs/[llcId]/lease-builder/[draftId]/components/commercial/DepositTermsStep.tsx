'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft, CommercialDepositTerms } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

export default function DepositTermsStep({ draft, updateDraft }: StepProps) {
  const [deposit, setDeposit] = useState<CommercialDepositTerms>(
    draft.commercial?.deposit || {
      securityDeposit: 0,
      depositReturnDays: 21,
    }
  );

  function updateDeposit(updates: Partial<CommercialDepositTerms>) {
    const updated = { ...deposit, ...updates };
    setDeposit(updated);
    updateDraft({
      commercial: {
        ...draft.commercial,
        deposit: updated,
      },
    });
  }

  function centsToDisplay(cents: number | undefined): string {
    if (cents === undefined || cents === 0) return '';
    return (cents / 100).toFixed(2);
  }

  function displayToCents(value: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Security Deposit</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Security Deposit Amount ($)
            </label>
            <input
              type="text"
              value={centsToDisplay(deposit.securityDeposit)}
              onChange={(e) =>
                updateDeposit({ securityDeposit: displayToCents(e.target.value) })
              }
              placeholder="0.00"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Deposit Return Period (days)
            </label>
            <input
              type="number"
              value={deposit.depositReturnDays}
              onChange={(e) =>
                updateDeposit({
                  depositReturnDays: parseInt(e.target.value, 10) || 21,
                })
              }
              min={1}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="p-3 bg-secondary/30 border border-input rounded-md">
          <p className="text-sm text-muted-foreground">
            Minnesota law requires landlords to return the security deposit (less any
            lawful deductions) within 21 days of lease termination and tenant vacating
            the premises. An itemized statement of deductions must accompany any
            withheld amounts.
          </p>
        </div>
      </div>
    </div>
  );
}
