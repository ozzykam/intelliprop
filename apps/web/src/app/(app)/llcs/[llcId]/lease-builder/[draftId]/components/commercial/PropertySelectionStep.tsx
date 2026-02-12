'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Unit {
  id: string;
  name: string;
  unitNumber: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function PropertySelectionStep({ draft, llcId, updateDraft }: StepProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const [propertyId, setPropertyId] = useState(draft.propertyId || '');
  const [unitId, setUnitId] = useState(draft.unitId || '');
  const [tenantIds, setTenantIds] = useState<string[]>(draft.tenantIds || []);
  const [leaseType, setLeaseType] = useState<'fixed_term' | 'month_to_month'>(
    draft.leaseType || 'fixed_term'
  );

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

  const fetchTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/tenants`);
      const data = await res.json();
      if (data.ok) {
        setTenants(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTenants(false);
    }
  }, [llcId]);

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, [fetchProperties, fetchTenants]);

  useEffect(() => {
    if (propertyId) {
      fetchUnits(propertyId);
    } else {
      setUnits([]);
      setUnitId('');
    }
  }, [propertyId, fetchUnits]);

  function handlePropertyChange(value: string) {
    setPropertyId(value);
    setUnitId('');
    updateDraft({ propertyId: value, unitId: '' });
  }

  function handleUnitChange(value: string) {
    setUnitId(value);
    updateDraft({ unitId: value });
  }

  function handleTenantToggle(tenantId: string) {
    const updated = tenantIds.includes(tenantId)
      ? tenantIds.filter((id) => id !== tenantId)
      : [...tenantIds, tenantId];
    setTenantIds(updated);
    updateDraft({ tenantIds: updated });
  }

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
                  {p.name} - {p.address}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Unit Selection */}
        {propertyId && (
          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            {loadingUnits ? (
              <p className="text-sm text-muted-foreground">Loading units...</p>
            ) : units.length === 0 ? (
              <p className="text-sm text-muted-foreground">No units found for this property.</p>
            ) : (
              <select
                value={unitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unitNumber} - {u.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Tenant Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Tenants</h2>
        {loadingTenants ? (
          <p className="text-sm text-muted-foreground">Loading tenants...</p>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tenants found for this LLC.</p>
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => (
              <label key={t.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
                <input
                  type="checkbox"
                  checked={tenantIds.includes(t.id)}
                  onChange={() => handleTenantToggle(t.id)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">
                  {t.firstName} {t.lastName}
                  <span className="text-muted-foreground ml-2">{t.email}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {tenantIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {tenantIds.length} tenant{tenantIds.length !== 1 ? 's' : ''} selected
          </p>
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
    </div>
  );
}
