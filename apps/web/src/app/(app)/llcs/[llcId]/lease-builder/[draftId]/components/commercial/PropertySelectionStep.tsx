'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';
import { TenantSelectorDialog, TenantOption } from '@/components/TenantSelectorDialog';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

interface PropertyOption {
  id: string;
  name: string;
  address?: { street1?: string; city?: string; state?: string };
}

interface UnitOption {
  id: string;
  name: string;
  unitNumber: string;
}

function getTenantLabel(t: TenantOption): string {
  if (t.type === 'business') return t.businessName || t.email;
  return `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.email;
}

export default function PropertySelectionStep({ draft, llcId, updateDraft }: StepProps) {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<TenantOption[]>([]);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const [propertyId, setPropertyId] = useState(draft.propertyId || '');
  const [unitIds, setUnitIds] = useState<string[]>(draft.unitIds || []);
  const [leaseType, setLeaseType] = useState<'fixed_term' | 'month_to_month'>(
    draft.leaseType || 'fixed_term'
  );

  // Fetch initial tenant data for pre-selected tenantIds
  useEffect(() => {
    if (!draft.tenantIds?.length) {
      setLoadingTenants(false);
      return;
    }
    async function fetchSelectedTenants() {
      setLoadingTenants(true);
      try {
        const res = await fetch(`/api/llcs/${llcId}/tenants`);
        const data = await res.json();
        if (data.ok) {
          const allTenants: TenantOption[] = data.data || [];
          const selected = allTenants.filter((t: TenantOption) => draft.tenantIds.includes(t.id));
          setSelectedTenants(selected);
        }
      } catch {
        // ignore
      } finally {
        setLoadingTenants(false);
      }
    }
    fetchSelectedTenants();
  }, [llcId, draft.tenantIds]);

  const fetchProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/properties`);
      const data = await res.json();
      if (data.ok) {
        setProperties(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingProperties(false);
    }
  }, [llcId]);

  const fetchUnits = useCallback(async (propId: string) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/properties/${propId}/units`);
      const data = await res.json();
      if (data.ok) {
        setUnits(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingUnits(false);
    }
  }, [llcId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (propertyId) {
      fetchUnits(propertyId);
    } else {
      setUnits([]);
      setUnitIds([]);
    }
  }, [propertyId, fetchUnits]);

  function handlePropertyChange(value: string) {
    setPropertyId(value);
    setUnitIds([]);
    updateDraft({ propertyId: value, unitIds: [] });
  }

  function handleUnitToggle(uid: string) {
    const updated = unitIds.includes(uid)
      ? unitIds.filter((id) => id !== uid)
      : [...unitIds, uid];
    setUnitIds(updated);
    updateDraft({ unitIds: updated });
  }

  const handleAddTenant = useCallback((tenant: TenantOption) => {
    if (selectedTenants.some((t) => t.id === tenant.id)) return;
    const updated = [...selectedTenants, tenant];
    setSelectedTenants(updated);
    updateDraft({ tenantIds: updated.map((t) => t.id) });
  }, [selectedTenants, updateDraft]);

  const handleRemoveTenant = useCallback((tenantId: string) => {
    const updated = selectedTenants.filter((t) => t.id !== tenantId);
    setSelectedTenants(updated);
    updateDraft({ tenantIds: updated.map((t) => t.id) });
  }, [selectedTenants, updateDraft]);

  function handleLeaseTypeChange(value: 'fixed_term' | 'month_to_month') {
    setLeaseType(value);
    updateDraft({ leaseType: value });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Property & Tenant Selection</h2>

      {/* Property Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Property</label>
          {loadingProperties ? (
            <p className="text-sm text-muted-foreground">Loading properties...</p>
          ) : (
            <select
              value={propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.address?.street1 ? ` - ${p.address.street1}${p.address.city ? `, ${p.address.city}` : ''}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Unit Selection (multi-select checkboxes) */}
        {propertyId && (
          <div>
            <label className="block text-sm font-medium mb-2">Units</label>
            {loadingUnits ? (
              <p className="text-sm text-muted-foreground">Loading units...</p>
            ) : units.length === 0 ? (
              <p className="text-sm text-muted-foreground">No units found for this property.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {units.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
                      <input
                        type="checkbox"
                        checked={unitIds.includes(u.id)}
                        onChange={() => handleUnitToggle(u.id)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <span className="text-sm">
                        {u.unitNumber} - {u.name}
                      </span>
                    </label>
                  ))}
                </div>
                {unitIds.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {unitIds.length} unit{unitIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tenant Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Tenants</h2>
          <button
            type="button"
            onClick={() => setTenantDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tenant
          </button>
        </div>

        {loadingTenants ? (
          <p className="text-sm text-muted-foreground">Loading tenants...</p>
        ) : selectedTenants.length === 0 ? (
          <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground">
            <p>No tenants selected</p>
            <p className="text-sm mt-1">Click &quot;Add Tenant&quot; to search and add tenants to this lease</p>
          </div>
        ) : (
          <div className="border rounded-md divide-y">
            {selectedTenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{getTenantLabel(tenant)}</span>
                  <span className="text-muted-foreground text-sm ml-2">({tenant.type})</span>
                  <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">{tenant.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTenant(tenant.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove tenant"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lease Type */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Lease Type</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="leaseType"
              value="fixed_term"
              checked={leaseType === 'fixed_term'}
              onChange={() => handleLeaseTypeChange('fixed_term')}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">Fixed Term</span>
              <p className="text-xs text-muted-foreground">
                Lease runs for a specific period with defined start and end dates.
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
            <input
              type="radio"
              name="leaseType"
              value="month_to_month"
              checked={leaseType === 'month_to_month'}
              onChange={() => handleLeaseTypeChange('month_to_month')}
              className="w-4 h-4 border-input"
            />
            <div>
              <span className="text-sm font-medium">Month-to-Month</span>
              <p className="text-xs text-muted-foreground">
                Lease continues monthly until terminated by either party with proper notice.
              </p>
            </div>
          </label>
        </div>
      </div>

      <TenantSelectorDialog
        open={tenantDialogOpen}
        onClose={() => setTenantDialogOpen(false)}
        onSelect={handleAddTenant}
        selectedIds={selectedTenants.map((t) => t.id)}
        llcId={llcId}
      />
    </div>
  );
}
