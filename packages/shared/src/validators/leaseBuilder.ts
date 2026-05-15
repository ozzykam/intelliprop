import { z } from 'zod';

// ============================================================================
// SHARED ENUMS
// ============================================================================

export const leaseClassSchema = z.enum(['residential', 'commercial']);

export const paymentMethodSchema = z.enum([
  'online_portal', 'ach', 'check', 'money_order', 'cashiers_check', 'cash',
]);

export const utilityTypeSchema = z.enum([
  'electricity', 'gas', 'water', 'sewer', 'trash', 'recycling',
  'internet', 'cable', 'phone', 'snow_removal', 'lawn_care',
]);

export const tenantMaintenanceSchema = z.enum([
  'lawn_care', 'snow_removal', 'hvac_filters',
  'smoke_detector_batteries', 'gutter_cleaning', 'pest_control',
]);

export const prohibitedActivitySchema = z.enum([
  'short_term_rental', 'illegal_activity', 'home_business',
  'vehicle_repair', 'outdoor_storage', 'satellite_dish_without_approval',
]);

export const commercialMaintenanceItemSchema = z.enum([
  'structural', 'roof', 'exterior_walls', 'common_areas',
  'interior', 'non_structural', 'fixtures_equipment', 'hvac',
  'plumbing', 'electrical',
]);

// ============================================================================
// PROPERTY PROFILE
// ============================================================================

export const propertyProfileSchema = z.object({
  city: z.string(),
  county: z.string(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  premisesSqft: z.number().positive().optional(),
  hasSharedUtilities: z.boolean(),
  // Residential
  unitType: z.enum(['single_family', 'duplex', 'triplex', 'fourplex', 'apartment', 'townhome', 'condo']).optional(),
  isFurnished: z.boolean().optional(),
  hasRentalLicense: z.boolean().nullable().optional(),
  minneapolisLicenseStatus: z.enum(['yes', 'no', 'unsure']).optional(),
  stPaulRentStabilization: z.enum(['subject', 'exempt', 'unsure']).optional(),
  // Commercial
  commercialSpaceTypes: z.array(z.enum(['office', 'retail', 'industrial', 'warehouse', 'restaurant', 'medical', 'daycare_services'])).min(1).optional(),
  zoningConfirmed: z.boolean().optional(),
  liquorLicenseRequired: z.boolean().optional(),
  outdoorPatioUse: z.boolean().optional(),
  buildingTotalSqft: z.number().positive().optional(),
  landlordAddress: z.string().optional(),
});

// ============================================================================
// RESIDENTIAL STEP SCHEMAS
// ============================================================================

export const residentialRentTermsSchema = z.object({
  monthlyRent: z.number().positive(),
  dueDay: z.number().int().min(1).max(28),
  gracePeriodDays: z.number().int().min(0).max(30),
  lateFeeType: z.enum(['flat', 'percentage', 'none']),
  lateFeeAmount: z.number().nonnegative().optional(),
  lateFeeMaxAmount: z.number().nonnegative().optional(),
  returnedPaymentFee: z.number().nonnegative().optional(),
  paymentMethods: z.array(paymentMethodSchema).min(1),
  prorationMethod: z.enum(['daily', 'none']),
  holdoverTerms: z.enum(['month_to_month', 'double_rent', 'none']),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  noticeToTerminateDays: z.number().int().min(1).optional(),
  rentIncreaseFromPrior: z.number().optional(),
  priorRentAmount: z.number().optional(),
}).refine(
  (data) => {
    if (data.lateFeeType === 'percentage' && data.lateFeeAmount !== undefined) {
      return data.lateFeeAmount <= 8; // MN max 8%
    }
    return true;
  },
  { message: 'Late fee percentage cannot exceed 8% under Minnesota law', path: ['lateFeeAmount'] }
);

export const nonrefundableFeeSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
});

export const residentialDepositTermsSchema = z.object({
  securityDeposit: z.number().nonnegative(),
  petDeposit: z.number().nonnegative().optional(),
  keyFobDeposit: z.number().nonnegative().optional(),
  nonrefundableFees: z.array(nonrefundableFeeSchema).optional(),
  useMoveinChecklist: z.boolean(),
});

export const sharedUtilitySchema = z.object({
  utilityType: utilityTypeSchema,
  allocationMethod: z.enum(['rubs_sqft', 'rubs_occupants', 'rubs_equal', 'submeter', 'fixed_amount']),
  fixedAmount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
});

export const residentialUtilityTermsSchema = z.object({
  landlordPays: z.array(utilityTypeSchema),
  tenantPays: z.array(utilityTypeSchema),
  sharedUtilities: z.array(sharedUtilitySchema),
});

export const occupancyTermsSchema = z.object({
  namedOccupants: z.array(z.string().min(1).max(200)),
  maxOccupants: z.number().int().min(1).max(50),
  guestMaxConsecutiveDays: z.number().int().min(1).max(365),
  guestMaxDaysPerYear: z.number().int().min(1).max(365).optional(),
  sublettingAllowed: z.boolean(),
  sublettingRequiresConsent: z.boolean(),
  assignmentAllowed: z.boolean(),
});

export const petRestrictionsSchema = z.object({
  maxPets: z.number().int().min(1).max(20),
  allowedTypes: z.array(z.enum(['dog', 'cat', 'bird', 'fish', 'small_animal', 'reptile'])).min(1),
  weightLimitLbs: z.number().positive().optional(),
  restrictedBreeds: z.array(z.string().max(100)).optional(),
  petRentPerMonth: z.number().nonnegative().optional(),
  petDeposit: z.number().nonnegative().optional(),
  requiresDocumentation: z.boolean(),
});

export const residentialPolicyTermsSchema = z.object({
  smokingPolicy: z.enum(['no_smoking', 'designated_areas', 'allowed']),
  smokingDesignatedAreas: z.string().max(500).optional(),
  petPolicy: z.enum(['no_pets', 'allowed_with_restrictions', 'allowed']),
  petRestrictions: petRestrictionsSchema.optional(),
  rentersInsuranceRequired: z.boolean(),
  rentersInsuranceMinCoverage: z.number().positive().optional(),
  parkingIncluded: z.boolean(),
  parkingSpaces: z.number().int().min(0).optional(),
  parkingFeePerMonth: z.number().nonnegative().optional(),
  guestParkingAvailable: z.boolean(),
  storageIncluded: z.boolean(),
  storageFeePerMonth: z.number().nonnegative().optional(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  tenantResponsibilities: z.array(tenantMaintenanceSchema),
  prohibitedActivities: z.array(prohibitedActivitySchema),
  lockChangePolicy: z.enum(['landlord_only', 'tenant_with_copy', 'either_party']),
});

export const entryTermsSchema = z.object({
  noticeHours: z.union([z.literal(24), z.literal(48), z.literal(72)]),
  maintenanceRequestMethod: z.enum(['online_portal', 'email', 'phone', 'written']),
  emergencyContactMethod: z.enum(['phone', 'email', 'both']),
  emergencyContactInfo: z.string().min(1).max(500),
});

export const residentialTermsSchema = z.object({
  rent: residentialRentTermsSchema.optional(),
  deposit: residentialDepositTermsSchema.optional(),
  utilities: residentialUtilityTermsSchema.optional(),
  occupancy: occupancyTermsSchema.optional(),
  policies: residentialPolicyTermsSchema.optional(),
  entry: entryTermsSchema.optional(),
});

// ============================================================================
// COMMERCIAL STEP SCHEMAS
// ============================================================================

export const commercialLeaseStructureSchema = z.object({
  leaseType: z.enum(['nnn', 'gross', 'modified_gross']),
  startDate: z.string().min(1),
  termMonths: z.number().int().min(1).max(600).optional(),
  endDate: z.string().optional(),
  noticeToTerminateDays: z.number().int().min(1).optional(),
  renewalOptions: z.number().int().min(0).max(10),
  renewalTermLength: z.string().max(50).optional(),
  renewalNoticePeriodDays: z.number().int().min(1).optional(),
});

export const rentStepSchema = z.object({
  year: z.number().int().min(1),
  monthlyRent: z.number().positive(),
});

export const commercialConvenienceFeeSchema = z.object({
  method: paymentMethodSchema,
  feeType: z.enum(['flat', 'percentage']),
  flatAmount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export const commercialFinancialTermsSchema = z.object({
  baseRentMonthly: z.number().positive(),
  dueDay: z.number().int().min(1).max(28),
  escalationType: z.enum(['fixed_amount', 'fixed_percentage', 'cpi', 'step_schedule', 'none']),
  escalationFixedAmount: z.number().positive().optional(),
  escalationPercentage: z.number().positive().max(100).optional(),
  escalationStepSchedule: z.array(rentStepSchema).optional(),
  gracePeriodDays: z.number().int().min(0).max(30).optional(),
  lateFeeType: z.enum(['flat', 'percentage']).optional(),
  lateFeeAmount: z.number().nonnegative().optional(),
  lateFeePercentage: z.number().min(0).max(100).optional(),
  defaultInterestRate: z.number().min(0).max(100).optional(),
  freeRentMonths: z.number().int().min(0).max(24).optional(),
  paymentMethods: z.array(paymentMethodSchema).optional(),
  payableTo: z.string().max(200).optional(),
  returnedPaymentFee: z.number().nonnegative().optional(),
  convenienceFees: z.array(commercialConvenienceFeeSchema).optional(),
  camEnabled: z.boolean(),
  camProRataShare: z.number().min(0).max(100).optional(),
  camIncludesPropertyTax: z.boolean(),
  camIncludesInsurance: z.boolean(),
  camIncludesManagement: z.boolean(),
  camManagementFeePercent: z.number().min(0).max(100).optional(),
  camIncludesUtilities: z.boolean(),
  camReconciliationDays: z.number().int().min(1).optional(),
  camAuditRights: z.boolean(),
});

export const commercialDepositTermsSchema = z.object({
  securityDeposit: z.number().nonnegative(),
  depositReturnDays: z.number().int().min(1).max(365),
});

const tiContributionInstallmentSchema = z.object({
  amountCents: z.number().nonnegative(),
  trigger: z.enum(['lease_execution', 'occupancy_plus_months', 'specific_date']),
  monthsAfterOccupancy: z.number().int().min(1).optional(),
  dueDate: z.string().optional(),
  note: z.string().max(200).optional(),
});

export const useAndBuildoutTermsSchema = z.object({
  permittedUse: z.string().min(1).max(2000),
  exclusiveUse: z.boolean(),
  exclusiveUseDescription: z.string().max(1000).optional(),
  tiType: z.enum(['none', 'landlord_allowance', 'work_letter']),
  tiAllowance: z.number().nonnegative().optional(),
  tiAllowanceScope: z.enum(['hard_costs_only', 'all_costs']).optional(),
  tiUnusedPolicy: z.enum(['forfeited', 'applied_to_rent']).optional(),
  tiConstructionManagedBy: z.enum(['landlord', 'tenant']).optional(),
  workLetterDescription: z.string().max(5000).optional(),
  workLetterPermitResponsibility: z.enum(['landlord', 'tenant']).optional(),
  workLetterDeadlineDays: z.number().int().min(1).optional(),
  workLetterCompletionDate: z.string().optional(),
  workLetterLienDischargeDays: z.number().int().min(1).optional(),
  tiContributionInstallments: z.array(tiContributionInstallmentSchema).optional(),
  improvementOwnership: z.enum(['landlord', 'tenant_trade_fixtures']),
  signageAllowed: z.boolean(),
  signageRequiresApproval: z.boolean(),
  premisesCondition: z.enum(['as_is', 'with_improvements']),
});

export const commercialOperationsTermsSchema = z.object({
  landlordMaintains: z.array(commercialMaintenanceItemSchema),
  tenantMaintains: z.array(commercialMaintenanceItemSchema),
  utilityResponsibility: z.enum(['tenant_all', 'landlord_all', 'shared']),
  sharedUtilityAllocation: z.string().max(1000).optional(),
  insuranceGLAmount: z.number().positive(),
  insurancePropertyRequired: z.boolean(),
  insuranceBusinessInterruption: z.boolean(),
  insuranceWorkersComp: z.boolean(),
  insuranceLandlordAdditionalInsured: z.boolean(),
  utilityInterruptionAbatementDays: z.number().int().min(1).max(14).optional(),
  utilityAbatementScope: z.enum(['narrow', 'moderate', 'broad']).optional(),
  environmentalComplianceIncluded: z.literal(true), // Cannot be false
  adaResponsibility: z.enum(['landlord', 'tenant', 'shared']),
  adaSharedDescription: z.string().max(1000).optional(),
});

const guarantorEntrySchema = z.object({
  firstName: z.string().min(1).max(100),
  middleInitial: z.string().max(5).optional(),
  lastName: z.string().min(1).max(100),
  title: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(200).optional(),
  address: z.object({
    street1: z.string().max(200),
    street2: z.string().max(200).optional(),
    city: z.string().max(100),
    state: z.string().max(50),
    zipCode: z.string().max(20),
  }).optional(),
  dateOfBirth: z.string().optional(),
  idType: z.enum(['passport', 'drivers_license', 'state_id', 'other']).optional(),
  idNumber: z.string().max(100).optional(),
});

export const commercialRiskTermsSchema = z.object({
  monetaryDefaultCureDays: z.number().int().min(1).max(90),
  nonMonetaryDefaultCureDays: z.number().int().min(1).max(90),
  remediesTermination: z.boolean(),
  remediesAcceleration: z.boolean(),
  remediesReentry: z.boolean(),
  remediesAttorneyFees: z.boolean(),
  remediesDefaultInterest: z.boolean(),
  holdoverRentPercent: z.number().int().min(100).max(300),
  assignmentAllowed: z.boolean(),
  assignmentConsentRequired: z.boolean(),
  assignmentConsentStandard: z.enum(['reasonable', 'sole_discretion']),
  landlordRecaptureRights: z.boolean(),
  sublettingProfitShare: z.number().min(0).max(100).optional(),
  personalGuaranteeRequired: z.boolean(),
  personalGuaranteeType: z.enum(['continuing', 'limited', 'good_guy']).optional(),
  personalGuaranteeCap: z.number().nonnegative().optional(),
  includePrimaryContactAsGuarantor: z.boolean().optional(),
  guarantors: z.array(guarantorEntrySchema).optional(),
  indemnificationMutual: z.boolean(),
  casualtyTerminationRight: z.enum(['landlord', 'both', 'neither']),
});

export const commercialTermsSchema = z.object({
  leaseStructure: commercialLeaseStructureSchema.optional(),
  financial: commercialFinancialTermsSchema.optional(),
  deposit: commercialDepositTermsSchema.optional(),
  useAndBuildout: useAndBuildoutTermsSchema.optional(),
  operations: commercialOperationsTermsSchema.optional(),
  risk: commercialRiskTermsSchema.optional(),
});

// ============================================================================
// FULL DRAFT SCHEMAS
// ============================================================================

export const createLeaseBuilderDraftSchema = z.object({
  leaseClass: leaseClassSchema,
  propertyId: z.string().optional(),
  unitIds: z.array(z.string()).default([]),
  tenantIds: z.array(z.string()).default([]),
  leaseType: z.enum(['fixed_term', 'month_to_month']).optional(),
  fromDefault: z.boolean().optional(),
});

const wizardStepEnum = z.enum([
  'property_selection',
  'property_profile',
  'rent_terms',
  'deposit_terms',
  'utility_terms',
  'occupancy_terms',
  'policy_terms',
  'entry_terms',
  'lease_structure',
  'financial_terms',
  'use_and_buildout',
  'operations',
  'risk_terms',
  'disclosures_review',
  'review',
  'generate',
]);

export const updateLeaseBuilderDraftSchema = z.object({
  currentStep: wizardStepEnum.optional(),
  propertyId: z.string().optional(),
  unitIds: z.array(z.string()).optional(),
  tenantIds: z.array(z.string()).optional(),
  signerUserId: z.string().optional(),
  tenantSigner: z.object({ name: z.string(), title: z.string().optional() }).optional(),
  leaseType: z.enum(['fixed_term', 'month_to_month']).optional(),
  propertyProfile: propertyProfileSchema.optional(),
  residential: residentialTermsSchema.optional(),
  commercial: commercialTermsSchema.optional(),
  triggeredDisclosures: z.array(z.string()).optional(),
  triggeredOverlays: z.array(z.string()).optional(),
  reviewedAt: z.string().optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  amendingPublishedLeaseId: z.string().optional(),
  clonedFromDraftId: z.string().optional(),
  saveAsDefault: z.boolean().optional(),
});

// Inferred types for API consumption
export type CreateLeaseBuilderDraftInput = z.infer<typeof createLeaseBuilderDraftSchema>;
export type UpdateLeaseBuilderDraftInput = z.infer<typeof updateLeaseBuilderDraftSchema>;
