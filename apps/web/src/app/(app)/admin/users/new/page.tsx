'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type TenantType = 'individual' | 'business';
type StaffRole = 'employee' | 'manager' | 'admin';

interface LlcOption {
  id: string;
  legalName: string;
}

interface PropertyOption {
  id: string;
  name?: string;
  address: { street1: string; city: string; state: string };
  llcId: string;
}

export default function NewUserPage() {
  const router = useRouter();

  // Role assignment
  const [isTenant, setIsTenant] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Tenant fields
  const [tenantType, setTenantType] = useState<TenantType>('individual');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ssn4, setSsn4] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [dba, setDba] = useState('');
  const [businessType, setBusinessType] = useState('llc');
  const [einLast4, setEinLast4] = useState('');
  const [stateOfIncorporation, setStateOfIncorporation] = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactMiddleName, setContactMiddleName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Staff fields
  const [staffRole, setStaffRole] = useState<StaffRole>('employee');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffMiddleInitial, setStaffMiddleInitial] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffDateOfBirth, setStaffDateOfBirth] = useState('');
  const [staffSsn4, setStaffSsn4] = useState('');
  const [selectedLlcIds, setSelectedLlcIds] = useState<string[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [workOrderAccess, setWorkOrderAccess] = useState(true);
  const [taskAccess, setTaskAccess] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [isAssignee, setIsAssignee] = useState(false);
  const [assigneeEntityType, setAssigneeEntityType] = useState<'individual' | 'company'>('individual');
  // Staff mailing address
  const [staffMailingStreet, setStaffMailingStreet] = useState('');
  const [staffMailingUnit, setStaffMailingUnit] = useState('');
  const [staffMailingCity, setStaffMailingCity] = useState('');
  const [staffMailingState, setStaffMailingState] = useState('');
  const [staffMailingZip, setStaffMailingZip] = useState('');
  // Staff emergency contact
  const [staffEmergencyName, setStaffEmergencyName] = useState('');
  const [staffEmergencyRelationship, setStaffEmergencyRelationship] = useState('');
  const [staffEmergencyPhone, setStaffEmergencyPhone] = useState('');
  const [staffEmergencyEmail, setStaffEmergencyEmail] = useState('');
  // Business tenant primary contact address
  const [contactStreet, setContactStreet] = useState('');
  const [contactUnit, setContactUnit] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [contactState, setContactState] = useState('');
  const [contactZip, setContactZip] = useState('');
  // Business tenant registration address
  const [regStreet, setRegStreet] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regZip, setRegZip] = useState('');

  // Data
  const [llcs, setLlcs] = useState<LlcOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  // UI state
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch LLCs on mount
  useEffect(() => {
    async function fetchLlcs() {
      try {
        const res = await fetch('/api/llcs');
        const data = await res.json();
        if (data.ok) setLlcs(data.data);
      } catch {
        // silently fail
      }
    }
    fetchLlcs();
  }, []);

  // Fetch properties when LLCs change (for staff section)
  useEffect(() => {
    async function fetchProperties() {
      if (selectedLlcIds.length === 0) {
        setProperties([]);
        return;
      }
      try {
        const allProperties: PropertyOption[] = [];
        for (const llcId of selectedLlcIds) {
          const res = await fetch(`/api/llcs/${llcId}/properties`);
          const data = await res.json();
          if (data.ok) {
            allProperties.push(...data.data.map((p: PropertyOption) => ({ ...p, llcId })));
          }
        }
        setProperties(allProperties);
      } catch {
        // silently fail
      }
    }
    fetchProperties();
  }, [selectedLlcIds]);

  const handleLlcToggle = (llcId: string) => {
    setSelectedLlcIds(prev =>
      prev.includes(llcId)
        ? prev.filter(id => id !== llcId)
        : [...prev, llcId]
    );
    setSelectedPropertyIds([]);
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const buildAddress = (street: string, unit: string, city: string, state: string, zip: string) => {
    if (!street.trim()) return undefined;
    return {
      street1: street.trim(),
      ...(unit.trim() && { street2: unit.trim() }),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zip.trim(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isTenant && !isStaff) {
      setError('Please select at least one role (Tenant or Staff)');
      return;
    }

    if (isStaff && selectedLlcIds.length === 0) {
      setError('Please select at least one LLC for the staff role');
      return;
    }

    if (isStaff && !isTenant && !staffEmail.trim()) {
      setError('Email is required for staff members');
      return;
    }

    setSaving(true);

    try {
      let tenantId: string | undefined;

      // Step 1: Create tenant if checked
      if (isTenant) {
        let tenantBody: Record<string, unknown>;

        if (tenantType === 'individual') {
          tenantBody = {
            type: 'individual',
            firstName,
            middleInitial: middleInitial || undefined,
            lastName,
            email,
            phone: phone || undefined,
            dateOfBirth: dateOfBirth || undefined,
            ssn4: ssn4 || undefined,
            emergencyContact: emergencyName
              ? { name: emergencyName, relationship: emergencyRelationship, phone: emergencyPhone }
              : undefined,
            notes: notes || undefined,
          };
        } else {
          tenantBody = {
            type: 'business',
            businessName,
            dba: dba || undefined,
            businessType,
            einLast4: einLast4 || undefined,
            stateOfIncorporation: stateOfIncorporation || undefined,
            primaryContact: {
              firstName: contactFirstName,
              middleName: contactMiddleName || undefined,
              lastName: contactLastName,
              title: contactTitle || undefined,
              email: contactEmail || undefined,
              phone: contactPhone || undefined,
              address: buildAddress(contactStreet, contactUnit, contactCity, contactState, contactZip),
            },
            registrationAddress: buildAddress(regStreet, regUnit, regCity, regState, regZip),
            email,
            phone: phone || undefined,
            notes: notes || undefined,
          };
        }

        const tenantRes = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tenantBody),
        });

        const tenantData = await tenantRes.json();

        if (!tenantData.ok) {
          setError(tenantData.error?.message || 'Failed to create tenant');
          setSaving(false);
          return;
        }

        tenantId = tenantData.data.id;
      }

      // Step 2: Create staff activation if checked
      if (isStaff) {
        // Use tenant name info if available, otherwise staff-specific fields
        const fn = isTenant ? firstName || contactFirstName || '' : staffFirstName;
        const mi = isTenant ? middleInitial || contactMiddleName.slice(0, 1) : staffMiddleInitial;
        const ln = isTenant ? lastName || contactLastName || '' : staffLastName;
        const dob = isTenant ? dateOfBirth : staffDateOfBirth;
        const s4 = isTenant ? ssn4 : staffSsn4;

        const staffBody = {
          type: 'individual' as const,
          role: staffRole,
          firstName: fn,
          middleInitial: mi || undefined,
          lastName: ln,
          dateOfBirth: dob,
          ssn4: s4,
          email: isTenant ? email : staffEmail,
          phone: isTenant ? (phone || undefined) : (staffPhone || undefined),
          llcIds: selectedLlcIds,
          propertyIds: staffRole === 'manager' ? selectedPropertyIds : [],
          capabilities: staffRole === 'employee' || staffRole === 'manager' ? {
            workOrderAccess,
            taskAccess,
            paymentProcessing,
          } : undefined,
          tenantId,
          isAssignee: isAssignee || undefined,
          assigneeEntityType: isAssignee ? assigneeEntityType : undefined,
          mailingAddress: buildAddress(staffMailingStreet, staffMailingUnit, staffMailingCity, staffMailingState, staffMailingZip),
          emergencyContact: staffEmergencyName.trim() ? {
            name: staffEmergencyName.trim(),
            relationship: staffEmergencyRelationship.trim() || undefined,
            phone: staffEmergencyPhone.trim() || undefined,
            email: staffEmergencyEmail.trim() || undefined,
          } : undefined,
        };

        const staffRes = await fetch('/api/activations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(staffBody),
        });

        const staffData = await staffRes.json();

        if (!staffData.ok) {
          setError(staffData.error?.message || staffData.error || 'Failed to create staff activation');
          setSaving(false);
          return;
        }
      }

      router.push('/admin/users?created=staff');
    } catch {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Users
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Add New User</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Create a new tenant, staff member, or both. Tenants will receive a tenant record. Staff will receive an activation code.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Role Assignment */}
        <div>
          <label className="block text-sm font-medium mb-3">Role Assignment *</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTenant}
                onChange={(e) => setIsTenant(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Tenant</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStaff}
                onChange={(e) => setIsStaff(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Staff</span>
            </label>
          </div>
        </div>

        {/* ============ TENANT SECTION ============ */}
        {isTenant && (
          <div className="space-y-6 p-4 border rounded-lg">
            <h2 className="text-lg font-medium">Tenant Information</h2>

            {/* Tenant Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Tenant Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="individual"
                    checked={tenantType === 'individual'}
                    onChange={(e) => setTenantType(e.target.value as TenantType)}
                    className="accent-primary"
                  />
                  <span>Individual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="business"
                    checked={tenantType === 'business'}
                    onChange={(e) => setTenantType(e.target.value as TenantType)}
                    className="accent-primary"
                  />
                  <span>Business</span>
                </label>
              </div>
            </div>

            {/* Individual Fields */}
            {tenantType === 'individual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name *</label>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="middleInitial" className="block text-sm font-medium mb-2">M.I.</label>
                    <input id="middleInitial" type="text" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.slice(0, 1).toUpperCase())} maxLength={1} className={`${inputClass} text-center`} />
                  </div>
                  <div className="col-span-3">
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name *</label>
                    <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">Date of Birth *</label>
                    <input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="ssn4" className="block text-sm font-medium mb-2">SSN (Last 4) *</label>
                    <input id="ssn4" type="text" maxLength={4} pattern="\d{4}" value={ssn4} onChange={(e) => setSsn4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required className={inputClass} />
                  </div>
                </div>

                <h3 className="font-medium pt-2">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="emergencyName" className="block text-sm font-medium mb-2">Name</label>
                    <input id="emergencyName" type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="emergencyRelationship" className="block text-sm font-medium mb-2">Relationship</label>
                    <input id="emergencyRelationship" type="text" value={emergencyRelationship} onChange={(e) => setEmergencyRelationship(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="emergencyPhone" className="block text-sm font-medium mb-2">Phone</label>
                    <input id="emergencyPhone" type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Business Fields */}
            {tenantType === 'business' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium mb-2">Business Name *</label>
                    <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="dba" className="block text-sm font-medium mb-2">DBA</label>
                    <input id="dba" type="text" value={dba} onChange={(e) => setDba(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium mb-2">Business Type *</label>
                    <select id="businessType" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required className={inputClass}>
                      <option value="llc">LLC</option>
                      <option value="corporation">Corporation</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="nonprofit">Nonprofit</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="einLast4" className="block text-sm font-medium mb-2">EIN (Last 4)</label>
                    <input id="einLast4" type="text" maxLength={4} pattern="\d{4}" value={einLast4} onChange={(e) => setEinLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="stateOfIncorporation" className="block text-sm font-medium mb-2">State of Inc.</label>
                    <input id="stateOfIncorporation" type="text" maxLength={2} value={stateOfIncorporation} onChange={(e) => setStateOfIncorporation(e.target.value.toUpperCase().slice(0, 2))} placeholder="TX" className={inputClass} />
                  </div>
                </div>

                <h3 className="font-medium pt-2">Primary Contact *</h3>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="contactFirstName" className="block text-sm font-medium mb-2">First Name *</label>
                    <input id="contactFirstName" type="text" value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="contactMiddleName" className="block text-sm font-medium mb-2">Middle</label>
                    <input id="contactMiddleName" type="text" value={contactMiddleName} onChange={(e) => setContactMiddleName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-3">
                    <label htmlFor="contactLastName" className="block text-sm font-medium mb-2">Last Name *</label>
                    <input id="contactLastName" type="text" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} required className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactTitle" className="block text-sm font-medium mb-2">Title</label>
                    <input id="contactTitle" type="text" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">Email</label>
                    <input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium mb-2">Phone</label>
                    <input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Primary Contact Address</h4>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Street Address</label>
                    <input type="text" value={contactStreet} onChange={(e) => setContactStreet(e.target.value)} className={inputClass} placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Suite / Unit</label>
                    <input type="text" value={contactUnit} onChange={(e) => setContactUnit(e.target.value)} className={inputClass} placeholder="Suite 200 (optional)" />
                  </div>
                  <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">City</label>
                      <input type="text" value={contactCity} onChange={(e) => setContactCity(e.target.value)} className={inputClass} placeholder="Minneapolis" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">State</label>
                      <input type="text" value={contactState} onChange={(e) => setContactState(e.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="MN" maxLength={2} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">ZIP</label>
                      <input type="text" value={contactZip} onChange={(e) => setContactZip(e.target.value)} className={inputClass} placeholder="55401" maxLength={10} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Registration Address</h4>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Street Address</label>
                    <input type="text" value={regStreet} onChange={(e) => setRegStreet(e.target.value)} className={inputClass} placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Suite / Unit</label>
                    <input type="text" value={regUnit} onChange={(e) => setRegUnit(e.target.value)} className={inputClass} placeholder="Suite 200 (optional)" />
                  </div>
                  <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">City</label>
                      <input type="text" value={regCity} onChange={(e) => setRegCity(e.target.value)} className={inputClass} placeholder="Minneapolis" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">State</label>
                      <input type="text" value={regState} onChange={(e) => setRegState(e.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="MN" maxLength={2} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">ZIP</label>
                      <input type="text" value={regZip} onChange={(e) => setRegZip(e.target.value)} className={inputClass} placeholder="55401" maxLength={10} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shared Contact Fields */}
            <div className="space-y-4">
              <h3 className="font-medium">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Business Email *</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">Business Phone</label>
                  <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">Notes</label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>
          </div>
        )}

        {/* ============ STAFF SECTION ============ */}
        {isStaff && (
          <div className="space-y-6 p-4 border rounded-lg">
            <h2 className="text-lg font-medium">Staff Information</h2>

            {/* Staff Role */}
            <div>
              <label className="block text-sm font-medium mb-2">Staff Role *</label>
              <div className="flex gap-2">
                {(['employee', 'manager', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setStaffRole(r)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border transition-colors ${
                      staffRole === r
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-input hover:bg-secondary'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {staffRole === 'admin' && 'Full access to manage LLC settings, members, and all properties.'}
                {staffRole === 'manager' && 'Can manage assigned properties and tenants.'}
                {staffRole === 'employee' && 'Can handle work orders, tasks, and payments based on capabilities.'}
              </p>
            </div>

            {/* Personal Information (only if tenant is NOT checked, to avoid duplication) */}
            {!isTenant && (
              <div className="space-y-4">
                <h3 className="font-medium">Personal Information</h3>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="staffFirstName" className="block text-sm font-medium mb-2">First Name *</label>
                    <input id="staffFirstName" type="text" value={staffFirstName} onChange={(e) => setStaffFirstName(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="staffMiddleInitial" className="block text-sm font-medium mb-2">M.I.</label>
                    <input id="staffMiddleInitial" type="text" value={staffMiddleInitial} onChange={(e) => setStaffMiddleInitial(e.target.value.slice(0, 1).toUpperCase())} maxLength={1} className={`${inputClass} text-center`} />
                  </div>
                  <div className="col-span-3">
                    <label htmlFor="staffLastName" className="block text-sm font-medium mb-2">Last Name *</label>
                    <input id="staffLastName" type="text" value={staffLastName} onChange={(e) => setStaffLastName(e.target.value)} required className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staffDateOfBirth" className="block text-sm font-medium mb-2">Date of Birth *</label>
                    <input id="staffDateOfBirth" type="date" value={staffDateOfBirth} onChange={(e) => setStaffDateOfBirth(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="staffSsn4" className="block text-sm font-medium mb-2">SSN (Last 4) *</label>
                    <input id="staffSsn4" type="text" value={staffSsn4} onChange={(e) => setStaffSsn4(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} required pattern="\d{4}" className={inputClass} placeholder="1234" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This information is used for account activation verification.
                </p>
              </div>
            )}

            {isTenant && (
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">
                Personal information from the tenant section above will be used for the staff activation.
              </p>
            )}

            {/* Email & Phone */}
            {!isTenant && (
              <div className="space-y-4">
                <h3 className="font-medium">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staffEmail" className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      id="staffEmail"
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="staff@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="staffPhone" className="block text-sm font-medium mb-2">Phone *</label>
                    <input
                      id="staffPhone"
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="(612) 555-0100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LLC Assignment */}
            <div className="space-y-4">
              <h3 className="font-medium">LLC Assignment *</h3>
              <p className="text-sm text-muted-foreground">
                Select which LLCs this staff member should have access to.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-input rounded-md p-3">
                {llcs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading LLCs...</p>
                ) : (
                  llcs.map((llc) => (
                    <label key={llc.id} className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={selectedLlcIds.includes(llc.id)}
                        onChange={() => handleLlcToggle(llc.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{llc.legalName}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Property Assignment (for managers) */}
            {staffRole === 'manager' && selectedLlcIds.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Property Assignment</h3>
                <p className="text-sm text-muted-foreground">
                  Optionally limit this manager to specific properties. Leave empty for all properties.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-input rounded-md p-3">
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No properties found</p>
                  ) : (
                    properties.map((prop) => (
                      <label key={prop.id} className="flex items-center gap-3 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={selectedPropertyIds.includes(prop.id)}
                          onChange={() => handlePropertyToggle(prop.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {prop.name || prop.address.street1} — {prop.address.city}, {prop.address.state}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Capabilities (for employees and managers) */}
            {(staffRole === 'employee' || staffRole === 'manager') && (
              <div className="space-y-4">
                <h3 className="font-medium">Capabilities</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={workOrderAccess} onChange={(e) => setWorkOrderAccess(e.target.checked)} className="w-4 h-4" />
                    <div>
                      <span className="text-sm font-medium">Work Order Access</span>
                      <p className="text-xs text-muted-foreground">Can view and manage work orders</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={taskAccess} onChange={(e) => setTaskAccess(e.target.checked)} className="w-4 h-4" />
                    <div>
                      <span className="text-sm font-medium">Task Access</span>
                      <p className="text-xs text-muted-foreground">Can view and manage tasks</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={paymentProcessing} onChange={(e) => setPaymentProcessing(e.target.checked)} className="w-4 h-4" />
                    <div>
                      <span className="text-sm font-medium">Payment Processing</span>
                      <p className="text-xs text-muted-foreground">Can process tenant payments</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Mailing Address */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="font-medium">Mailing Address <span className="text-xs text-muted-foreground font-normal">(optional)</span></h3>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Street Address</label>
                <input type="text" value={staffMailingStreet} onChange={(e) => setStaffMailingStreet(e.target.value)} className={inputClass} placeholder="123 Main St" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Suite / Unit</label>
                <input type="text" value={staffMailingUnit} onChange={(e) => setStaffMailingUnit(e.target.value)} className={inputClass} placeholder="Suite 200 (optional)" />
              </div>
              <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">City</label>
                  <input type="text" value={staffMailingCity} onChange={(e) => setStaffMailingCity(e.target.value)} className={inputClass} placeholder="Minneapolis" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">State</label>
                  <input type="text" value={staffMailingState} onChange={(e) => setStaffMailingState(e.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="MN" maxLength={2} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">ZIP</label>
                  <input type="text" value={staffMailingZip} onChange={(e) => setStaffMailingZip(e.target.value)} className={inputClass} placeholder="55401" maxLength={10} />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="font-medium">Emergency Contact <span className="text-xs text-muted-foreground font-normal">(optional)</span></h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Name</label>
                  <input type="text" value={staffEmergencyName} onChange={(e) => setStaffEmergencyName(e.target.value)} className={inputClass} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Relationship</label>
                  <input type="text" value={staffEmergencyRelationship} onChange={(e) => setStaffEmergencyRelationship(e.target.value)} className={inputClass} placeholder="Spouse, Parent, etc." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                  <input type="tel" value={staffEmergencyPhone} onChange={(e) => setStaffEmergencyPhone(e.target.value)} className={inputClass} placeholder="(612) 555-0100" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Email</label>
                  <input type="email" value={staffEmergencyEmail} onChange={(e) => setStaffEmergencyEmail(e.target.value)} className={inputClass} placeholder="emergency@example.com" />
                </div>
              </div>
            </div>

            {/* Assignee Designation */}
            <div className="space-y-3 pt-2 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isAssignee} onChange={(e) => setIsAssignee(e.target.checked)} className="w-4 h-4" />
                <div>
                  <span className="text-sm font-medium">Assignee</span>
                  <p className="text-xs text-muted-foreground">This user can receive Assignments of Claim. Their mailing address and contact info will pre-fill in the assignment wizard.</p>
                </div>
              </label>
              {isAssignee && (
                <div className="pl-7">
                  <label className="block text-sm font-medium mb-2">Entity Type</label>
                  <div className="flex gap-4">
                    {(['individual', 'company'] as const).map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={t}
                          checked={assigneeEntityType === t}
                          onChange={() => setAssigneeEntityType(t)}
                          className="accent-primary"
                        />
                        <span className="text-sm capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || (!isTenant && !isStaff)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create User'}
          </button>
          <Link
            href="/admin/users"
            className="px-6 py-2 border border-input rounded-md hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
