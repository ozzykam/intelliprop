'use client';

import { useState, useEffect } from 'react';
import type {
  LeaseBuilderDraft,
  ResidentialRentTerms,
  LeasePaymentMethod,
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

const PAYMENT_METHODS: { value: LeasePaymentMethod; label: string }[] = [
  { value: 'online_portal', label: 'Online Portal' },
  { value: 'ach', label: 'ACH / Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'money_order', label: 'Money Order' },
  { value: 'cashiers_check', label: "Cashier's Check" },
  { value: 'cash', label: 'Cash' },
];

function centsToDisplay(cents: number | undefined): string {
  if (cents == null || isNaN(cents) || cents === 0) return '';
  return (cents / 100).toFixed(2);
}

function displayToCents(display: string): number {
  const parsed = parseFloat(display);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Dollar input that stores raw text while typing and only converts to cents on blur.
 * This prevents the value from reformatting mid-keystroke.
 */
function DollarInput({
  value,
  onChange,
  placeholder = '0.00',
  className,
}: {
  value: number | undefined;
  onChange: (cents: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [raw, setRaw] = useState(() => centsToDisplay(value));

  // Sync from parent when value changes externally (e.g. reset)
  useEffect(() => {
    setRaw(centsToDisplay(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={raw}
      placeholder={placeholder}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        const cents = displayToCents(raw);
        onChange(cents);
        setRaw(centsToDisplay(cents));
      }}
    />
  );
}

export default function RentTermsStep({ draft, updateDraft }: StepProps) {
  const existing = draft.residential?.rent;

  const [rent, setRent] = useState<Partial<ResidentialRentTerms>>({
    monthlyRent: existing?.monthlyRent ?? 0,
    dueDay: existing?.dueDay ?? 1,
    gracePeriodDays: existing?.gracePeriodDays ?? 0,
    lateFeeType: existing?.lateFeeType ?? 'none',
    lateFeeAmount: existing?.lateFeeAmount,
    lateFeeMaxAmount: existing?.lateFeeMaxAmount,
    returnedPaymentFee: existing?.returnedPaymentFee,
    paymentMethods: existing?.paymentMethods ?? [],
    prorationMethod: existing?.prorationMethod ?? 'daily',
    holdoverTerms: existing?.holdoverTerms ?? 'month_to_month',
    startDate: existing?.startDate ?? '',
    endDate: existing?.endDate,
    noticeToTerminateDays: existing?.noticeToTerminateDays,
    priorRentAmount: existing?.priorRentAmount,
    rentIncreaseFromPrior: existing?.rentIncreaseFromPrior,
  });

  function update(changes: Partial<ResidentialRentTerms>) {
    const updated = { ...rent, ...changes };
    setRent(updated);
    updateDraft({
      residential: {
        ...draft.residential,
        rent: updated as ResidentialRentTerms,
      },
    });
  }

  function toggleLeasePaymentMethod(method: LeasePaymentMethod) {
    const current = rent.paymentMethods || [];
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    update({ paymentMethods: updated });
  }

  const isFixedTerm = draft.leaseType === 'fixed_term';
  const isMonthToMonth = draft.leaseType === 'month_to_month';
  const isStPaulSubject =
    draft.propertyProfile?.stPaulRentStabilization === 'subject';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Rent & Payment Terms</h2>

      {/* Monthly Rent & Due Day */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Monthly Rent ($)</label>
            <DollarInput
              className={inputClass}
              value={rent.monthlyRent}
              onChange={(cents) => update({ monthlyRent: cents })}
            />
          </div>
          <div>
            <label className={labelClass}>Due Day of Month</label>
            <input
              type="number"
              className={inputClass}
              value={rent.dueDay ?? ''}
              onChange={(e) => update({ dueDay: parseInt(e.target.value, 10) || 1 })}
              min={1}
              max={28}
            />
            <p className="text-xs text-muted-foreground mt-1">1-28</p>
          </div>
        </div>

        {/* Grace Period */}
        <div>
          <label className={labelClass}>Grace Period (days)</label>
          <input
            type="number"
            className={inputClass}
            value={rent.gracePeriodDays ?? ''}
            onChange={(e) => update({ gracePeriodDays: parseInt(e.target.value, 10) || 0 })}
            min={0}
          />
        </div>
      </div>

      {/* Late Fees */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Late Fees</h2>

        <div>
          <label className={labelClass}>Late Fee Type</label>
          <select
            className={inputClass}
            value={rent.lateFeeType || 'none'}
            onChange={(e) =>
              update({
                lateFeeType: e.target.value as ResidentialRentTerms['lateFeeType'],
                lateFeeAmount: undefined,
                lateFeeMaxAmount: undefined,
              })
            }
          >
            <option value="none">No Late Fee</option>
            <option value="flat">Flat Amount</option>
            <option value="percentage">Percentage of Rent</option>
          </select>
        </div>

        {rent.lateFeeType === 'flat' && (
          <div>
            <label className={labelClass}>Late Fee Amount ($)</label>
            <DollarInput
              className={inputClass}
              value={rent.lateFeeAmount}
              onChange={(cents) => update({ lateFeeAmount: cents })}
            />
          </div>
        )}

        {rent.lateFeeType === 'percentage' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Late Fee Percentage (%)</label>
              <input
                type="number"
                className={inputClass}
                value={rent.lateFeeAmount ?? ''}
                onChange={(e) =>
                  update({ lateFeeAmount: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 5"
                step="0.1"
                min="0"
                max="8"
              />
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                Minnesota law limits late fees to 8% of the overdue rent amount for residential leases.
              </p>
            </div>
            <div>
              <label className={labelClass}>Maximum Late Fee Amount ($)</label>
              <DollarInput
                className={inputClass}
                value={rent.lateFeeMaxAmount}
                onChange={(cents) => update({ lateFeeMaxAmount: cents })}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Returned Payment Fee ($)</label>
          <DollarInput
            className={inputClass}
            value={rent.returnedPaymentFee}
            onChange={(cents) => update({ returnedPaymentFee: cents })}
          />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Payment Methods</h2>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((method) => (
            <label key={method.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input"
                checked={rent.paymentMethods?.includes(method.value) ?? false}
                onChange={() => toggleLeasePaymentMethod(method.value)}
              />
              <span className="text-sm">{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Proration & Holdover */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Proration & Holdover</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Proration Method</label>
            <select
              className={inputClass}
              value={rent.prorationMethod || 'daily'}
              onChange={(e) =>
                update({ prorationMethod: e.target.value as 'daily' | 'none' })
              }
            >
              <option value="daily">Daily Proration</option>
              <option value="none">No Proration</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Holdover Terms</label>
            <select
              className={inputClass}
              value={rent.holdoverTerms || 'month_to_month'}
              onChange={(e) =>
                update({
                  holdoverTerms: e.target.value as ResidentialRentTerms['holdoverTerms'],
                })
              }
            >
              <option value="month_to_month">Convert to Month-to-Month</option>
              <option value="double_rent">Double Rent</option>
              <option value="none">No Holdover Provision</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lease Dates */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Lease Dates</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={rent.startDate || ''}
              onChange={(e) => update({ startDate: e.target.value })}
            />
          </div>
          {isFixedTerm && (
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                className={inputClass}
                value={rent.endDate || ''}
                onChange={(e) => update({ endDate: e.target.value })}
              />
            </div>
          )}
        </div>

        {isMonthToMonth && (
          <div>
            <label className={labelClass}>Notice to Terminate (days)</label>
            <input
              type="number"
              className={inputClass}
              value={rent.noticeToTerminateDays ?? ''}
              onChange={(e) =>
                update({
                  noticeToTerminateDays: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              placeholder="e.g. 30"
              min={0}
            />
          </div>
        )}
      </div>

      {/* St. Paul Rent Stabilization */}
      {isStPaulSubject && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">St. Paul Rent Stabilization</h2>
          <p className="text-sm text-muted-foreground">
            This property is subject to St. Paul rent stabilization (3% annual cap).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prior Rent Amount ($)</label>
              <DollarInput
                className={inputClass}
                value={rent.priorRentAmount}
                onChange={(cents) => update({ priorRentAmount: cents })}
              />
            </div>
            <div>
              <label className={labelClass}>Rent Increase from Prior ($)</label>
              <DollarInput
                className={inputClass}
                value={rent.rentIncreaseFromPrior}
                onChange={(cents) => update({ rentIncreaseFromPrior: cents })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
