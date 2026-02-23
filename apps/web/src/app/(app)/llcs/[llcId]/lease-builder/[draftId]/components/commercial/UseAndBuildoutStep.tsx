'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft, UseAndBuildoutTerms } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

function centsToDisplayStr(cents: number | undefined): string {
  if (cents === undefined || cents === 0) return '';
  return (cents / 100).toFixed(2);
}

function displayToCents(value: string): number {
  const parsed = parseFloat(value);
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

export default function UseAndBuildoutStep({ draft, updateDraft }: StepProps) {
  const [buildout, setBuildout] = useState<UseAndBuildoutTerms>(
    draft.commercial?.useAndBuildout || {
      permittedUse: '',
      exclusiveUse: false,
      tiType: 'none',
      improvementOwnership: 'landlord',
      signageAllowed: false,
      signageRequiresApproval: false,
      premisesCondition: 'as_is',
    }
  );

  function updateBuildout(updates: Partial<UseAndBuildoutTerms>) {
    const updated = { ...buildout, ...updates };
    setBuildout(updated);
    updateDraft({
      commercial: {
        ...draft.commercial,
        useAndBuildout: updated,
      },
    });
  }

  const showTiDetails = buildout.tiType === 'landlord_allowance' || buildout.tiType === 'work_letter';
  const showWorkLetter = buildout.tiType === 'work_letter';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Use & Buildout</h2>

      {/* Permitted Use */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Permitted Use</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Permitted Use</label>
          <textarea
            value={buildout.permittedUse}
            onChange={(e) => updateBuildout({ permittedUse: e.target.value })}
            placeholder="Describe the permitted use of the premises..."
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={buildout.exclusiveUse}
            onChange={(e) => updateBuildout({ exclusiveUse: e.target.checked })}
            className="w-4 h-4 rounded border-input mt-0.5"
          />
          <span className="text-sm">Exclusive use clause</span>
        </label>

        {buildout.exclusiveUse && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Exclusive Use Description
            </label>
            <textarea
              value={buildout.exclusiveUseDescription || ''}
              onChange={(e) =>
                updateBuildout({ exclusiveUseDescription: e.target.value })
              }
              placeholder="Describe the exclusive use rights..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      {/* Tenant Improvements */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Tenant Improvements</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="tiType"
              value="none"
              checked={buildout.tiType === 'none'}
              onChange={() => updateBuildout({ tiType: 'none' })}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">None</span>
              <p className="text-xs text-muted-foreground">No tenant improvement allowance.</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="tiType"
              value="landlord_allowance"
              checked={buildout.tiType === 'landlord_allowance'}
              onChange={() => updateBuildout({ tiType: 'landlord_allowance' })}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">Landlord Allowance</span>
              <p className="text-xs text-muted-foreground">
                Landlord provides a fixed dollar allowance for improvements.
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="tiType"
              value="work_letter"
              checked={buildout.tiType === 'work_letter'}
              onChange={() => updateBuildout({ tiType: 'work_letter' })}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">Work Letter</span>
              <p className="text-xs text-muted-foreground">
                Detailed specification of improvements to be completed.
              </p>
            </div>
          </label>
        </div>

        {showTiDetails && (
          <div className="space-y-4 pl-4 border-l-2 border-input">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  TI Allowance ($)
                </label>
                <DollarInput
                  cents={buildout.tiAllowance}
                  onChange={(c) => updateBuildout({ tiAllowance: c })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Allowance Scope
                </label>
                <select
                  value={buildout.tiAllowanceScope || 'hard_costs_only'}
                  onChange={(e) =>
                    updateBuildout({
                      tiAllowanceScope: e.target.value as 'hard_costs_only' | 'all_costs',
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="hard_costs_only">Hard Costs Only</option>
                  <option value="all_costs">All Costs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unused Allowance Policy
                </label>
                <select
                  value={buildout.tiUnusedPolicy || 'forfeited'}
                  onChange={(e) =>
                    updateBuildout({
                      tiUnusedPolicy: e.target.value as 'forfeited' | 'applied_to_rent',
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="forfeited">Forfeited</option>
                  <option value="applied_to_rent">Applied to Rent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Construction Managed By
                </label>
                <select
                  value={buildout.tiConstructionManagedBy || 'landlord'}
                  onChange={(e) =>
                    updateBuildout({
                      tiConstructionManagedBy: e.target.value as 'landlord' | 'tenant',
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="landlord">Landlord</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Work Letter Details */}
        {showWorkLetter && (
          <div className="space-y-4 pl-4 border-l-2 border-input">
            <h2 className="text-lg font-medium">Work Letter Details</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                Work Letter Description
              </label>
              <textarea
                value={buildout.workLetterDescription || ''}
                onChange={(e) =>
                  updateBuildout({ workLetterDescription: e.target.value })
                }
                placeholder="Describe the scope of work..."
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Permit Responsibility
                </label>
                <select
                  value={buildout.workLetterPermitResponsibility || 'landlord'}
                  onChange={(e) =>
                    updateBuildout({
                      workLetterPermitResponsibility: e.target.value as 'landlord' | 'tenant',
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="landlord">Landlord</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Deadline (days from execution)
                </label>
                <input
                  type="number"
                  value={buildout.workLetterDeadlineDays || ''}
                  onChange={(e) =>
                    updateBuildout({
                      workLetterDeadlineDays: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="e.g. 90"
                  min={1}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={buildout.workLetterCompletionDate || ''}
                  onChange={(e) =>
                    updateBuildout({ workLetterCompletionDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Lien Discharge Period (days)
                </label>
                <input
                  type="number"
                  value={buildout.workLetterLienDischargeDays || ''}
                  onChange={(e) =>
                    updateBuildout({
                      workLetterLienDischargeDays: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="e.g. 30"
                  min={1}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Improvement Ownership */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Improvement Ownership</h2>
        <div>
          <label className="block text-sm font-medium mb-2">
            Ownership of Improvements
          </label>
          <select
            value={buildout.improvementOwnership}
            onChange={(e) =>
              updateBuildout({
                improvementOwnership: e.target.value as 'landlord' | 'tenant_trade_fixtures',
              })
            }
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="landlord">Landlord (all improvements become landlord property)</option>
            <option value="tenant_trade_fixtures">
              Tenant Trade Fixtures (tenant must remove trade fixtures)
            </option>
          </select>
        </div>
      </div>

      {/* Signage */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Signage</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={buildout.signageAllowed}
            onChange={(e) => updateBuildout({ signageAllowed: e.target.checked })}
            className="w-4 h-4 rounded border-input"
          />
          <span className="text-sm">Signage allowed</span>
        </label>

        {buildout.signageAllowed && (
          <label className="flex items-center gap-3 pl-7">
            <input
              type="checkbox"
              checked={buildout.signageRequiresApproval}
              onChange={(e) =>
                updateBuildout({ signageRequiresApproval: e.target.checked })
              }
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-sm">Signage requires landlord approval</span>
          </label>
        )}
      </div>

      {/* Premises Condition */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Premises Condition</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="premisesCondition"
              value="as_is"
              checked={buildout.premisesCondition === 'as_is'}
              onChange={() => updateBuildout({ premisesCondition: 'as_is' })}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">As-Is</span>
              <p className="text-xs text-muted-foreground">
                Tenant accepts the premises in its current condition.
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="premisesCondition"
              value="with_improvements"
              checked={buildout.premisesCondition === 'with_improvements'}
              onChange={() => updateBuildout({ premisesCondition: 'with_improvements' })}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">With Improvements</span>
              <p className="text-xs text-muted-foreground">
                Landlord will deliver premises with specified improvements completed.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
