/**
 * Lease Builder Types
 *
 * Unified type system for the Minnesota Lease Builder supporting both
 * residential and commercial lease generation with city-specific overlays.
 */

// ============================================================================
// CORE ENUMS & LITERALS
// ============================================================================

export type LeaseClass = 'residential' | 'commercial';

export type ResidentialWizardStep =
  | 'property_selection'
  | 'property_profile'
  | 'rent_terms'
  | 'deposit_terms'
  | 'utility_terms'
  | 'occupancy_terms'
  | 'policy_terms'
  | 'entry_terms'
  | 'disclosures_review'
  | 'review'
  | 'generate';

export type CommercialWizardStep =
  | 'property_selection'
  | 'property_profile'
  | 'lease_structure'
  | 'financial_terms'
  | 'deposit_terms'
  | 'use_and_buildout'
  | 'operations'
  | 'risk_terms'
  | 'disclosures_review'
  | 'review'
  | 'generate';

export type WizardStep = ResidentialWizardStep | CommercialWizardStep;

export type LeasePaymentMethod =
  | 'online_portal'
  | 'ach'
  | 'check'
  | 'money_order'
  | 'cashiers_check'
  | 'cash';

export type LeaseUtilityType =
  | 'electricity'
  | 'gas'
  | 'water'
  | 'sewer'
  | 'trash'
  | 'recycling'
  | 'internet'
  | 'cable'
  | 'phone'
  | 'snow_removal'
  | 'lawn_care';

export type TenantMaintenance =
  | 'lawn_care'
  | 'snow_removal'
  | 'hvac_filters'
  | 'smoke_detector_batteries'
  | 'gutter_cleaning'
  | 'pest_control';

export type ProhibitedActivity =
  | 'short_term_rental'
  | 'illegal_activity'
  | 'home_business'
  | 'vehicle_repair'
  | 'outdoor_storage'
  | 'satellite_dish_without_approval';

export type CommercialMaintenanceItem =
  | 'structural'
  | 'roof'
  | 'exterior_walls'
  | 'common_areas'
  | 'interior'
  | 'non_structural'
  | 'fixtures_equipment'
  | 'hvac'
  | 'plumbing'
  | 'electrical';

export type CommercialSpaceType =
  | 'office'
  | 'retail'
  | 'industrial'
  | 'warehouse'
  | 'restaurant'
  | 'medical';

// ============================================================================
// WIZARD DRAFT (Top-Level — Persisted to Firestore)
// ============================================================================

export interface LeaseBuilderDraft {
  id: string;
  llcId: string;
  leaseClass: LeaseClass;
  currentStep: WizardStep;
  status: 'in_progress' | 'completed' | 'abandoned';

  // Step 1: Property & Tenant Selection (shared)
  propertyId?: string;
  unitIds: string[];
  tenantIds: string[];
  leaseType?: 'fixed_term' | 'month_to_month';

  // Landlord signer (selected LLC member who signs on behalf of the LLC)
  signerUserId?: string;

  // Tenant signer (the individual who signs on behalf of the tenant entity)
  tenantSigner?: { name: string; title?: string };

  // Step 2: Property & Location Profile
  propertyProfile?: PropertyProfile;

  // Residential-specific (populated when leaseClass === 'residential')
  residential?: ResidentialTerms;

  // Commercial-specific (populated when leaseClass === 'commercial')
  commercial?: CommercialTerms;

  // Auto-computed disclosures & overlays
  triggeredDisclosures: string[];
  triggeredOverlays: string[];

  // Review
  reviewedAt?: string;

  // Default template
  saveAsDefault?: boolean;

  // Publishing
  published?: boolean;
  publishedLeaseId?: string;

  // Amendment fields (set when this draft is a clone for addendum)
  amendingPublishedLeaseId?: string; // published lease being amended
  clonedFromDraftId?: string;        // source draft (for diffing)

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  templateVersion: string;
}

// ============================================================================
// PROPERTY PROFILE (Shared, with class-specific fields)
// ============================================================================

export interface PropertyProfile {
  city: string;
  county: string;
  yearBuilt?: number;
  premisesSqft?: number;
  hasSharedUtilities: boolean;

  // Residential-specific
  unitType?: 'single_family' | 'duplex' | 'triplex' | 'fourplex' | 'apartment' | 'townhome' | 'condo';
  isFurnished?: boolean;
  hasRentalLicense?: boolean | null; // null = unsure
  minneapolisLicenseStatus?: 'yes' | 'no' | 'unsure';
  stPaulRentStabilization?: 'subject' | 'exempt' | 'unsure';

  // Commercial-specific
  commercialSpaceTypes?: CommercialSpaceType[];
  zoningConfirmed?: boolean;
  liquorLicenseRequired?: boolean;
  outdoorPatioUse?: boolean;
  buildingTotalSqft?: number;       // Total building rentable sq ft (for Pro Rata Share)
  landlordAddress?: string;          // Landlord principal office address (LLC has no address field)
}

// ============================================================================
// RESIDENTIAL TERMS
// ============================================================================

export interface ResidentialTerms {
  rent?: ResidentialRentTerms;
  deposit?: ResidentialDepositTerms;
  utilities?: ResidentialUtilityTerms;
  occupancy?: OccupancyTerms;
  policies?: ResidentialPolicyTerms;
  entry?: EntryTerms;
}

export interface ResidentialRentTerms {
  monthlyRent: number; // cents
  dueDay: number; // 1-28
  gracePeriodDays: number;
  lateFeeType: 'flat' | 'percentage' | 'none';
  lateFeeAmount?: number; // cents (flat) or percentage value (e.g. 5 = 5%)
  lateFeeMaxAmount?: number; // cents (cap for percentage type)
  returnedPaymentFee?: number; // cents
  paymentMethods: LeasePaymentMethod[];
  prorationMethod: 'daily' | 'none';
  holdoverTerms: 'month_to_month' | 'double_rent' | 'none';
  startDate: string; // ISO date
  endDate?: string; // ISO date (not for month-to-month)
  noticeToTerminateDays?: number; // month-to-month only
  // St. Paul renewal fields
  rentIncreaseFromPrior?: number; // cents
  priorRentAmount?: number; // cents
}

export interface ResidentialDepositTerms {
  securityDeposit: number; // cents
  petDeposit?: number; // cents
  keyFobDeposit?: number; // cents
  nonrefundableFees?: NonrefundableFee[];
  useMoveinChecklist: boolean;
}

export interface NonrefundableFee {
  name: string;
  amount: number; // cents
}

export interface ResidentialUtilityTerms {
  landlordPays: LeaseUtilityType[];
  tenantPays: LeaseUtilityType[];
  sharedUtilities: SharedUtility[];
}

export interface SharedUtility {
  utilityType: LeaseUtilityType;
  allocationMethod: 'rubs_sqft' | 'rubs_occupants' | 'rubs_equal' | 'submeter' | 'fixed_amount';
  fixedAmount?: number; // cents (if method is fixed_amount)
  description?: string;
}

export interface OccupancyTerms {
  namedOccupants: string[];
  maxOccupants: number;
  guestMaxConsecutiveDays: number;
  guestMaxDaysPerYear?: number;
  sublettingAllowed: boolean;
  sublettingRequiresConsent: boolean;
  assignmentAllowed: boolean;
}

export interface ResidentialPolicyTerms {
  // Smoking
  smokingPolicy: 'no_smoking' | 'designated_areas' | 'allowed';
  smokingDesignatedAreas?: string;
  // Pets
  petPolicy: 'no_pets' | 'allowed_with_restrictions' | 'allowed';
  petRestrictions?: PetRestrictions;
  // Insurance
  rentersInsuranceRequired: boolean;
  rentersInsuranceMinCoverage?: number; // dollars
  // Parking
  parkingIncluded: boolean;
  parkingSpaces?: number;
  parkingFeePerMonth?: number; // cents
  guestParkingAvailable: boolean;
  // Storage
  storageIncluded: boolean;
  storageFeePerMonth?: number; // cents
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  // Maintenance responsibilities
  tenantResponsibilities: TenantMaintenance[];
  // Prohibited activities
  prohibitedActivities: ProhibitedActivity[];
  // Keys
  lockChangePolicy: 'landlord_only' | 'tenant_with_copy' | 'either_party';
}

export interface PetRestrictions {
  maxPets: number;
  allowedTypes: ('dog' | 'cat' | 'bird' | 'fish' | 'small_animal' | 'reptile')[];
  weightLimitLbs?: number;
  restrictedBreeds?: string[];
  petRentPerMonth?: number; // cents
  petDeposit?: number; // cents
  requiresDocumentation: boolean;
}

export interface EntryTerms {
  noticeHours: 24 | 48 | 72;
  maintenanceRequestMethod: 'online_portal' | 'email' | 'phone' | 'written';
  emergencyContactMethod: 'phone' | 'email' | 'both';
  emergencyContactInfo: string;
}

// ============================================================================
// COMMERCIAL TERMS
// ============================================================================

export interface CommercialTerms {
  leaseStructure?: CommercialLeaseStructure;
  financial?: CommercialFinancialTerms;
  deposit?: CommercialDepositTerms;
  useAndBuildout?: UseAndBuildoutTerms;
  operations?: CommercialOperationsTerms;
  risk?: CommercialRiskTerms;
}

export interface CommercialLeaseStructure {
  leaseType: 'nnn' | 'gross' | 'modified_gross';
  startDate: string; // ISO date
  termMonths?: number; // duration in months (fixed-term only; end date is computed)
  endDate?: string; // ISO date (computed from startDate + termMonths)
  noticeToTerminateDays?: number; // month-to-month
  renewalOptions: number; // 0 = none
  renewalTermLength?: string; // e.g. "5 years"
  renewalNoticePeriodDays?: number;
}

export interface CommercialConvenienceFee {
  method: LeasePaymentMethod;
  feeType: 'flat' | 'percentage';
  flatAmount?: number;  // cents
  percentage?: number;  // e.g. 3 = 3%
}

export interface CommercialFinancialTerms {
  // Base rent
  baseRentMonthly: number; // cents
  dueDay: number; // 1-28
  // Escalation (mutually exclusive types)
  escalationType: 'fixed_amount' | 'fixed_percentage' | 'cpi' | 'step_schedule' | 'none';
  escalationFixedAmount?: number; // cents per year
  escalationPercentage?: number; // e.g. 3 = 3%
  escalationStepSchedule?: RentStep[];
  // Late fee / default interest
  gracePeriodDays?: number;
  lateFeeType?: 'flat' | 'percentage';
  lateFeeAmount?: number; // cents (flat)
  lateFeePercentage?: number; // e.g. 5 = 5%
  defaultInterestRate?: number; // percentage per annum
  // Free rent / rent concession period
  freeRentMonths?: number; // 0–24
  // Payment methods
  paymentMethods?: LeasePaymentMethod[];
  returnedPaymentFee?: number; // cents
  convenienceFees?: CommercialConvenienceFee[];
  // CAM / Additional rent (NNN and Modified Gross only)
  camEnabled: boolean;
  camProRataShare?: number; // percentage (e.g. 12.5)
  camIncludesPropertyTax: boolean;
  camIncludesInsurance: boolean;
  camIncludesManagement: boolean;
  camManagementFeePercent?: number; // percentage
  camIncludesUtilities: boolean;
  camReconciliationDays?: number; // days to pay deficiency
  camAuditRights: boolean;
}

export interface RentStep {
  year: number;
  monthlyRent: number; // cents
}

export interface CommercialDepositTerms {
  securityDeposit: number; // cents
  depositReturnDays: number;
}

export interface UseAndBuildoutTerms {
  permittedUse: string;
  exclusiveUse: boolean;
  exclusiveUseDescription?: string;
  // Tenant improvements
  tiType: 'none' | 'landlord_allowance' | 'work_letter';
  tiAllowance?: number; // cents
  tiAllowanceScope?: 'hard_costs_only' | 'all_costs';
  tiUnusedPolicy?: 'forfeited' | 'applied_to_rent';
  tiConstructionManagedBy?: 'landlord' | 'tenant';
  // Work letter
  workLetterDescription?: string;
  workLetterPermitResponsibility?: 'landlord' | 'tenant';
  workLetterDeadlineDays?: number;
  workLetterCompletionDate?: string; // ISO date
  workLetterLienDischargeDays?: number;
  // Improvement ownership
  improvementOwnership: 'landlord' | 'tenant_trade_fixtures';
  // Signage
  signageAllowed: boolean;
  signageRequiresApproval: boolean;
  // Condition
  premisesCondition: 'as_is' | 'with_improvements';
}

export interface CommercialOperationsTerms {
  // Maintenance split
  landlordMaintains: CommercialMaintenanceItem[];
  tenantMaintains: CommercialMaintenanceItem[];
  // Utilities
  utilityResponsibility: 'tenant_all' | 'landlord_all' | 'shared';
  sharedUtilityAllocation?: string;
  // Insurance
  insuranceGLAmount: number; // per occurrence, dollars
  insurancePropertyRequired: boolean;
  insuranceBusinessInterruption: boolean;
  insuranceWorkersComp: boolean;
  insuranceLandlordAdditionalInsured: boolean;
  // Utility interruption abatement trigger
  utilityInterruptionAbatementDays?: number; // 1–14; absent = no abatement clause
  utilityAbatementScope?: 'narrow' | 'moderate' | 'broad'; // required when days is set
  // Environmental (always true, cannot remove)
  environmentalComplianceIncluded: boolean;
  // ADA
  adaResponsibility: 'landlord' | 'tenant' | 'shared';
  adaSharedDescription?: string;
}

export interface GuarantorEntry {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  title?: string;
  phone?: string;
  email?: string;
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dateOfBirth?: string; // ISO date string YYYY-MM-DD
  idType?: 'passport' | 'drivers_license' | 'state_id' | 'other';
  idNumber?: string;
}

export interface CommercialRiskTerms {
  // Default & remedies
  monetaryDefaultCureDays: number;
  nonMonetaryDefaultCureDays: number;
  remediesTermination: boolean;
  remediesAcceleration: boolean;
  remediesReentry: boolean;
  remediesAttorneyFees: boolean;
  remediesDefaultInterest: boolean;
  // Holdover
  holdoverRentPercent: number; // e.g. 150 = 150% of last rent
  // Assignment & subletting
  assignmentAllowed: boolean;
  assignmentConsentRequired: boolean;
  assignmentConsentStandard: 'reasonable' | 'sole_discretion';
  landlordRecaptureRights: boolean;
  sublettingProfitShare?: number; // percentage landlord gets
  // Personal guarantee
  personalGuaranteeRequired: boolean;
  personalGuaranteeType?: 'continuing' | 'limited' | 'good_guy';
  personalGuaranteeCap?: number; // cents (for limited)
  includePrimaryContactAsGuarantor?: boolean;
  guarantors?: GuarantorEntry[];  // additional guarantors only (not primary contact)
  // Indemnification
  indemnificationMutual: boolean;
  // Casualty & condemnation
  casualtyTerminationRight: 'landlord' | 'both' | 'neither';
}

// ============================================================================
// CLAUSE LIBRARY TYPES
// ============================================================================

export type ClauseCategory =
  // Shared
  | 'core'
  | 'rent'
  | 'deposit'
  | 'utilities'
  | 'maintenance'
  | 'termination'
  | 'disclosure'
  | 'local_overlay'
  // Residential-only
  | 'occupancy'
  | 'pets'
  | 'smoking'
  | 'renter_insurance'
  | 'parking'
  // Commercial-only
  | 'cam'
  | 'tenant_improvements'
  | 'insurance_commercial'
  | 'use_and_exclusivity'
  | 'environmental'
  | 'ada'
  | 'indemnification'
  | 'personal_guarantee'
  | 'signage'
  | 'casualty_condemnation'
  | 'assignment';

export interface ClauseCondition {
  field: string; // dot-path into LeaseBuilderDraft (e.g. "residential.policies.petPolicy")
  operator:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'exists'
    | 'truthy'
    | 'contains'
    | 'contains_any';
  value: unknown;
}

export interface ClauseDefinition {
  id: string;
  leaseClass: LeaseClass | 'both';
  category: ClauseCategory;
  title: string;
  description: string;
  htmlContent: string;
  isRequired: boolean;
  conditions?: ClauseCondition[];
  placeholders: string[];
  sortOrder: number; // determines position in final document
  version: string;
  lastReviewedDate: string;
}

// ============================================================================
// OVERLAY TYPES
// ============================================================================

export interface OverlayRule {
  id: string;
  description: string;
  type: 'replace_clause' | 'add_clause' | 'remove_clause' | 'modify_validation' | 'add_warning';
  targetClauseId?: string;
  replacementClauseId?: string;
  additionalClauseId?: string;
  validationRuleId?: string;
  warningMessage?: string;
  conditions?: ClauseCondition[]; // additional conditions for this rule
}

export interface CityOverlay {
  id: string;
  leaseClass: LeaseClass;
  cityName: string;
  version: string;
  lastReviewedDate: string;
  rules: OverlayRule[];
  requiredDisclosures: string[]; // clause IDs auto-included
  requiredAddenda: string[]; // addendum clause IDs auto-included
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationCondition {
  type: 'max_value' | 'min_value' | 'required' | 'required_if' | 'forbidden' | 'custom';
  value?: unknown;
  dependsOnField?: string; // for required_if
  dependsOnValue?: unknown;
  customFn?: string; // function name in validation engine
}

export interface ValidationRule {
  id: string;
  leaseClass: LeaseClass | 'both';
  description: string;
  severity: ValidationSeverity;
  field: string; // dot-path into draft
  condition: ValidationCondition;
  message: string; // user-facing error/warning message
  helpText?: string; // extended explanation
  appliesTo?: 'state' | 'minneapolis' | 'stpaul'; // scope
}

export interface ValidationResult {
  ruleId: string;
  severity: ValidationSeverity;
  field: string;
  message: string;
  helpText?: string;
  passed: boolean;
}

// ============================================================================
// OUTPUT / PACKAGE TYPES
// ============================================================================

export type PackageDocumentType = 'core_lease' | 'disclosure' | 'addendum' | 'checklist';

export interface LeasePackageDocument {
  type: PackageDocumentType;
  title: string;
  htmlContent: string;
  pageOrder: number;
  requiredByLaw: boolean;
  triggeredBy?: string; // explanation of why included
  clauseIds: string[]; // which clauses compose this document
}

export interface LeasePackage {
  id: string;
  leaseId: string;
  draftId: string;
  llcId: string;
  leaseClass: LeaseClass;
  generatedAt: string; // ISO datetime
  templateVersion: string;
  documents: LeasePackageDocument[];
  inputs: LeaseBuilderDraft; // snapshot at generation time
  clausesIncluded: string[];
  overlaysApplied: string[];
  validationResults: ValidationResult[];
  createdByUserId: string;
}

// ============================================================================
// WIZARD STEP METADATA (for progress bar + navigation)
// ============================================================================

export interface WizardStepMeta {
  key: WizardStep;
  label: string;
  shortLabel: string; // for progress bar
  description: string;
}

export const RESIDENTIAL_STEPS: WizardStepMeta[] = [
  { key: 'property_selection', label: 'Property & Tenant Selection', shortLabel: 'Property', description: 'Select property, unit, tenants, and lease type' },
  { key: 'property_profile', label: 'Property Profile', shortLabel: 'Profile', description: 'Location details and compliance profiling' },
  { key: 'rent_terms', label: 'Rent & Payment Terms', shortLabel: 'Rent', description: 'Monthly rent, due dates, late fees, payment methods' },
  { key: 'deposit_terms', label: 'Deposits & Fees', shortLabel: 'Deposits', description: 'Security deposit, pet deposit, move-in fees' },
  { key: 'utility_terms', label: 'Utilities & Services', shortLabel: 'Utilities', description: 'Utility responsibilities and shared utility allocation' },
  { key: 'occupancy_terms', label: 'Occupancy & Guests', shortLabel: 'Occupancy', description: 'Occupants, guest rules, subletting' },
  { key: 'policy_terms', label: 'Policies', shortLabel: 'Policies', description: 'Pets, smoking, insurance, parking, maintenance' },
  { key: 'entry_terms', label: 'Entry & Repairs', shortLabel: 'Entry', description: 'Access notice, maintenance requests, emergency contact' },
  { key: 'disclosures_review', label: 'Disclosures & Overlays', shortLabel: 'Disclosures', description: 'Review required disclosures and city-specific addenda' },
  { key: 'review', label: 'Review', shortLabel: 'Review', description: 'Review lease summary and package contents' },
  { key: 'generate', label: 'Generate & Download', shortLabel: 'Generate', description: 'Generate final lease package' },
];

export const COMMERCIAL_STEPS: WizardStepMeta[] = [
  { key: 'property_selection', label: 'Property & Tenant Selection', shortLabel: 'Property', description: 'Select property, unit, tenants, and lease type' },
  { key: 'property_profile', label: 'Property Profile', shortLabel: 'Profile', description: 'Location details, space type, zoning confirmation' },
  { key: 'lease_structure', label: 'Lease Structure', shortLabel: 'Structure', description: 'Lease type (NNN/Gross/Modified), term, renewal options' },
  { key: 'financial_terms', label: 'Financial Terms', shortLabel: 'Financial', description: 'Base rent, escalations, CAM, additional rent' },
  { key: 'deposit_terms', label: 'Security Deposit', shortLabel: 'Deposit', description: 'Security deposit amount and return terms' },
  { key: 'use_and_buildout', label: 'Use & Buildout', shortLabel: 'Use', description: 'Permitted use, TI allowance, work letter, signage' },
  { key: 'operations', label: 'Operations', shortLabel: 'Operations', description: 'Maintenance, utilities, insurance, ADA, environmental' },
  { key: 'risk_terms', label: 'Risk & Default', shortLabel: 'Risk', description: 'Default, remedies, assignment, personal guarantee' },
  { key: 'disclosures_review', label: 'Disclosures & Overlays', shortLabel: 'Disclosures', description: 'Review required disclosures and city-specific addenda' },
  { key: 'review', label: 'Review', shortLabel: 'Review', description: 'Review lease summary and package contents' },
  { key: 'generate', label: 'Generate & Download', shortLabel: 'Generate', description: 'Generate final lease package' },
];
