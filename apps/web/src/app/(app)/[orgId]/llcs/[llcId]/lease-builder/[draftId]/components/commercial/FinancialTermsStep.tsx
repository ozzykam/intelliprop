'use client';

import { useState } from 'react';
import type {
  LeaseBuilderDraft,
  CommercialFinancialTerms,
  CommercialConvenienceFee,
  LeasePaymentMethod,
  RentStep,
} from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const PAYMENT_METHODS: { value: LeasePaymentMethod; label: string }[] = [
  { value: 'online_portal', label: 'Online Portal' },
  { value: 'ach', label: 'ACH Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'money_order', label: 'Money Order' },
  { value: 'cashiers_check', label: "Cashier's Check" },
  { value: 'cash', label: 'Cash' },
];

const ESCALATION_TYPES: { value: CommercialFinancialTerms['escalationType']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fixed_amount', label: 'Fixed Amount ($/year)' },
  { value: 'fixed_percentage', label: 'Fixed Percentage (%/year)' },
  { value: 'cpi', label: 'Consumer Price Index (CPI)' },
  { value: 'step_schedule', label: 'Step Schedule' },
];

/** A controlled dollar input that doesn't reformat while typing */
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

  function handleChange(value: string) {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setRaw(cleaned);
    onChange(displayToCents(cleaned));
  }

  function handleBlur() {
    const c = displayToCents(raw);
    setRaw(centsToDisplayStr(c));
  }

  return (
    <input
      type="text"
      value={raw}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

function centsToDisplayStr(cents: number | undefined): string {
  if (cents === undefined || cents === 0) return '';
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function displayToCents(value: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/** Hook for a dollar input: keeps raw string locally, syncs cents on change, reformats on blur */
function useDollarInput(
  cents: number | undefined,
  onChange: (cents: number) => void
) {
  const [raw, setRaw] = useState(() => centsToDisplayStr(cents));

  function handleChange(value: string) {
    // Allow digits, one decimal point, and leading empty
    const cleaned = value.replace(/[^0-9.]/g, '');
    setRaw(cleaned);
    onChange(displayToCents(cleaned));
  }

  function handleBlur() {
    // Reformat to 2 decimal places on blur
    const c = displayToCents(raw);
    setRaw(centsToDisplayStr(c));
  }

  return { value: raw, handleChange, handleBlur };
}

export default function FinancialTermsStep({ draft, updateDraft }: StepProps) {
  const leaseType = draft.commercial?.leaseStructure?.leaseType || 'nnn';

  const [financial, setFinancial] = useState<CommercialFinancialTerms>(
    draft.commercial?.financial || {
      baseRentMonthly: 0,
      dueDay: 1,
      escalationType: 'none',
      camEnabled: false,
      camIncludesPropertyTax: false,
      camIncludesInsurance: false,
      camIncludesManagement: false,
      camIncludesUtilities: false,
      camAuditRights: false,
    }
  );

  function updateFinancial(updates: Partial<CommercialFinancialTerms>) {
    const updated = { ...financial, ...updates };
    setFinancial(updated);
    updateDraft({
      commercial: {
        ...draft.commercial,
        financial: updated,
      },
    });
  }

  // Dollar input hooks
  const baseRent = useDollarInput(financial.baseRentMonthly, (c) =>
    updateFinancial({ baseRentMonthly: c })
  );
  const lateFee = useDollarInput(financial.lateFeeAmount, (c) =>
    updateFinancial({ lateFeeAmount: c })
  );
  const returnedPaymentFeeInput = useDollarInput(financial.returnedPaymentFee, (c) =>
    updateFinancial({ returnedPaymentFee: c })
  );
  const escalationAmt = useDollarInput(financial.escalationFixedAmount, (c) =>
    updateFinancial({ escalationFixedAmount: c })
  );

  // Payment methods helpers
  function togglePaymentMethod(method: LeasePaymentMethod) {
    const current = financial.paymentMethods ?? [];
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    updateFinancial({ paymentMethods: updated.length > 0 ? updated : undefined });
  }

  function updateConvenienceFee(method: LeasePaymentMethod, updates: Partial<CommercialConvenienceFee> | null) {
    const current = financial.convenienceFees ?? [];
    if (updates === null) {
      const filtered = current.filter((f) => f.method !== method);
      updateFinancial({ convenienceFees: filtered.length > 0 ? filtered : undefined });
      return;
    }
    const existing = current.find((f) => f.method === method);
    if (existing) {
      updateFinancial({ convenienceFees: current.map((f) => f.method === method ? { ...f, ...updates } : f) });
    } else {
      updateFinancial({ convenienceFees: [...current, { method, feeType: 'flat', ...updates }] });
    }
  }

  // Step schedule management
  function addStep() {
    const steps = financial.escalationStepSchedule || [];
    const lastStep = steps[steps.length - 1];
    const nextYear = lastStep ? lastStep.year + 1 : 2;
    updateFinancial({
      escalationStepSchedule: [...steps, { year: nextYear, monthlyRent: 0 }],
    });
  }

  function updateStep(index: number, updates: Partial<RentStep>) {
    const steps = [...(financial.escalationStepSchedule || [])];
    const existing = steps[index] ?? { year: 1, monthlyRent: 0 };
    steps[index] = { ...existing, ...updates };
    updateFinancial({ escalationStepSchedule: steps });
  }

  function removeStep(index: number) {
    const steps = (financial.escalationStepSchedule || []).filter((_, i) => i !== index);
    updateFinancial({ escalationStepSchedule: steps });
  }

  const isGross = leaseType === 'gross';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Financial Terms</h2>

      {/* Base Rent */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Base Rent</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Monthly Base Rent ($)
            </label>
            <input
              type="text"
              value={baseRent.value}
              onChange={(e) => baseRent.handleChange(e.target.value)}
              onBlur={baseRent.handleBlur}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Due Day of Month (1-28)
            </label>
            <input
              type="number"
              value={financial.dueDay}
              onChange={(e) =>
                updateFinancial({
                  dueDay: Math.max(1, Math.min(28, parseInt(e.target.value, 10))),
                })
              }
              min={1}
              max={28}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Escalation */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Rent Escalation</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Escalation Type</label>
          <select
            value={financial.escalationType}
            onChange={(e) =>
              updateFinancial({
                escalationType: e.target.value as CommercialFinancialTerms['escalationType'],
              })
            }
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ESCALATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {financial.escalationType === 'fixed_amount' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Annual Escalation Amount ($)
            </label>
            <input
              type="text"
              value={escalationAmt.value}
              onChange={(e) => escalationAmt.handleChange(e.target.value)}
              onBlur={escalationAmt.handleBlur}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {financial.escalationType === 'fixed_percentage' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Annual Escalation Percentage (%)
            </label>
            <input
              type="number"
              value={financial.escalationPercentage || ''}
              onChange={(e) =>
                updateFinancial({
                  escalationPercentage: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              placeholder="e.g. 3"
              step="0.1"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {financial.escalationType === 'step_schedule' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Define the monthly rent for each year of the lease.
            </p>
            <table className="w-full text-sm border border-input rounded-md">
              <thead>
                <tr className="bg-secondary/30">
                  <th className="text-left px-3 py-2 font-medium">Year</th>
                  <th className="text-left px-3 py-2 font-medium">Monthly Rent ($)</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {(financial.escalationStepSchedule || []).map((step, index) => (
                  <tr key={index} className="border-t border-input">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={step.year}
                        onChange={(e) =>
                          updateStep(index, {
                            year: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        min={1}
                        className="w-full px-2 py-1 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DollarInput
                        cents={step.monthlyRent}
                        onChange={(c) => updateStep(index, { monthlyRent: c })}
                        className="w-full px-2 py-1 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-destructive hover:text-destructive/80 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addStep}
              className="px-3 py-1.5 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
            >
              Add Year
            </button>
          </div>
        )}
      </div>

      {/* Free Rent Period */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Free Rent / Rent Concession</h2>
        <div>
          <label className="block text-sm font-medium mb-2">
            Free Rent Period (months)
          </label>
          <input
            type="number"
            value={financial.freeRentMonths ?? ''}
            onChange={(e) =>
              updateFinancial({
                freeRentMonths: e.target.value
                  ? Math.max(0, Math.min(24, parseInt(e.target.value, 10)))
                  : undefined,
              })
            }
            placeholder="0"
            min={0}
            max={24}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Number of months at the start of the lease with no base rent obligation (0–24). Leave blank or 0 for none.
          </p>
        </div>
      </div>

      {/* Late Fee & Default Interest */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Late Fee & Default Interest</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Late Fee</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => updateFinancial({ lateFeeType: 'flat' })}
                className={`flex-1 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                  (financial.lateFeeType ?? 'flat') === 'flat'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input hover:bg-secondary'
                }`}
              >
                Flat ($)
              </button>
              <button
                type="button"
                onClick={() => updateFinancial({ lateFeeType: 'percentage', lateFeePercentage: financial.lateFeePercentage ?? 5 })}
                className={`flex-1 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                  financial.lateFeeType === 'percentage'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input hover:bg-secondary'
                }`}
              >
                Percentage (%)
              </button>
            </div>
            {(financial.lateFeeType ?? 'flat') === 'flat' ? (
              <input
                type="text"
                value={lateFee.value}
                onChange={(e) => lateFee.handleChange(e.target.value)}
                onBlur={lateFee.handleBlur}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <div className="relative">
                <input
                  type="number"
                  value={financial.lateFeePercentage || ''}
                  onChange={(e) =>
                    updateFinancial({
                      lateFeePercentage: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 5"
                  step="0.1"
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 pr-8 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Grace Period (days)
            </label>
            <input
              type="number"
              value={financial.gracePeriodDays ?? ''}
              onChange={(e) =>
                updateFinancial({
                  gracePeriodDays: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              placeholder="e.g. 5"
              min={0}
              max={30}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Interest Rate (% per annum)
            </label>
            <input
              type="number"
              value={financial.defaultInterestRate || ''}
              onChange={(e) =>
                updateFinancial({
                  defaultInterestRate: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              placeholder="e.g. 8"
              step="0.1"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Payment Terms</h2>

        {/* Accepted payment methods */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Accepted Payment Methods</label>
          <p className="text-xs text-muted-foreground">Leave blank to use default language (check, ACH, wire transfer).</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(financial.paymentMethods ?? []).includes(m.value)}
                  onChange={() => togglePaymentMethod(m.value)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Payable to */}
        <div>
          <label className="block text-sm font-medium mb-2">Checks / Money Orders Payable To</label>
          <input
            type="text"
            value={financial.payableTo ?? ''}
            onChange={(e) => updateFinancial({ payableTo: e.target.value || undefined })}
            placeholder="e.g. Omar Investments LLC"
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Returned payment fee */}
        <div>
          <label className="block text-sm font-medium mb-2">Returned Payment Fee ($)</label>
          <input
            type="text"
            value={returnedPaymentFeeInput.value}
            onChange={(e) => returnedPaymentFeeInput.handleChange(e.target.value)}
            onBlur={returnedPaymentFeeInput.handleBlur}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="flex items-start gap-3 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={financial.returnedCheckPaymentRestriction || false}
              onChange={(e) => updateFinancial({ returnedCheckPaymentRestriction: e.target.checked || undefined })}
              className="w-4 h-4 rounded border-input mt-0.5"
            />
            <div>
              <span className="text-sm">Restrict payment method after 2 returned checks</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                If 2 or more checks are returned within 12 months, tenant must pay by money order, cashier&apos;s check, or cash for the remainder of the lease.
              </p>
            </div>
          </label>
        </div>

        {/* Convenience fees — shown only when methods are selected */}
        {(financial.paymentMethods?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Convenience Fees (optional)</label>
            <p className="text-xs text-muted-foreground">Set a fee per payment method. Methods with no fee will not appear in the lease.</p>
            {(financial.paymentMethods ?? []).map((method) => {
              const fee = (financial.convenienceFees ?? []).find((f) => f.method === method);
              const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
              return (
                <div key={method} className="flex items-center gap-3 p-3 border border-input rounded-md">
                  <span className="text-sm w-32 shrink-0">{methodLabel}</span>
                  <div className="flex gap-1">
                    {(['none', 'flat', 'percentage'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (t === 'none') updateConvenienceFee(method, null);
                          else updateConvenienceFee(method, { feeType: t });
                        }}
                        className={`px-2 py-1 text-xs border rounded transition-colors ${
                          (fee?.feeType === t || (!fee && t === 'none'))
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-input hover:bg-secondary'
                        }`}
                      >
                        {t === 'none' ? 'No fee' : t === 'flat' ? 'Flat $' : '%'}
                      </button>
                    ))}
                  </div>
                  {fee?.feeType === 'flat' && (
                    <DollarInput
                      cents={fee.flatAmount}
                      onChange={(c) => updateConvenienceFee(method, { flatAmount: c })}
                      placeholder="0.00"
                      className="w-28 px-2 py-1 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                  {fee?.feeType === 'percentage' && (
                    <div className="relative w-28">
                      <input
                        type="number"
                        value={fee.percentage || ''}
                        onChange={(e) =>
                          updateConvenienceFee(method, {
                            percentage: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        placeholder="e.g. 3"
                        step="0.1"
                        min={0}
                        max={100}
                        className="w-full px-2 py-1 pr-6 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CAM / Additional Rent */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Common Area Maintenance (CAM)</h2>

        {isGross ? (
          <div className="p-3 bg-secondary/30 border border-input rounded-md">
            <p className="text-sm text-muted-foreground">
              CAM charges are not available for Gross leases. All operating expenses are
              included in the base rent under a Gross lease structure.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={financial.camEnabled}
                onChange={(e) => updateFinancial({ camEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm font-medium">Enable CAM charges</span>
            </label>

            {financial.camEnabled && (
              <div className="space-y-4 pl-7">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pro Rata Share (%)
                  </label>
                  <input
                    type="number"
                    value={financial.camProRataShare || ''}
                    onChange={(e) =>
                      updateFinancial({
                        camProRataShare: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="e.g. 12.5"
                    step="0.01"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">CAM Includes:</p>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={financial.camIncludesPropertyTax}
                      onChange={(e) =>
                        updateFinancial({ camIncludesPropertyTax: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">Property Tax</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={financial.camIncludesInsurance}
                      onChange={(e) =>
                        updateFinancial({ camIncludesInsurance: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">Insurance</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={financial.camIncludesManagement}
                      onChange={(e) =>
                        updateFinancial({ camIncludesManagement: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">Management Fee</span>
                  </label>

                  {financial.camIncludesManagement && (
                    <div className="pl-7">
                      <label className="block text-sm font-medium mb-2">
                        Management Fee Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={financial.camManagementFeePercent || ''}
                        onChange={(e) =>
                          updateFinancial({
                            camManagementFeePercent: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="e.g. 5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={financial.camIncludesUtilities}
                      onChange={(e) =>
                        updateFinancial({ camIncludesUtilities: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">Utilities</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    CAM Reconciliation Period (days)
                  </label>
                  <input
                    type="number"
                    value={financial.camReconciliationDays || ''}
                    onChange={(e) =>
                      updateFinancial({
                        camReconciliationDays: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })
                    }
                    placeholder="e.g. 90"
                    min={1}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={financial.camAuditRights}
                    onChange={(e) =>
                      updateFinancial({ camAuditRights: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm">Tenant has CAM audit rights</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
