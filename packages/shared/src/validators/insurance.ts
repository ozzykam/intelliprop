import { z } from 'zod';
import {
  INSURANCE_POLICY_TYPES,
  INSURANCE_POLICY_STATUSES,
  INSURANCE_CLAIM_STATUSES,
  INSURANCE_CAUSE_OF_LOSS,
  APPRAISAL_PROCESS_STATUSES,
  CLAIM_DOCUMENT_TYPES,
} from '../types/insurance';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// ============================================================
// POLICY
// ============================================================

export const insurancePolicyTypeSchema = z.enum([
  INSURANCE_POLICY_TYPES.property,
  INSURANCE_POLICY_TYPES.general_liability,
  INSURANCE_POLICY_TYPES.flood,
  INSURANCE_POLICY_TYPES.umbrella,
  INSURANCE_POLICY_TYPES.earthquake,
  INSURANCE_POLICY_TYPES.builders_risk,
  INSURANCE_POLICY_TYPES.renters,
  INSURANCE_POLICY_TYPES.commercial_liability,
  INSURANCE_POLICY_TYPES.other,
]);

export const insurancePolicyStatusSchema = z.enum([
  INSURANCE_POLICY_STATUSES.active,
  INSURANCE_POLICY_STATUSES.pending,
  INSURANCE_POLICY_STATUSES.expired,
  INSURANCE_POLICY_STATUSES.cancelled,
]);

export const premiumFrequencySchema = z.enum(['monthly', 'quarterly', 'annual']);

export const createInsurancePolicySchema = z.object({
  entityType: z.enum(['property', 'tenant']),
  entityId: z.string().min(1),
  entityName: z.string().min(1).max(200),
  propertyId: z.string().optional(),
  propertyName: z.string().max(200).optional(),
  unitId: z.string().optional(),
  unitLabel: z.string().max(100).optional(),
  policyType: insurancePolicyTypeSchema,
  status: insurancePolicyStatusSchema.default('active'),
  carrier: z.string().min(1).max(200),
  policyNumber: z.string().min(1).max(100),
  effectiveDate: isoDateSchema,
  expirationDate: isoDateSchema,
  coverageAmount: z.number().int().min(0).optional(),
  deductible: z.number().int().min(0).optional(),
  premium: z.number().int().min(0).optional(),
  premiumFrequency: premiumFrequencySchema.optional(),
  agentName: z.string().max(200).optional(),
  agentPhone: z.string().max(30).optional(),
  agentEmail: z.string().email().optional(),
  notes: z.string().max(5000).optional(),
});

export const updateInsurancePolicySchema = createInsurancePolicySchema
  .omit({ entityType: true, entityId: true })
  .partial();

// ============================================================
// CLAIM — EMBEDDED PEOPLE
// ============================================================

export const claimAdjusterSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['staff', 'independent', 'public']),
  represents: z.enum(['insurer', 'insured']),
  name: z.string().min(1).max(200),
  firm: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().max(100).optional(),
});

export const claimExpertSchema = z.object({
  id: z.string().min(1),
  specialty: z.enum([
    'general_contractor',
    'engineer',
    'fire_investigator',
    'building_consultant',
    'estimator',
    'cost_consultant',
    'other',
  ]),
  retainedBy: z.enum(['insurer', 'insured']),
  name: z.string().min(1).max(200),
  firm: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
});

export const claimAttorneySchema = z.object({
  id: z.string().min(1),
  represents: z.enum(['insurer', 'insured']),
  name: z.string().min(1).max(200),
  firmName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
});

// ============================================================
// CLAIM
// ============================================================

export const insuranceClaimStatusSchema = z.enum([
  INSURANCE_CLAIM_STATUSES.open,
  INSURANCE_CLAIM_STATUSES.under_review,
  INSURANCE_CLAIM_STATUSES.approved,
  INSURANCE_CLAIM_STATUSES.denied,
  INSURANCE_CLAIM_STATUSES.settled,
  INSURANCE_CLAIM_STATUSES.closed,
]);

export const causeOfLossSchema = z.enum([
  INSURANCE_CAUSE_OF_LOSS.fire,
  INSURANCE_CAUSE_OF_LOSS.water,
  INSURANCE_CAUSE_OF_LOSS.wind,
  INSURANCE_CAUSE_OF_LOSS.hail,
  INSURANCE_CAUSE_OF_LOSS.theft,
  INSURANCE_CAUSE_OF_LOSS.vandalism,
  INSURANCE_CAUSE_OF_LOSS.vehicle_collision,
  INSURANCE_CAUSE_OF_LOSS.liability,
  INSURANCE_CAUSE_OF_LOSS.mold,
  INSURANCE_CAUSE_OF_LOSS.other,
]);

export const createInsuranceClaimSchema = z.object({
  policyId: z.string().optional(),
  policyNumber: z.string().max(100).optional(),
  carrier: z.string().max(200).optional(),
  entityType: z.enum(['property', 'tenant']).optional(),
  entityId: z.string().optional(),
  entityName: z.string().min(1).max(200),
  propertyId: z.string().optional(),
  propertyName: z.string().max(200).optional(),
  unitId: z.string().optional(),
  unitLabel: z.string().max(100).optional(),
  claimNumber: z.string().max(100).optional(),
  insuredName: z.string().max(200).optional(),
  insuredPhone: z.string().max(30).optional(),
  insuredEmail: z.string().email().optional(),
  disputeType: z.enum(['coverage', 'payment', 'appraisal']).optional(),
  causeOfLoss: causeOfLossSchema.optional(),
  dateOfLoss: isoDateSchema,
  dateFiled: isoDateSchema.optional(),
  description: z.string().min(1).max(5000),
  status: insuranceClaimStatusSchema.default('open'),
  reportedAmount: z.number().int().min(0).optional(),
  offeredAmount: z.number().int().min(0).optional(),
  settledAmount: z.number().int().min(0).optional(),
  replacementCostValue: z.number().int().min(0).optional(),
  actualCashValue: z.number().int().min(0).optional(),
  depreciation: z.number().int().min(0).optional(),
  adjusters: z.array(claimAdjusterSchema).default([]),
  experts: z.array(claimExpertSchema).default([]),
  attorneys: z.array(claimAttorneySchema).default([]),
  notes: z.string().max(5000).optional(),
});

export const updateInsuranceClaimSchema = createInsuranceClaimSchema
  .omit({ policyId: true })
  .partial();

// ============================================================
// CLAIM DOCUMENT
// ============================================================

export const claimDocumentTypeSchema = z.enum([
  CLAIM_DOCUMENT_TYPES.damage_photo,
  CLAIM_DOCUMENT_TYPES.damage_video,
  CLAIM_DOCUMENT_TYPES.repair_estimate,
  CLAIM_DOCUMENT_TYPES.repair_invoice,
  CLAIM_DOCUMENT_TYPES.adjuster_report,
  CLAIM_DOCUMENT_TYPES.proof_of_loss,
  CLAIM_DOCUMENT_TYPES.policy_document,
  CLAIM_DOCUMENT_TYPES.denial_letter,
  CLAIM_DOCUMENT_TYPES.mitigation_records,
  CLAIM_DOCUMENT_TYPES.appraisal_demand,
  CLAIM_DOCUMENT_TYPES.appraisal_estimate,
  CLAIM_DOCUMENT_TYPES.appraisal_award,
  CLAIM_DOCUMENT_TYPES.umpire_agreement,
  CLAIM_DOCUMENT_TYPES.umpire_petition,
  CLAIM_DOCUMENT_TYPES.expert_report,
  CLAIM_DOCUMENT_TYPES.correspondence,
  CLAIM_DOCUMENT_TYPES.legal_filing,
  CLAIM_DOCUMENT_TYPES.settlement,
  CLAIM_DOCUMENT_TYPES.other,
]);

export const createClaimDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: claimDocumentTypeSchema,
  fileName: z.string().min(1).max(255),
  storagePath: z.string().min(1),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().positive(),
  appraisalProcessId: z.string().optional(),
  estimateId: z.string().optional(),
});

// ============================================================
// APPRAISAL PROCESS
// ============================================================

export const appraisalProcessStatusSchema = z.enum([
  APPRAISAL_PROCESS_STATUSES.demanded,
  APPRAISAL_PROCESS_STATUSES.panel_forming,
  APPRAISAL_PROCESS_STATUSES.estimating,
  APPRAISAL_PROCESS_STATUSES.in_dispute,
  APPRAISAL_PROCESS_STATUSES.awarded,
  APPRAISAL_PROCESS_STATUSES.court_intervention,
  APPRAISAL_PROCESS_STATUSES.completed,
  APPRAISAL_PROCESS_STATUSES.withdrawn,
]);

export const appraiserSchema = z.object({
  id: z.string().min(1),
  side: z.enum(['insured', 'insurer']),
  name: z.string().min(1).max(200),
  firm: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().max(100).optional(),
  licenseState: z.string().max(50).optional(),
  appointedDate: isoDateSchema.optional(),
  estimateId: z.string().optional(),
});

export const umpireSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  firm: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().max(100).optional(),
  licenseState: z.string().max(50).optional(),
  appointedBy: z.enum(['agreement', 'court']),
  appointmentDate: isoDateSchema.optional(),
  feeSplit: z.string().max(50).optional(),
});

export const appraisalPanelSchema = z.object({
  insuredAppraiser: appraiserSchema.optional(),
  insurerAppraiser: appraiserSchema.optional(),
  umpire: umpireSchema.optional(),
  status: z.enum(['forming', 'active', 'complete']),
  panelFormedDate: isoDateSchema.optional(),
});

export const damageLineItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  quantity: z.number().optional(),
  unit: z.string().max(50).optional(),
  unitCost: z.number().int().min(0).optional(),
  totalRCV: z.number().int().min(0).optional(),
  depreciation: z.number().int().min(0).optional(),
  totalACV: z.number().int().min(0).optional(),
  disputed: z.boolean().optional(),
});

export const disputedItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1).max(500),
  insuredPosition: z.number().int().min(0).optional(),
  insurerPosition: z.number().int().min(0).optional(),
  resolvedAmount: z.number().int().min(0).optional(),
  resolution: z.enum(['agreed', 'umpire_decided', 'withdrawn']).optional(),
});

export const appraisalCourtActionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['appoint_umpire', 'confirm_award', 'vacate_award', 'compel_appraisal']),
  filingDate: isoDateSchema,
  status: z.enum(['filed', 'pending', 'granted', 'denied']),
  docketNumber: z.string().max(100).optional(),
  court: z.string().max(200).optional(),
  outcome: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const appraisalAwardSchema = z.object({
  awardDate: isoDateSchema,
  signedBy: z.enum([
    'both_appraisers',
    'insured_appraiser_and_umpire',
    'insurer_appraiser_and_umpire',
  ]),
  awardAmount: z.number().int().min(0),
  replacementCostValue: z.number().int().min(0).optional(),
  actualCashValue: z.number().int().min(0).optional(),
  depreciation: z.number().int().min(0).optional(),
  scopeItems: z.array(damageLineItemSchema).optional(),
  conditions: z.string().max(5000).optional(),
  status: z.enum(['draft', 'signed', 'confirmed', 'vacated']),
});

export const createAppraisalProcessSchema = z.object({
  demandDate: isoDateSchema,
  demandedBy: z.enum(['insured', 'insurer']),
  notes: z.string().max(5000).optional(),
});

export const updateAppraisalProcessSchema = z.object({
  status: appraisalProcessStatusSchema.optional(),
  panel: appraisalPanelSchema.partial().optional(),
  disputedItems: z.array(disputedItemSchema).optional(),
  award: appraisalAwardSchema.nullable().optional(),
  courtActions: z.array(appraisalCourtActionSchema).optional(),
  notes: z.string().max(5000).optional(),
});

// ============================================================
// APPRAISAL ESTIMATE
// ============================================================

export const createAppraisalEstimateSchema = z.object({
  preparedBySide: z.enum(['insured', 'insurer']),
  appraiserId: z.string().optional(),
  date: isoDateSchema.optional(),
  replacementCostValue: z.number().int().min(0).optional(),
  actualCashValue: z.number().int().min(0).optional(),
  depreciation: z.number().int().min(0).optional(),
  scopeItems: z.array(damageLineItemSchema).default([]),
  status: z.enum(['draft', 'submitted', 'disputed', 'agreed']).default('draft'),
  notes: z.string().max(5000).optional(),
});

export const updateAppraisalEstimateSchema = createAppraisalEstimateSchema.partial();

// ============================================================
// CLAIM TASKS
// ============================================================

export const createClaimTaskSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(5000).optional(),
  dueDate: isoDateSchema.optional(),
});

export const updateClaimTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(5000).optional(),
  dueDate: isoDateSchema.optional(),
  completed: z.boolean().optional(),
});

// ============================================================
// CLAIM ACTIVITIES
// ============================================================

export const claimActivityTypeSchema = z.enum([
  'note', 'correspondence', 'phone_call', 'email', 'request_for_info',
  'inspection', 'status_update', 'document_submission', 'meeting', 'other',
]);

export const createClaimActivitySchema = z.object({
  type: claimActivityTypeSchema,
  title: z.string().min(1).max(500),
  notes: z.string().max(5000).optional(),
  occurredAt: isoDateSchema.optional(),
});

export const updateClaimActivitySchema = createClaimActivitySchema.partial();
