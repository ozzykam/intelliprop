'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { TenantSelectorDialog, TenantOption } from '@/components/TenantSelectorDialog';

interface PropertyOption {
  id: string;
  name?: string;
  address?: { street1: string; city: string };
}

interface UnitOption {
  id: string;
  unitNumber: string;
  status: string;
}

interface NewExpressLeasePageProps {
  params: Promise<{ orgId: string; llcId: string }>;
}

function getTenantLabel(t: TenantOption): string {
  if (t.type === 'business') return t.businessName || t.email;
  return `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.email;
}

export default function NewExpressLeasePage({ params }: NewExpressLeasePageProps) {
  const { orgId, llcId } = use(params);
  const router = useRouter();

  // Selectors
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);

  // Tenant selection
  const [selectedTenants, setSelectedTenants] = useState<TenantOption[]>([]);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);

  // Form fields
  const [leaseClass, setLeaseClass] = useState<'residential' | 'commercial'>('residential');
  const [leaseType, setLeaseType] = useState<'fixed_term' | 'month_to_month'>('fixed_term');
  const [propertyId, setPropertyId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [depositAmount, setDepositAmount] = useState('');
  const [status, setStatus] = useState('active');

  // Late fee fields
  const [gracePeriodDays, setGracePeriodDays] = useState('0');
  const [lateFeeType, setLateFeeType] = useState<'flat' | 'percentage' | 'none'>('none');
  const [lateFeeAmount, setLateFeeAmount] = useState('');
  const [lateFeeMaxAmount, setLateFeeMaxAmount] = useState('');

  // Express details
  const [petPolicy, setPetPolicy] = useState('');
  const [petDeposit, setPetDeposit] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState('');
  const [specialTerms, setSpecialTerms] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      const res = await fetch(`/api/llcs/${llcId}/properties`);
      const data = await res.json();
      if (data.ok) setProperties(data.data);
    }
    loadProperties();
  }, [llcId]);

  // Load units when property changes
  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      setSelectedUnitIds([]);
      return;
    }
    async function loadUnits() {
      const res = await fetch(`/api/llcs/${llcId}/properties/${propertyId}/units`);
      const data = await res.json();
      if (data.ok) setUnits(data.data);
    }
    loadUnits();
  }, [llcId, propertyId]);

  const handleAddTenant = useCallback((tenant: TenantOption) => {
    setSelectedTenants((prev) => {
      if (prev.some((t) => t.id === tenant.id)) return prev;
      return [...prev, tenant];
    });
  }, []);

  const handleRemoveTenant = useCallback((tenantId: string) => {
    setSelectedTenants((prev) => prev.filter((t) => t.id !== tenantId));
  }, []);

  function toggleUnit(unitId: string) {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (selectedTenants.length === 0) {
      setError('At least one tenant must be selected');
      setSaving(false);
      return;
    }

    if (selectedUnitIds.length === 0) {
      setError('At least one unit must be selected');
      setSaving(false);
      return;
    }

    // Build express details
    const expressDetails: Record<string, unknown> = {};
    if (petPolicy) expressDetails.petPolicy = petPolicy;
    if (petDeposit) expressDetails.petDeposit = Math.round(parseFloat(petDeposit) * 100);
    if (parkingSpaces) expressDetails.parkingSpaces = parseInt(parkingSpaces);
    if (utilitiesIncluded.trim()) {
      expressDetails.utilitiesIncluded = utilitiesIncluded.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (specialTerms) expressDetails.specialTerms = specialTerms;
    if (notes) expressDetails.notes = notes;

    const body: Record<string, unknown> = {
      leaseClass,
      propertyId,
      unitIds: selectedUnitIds,
      tenantIds: selectedTenants.map((t) => t.id),
      leaseType,
      startDate,
      endDate: leaseType === 'fixed_term' ? endDate : undefined,
      monthlyRent: Math.round(parseFloat(rentAmount) * 100),
      dueDay: parseInt(dueDay),
      depositAmount: depositAmount ? Math.round(parseFloat(depositAmount) * 100) : 0,
      gracePeriodDays: parseInt(gracePeriodDays) || 0,
      lateFeeType,
      status,
    };

    if (lateFeeType !== 'none' && lateFeeAmount) {
      body.lateFeeAmount = Math.round(parseFloat(lateFeeAmount) * 100);
    }
    if (lateFeeType === 'percentage' && lateFeeMaxAmount) {
      body.lateFeeMaxAmount = Math.round(parseFloat(lateFeeMaxAmount) * 100);
    }
    if (Object.keys(expressDetails).length > 0) {
      body.expressDetails = expressDetails;
    }

    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases/express`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(`/${orgId}/llcs/${llcId}/leases`);
      } else {
        setError(data.error?.message || 'Failed to create express lease');
      }
    } catch {
      setError('Failed to create express lease');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';
  const labelCls = 'block text-sm font-medium mb-2';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/${orgId}/llcs/${llcId}/leases`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Leases
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Express Lease</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Quickly create a published lease without using the full lease builder wizard. Useful for importing existing or legacy leases.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Lease Classification */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Lease Classification</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="leaseClass" className={labelCls}>Lease Class *</label>
              <select
                id="leaseClass"
                value={leaseClass}
                onChange={(e) => setLeaseClass(e.target.value as 'residential' | 'commercial')}
                required
                className={inputCls}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label htmlFor="leaseType" className={labelCls}>Lease Type *</label>
              <select
                id="leaseType"
                value={leaseType}
                onChange={(e) => setLeaseType(e.target.value as 'fixed_term' | 'month_to_month')}
                required
                className={inputCls}
              >
                <option value="fixed_term">Fixed Term</option>
                <option value="month_to_month">Month-to-Month</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className={labelCls}>Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property & Unit */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Property & Unit</h2>
          <div>
            <label htmlFor="propertyId" className={labelCls}>Property *</label>
            <select
              id="propertyId"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Select property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.address?.street1 || p.id}
                </option>
              ))}
            </select>
          </div>

          {propertyId && units.length > 0 && (
            <div>
              <label className={labelCls}>Unit(s) *</label>
              <div className="border border-input rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {units.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUnitIds.includes(u.id)}
                      onChange={() => toggleUnit(u.id)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">
                      {u.unitNumber} <span className="text-muted-foreground">({u.status})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {propertyId && units.length === 0 && (
            <p className="text-sm text-muted-foreground">No units found for this property.</p>
          )}
        </div>

        {/* Tenants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Tenant(s) *</h2>
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

          {selectedTenants.length === 0 ? (
            <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground">
              <p>No tenants selected</p>
              <p className="text-sm mt-1">Click &quot;Add Tenant&quot; to search and add tenants</p>
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

        {/* Financial Terms */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Lease Terms</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className={labelCls}>Start Date *</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            {leaseType === 'fixed_term' && (
              <div>
                <label htmlFor="endDate" className={labelCls}>End Date *</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="rentAmount" className={labelCls}>Monthly Rent ($) *</label>
              <input
                id="rentAmount"
                type="number"
                step="0.01"
                min="0"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="dueDay" className={labelCls}>Due Day (1-28) *</label>
              <input
                id="dueDay"
                type="number"
                min="1"
                max="28"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="depositAmount" className={labelCls}>Security Deposit ($)</label>
              <input
                id="depositAmount"
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Late Fee Terms */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Late Fee Terms</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gracePeriodDays" className={labelCls}>Grace Period (Days)</label>
              <input
                id="gracePeriodDays"
                type="number"
                min="0"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="lateFeeType" className={labelCls}>Late Fee Type</label>
              <select
                id="lateFeeType"
                value={lateFeeType}
                onChange={(e) => setLateFeeType(e.target.value as 'flat' | 'percentage' | 'none')}
                className={inputCls}
              >
                <option value="none">None</option>
                <option value="flat">Flat Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
          </div>

          {lateFeeType !== 'none' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lateFeeAmount" className={labelCls}>
                  {lateFeeType === 'flat' ? 'Late Fee Amount ($)' : 'Late Fee Percentage'}
                </label>
                <input
                  id="lateFeeAmount"
                  type="number"
                  step={lateFeeType === 'flat' ? '0.01' : '0.1'}
                  min="0"
                  value={lateFeeAmount}
                  onChange={(e) => setLateFeeAmount(e.target.value)}
                  className={inputCls}
                />
              </div>
              {lateFeeType === 'percentage' && (
                <div>
                  <label htmlFor="lateFeeMaxAmount" className={labelCls}>Max Late Fee ($)</label>
                  <input
                    id="lateFeeMaxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={lateFeeMaxAmount}
                    onChange={(e) => setLateFeeMaxAmount(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Additional Details</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="petPolicy" className={labelCls}>Pet Policy</label>
              <select
                id="petPolicy"
                value={petPolicy}
                onChange={(e) => setPetPolicy(e.target.value)}
                className={inputCls}
              >
                <option value="">-</option>
                <option value="allowed">Allowed</option>
                <option value="not_allowed">Not Allowed</option>
                <option value="case_by_case">Case by Case</option>
              </select>
            </div>
            <div>
              <label htmlFor="petDeposit" className={labelCls}>Pet Deposit ($)</label>
              <input
                id="petDeposit"
                type="number"
                step="0.01"
                min="0"
                value={petDeposit}
                onChange={(e) => setPetDeposit(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="parkingSpaces" className={labelCls}>Parking Spaces</label>
              <input
                id="parkingSpaces"
                type="number"
                min="0"
                value={parkingSpaces}
                onChange={(e) => setParkingSpaces(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="utilitiesIncluded" className={labelCls}>Utilities Included (comma-separated)</label>
            <input
              id="utilitiesIncluded"
              type="text"
              value={utilitiesIncluded}
              onChange={(e) => setUtilitiesIncluded(e.target.value)}
              placeholder="e.g. water, trash, sewer"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="specialTerms" className={labelCls}>Special Terms</label>
            <textarea
              id="specialTerms"
              value={specialTerms}
              onChange={(e) => setSpecialTerms(e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
            />
          </div>

          <div>
            <label htmlFor="notes" className={labelCls}>Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || !propertyId || selectedUnitIds.length === 0 || !startDate || !rentAmount || selectedTenants.length === 0}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Express Lease'}
          </button>
          <Link
            href={`/${orgId}/llcs/${llcId}/leases`}
            className="px-6 py-2 border border-input rounded-md hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Tenant Selector Dialog */}
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
