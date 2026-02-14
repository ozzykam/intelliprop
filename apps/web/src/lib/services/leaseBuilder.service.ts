/**
 * Lease Builder Service
 *
 * Handles CRUD operations for lease builder drafts and package generation.
 * Follows the same patterns as lease.service.ts — Firestore CRUD with audit logging.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  LeaseBuilderDraft,
  LeasePackage,
  LeaseClass,
  WizardStep,
  ValidationResult,
} from '@shared/types/leaseBuilder';
import {
  assembleLease,
  replacePlaceholders,
  determineTriggeredDisclosures,
  determineTriggeredAddenda,
  TEMPLATE_VERSIONS,
} from '@shared/leaseBuilder';
import type { AssemblyResult } from '@shared/leaseBuilder';

// Template imports for filling document content
import { MN_RESIDENTIAL_CORE_TEMPLATE } from '@shared/leaseBuilder/residential/templates';
import { MN_COMMERCIAL_CORE_TEMPLATE } from '@shared/leaseBuilder/commercial/templates';
import {
  LEAD_PAINT_DISCLOSURE_TEMPLATE,
  BED_BUG_DISCLOSURE_TEMPLATE,
  DV_NOTICE_TEMPLATE,
  MINNEAPOLIS_TENANT_PROTECTIONS_TEMPLATE,
  ST_PAUL_RENT_STABILIZATION_TEMPLATE,
  RENTAL_LICENSE_DISCLOSURE_TEMPLATE,
  SHARED_UTILITY_DISCLOSURE_TEMPLATE,
  TENANT_RIGHTS_SUMMARY_TEMPLATE,
} from '@shared/leaseBuilder/residential/templates/disclosures';
import {
  PET_ADDENDUM_TEMPLATE,
  SMOKING_ADDENDUM_TEMPLATE,
  UTILITIES_ADDENDUM_TEMPLATE,
  RENTERS_INSURANCE_ADDENDUM_TEMPLATE,
  MOVE_IN_CHECKLIST_TEMPLATE,
  PARKING_ADDENDUM_TEMPLATE,
} from '@shared/leaseBuilder/residential/templates/addenda';
import {
  WORK_LETTER_ADDENDUM_TEMPLATE,
  PERSONAL_GUARANTEE_ADDENDUM_TEMPLATE,
  CAM_RECONCILIATION_ADDENDUM_TEMPLATE,
  RENT_STEP_SCHEDULE_ADDENDUM_TEMPLATE,
} from '@shared/leaseBuilder/commercial/templates/addenda';

// Data-fetching services for building template context
import { getLlc } from '@/lib/services/llc.service';
import { getProperty } from '@/lib/services/property.service';
import { getUnit } from '@/lib/services/unit.service';
import { getTenantsByIds } from '@/lib/services/tenant.service';

import type { Tenant, IndividualTenant, BusinessTenant } from '@shared/types/tenant';
import type { Property } from '@shared/types/property';
import type { Unit } from '@shared/types/property';
import type { LLC } from '@shared/types/llc';
import { getMember } from '@/lib/services/member.service';

// ============================================================================
// TEMPLATE MAPS
// ============================================================================

const DISCLOSURE_TEMPLATES: Record<string, string> = {
  'disclosure-lead-paint': LEAD_PAINT_DISCLOSURE_TEMPLATE,
  'disclosure-bed-bug': BED_BUG_DISCLOSURE_TEMPLATE,
  'disclosure-dv-notice': DV_NOTICE_TEMPLATE,
  'disclosure-tenant-rights': TENANT_RIGHTS_SUMMARY_TEMPLATE,
  'disclosure-shared-utility': SHARED_UTILITY_DISCLOSURE_TEMPLATE,
  'disclosure-mpls-tenant-protections': MINNEAPOLIS_TENANT_PROTECTIONS_TEMPLATE,
  'disclosure-rental-license': RENTAL_LICENSE_DISCLOSURE_TEMPLATE,
  'disclosure-stp-rent-stabilization': ST_PAUL_RENT_STABILIZATION_TEMPLATE,
};

const ADDENDA_TEMPLATES: Record<string, string> = {
  'addendum-pet': PET_ADDENDUM_TEMPLATE,
  'addendum-smoking': SMOKING_ADDENDUM_TEMPLATE,
  'addendum-utilities': UTILITIES_ADDENDUM_TEMPLATE,
  'addendum-renters-insurance': RENTERS_INSURANCE_ADDENDUM_TEMPLATE,
  'addendum-move-in-checklist': MOVE_IN_CHECKLIST_TEMPLATE,
  'addendum-parking': PARKING_ADDENDUM_TEMPLATE,
  'addendum-work-letter': WORK_LETTER_ADDENDUM_TEMPLATE,
  'addendum-personal-guarantee': PERSONAL_GUARANTEE_ADDENDUM_TEMPLATE,
  'addendum-cam-reconciliation': CAM_RECONCILIATION_ADDENDUM_TEMPLATE,
  'addendum-rent-step-schedule': RENT_STEP_SCHEDULE_ADDENDUM_TEMPLATE,
};

// ============================================================================
// COLLECTION HELPERS
// ============================================================================

function draftsCollection(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('leaseBuilderDrafts');
}

function packagesCollection(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('leasePackages');
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatCurrency(cents: number | undefined): string {
  if (cents == null || isNaN(cents) || cents === 0) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAddress(property: Property | null): string {
  if (!property?.address) return '';
  const a = property.address;
  const parts = [a.street1];
  if (a.street2) parts.push(a.street2);
  parts.push(`${a.city}, ${a.state} ${a.zipCode}`);
  return parts.join(', ');
}

function formatPaymentMethods(methods: string[] | undefined): string {
  if (!methods?.length) return '';
  const labels: Record<string, string> = {
    online_portal: 'Online Portal',
    ach: 'ACH / Bank Transfer',
    check: 'Check',
    money_order: 'Money Order',
    cashiers_check: "Cashier's Check",
    cash: 'Cash',
  };
  return methods.map((m) => labels[m] || m).join(', ');
}

function formatMaintenanceItems(items: string[] | undefined): string {
  if (!items?.length) return 'None specified';
  const labels: Record<string, string> = {
    structural: 'Structural elements',
    roof: 'Roof',
    exterior_walls: 'Exterior walls',
    common_areas: 'Common areas',
    interior: 'Interior finishes',
    non_structural: 'Non-structural elements',
    fixtures_equipment: 'Fixtures and equipment',
    hvac: 'HVAC systems',
    plumbing: 'Plumbing',
    electrical: 'Electrical systems',
    lawn_care: 'Lawn care',
    snow_removal: 'Snow removal',
    hvac_filters: 'HVAC filter replacement',
    smoke_detector_batteries: 'Smoke detector batteries',
    gutter_cleaning: 'Gutter cleaning',
    pest_control: 'Pest control',
  };
  return items.map((i) => labels[i] || i).join(', ');
}

function formatUtilityList(utilities: string[] | undefined): string {
  if (!utilities?.length) return 'None';
  const labels: Record<string, string> = {
    electricity: 'Electricity',
    gas: 'Gas',
    water: 'Water',
    sewer: 'Sewer',
    trash: 'Trash',
    recycling: 'Recycling',
    internet: 'Internet',
    cable: 'Cable',
    phone: 'Phone',
    snow_removal: 'Snow Removal',
    lawn_care: 'Lawn Care',
  };
  return utilities.map((u) => labels[u] || u).join(', ');
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  llc: 'Limited Liability Company',
  corporation: 'Corporation',
  sole_proprietorship: 'Sole Proprietorship',
  partnership: 'Partnership',
  nonprofit: 'Nonprofit',
  other: 'Other',
};

const STATE_ABBR_TO_NAME: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

/** Resolve a state value (abbreviation or full name) to a full name */
function resolveStateName(value: string): string {
  if (!value) return '';
  // If it's a 2-letter abbreviation, look it up
  const upper = value.toUpperCase();
  if (upper.length === 2 && STATE_ABBR_TO_NAME[upper]) {
    return STATE_ABBR_TO_NAME[upper];
  }
  // Already a full name — return as-is
  return value;
}

/** Resolve a business type code to its title-cased display label */
function resolveBusinessTypeLabel(code: string): string {
  if (!code) return '';
  return BUSINESS_TYPE_LABELS[code] || code;
}

function getTenantName(tenant: Tenant): string {
  if (tenant.type === 'individual') {
    const rt = tenant as IndividualTenant;
    return `${rt.firstName} ${rt.lastName}`;
  }
  const ct = tenant as BusinessTenant;
  return ct.dba ? `${ct.businessName} dba ${ct.dba}` : ct.businessName;
}

// ============================================================================
// TEMPLATE CONTEXT BUILDER
// ============================================================================

/**
 * Builds a flat Record<string, string> mapping every placeholder path to its
 * resolved string value. Fetches LLC, property, unit, and tenant data from
 * Firestore and combines with draft wizard data.
 */
async function buildTemplateContext(
  draft: LeaseBuilderDraft & { id: string },
  llcId: string
): Promise<Record<string, string>> {
  // Fetch external data in parallel
  const [llcRaw, propertyRaw, tenantsRaw] = await Promise.all([
    getLlc(llcId),
    draft.propertyId ? getProperty(llcId, draft.propertyId) : Promise.resolve(null),
    draft.tenantIds?.length
      ? getTenantsByIds(draft.tenantIds)
      : Promise.resolve([]),
  ]);

  // Fetch all selected units
  const unitResults = draft.propertyId && draft.unitIds?.length
    ? await Promise.all(
        draft.unitIds.map((uid) => getUnit(llcId, draft.propertyId!, uid))
      )
    : [];
  const units = unitResults.filter(Boolean) as (Unit & { id: string })[];

  // Cast Firestore results to typed interfaces (service functions return untyped doc data)
  const llc = llcRaw as LLC | null;
  const property = propertyRaw as Property | null;
  const tenants = tenantsRaw;

  const ctx: Record<string, string> = {};

  // ── Metadata ──────────────────────────────────────────────────────────
  ctx['generatedDate'] = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  ctx['templateVersion'] = draft.templateVersion || '';

  // ── Landlord (from LLC + signer member) ──────────────────────────────
  const signerMember = draft.signerUserId
    ? await getMember(llcId, draft.signerUserId)
    : null;
  populateLandlord(ctx, llc, signerMember);

  // ── Tenant(s) ─────────────────────────────────────────────────────────
  populateTenants(ctx, tenants as Tenant[], draft);

  // ── Property & Unit(s) ──────────────────────────────────────────────
  populatePropertyAndUnit(ctx, property, units, draft);

  // ── Lease dates & terms ───────────────────────────────────────────────
  populateLeaseDates(ctx, draft);

  // ── Residential-specific ──────────────────────────────────────────────
  if (draft.leaseClass === 'residential') {
    populateResidentialContext(ctx, draft);
  }

  // ── Commercial-specific ───────────────────────────────────────────────
  if (draft.leaseClass === 'commercial') {
    populateCommercialContext(ctx, draft);
  }

  // ── Computed fields ───────────────────────────────────────────────────
  populateComputed(ctx, draft);

  // ── Walk draft for any propertyProfile.*, residential.*, commercial.* paths ──
  walkAndPopulate(ctx, draft, '');

  return ctx;
}

// ── Landlord ──────────────────────────────────────────────────────────────

function populateLandlord(
  ctx: Record<string, string>,
  llc: LLC | null,
  signer: { displayName: string | null; role: string } | null
) {
  ctx['landlord.name'] = llc?.legalName || '';
  ctx['landlord.address'] = '';
  ctx['landlord.email'] = '';
  ctx['landlord.phone'] = '';
  ctx['landlord.entityType'] = 'LLC';
  ctx['landlord.stateOfFormation'] = 'Minnesota';

  const signerName = signer?.displayName || '';
  const signerTitle = signer?.role === 'admin' ? 'Managing Member' : 'Authorized Representative';

  // Commercial placeholders
  ctx['landlord.signerName'] = signerName;
  ctx['landlord.signerTitle'] = signerTitle;
  // Residential placeholders (user-modified clause template)
  ctx['landlord.representativeName'] = signerName;
  ctx['landlord.represetativeTitle'] = signerTitle;
  // Legacy
  ctx['landlord.title'] = signerTitle;
}

// ── Tenants ───────────────────────────────────────────────────────────────

function populateTenants(
  ctx: Record<string, string>,
  tenants: Tenant[],
  draft: LeaseBuilderDraft
) {
  if (!tenants.length) {
    ctx['tenant.name'] = '';
    ctx['tenant.names'] = '';
    ctx['tenant.name1'] = '';
    ctx['tenant.name2'] = '';
    ctx['tenant.address'] = '';
    ctx['tenant.phone'] = '';
    ctx['tenant.email'] = '';
    ctx['tenant.entityType'] = '';
    ctx['tenant.stateOfFormation'] = '';
    ctx['tenant.signerName'] = '';
    ctx['tenant.signerTitle'] = '';
    return;
  }

  const names = tenants.map(getTenantName);
  ctx['tenant.names'] = names.join(' and ');
  ctx['tenant.name'] = names[0] || '';
  ctx['tenant.name1'] = names[0] || '';
  ctx['tenant.name2'] = names[1] || '';

  const firstTenant = tenants[0];
  if (firstTenant) {
    ctx['tenant.email'] = firstTenant.email || '';
    ctx['tenant.phone'] = firstTenant.phone || '';
  }

  if (draft.leaseClass === 'commercial' && firstTenant?.type === 'business') {
    const ct = firstTenant as BusinessTenant;
    ctx['tenant.entityType'] = resolveBusinessTypeLabel(ct.businessType || '');
    ctx['tenant.stateOfFormation'] = resolveStateName(ct.stateOfIncorporation || '');
    ctx['tenant.signerName'] = ct.primaryContact?.name || '';
    ctx['tenant.signerTitle'] = ct.primaryContact?.title || '';
    ctx['tenant.address'] = '';
  } else {
    ctx['tenant.address'] = '';
    ctx['tenant.entityType'] = '';
    ctx['tenant.stateOfFormation'] = '';
    ctx['tenant.signerName'] = '';
    ctx['tenant.signerTitle'] = '';
  }
}

// ── Property & Unit ───────────────────────────────────────────────────────

function populatePropertyAndUnit(
  ctx: Record<string, string>,
  property: Property | null,
  units: (Unit & { id: string })[],
  draft: LeaseBuilderDraft
) {
  ctx['property.address'] = formatAddress(property);
  ctx['property.buildingName'] = property?.name || '';
  ctx['property.yearBuilt'] = property?.yearBuilt ? String(property.yearBuilt) : '';

  // Multi-unit support: join unit numbers, sum sqft
  const unitNumbers = units.map((u) => u.unitNumber).filter(Boolean);
  ctx['unit.number'] = unitNumbers.join(', ');

  const totalSqft = draft.propertyProfile?.premisesSqft ||
    units.reduce((sum, u) => sum + (u.sqft || 0), 0) || '';
  ctx['premises.sqft'] = String(totalSqft);

  if (units.length > 1) {
    const sqftLabel = totalSqft ? ` (approx. ${totalSqft} sq. ft. combined)` : '';
    ctx['premises.description'] = `Units ${unitNumbers.join(', ')}${sqftLabel}`;
  } else if (units.length === 1) {
    const u = units[0]!;
    ctx['premises.description'] = `Unit ${u.unitNumber}${u.sqft ? ` (approx. ${u.sqft} sq. ft.)` : ''}`;
  } else {
    ctx['premises.description'] = '';
  }

  ctx['building.totalSqft'] = property?.totalSqft ? String(property.totalSqft) : '';
}

// ── Lease Dates ───────────────────────────────────────────────────────────

function populateLeaseDates(ctx: Record<string, string>, draft: LeaseBuilderDraft) {
  const rent = draft.residential?.rent;
  const ls = draft.commercial?.leaseStructure;

  const startDate = rent?.startDate || ls?.startDate || '';
  const endDate = rent?.endDate || ls?.endDate || '';

  ctx['lease.startDate'] = formatDate(startDate);
  ctx['lease.endDate'] = formatDate(endDate);
  ctx['leaseDate'] = formatDate(startDate);
  ctx['lease.rentCommencementDate'] = formatDate(startDate);

  // Notice days
  ctx['lease.noticeDays'] = String(
    rent?.noticeToTerminateDays || ls?.noticeToTerminateDays || 30
  );
}

// ── Residential Context ──────────────────────────────────────────────────

function populateResidentialContext(ctx: Record<string, string>, draft: LeaseBuilderDraft) {
  const rent = draft.residential?.rent;
  const deposit = draft.residential?.deposit;
  const utilities = draft.residential?.utilities;
  const occupancy = draft.residential?.occupancy;
  const policies = draft.residential?.policies;
  const entry = draft.residential?.entry;

  // ── Rent ──
  ctx['lease.monthlyRent'] = formatCurrency(rent?.monthlyRent);
  ctx['lease.dueDay'] = String(rent?.dueDay || 1);
  ctx['lease.gracePeriodDays'] = String(rent?.gracePeriodDays || 0);
  ctx['lease.lateFeeAmount'] = formatCurrency(rent?.lateFeeAmount);
  ctx['lease.lateFeePercent'] = rent?.lateFeeType === 'percentage'
    ? String(rent?.lateFeeAmount || 0) : '';
  ctx['lease.returnedPaymentFee'] = formatCurrency(rent?.returnedPaymentFee);
  ctx['lease.paymentMethods'] = formatPaymentMethods(rent?.paymentMethods);
  ctx['lease.paymentInstructions'] = `Payable to ${ctx['landlord.name']}`;

  // Proration
  if (rent?.prorationMethod === 'daily' && rent?.startDate) {
    const startDay = new Date(rent.startDate + 'T00:00:00').getDate();
    if (startDay > 1) {
      const startDt = new Date(rent.startDate + 'T00:00:00');
      const endOfMonth = new Date(startDt.getFullYear(), startDt.getMonth() + 1, 0);
      const daysInMonth = endOfMonth.getDate();
      const daysRemaining = daysInMonth - startDay + 1;
      const dailyRate = (rent.monthlyRent || 0) / daysInMonth;
      const prorated = Math.round(dailyRate * daysRemaining);
      ctx['lease.proratedAmount'] = formatCurrency(prorated);
      ctx['lease.prorationStartDate'] = formatDate(rent.startDate);
      ctx['lease.prorationEndDate'] = formatDate(
        `${startDt.getFullYear()}-${String(startDt.getMonth() + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
      );
    } else {
      ctx['lease.proratedAmount'] = 'N/A (starts on 1st)';
      ctx['lease.prorationStartDate'] = '';
      ctx['lease.prorationEndDate'] = '';
    }
  } else {
    ctx['lease.proratedAmount'] = 'N/A';
    ctx['lease.prorationStartDate'] = '';
    ctx['lease.prorationEndDate'] = '';
  }

  // ── Deposits ──
  ctx['lease.securityDeposit'] = formatCurrency(deposit?.securityDeposit);
  ctx['lease.petDeposit'] = formatCurrency(deposit?.petDeposit);
  ctx['lease.keyFobDeposit'] = formatCurrency(deposit?.keyFobDeposit);
  ctx['lease.accessDevicesList'] = 'Front door key, mailbox key';

  if (deposit?.nonrefundableFees?.length) {
    ctx['lease.nonrefundableFeesList'] = deposit.nonrefundableFees
      .map((f) => `${f.name}: ${formatCurrency(f.amount)}`)
      .join('; ');
  } else {
    ctx['lease.nonrefundableFeesList'] = 'None';
  }

  // ── Utilities ──
  ctx['lease.landlordUtilities'] = formatUtilityList(utilities?.landlordPays);
  ctx['lease.tenantUtilities'] = formatUtilityList(utilities?.tenantPays);

  if (utilities?.sharedUtilities?.length) {
    const allocationLabels: Record<string, string> = {
      rubs_sqft: 'RUBS (by square footage)',
      rubs_occupants: 'RUBS (by occupant count)',
      rubs_equal: 'RUBS (equal share)',
      submeter: 'Submetered',
      fixed_amount: 'Fixed monthly amount',
    };
    const details = utilities.sharedUtilities.map((su) => {
      const method = allocationLabels[su.allocationMethod] || su.allocationMethod;
      const fixed = su.fixedAmount ? ` — ${formatCurrency(su.fixedAmount)}/month` : '';
      return `${su.utilityType}: ${method}${fixed}`;
    });
    ctx['lease.sharedUtilityDetails'] = details.join('; ');
    ctx['lease.sharedUtilityAllocationMethod'] = details.join('; ');
    ctx['lease.sharedUtilityEstimate'] = 'See allocation details above';

    // For disclosure template
    ctx['sharedUtilityRows'] = utilities.sharedUtilities.map((su) => {
      const method = allocationLabels[su.allocationMethod] || su.allocationMethod;
      return `<tr><td>${su.utilityType}</td><td>${method}</td><td>${su.fixedAmount ? formatCurrency(su.fixedAmount) : 'Variable'}</td><td>${su.description || ''}</td></tr>`;
    }).join('\n');
    ctx['utilities.sharedList'] = details.join('; ');
    ctx['utilities.allocationDetails'] = details.join('; ');
  } else {
    ctx['lease.sharedUtilityDetails'] = 'None';
    ctx['lease.sharedUtilityAllocationMethod'] = 'N/A';
    ctx['lease.sharedUtilityEstimate'] = 'N/A';
    ctx['sharedUtilityRows'] = '<tr><td colspan="4">No shared utilities</td></tr>';
    ctx['utilities.sharedList'] = 'None';
    ctx['utilities.allocationDetails'] = 'N/A';
  }

  // ── Occupancy ──
  ctx['lease.maxOccupants'] = String(occupancy?.maxOccupants || '');
  ctx['lease.namedOccupants'] = occupancy?.namedOccupants?.join(', ') || '';
  ctx['lease.guestMaxConsecutiveDays'] = String(occupancy?.guestMaxConsecutiveDays || '');
  ctx['lease.guestMaxDaysPerYear'] = String(occupancy?.guestMaxDaysPerYear || '');

  // ── Policies ──
  // Smoking
  const smokingLabels: Record<string, string> = {
    no_smoking: 'No Smoking',
    designated_areas: 'Designated Areas Only',
    allowed: 'Allowed',
  };
  ctx['lease.smokingDesignatedAreas'] = policies?.smokingDesignatedAreas || '';
  ctx['smoking.policy'] = smokingLabels[policies?.smokingPolicy || ''] || '';
  ctx['smoking.designatedAreas'] = policies?.smokingDesignatedAreas || '';

  // Pets
  const petRestrictions = policies?.petRestrictions;
  ctx['lease.petMaxCount'] = String(petRestrictions?.maxPets || '');
  ctx['lease.petAllowedTypes'] = petRestrictions?.allowedTypes?.join(', ') || '';
  ctx['lease.petWeightLimit'] = petRestrictions?.weightLimitLbs
    ? `${petRestrictions.weightLimitLbs} lbs` : 'No limit';
  ctx['lease.petRestrictedBreeds'] = petRestrictions?.restrictedBreeds?.join(', ') || 'None';
  ctx['lease.petRentPerMonth'] = formatCurrency(petRestrictions?.petRentPerMonth);

  // Addenda-specific pet placeholders
  ctx['pet.maxPets'] = String(petRestrictions?.maxPets || '');
  ctx['pet.allowedTypes'] = petRestrictions?.allowedTypes?.join(', ') || '';
  ctx['pet.weightLimit'] = petRestrictions?.weightLimitLbs
    ? `${petRestrictions.weightLimitLbs} lbs` : 'No weight limit';
  ctx['pet.restrictedBreeds'] = petRestrictions?.restrictedBreeds?.join(', ') || 'None';
  ctx['pet.petRent'] = formatCurrency(petRestrictions?.petRentPerMonth);
  ctx['pet.petDeposit'] = formatCurrency(petRestrictions?.petDeposit);

  // Parking
  ctx['lease.parkingSpaces'] = String(policies?.parkingSpaces || 0);
  ctx['lease.parkingFee'] = formatCurrency(policies?.parkingFeePerMonth);
  ctx['lease.parkingLocation'] = 'As assigned by Landlord';
  ctx['lease.guestParkingDetails'] = policies?.guestParkingAvailable
    ? 'Guest parking is available on a first-come, first-served basis.'
    : 'Guest parking is not available at this property.';

  ctx['parking.spaces'] = String(policies?.parkingSpaces || 0);
  ctx['parking.fee'] = formatCurrency(policies?.parkingFeePerMonth);
  ctx['parking.guestParking'] = policies?.guestParkingAvailable
    ? 'Available' : 'Not available';

  // Insurance
  ctx['lease.insuranceMinCoverage'] = formatCurrency(
    policies?.rentersInsuranceMinCoverage
  );
  ctx['insurance.minCoverage'] = formatCurrency(
    policies?.rentersInsuranceMinCoverage
  );

  // Maintenance
  ctx['lease.tenantMaintenanceTasks'] = formatMaintenanceItems(
    policies?.tenantResponsibilities
  );

  // Entry
  ctx['lease.noticeHours'] = String(entry?.noticeHours || 24);
  ctx['lease.maintenanceRequestMethod'] = entry?.maintenanceRequestMethod || 'online_portal';
  ctx['lease.maintenanceContactInfo'] = entry?.emergencyContactInfo || '';
  ctx['lease.emergencyContact'] = entry?.emergencyContactInfo || '';

  // Early termination
  ctx['lease.earlyTerminationFee'] = 'two (2) months\' rent';

  // St. Paul rent stabilization direct paths
  ctx['residential.rent.monthlyRent'] = formatCurrency(rent?.monthlyRent);
  ctx['residential.rent.priorRentAmount'] = formatCurrency(rent?.priorRentAmount);
}

// ── Commercial Context ───────────────────────────────────────────────────

function populateCommercialContext(ctx: Record<string, string>, draft: LeaseBuilderDraft) {
  const ls = draft.commercial?.leaseStructure;
  const fin = draft.commercial?.financial;
  const dep = draft.commercial?.deposit;
  const ub = draft.commercial?.useAndBuildout;
  const ops = draft.commercial?.operations;
  const risk = draft.commercial?.risk;

  // ── Lease Structure ──
  const leaseTypeLabels: Record<string, string> = {
    nnn: 'Triple Net (NNN)',
    gross: 'Gross',
    modified_gross: 'Modified Gross',
  };
  ctx['commercial.leaseStructure.leaseType'] = leaseTypeLabels[ls?.leaseType || ''] || '';
  ctx['lease.renewalOptions'] = String(ls?.renewalOptions || 0);
  ctx['lease.renewalTermLength'] = ls?.renewalTermLength || '';
  ctx['lease.renewalNoticePeriodDays'] = String(ls?.renewalNoticePeriodDays || '');

  // ── Financial ──
  ctx['lease.baseRentMonthly'] = formatCurrency(fin?.baseRentMonthly);
  ctx['lease.dueDay'] = String(fin?.dueDay || 1);
  ctx['lease.lateFeeAmount'] = formatCurrency(fin?.lateFeeAmount);
  ctx['lease.defaultInterestRate'] = String(fin?.defaultInterestRate || '');
  ctx['lease.returnedPaymentFee'] = formatCurrency(fin?.lateFeeAmount);

  // Escalation
  ctx['lease.escalationAmount'] = formatCurrency(fin?.escalationFixedAmount);
  ctx['lease.escalationPercentage'] = String(fin?.escalationPercentage || '');
  if (fin?.escalationPercentage) {
    const pct = fin.escalationPercentage;
    ctx['lease.escalationPercentagePadded'] = String(Math.round(pct * 10)).padStart(3, '0');
  } else {
    ctx['lease.escalationPercentagePadded'] = '000';
  }
  ctx['lease.cpiCapPercent'] = '5';
  ctx['lease.cpiFloorPercent'] = '1';

  // CAM
  ctx['lease.camProRataShare'] = String(fin?.camProRataShare || '');
  ctx['lease.camManagementFeePercent'] = String(fin?.camManagementFeePercent || '');
  ctx['lease.camReconciliationDays'] = String(fin?.camReconciliationDays || 30);

  // CAM template placeholders (direct draft paths)
  ctx['commercial.financial.camProRataShare'] = String(fin?.camProRataShare || '');
  ctx['commercial.financial.camIncludesPropertyTax'] = fin?.camIncludesPropertyTax ? 'Yes' : 'No';
  ctx['commercial.financial.camIncludesInsurance'] = fin?.camIncludesInsurance ? 'Yes' : 'No';
  ctx['commercial.financial.camIncludesManagement'] = fin?.camIncludesManagement ? 'Yes' : 'No';
  ctx['commercial.financial.camIncludesUtilities'] = fin?.camIncludesUtilities ? 'Yes' : 'No';
  ctx['commercial.financial.camManagementFeePercent'] = String(fin?.camManagementFeePercent || '');
  ctx['commercial.financial.camReconciliationDays'] = String(fin?.camReconciliationDays || 30);
  ctx['commercial.financial.camAuditRights'] = fin?.camAuditRights ? 'true' : 'false';

  // Rent step schedule
  if (fin?.escalationStepSchedule?.length) {
    ctx['rentStepRows'] = fin.escalationStepSchedule.map((step) => {
      const monthly = formatCurrency(step.monthlyRent);
      const annual = formatCurrency(step.monthlyRent * 12);
      return `<tr><td>Year ${step.year}</td><td>Months ${(step.year - 1) * 12 + 1}-${step.year * 12}</td><td>${monthly}</td><td>${annual}</td></tr>`;
    }).join('\n');
  } else {
    ctx['rentStepRows'] = '<tr><td colspan="4">No step schedule defined</td></tr>';
  }

  // ── Deposit ──
  ctx['lease.securityDeposit'] = formatCurrency(dep?.securityDeposit);
  ctx['lease.depositReturnDays'] = String(dep?.depositReturnDays || '');

  // ── Use & Buildout ──
  ctx['lease.permittedUse'] = ub?.permittedUse || '';
  ctx['lease.exclusiveUseDescription'] = ub?.exclusiveUseDescription || '';
  ctx['lease.tiAllowance'] = formatCurrency(ub?.tiAllowance);

  // TI scope
  const scopeLabels: Record<string, string> = {
    hard_costs_only: 'Hard construction costs for labor, materials, and equipment directly incorporated into the Premises',
    all_costs: 'All costs including hard construction costs, soft costs, architectural fees, and permit fees',
  };
  ctx['lease.tiAllowanceScopeDescription'] = scopeLabels[ub?.tiAllowanceScope || ''] || '';

  // TI unused policy
  const unusedLabels: Record<string, string> = {
    forfeited: 'Any unused portion of the TI Allowance shall be forfeited by Tenant and retained by Landlord.',
    applied_to_rent: 'Any unused portion of the TI Allowance may be applied as a credit toward Base Rent.',
  };
  ctx['lease.tiUnusedPolicyDescription'] = unusedLabels[ub?.tiUnusedPolicy || ''] || '';

  // Work letter addendum placeholders
  ctx['commercial.useAndBuildout.workLetterDescription'] = ub?.workLetterDescription || '';
  ctx['commercial.useAndBuildout.workLetterPermitResponsibility'] = ub?.workLetterPermitResponsibility || '';
  ctx['commercial.useAndBuildout.workLetterDeadlineDays'] = String(ub?.workLetterDeadlineDays || '');
  ctx['commercial.useAndBuildout.workLetterLienDischargeDays'] = String(ub?.workLetterLienDischargeDays || '');
  ctx['commercial.useAndBuildout.tiAllowance'] = formatCurrency(ub?.tiAllowance);
  ctx['commercial.useAndBuildout.tiAllowanceScope'] = ub?.tiAllowanceScope || '';
  ctx['commercial.useAndBuildout.tiUnusedPolicy'] = ub?.tiUnusedPolicy || '';
  ctx['commercial.useAndBuildout.tiConstructionManagedBy'] = ub?.tiConstructionManagedBy || '';
  ctx['commercial.useAndBuildout.improvementOwnership'] = ub?.improvementOwnership || '';
  ctx['lease.workLetterLienDischargeDays'] = String(ub?.workLetterLienDischargeDays || '');

  // ── Operations ──
  ctx['landlord.maintenanceItems'] = formatMaintenanceItems(ops?.landlordMaintains);
  ctx['tenant.maintenanceItems'] = formatMaintenanceItems(ops?.tenantMaintains);

  const utilRespLabels: Record<string, string> = {
    tenant_all: 'Tenant shall be solely responsible for obtaining and paying for all utility services to the Premises',
    landlord_all: 'Landlord shall provide and pay for all utility services to the Premises',
    shared: 'Utility costs shall be shared between Landlord and Tenant as follows',
  };
  ctx['lease.utilityResponsibilityDescription'] = utilRespLabels[ops?.utilityResponsibility || ''] || '';
  ctx['lease.sharedUtilityAllocation'] = ops?.sharedUtilityAllocation || '';

  // Insurance
  ctx['lease.insuranceGLAmount'] = ops?.insuranceGLAmount
    ? `$${ops.insuranceGLAmount.toLocaleString('en-US')}` : '';
  ctx['lease.insurancePropertyDescription'] = ops?.insurancePropertyRequired
    ? 'Tenant shall maintain.' : 'Not required.';
  ctx['lease.insuranceBusinessInterruptionDescription'] = ops?.insuranceBusinessInterruption
    ? 'Tenant shall maintain.' : 'Not required.';
  ctx['lease.insuranceWorkersCompDescription'] = ops?.insuranceWorkersComp
    ? 'If Tenant has employees, Tenant shall maintain.' : 'Not required unless Tenant has employees.';
  ctx['lease.insuranceAdditionalInsuredDescription'] = ops?.insuranceLandlordAdditionalInsured
    ? '' : 'Unless waived by Landlord in writing,';

  // ADA
  const adaLabels: Record<string, string> = {
    landlord: 'Landlord shall be solely responsible for compliance with all Accessibility Laws with respect to the Building and the Premises.',
    tenant: 'Tenant shall be solely responsible for ADA compliance within the Premises and for any modifications required by Tenant\'s specific use.',
    shared: `ADA compliance responsibilities shall be shared. ${ops?.adaSharedDescription || 'Landlord shall maintain common area compliance; Tenant shall maintain compliance within the Premises.'}`,
  };
  ctx['lease.adaResponsibilityDescription'] = adaLabels[ops?.adaResponsibility || ''] || '';

  // Environmental
  ctx['commercial.operations.environmentalComplianceIncluded'] = 'true';

  // ── Risk ──
  ctx['lease.monetaryDefaultCureDays'] = String(risk?.monetaryDefaultCureDays || '');
  ctx['lease.nonMonetaryDefaultCureDays'] = String(risk?.nonMonetaryDefaultCureDays || '');
  ctx['lease.holdoverRentPercent'] = String(risk?.holdoverRentPercent || 150);

  // Assignment
  const consentLabels: Record<string, string> = {
    reasonable: 'reasonable',
    sole_discretion: 'sole',
  };
  ctx['lease.assignmentConsentStandard'] = consentLabels[risk?.assignmentConsentStandard || ''] || '';
  ctx['lease.assignmentConsentStandardDescription'] = risk?.assignmentConsentStandard === 'reasonable'
    ? 'Landlord\'s consent shall not be unreasonably withheld, conditioned, or delayed, provided that the proposed assignee demonstrates creditworthiness and the intended use is consistent with the permitted use under this Lease.'
    : 'Landlord may withhold consent for any reason or no reason.';

  ctx['lease.recaptureRightsDescription'] = risk?.landlordRecaptureRights
    ? 'Elect to terminate this Lease and recapture the Premises effective as of the proposed Transfer date, whereupon Landlord may negotiate directly with the proposed Transferee or any other party.'
    : 'Landlord has waived recapture rights under this Lease.';

  const profitShare = risk?.sublettingProfitShare;
  ctx['lease.sublettingProfitSharePercent'] = profitShare ? String(profitShare) : '';
  ctx['lease.sublettingProfitShareDescription'] = profitShare && profitShare > 0
    ? `Landlord shall be entitled to ${profitShare}% of any subletting profits (the excess of sublease rent over Tenant's Rent under this Lease).`
    : '';

  // Personal guarantee
  const guaranteeTypeLabels: Record<string, string> = {
    continuing: 'Unconditional and Continuing — Guarantor\'s obligations continue for the full Lease Term and any extensions or renewals.',
    limited: `Limited — Guarantor's liability is capped at ${formatCurrency(risk?.personalGuaranteeCap)}.`,
    good_guy: 'Good Guy Guarantee — Guarantor\'s obligations terminate upon Tenant\'s proper surrender of the Premises with all Rent paid through the surrender date.',
  };
  ctx['lease.guaranteeTypeDescription'] = guaranteeTypeLabels[risk?.personalGuaranteeType || ''] || '';
  ctx['lease.guarantorNames'] = '';

  ctx['commercial.risk.personalGuaranteeType'] = risk?.personalGuaranteeType || '';
  ctx['commercial.risk.personalGuaranteeCap'] = formatCurrency(risk?.personalGuaranteeCap);

  // Indemnification
  ctx['lease.indemnificationMutualSection'] = risk?.indemnificationMutual
    ? 'Landlord\'s Mutual Indemnification. Landlord shall indemnify, defend (with counsel reasonably acceptable to Tenant), and hold harmless Tenant and its officers, directors, employees, and agents from and against all Claims arising out of or resulting from: (a) Landlord\'s negligence or willful misconduct; (b) Landlord\'s breach of this Lease; or (c) any condition of the Building\'s common areas or structural elements, except to the extent caused by Tenant\'s negligence or willful misconduct.'
    : '';

  // Casualty
  const casualtyLabels: Record<string, string> = {
    landlord: 'Landlord',
    both: 'Either party',
    neither: 'Neither party',
  };
  ctx['casualtyTerminationRight'] = casualtyLabels[risk?.casualtyTerminationRight || ''] || 'Either party';
}

// ── Computed fields ──────────────────────────────────────────────────────

function populateComputed(ctx: Record<string, string>, draft: LeaseBuilderDraft) {
  const rent = draft.residential?.rent;
  if (rent?.priorRentAmount && rent.monthlyRent) {
    const diff = rent.monthlyRent - rent.priorRentAmount;
    ctx['computed.rentIncreaseAmount'] = formatCurrency(diff);
    if (rent.priorRentAmount > 0) {
      const pct = (diff / rent.priorRentAmount) * 100;
      ctx['computed.rentIncreasePercent'] = pct.toFixed(1);
    } else {
      ctx['computed.rentIncreasePercent'] = 'N/A';
    }
  } else {
    ctx['computed.rentIncreaseAmount'] = 'N/A';
    ctx['computed.rentIncreasePercent'] = 'N/A';
  }
}

// ── Walk draft to populate direct paths like propertyProfile.* ──────────

function walkAndPopulate(
  ctx: Record<string, string>,
  obj: unknown,
  prefix: string
) {
  if (obj === null || obj === undefined || typeof obj !== 'object') return;
  if (Array.isArray(obj)) return;

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;

    // Skip already-set values (explicit mappings take priority)
    if (ctx[path] !== undefined) continue;

    if (value === null || value === undefined) {
      ctx[path] = '';
    } else if (typeof value === 'string') {
      ctx[path] = value;
    } else if (typeof value === 'number') {
      // Format monetary fields
      if (key.toLowerCase().includes('rent') || key.toLowerCase().includes('deposit') ||
          key.toLowerCase().includes('fee') || key.toLowerCase().includes('allowance') ||
          key.toLowerCase().includes('amount') || key.toLowerCase().includes('cap')) {
        ctx[path] = formatCurrency(value);
      } else {
        ctx[path] = String(value);
      }
    } else if (typeof value === 'boolean') {
      ctx[path] = value ? 'Yes' : 'No';
    } else if (Array.isArray(value)) {
      ctx[path] = value.map(String).join(', ');
    } else if (typeof value === 'object') {
      walkAndPopulate(ctx, value, path);
    }
  }
}

// ============================================================================
// DRAFT CRUD
// ============================================================================

/**
 * Create a new lease builder draft.
 */
export async function createDraft(
  llcId: string,
  leaseClass: LeaseClass,
  actorUserId: string
): Promise<{ id: string }> {
  const docRef = draftsCollection(llcId).doc();

  const draft: Omit<LeaseBuilderDraft, 'id'> & { createdAt: FieldValue; updatedAt: FieldValue } = {
    llcId,
    leaseClass,
    currentStep: 'property_selection' as WizardStep,
    status: 'in_progress',
    propertyId: '',
    unitIds: [],
    tenantIds: [],
    leaseType: 'fixed_term',
    propertyProfile: {
      city: '',
      county: '',
      hasSharedUtilities: false,
    },
    triggeredDisclosures: [],
    triggeredOverlays: [],
    createdAt: FieldValue.serverTimestamp() as unknown as string,
    updatedAt: FieldValue.serverTimestamp() as unknown as string,
    createdByUserId: actorUserId,
    templateVersion: leaseClass === 'residential'
      ? TEMPLATE_VERSIONS.MN_RESIDENTIAL_CORE
      : TEMPLATE_VERSIONS.MN_COMMERCIAL_CORE,
  } as never;

  await docRef.set(draft);

  return { id: docRef.id };
}

/**
 * Get a draft by ID.
 */
export async function getDraft(
  llcId: string,
  draftId: string
): Promise<(LeaseBuilderDraft & { id: string }) | null> {
  const doc = await draftsCollection(llcId).doc(draftId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as LeaseBuilderDraft & { id: string };
}

/**
 * List all drafts for an LLC.
 */
export async function listDrafts(
  llcId: string,
  filters?: { status?: string; leaseClass?: LeaseClass }
): Promise<(LeaseBuilderDraft & { id: string })[]> {
  let query: FirebaseFirestore.Query = draftsCollection(llcId).orderBy('createdAt', 'desc');

  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.leaseClass) {
    query = query.where('leaseClass', '==', filters.leaseClass);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (LeaseBuilderDraft & { id: string })[];
}

/**
 * Update a draft (partial update for wizard step saves).
 */
export async function updateDraft(
  llcId: string,
  draftId: string,
  updates: Partial<LeaseBuilderDraft>,
  _actorUserId: string
): Promise<void> {
  const docRef = draftsCollection(llcId).doc(draftId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  // Auto-update triggered disclosures/overlays when relevant fields change
  const currentData = doc.data() as LeaseBuilderDraft;
  const mergedDraft = { ...currentData, ...updates, id: draftId } as LeaseBuilderDraft;

  const triggeredDisclosures = determineTriggeredDisclosures(mergedDraft);
  const triggeredAddenda = determineTriggeredAddenda(mergedDraft);

  await docRef.update({
    ...updates,
    triggeredDisclosures,
    triggeredOverlays: triggeredAddenda,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Delete a draft.
 */
export async function deleteDraft(
  llcId: string,
  draftId: string,
  _actorUserId: string
): Promise<void> {
  const docRef = draftsCollection(llcId).doc(draftId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  await docRef.delete();
}

/**
 * Abandon a draft (soft delete — sets status to 'abandoned').
 */
export async function abandonDraft(
  llcId: string,
  draftId: string,
  _actorUserId: string
): Promise<void> {
  await draftsCollection(llcId).doc(draftId).update({
    status: 'abandoned',
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a draft and return results (without assembling).
 */
export async function validateDraftStep(
  llcId: string,
  draftId: string
): Promise<{ results: ValidationResult[]; canProceed: boolean }> {
  const draft = await getDraft(llcId, draftId);
  if (!draft) throw new Error(`Draft not found: ${draftId}`);

  const { getValidationRulesForClass } = await import('@shared/leaseBuilder');
  const { validateDraft: validate, canProceed: checkCanProceed } = await import('@shared/leaseBuilder');

  const rules = getValidationRulesForClass(draft.leaseClass);
  const results = validate(draft, rules);

  return {
    results,
    canProceed: checkCanProceed(results),
  };
}

// ============================================================================
// ASSEMBLY & PACKAGE GENERATION
// ============================================================================

/**
 * Assemble a lease from a draft — runs validation, clause filtering,
 * overlay application, and produces the full document set with all
 * placeholder values populated from LLC/Property/Unit/Tenant data.
 */
export async function assembleLeasePackage(
  llcId: string,
  draftId: string,
  _actorUserId: string
): Promise<AssemblyResult> {
  const draft = await getDraft(llcId, draftId);
  if (!draft) throw new Error(`Draft not found: ${draftId}`);

  // Build the template context (fetches LLC, property, unit, tenant data)
  const context = await buildTemplateContext(draft, llcId);

  // Run the assembly engine with the context
  const result = assembleLease(draft, context);

  if (!result.success) {
    return result;
  }

  // Fill in disclosure and addenda template content using the same context
  const filledDocuments = result.documents.map((doc) => {
    if (doc.type === 'disclosure' && doc.triggeredBy) {
      const template = DISCLOSURE_TEMPLATES[doc.triggeredBy];
      if (template) {
        return { ...doc, htmlContent: replacePlaceholders(template, context) };
      }
    }
    if ((doc.type === 'addendum' || doc.type === 'checklist') && doc.triggeredBy) {
      const template = ADDENDA_TEMPLATES[doc.triggeredBy];
      if (template) {
        return { ...doc, htmlContent: replacePlaceholders(template, context) };
      }
    }
    if (doc.type === 'core_lease') {
      // Wrap clause content in the master template
      const masterTemplate = draft.leaseClass === 'residential'
        ? MN_RESIDENTIAL_CORE_TEMPLATE
        : MN_COMMERCIAL_CORE_TEMPLATE;
      // Insert clause content first, then replace all placeholders
      const fullHtml = replacePlaceholders(
        masterTemplate.replace('{{clauseContent}}', doc.htmlContent),
        context
      );
      return { ...doc, htmlContent: fullHtml };
    }
    return doc;
  });

  return { ...result, documents: filledDocuments };
}

/**
 * Generate the final lease package, save it to Firestore, and return the package.
 */
export async function generateLeasePackage(
  llcId: string,
  draftId: string,
  actorUserId: string
): Promise<LeasePackage & { id: string }> {
  const draft = await getDraft(llcId, draftId);
  if (!draft) throw new Error(`Draft not found: ${draftId}`);

  // Assemble
  const assemblyResult = await assembleLeasePackage(llcId, draftId, actorUserId);

  if (!assemblyResult.success) {
    throw new Error(
      `Assembly failed with errors: ${assemblyResult.errors.join('; ')}`
    );
  }

  // Create package record
  const packageRef = packagesCollection(llcId).doc();
  const leasePackage: Omit<LeasePackage, 'id'> = {
    leaseId: '', // Will be linked when a Lease record is created
    draftId,
    llcId,
    leaseClass: draft.leaseClass,
    generatedAt: new Date().toISOString(),
    templateVersion: draft.templateVersion,
    documents: assemblyResult.documents,
    inputs: draft,
    clausesIncluded: assemblyResult.clausesIncluded,
    overlaysApplied: assemblyResult.overlaysApplied,
    validationResults: assemblyResult.validationResults,
    createdByUserId: actorUserId,
  };

  // Strip undefined values — Firestore rejects them
  const sanitized = JSON.parse(JSON.stringify(leasePackage));

  await packageRef.set({
    ...sanitized,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Mark draft as completed
  await draftsCollection(llcId).doc(draftId).update({
    status: 'completed',
    reviewedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: packageRef.id, ...leasePackage };
}

/**
 * Get a generated package by ID.
 */
export async function getPackage(
  llcId: string,
  packageId: string
): Promise<(LeasePackage & { id: string }) | null> {
  const doc = await packagesCollection(llcId).doc(packageId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as LeasePackage & { id: string };
}

/**
 * List packages for an LLC.
 */
export async function listPackages(
  llcId: string,
  filters?: { leaseClass?: LeaseClass }
): Promise<(LeasePackage & { id: string })[]> {
  let query: FirebaseFirestore.Query = packagesCollection(llcId).orderBy('createdAt', 'desc');

  if (filters?.leaseClass) {
    query = query.where('leaseClass', '==', filters.leaseClass);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (LeasePackage & { id: string })[];
}
