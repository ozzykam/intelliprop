'use client';

import { useState } from 'react';
import type {
  LeaseBuilderDraft,
  ResidentialDepositTerms,
  NonrefundableFee,
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

function centsToDisplay(cents: number | undefined): string {
  if (cents == null || isNaN(cents)) return '';
  return (cents / 100).toFixed(2);
}

function displayToCents(display: string): number {
  const parsed = parseFloat(display);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export default function DepositTermsStep({ draft, updateDraft }: StepProps) {
  const existing = draft.residential?.deposit;

  const [deposit, setDeposit] = useState<Partial<ResidentialDepositTerms>>({
    securityDeposit: existing?.securityDeposit ?? 0,
    petDeposit: existing?.petDeposit,
    keyFobDeposit: existing?.keyFobDeposit,
    nonrefundableFees: existing?.nonrefundableFees ?? [],
    useMoveinChecklist: existing?.useMoveinChecklist ?? false,
  });

  function update(changes: Partial<ResidentialDepositTerms>) {
    const updated = { ...deposit, ...changes };
    setDeposit(updated);
    updateDraft({
      residential: {
        ...draft.residential,
        deposit: updated as ResidentialDepositTerms,
      },
    });
  }

  function addFee() {
    const fees = [...(deposit.nonrefundableFees || []), { name: '', amount: 0 }];
    update({ nonrefundableFees: fees });
  }

  function updateFee(index: number, changes: Partial<NonrefundableFee>) {
    const fees = [...(deposit.nonrefundableFees || [])];
    fees[index] = { 
      name: fees[index]?.name ?? '',
      amount: fees[index]?.amount ?? 0,
      ...changes 
    };
    update({ nonrefundableFees: fees });
  }

  function removeFee(index: number) {
    const fees = (deposit.nonrefundableFees || []).filter((_, i) => i !== index);
    update({ nonrefundableFees: fees });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Deposits & Fees</h2>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        Minnesota law requires landlords to return security deposits within 21 days of
        lease termination, with an itemized statement of any deductions. Interest must be
        paid on deposits held for units in buildings with more than 24 units.
      </div>

      <div className="space-y-4">
        {/* Security Deposit */}
        <div>
          <label className={labelClass}>Security Deposit ($)</label>
          <input
            type="number"
            className={inputClass}
            value={centsToDisplay(deposit.securityDeposit)}
            onChange={(e) => update({ securityDeposit: displayToCents(e.target.value) })}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Pet Deposit */}
        <div>
          <label className={labelClass}>Pet Deposit ($, optional)</label>
          <input
            type="number"
            className={inputClass}
            value={centsToDisplay(deposit.petDeposit)}
            onChange={(e) =>
              update({
                petDeposit: e.target.value ? displayToCents(e.target.value) : undefined,
              })
            }
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Key/Fob Deposit */}
        <div>
          <label className={labelClass}>Key/Fob Deposit ($, optional)</label>
          <input
            type="number"
            className={inputClass}
            value={centsToDisplay(deposit.keyFobDeposit)}
            onChange={(e) =>
              update({
                keyFobDeposit: e.target.value ? displayToCents(e.target.value) : undefined,
              })
            }
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {/* Non-refundable Fees */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Non-Refundable Fees</h2>

        {(deposit.nonrefundableFees || []).map((fee, index) => (
          <div key={index} className="flex items-end gap-3">
            <div className="flex-1">
              <label className={labelClass}>Fee Name</label>
              <input
                type="text"
                className={inputClass}
                value={fee.name}
                onChange={(e) => updateFee(index, { name: e.target.value })}
                placeholder="e.g. Admin Fee, Cleaning Fee"
              />
            </div>
            <div className="w-40">
              <label className={labelClass}>Amount ($)</label>
              <input
                type="number"
                className={inputClass}
                value={centsToDisplay(fee.amount)}
                onChange={(e) => updateFee(index, { amount: displayToCents(e.target.value) })}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <button
              type="button"
              onClick={() => removeFee(index)}
              className="px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addFee}
          className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
        >
          + Add Non-Refundable Fee
        </button>
      </div>

      {/* Move-in Checklist */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Move-In Checklist</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-input"
            checked={deposit.useMoveinChecklist ?? false}
            onChange={(e) => update({ useMoveinChecklist: e.target.checked })}
          />
          <span className="text-sm">
            Include move-in / move-out condition checklist
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          A move-in checklist helps document the condition of the property at the start of
          the tenancy and can protect both parties during security deposit disputes.
        </p>
      </div>
    </div>
  );
}
