'use client';

import { useState, useEffect } from 'react';
import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';

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

interface TenantOption {
  id: string;
  type: 'residential' | 'commercial';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
}

const inputClass =
  'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'block text-sm font-medium mb-2';

export default function PropertySelectionStep({ draft, llcId, updateDraft }: StepProps) {
  const [propertyId, setPropertyId] = useState(draft.propertyId || '');
  const [unitId, setUnitId] = useState(draft.unitId || '');
  const [tenantIds, setTenantIds] = useState<string[]>(draft.tenantIds || []);
  const [leaseType, setLeaseType] = useState(draft.leaseType || '');

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);

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

    async function fetchTenants() {
      setLoadingTenants(true);
      try {
        const res = await fetch(`/api/llcs/${llcId}/tenants`);
        const data = await res.json();
        if (data.ok) {
          setTenants(data.data || []);
        }
      } catch {
        // silent
      } finally {
        setLoadingTenants(false);
      }
    }

    fetchProperties();
    fetchTenants();
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
      setUnitId('');
    }
  }, [propertyId, llcId]);

  function handlePropertyChange(value: string) {
    setPropertyId(value);
    setUnitId('');
    updateDraft({ propertyId: value || undefined, unitId: undefined });
  }

  function handleUnitChange(value: string) {
    setUnitId(value);
    updateDraft({ unitId: value || undefined });
  }

  function handleTenantToggle(tenantId: string) {
    const updated = tenantIds.includes(tenantId)
      ? tenantIds.filter((id) => id !== tenantId)
      : [...tenantIds, tenantId];
    setTenantIds(updated);
    updateDraft({ tenantIds: updated });
  }

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

  function getTenantLabel(tenant: TenantOption): string {
    if (tenant.type === 'residential') {
      return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.email;
    }
    return tenant.businessName || tenant.email;
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

        {/* Unit */}
        {propertyId && (
          <div>
            <label className={labelClass}>Unit</label>
            {loadingUnits ? (
              <p className="text-sm text-muted-foreground">Loading units...</p>
            ) : units.length === 0 ? (
              <p className="text-sm text-muted-foreground">No units found for this property.</p>
            ) : (
              <select
                className={inputClass}
                value={unitId}
                onChange={(e) => handleUnitChange(e.target.value)}
              >
                <option value="">Select a unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unit {unit.unitNumber}
                    {unit.bedrooms != null ? ` - ${unit.bedrooms}BR` : ''}
                    {unit.bathrooms != null ? `/${unit.bathrooms}BA` : ''}
                  </option>
                ))}
              </select>
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
        <h2 className="text-lg font-medium">Tenants</h2>
        {loadingTenants ? (
          <p className="text-sm text-muted-foreground">Loading tenants...</p>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tenants found.</p>
        ) : (
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <label key={tenant.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-input"
                  checked={tenantIds.includes(tenant.id)}
                  onChange={() => handleTenantToggle(tenant.id)}
                />
                <span className="text-sm">
                  {getTenantLabel(tenant)}
                  <span className="text-muted-foreground ml-2">({tenant.email})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
