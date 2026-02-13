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
  name?: string;
  address?: { street?: string; city?: string; state?: string };
}

interface UnitOption {
  id: string;
  unitNumber: string;
  bedrooms?: number;
  bathrooms?: number;
}

const inputClass =
  'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'block text-sm font-medium mb-2';

function getTenantLabel(t: TenantOption): string {
  if (t.type === 'commercial') return t.businessName || t.email;
  return `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.email;
}

export default function PropertySelectionStep({ draft, llcId, updateDraft }: StepProps) {
  const [propertyId, setPropertyId] = useState(draft.propertyId || '');
  const [unitIds, setUnitIds] = useState<string[]>(draft.unitIds || []);
  const [selectedTenants, setSelectedTenants] = useState<TenantOption[]>([]);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [leaseType, setLeaseType] = useState(draft.leaseType || '');

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);

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
        // silent
      } finally {
        setLoadingTenants(false);
      }
    }
    fetchSelectedTenants();
  }, [llcId, draft.tenantIds]);

  useEffect(() => {
    async function fetchProperties() {
      setLoadingProperties(true);
      try {
        const res = await fetch(`/api/llcs/${llcId}/properties`);
        const data = await res.json();
        if (data.ok) {
          setProperties(data.data || []);
        }
      } catch {
        // silent
      } finally {
        setLoadingProperties(false);
      }
    }
    fetchProperties();
  }, [llcId]);

  useEffect(() => {
    async function fetchUnits(propId: string) {
      setLoadingUnits(true);
      try {
        const res = await fetch(`/api/llcs/${llcId}/properties/${propId}/units`);
        const data = await res.json();
        if (data.ok) {
          setUnits(data.data || []);
        }
      } catch {
        // silent
      } finally {
        setLoadingUnits(false);
      }
    }

    if (propertyId) {
      fetchUnits(propertyId);
    } else {
      setUnits([]);
      setUnitIds([]);
    }
  }, [propertyId, llcId]);

  function handlePropertyChange(value: string) {
    setPropertyId(value);
    setUnitIds([]);
    updateDraft({ propertyId: value || undefined, unitIds: [] });
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

  function handleLeaseTypeChange(value: string) {
    setLeaseType(value as 'fixed_term' | 'month_to_month');
    updateDraft({ leaseType: value as 'fixed_term' | 'month_to_month' });
  }

  function getPropertyLabel(prop: PropertyOption): string {
    if (prop.name) return prop.name;
    if (prop.address?.street) {
      return `${prop.address.street}${prop.address.city ? `, ${prop.address.city}` : ''}`;
    }
    return prop.id;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Property & Tenant Selection</h2>

      <div className="space-y-4">
        {/* Property */}
        <div>
          <label className={labelClass}>Property</label>
          {loadingProperties ? (
            <p className="text-sm text-muted-foreground">Loading properties...</p>
          ) : (
            <select
              className={inputClass}
              value={propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
            >
              <option value="">Select a property</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {getPropertyLabel(prop)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Units (multi-select checkboxes) */}
        {propertyId && (
          <div>
            <label className={labelClass}>Units</label>
            {loadingUnits ? (
              <p className="text-sm text-muted-foreground">Loading units...</p>
            ) : units.length === 0 ? (
              <p className="text-sm text-muted-foreground">No units found for this property.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {units.map((unit) => (
                    <label key={unit.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-input"
                        checked={unitIds.includes(unit.id)}
                        onChange={() => handleUnitToggle(unit.id)}
                      />
                      <span className="text-sm">
                        Unit {unit.unitNumber}
                        {unit.bedrooms != null ? ` - ${unit.bedrooms}BR` : ''}
                        {unit.bathrooms != null ? `/${unit.bathrooms}BA` : ''}
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

        {/* Lease Type */}
        <div>
          <label className={labelClass}>Lease Type</label>
          <select
            className={inputClass}
            value={leaseType}
            onChange={(e) => handleLeaseTypeChange(e.target.value)}
          >
            <option value="">Select lease type</option>
            <option value="fixed_term">Fixed Term</option>
            <option value="month_to_month">Month to Month</option>
          </select>
        </div>
      </div>

      {/* Tenants */}
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
