import { Timestamp } from './common';

// ============================================================
// POLICY CONSTANTS
// ============================================================

export const INSURANCE_POLICY_TYPES = {
  // Property-level
  property: 'property',
  general_liability: 'general_liability',
  flood: 'flood',
  umbrella: 'umbrella',
  earthquake: 'earthquake',
  builders_risk: 'builders_risk',
  // Tenant-level
  renters: 'renters',
  commercial_liability: 'commercial_liability',
  other: 'other',
} as const;

export type InsurancePolicyType = (typeof INSURANCE_POLICY_TYPES)[keyof typeof INSURANCE_POLICY_TYPES];

export const INSURANCE_POLICY_STATUSES = {
  active: 'active',
  pending: 'pending',
  expired: 'expired',
  cancelled: 'cancelled',
} as const;

export type InsurancePolicyStatus = (typeof INSURANCE_POLICY_STATUSES)[keyof typeof INSURANCE_POLICY_STATUSES];

// ============================================================
// CLAIM CONSTANTS
// ============================================================

export const INSURANCE_CLAIM_STATUSES = {
  open: 'open',
  under_review: 'under_review',
  approved: 'approved',
  denied: 'denied',
  settled: 'settled',
  closed: 'closed',
} as const;

export type InsuranceClaimStatus = (typeof INSURANCE_CLAIM_STATUSES)[keyof typeof INSURANCE_CLAIM_STATUSES];

export const INSURANCE_CAUSE_OF_LOSS = {
  fire: 'fire',
  water: 'water',
  wind: 'wind',
  hail: 'hail',
  theft: 'theft',
  vandalism: 'vandalism',
  vehicle_collision: 'vehicle_collision',
  liability: 'liability',
  mold: 'mold',
  other: 'other',
} as const;

export type InsuranceCauseOfLoss = (typeof INSURANCE_CAUSE_OF_LOSS)[keyof typeof INSURANCE_CAUSE_OF_LOSS];

// ============================================================
// APPRAISAL CONSTANTS
// ============================================================

export const APPRAISAL_PROCESS_STATUSES = {
  demanded: 'demanded',
  panel_forming: 'panel_forming',
  estimating: 'estimating',
  in_dispute: 'in_dispute',
  awarded: 'awarded',
  court_intervention: 'court_intervention',
  completed: 'completed',
  withdrawn: 'withdrawn',
} as const;

export type AppraisalProcessStatus = (typeof APPRAISAL_PROCESS_STATUSES)[keyof typeof APPRAISAL_PROCESS_STATUSES];

// ============================================================
// CLAIM DOCUMENT CONSTANTS
// ============================================================

export const CLAIM_DOCUMENT_TYPES = {
  damage_photo: 'damage_photo',
  damage_video: 'damage_video',
  repair_estimate: 'repair_estimate',
  repair_invoice: 'repair_invoice',
  adjuster_report: 'adjuster_report',
  proof_of_loss: 'proof_of_loss',
  policy_document: 'policy_document',
  denial_letter: 'denial_letter',
  mitigation_records: 'mitigation_records',
  appraisal_demand: 'appraisal_demand',
  appraisal_estimate: 'appraisal_estimate',
  appraisal_award: 'appraisal_award',
  umpire_agreement: 'umpire_agreement',
  umpire_petition: 'umpire_petition',
  expert_report: 'expert_report',
  correspondence: 'correspondence',
  legal_filing: 'legal_filing',
  settlement: 'settlement',
  other: 'other',
} as const;

export type ClaimDocumentType = (typeof CLAIM_DOCUMENT_TYPES)[keyof typeof CLAIM_DOCUMENT_TYPES];

// ============================================================
// INSURANCE POLICY
// ============================================================

export type InsurancePolicyEntityType = 'property' | 'tenant';
export type PremiumFrequency = 'monthly' | 'quarterly' | 'annual';

/**
 * Insurance Policy
 * Stored at: llcs/{llcId}/insurancePolicies/{policyId}
 */
export interface InsurancePolicy {
  id: string;
  llcId: string;

  entityType: InsurancePolicyEntityType;
  entityId: string;
  entityName: string;

  // For tenant policies — which property/unit they occupy
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitLabel?: string;

  policyType: InsurancePolicyType;
  status: InsurancePolicyStatus;

  carrier: string;
  policyNumber: string;

  effectiveDate: string;   // ISO date
  expirationDate: string;  // ISO date

  coverageAmount?: number;       // cents
  deductible?: number;           // cents
  premium?: number;              // cents
  premiumFrequency?: PremiumFrequency;

  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;

  notes?: string;

  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateInsurancePolicyInput {
  entityType: InsurancePolicyEntityType;
  entityId: string;
  entityName: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitLabel?: string;
  policyType: InsurancePolicyType;
  status?: InsurancePolicyStatus;
  carrier: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  coverageAmount?: number;
  deductible?: number;
  premium?: number;
  premiumFrequency?: PremiumFrequency;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  notes?: string;
}

export type UpdateInsurancePolicyInput = Partial<Omit<CreateInsurancePolicyInput, 'entityType' | 'entityId'>>;

// ============================================================
// INSURANCE CLAIM — PEOPLE
// ============================================================

/**
 * Adjuster on a claim.
 * type: staff (insurer employee) | independent (contracted by insurer) | public (represents insured)
 */
export interface ClaimAdjuster {
  id: string;
  type: 'staff' | 'independent' | 'public';
  represents: 'insurer' | 'insured';
  name: string;
  firm?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
}

/**
 * Expert / consultant retained for a claim.
 */
export interface ClaimExpert {
  id: string;
  specialty:
    | 'general_contractor'
    | 'engineer'
    | 'fire_investigator'
    | 'building_consultant'
    | 'estimator'
    | 'cost_consultant'
    | 'other';
  retainedBy: 'insurer' | 'insured';
  name: string;
  firm?: string;
  phone?: string;
  email?: string;
}

/**
 * Attorney involved in a claim (coverage counsel, litigation counsel, etc.)
 */
export interface ClaimAttorney {
  id: string;
  represents: 'insurer' | 'insured';
  name: string;
  firmName?: string;
  phone?: string;
  email?: string;
}

export type ClaimDisputeType = 'coverage' | 'payment' | 'appraisal';

// ============================================================
// INSURANCE CLAIM
// ============================================================

/**
 * Insurance Claim
 * Stored at: llcs/{llcId}/insuranceClaims/{claimId}
 */
export interface InsuranceClaim {
  id: string;
  llcId: string;

  // Policy reference — optional if claim is filed before a policy is added
  policyId?: string;
  policyNumber?: string;  // denormalized
  carrier?: string;       // denormalized

  // Covered entity
  entityType?: InsurancePolicyEntityType;
  entityId?: string;      // system entity ID — may be absent for standalone claims
  entityName: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitLabel?: string;

  claimNumber?: string;

  // Insured / policyholder contact
  insuredName?: string;
  insuredPhone?: string;
  insuredEmail?: string;

  // Important legal distinction — appraisal decides amount of loss, NOT coverage/payment
  disputeType?: ClaimDisputeType;

  causeOfLoss?: InsuranceCauseOfLoss;
  dateOfLoss: string;    // ISO date
  dateFiled?: string;    // ISO date
  description: string;

  status: InsuranceClaimStatus;

  // Financials — all in cents
  reportedAmount?: number;         // insured's claimed amount
  offeredAmount?: number;          // insurer's initial offer
  settledAmount?: number;          // final payout
  replacementCostValue?: number;   // RCV
  actualCashValue?: number;        // ACV
  depreciation?: number;

  // Claim participants
  adjusters: ClaimAdjuster[];
  experts: ClaimExpert[];
  attorneys: ClaimAttorney[];

  // Appraisal process link (set when appraisal is demanded)
  appraisalProcessId?: string;

  notes?: string;

  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateInsuranceClaimInput {
  policyId?: string;
  policyNumber?: string;
  carrier?: string;
  entityType?: InsurancePolicyEntityType;
  entityId?: string;
  entityName: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitLabel?: string;
  claimNumber?: string;
  insuredName?: string;
  insuredPhone?: string;
  insuredEmail?: string;
  disputeType?: ClaimDisputeType;
  causeOfLoss?: InsuranceCauseOfLoss;
  dateOfLoss: string;
  dateFiled?: string;
  description: string;
  status?: InsuranceClaimStatus;
  reportedAmount?: number;
  offeredAmount?: number;
  settledAmount?: number;
  replacementCostValue?: number;
  actualCashValue?: number;
  depreciation?: number;
  adjusters?: ClaimAdjuster[];
  experts?: ClaimExpert[];
  attorneys?: ClaimAttorney[];
  notes?: string;
}

export type UpdateInsuranceClaimInput = Partial<Omit<CreateInsuranceClaimInput, 'policyId'>>;

// ============================================================
// CLAIM DOCUMENT
// ============================================================

/**
 * Document / file attached to a claim.
 * Stored at: llcs/{llcId}/insuranceClaims/{claimId}/documents/{documentId}
 * Firebase Storage: llcs/{llcId}/insurance/claims/{claimId}/documents/{timestamp}_{fileName}
 */
export interface ClaimDocument {
  id: string;
  claimId: string;
  llcId: string;

  title: string;
  description?: string;
  type: ClaimDocumentType;

  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;

  // Optional appraisal context
  appraisalProcessId?: string;
  estimateId?: string;

  uploadedByUserId: string;
  createdAt: Timestamp;
}

export interface CreateClaimDocumentInput {
  title: string;
  description?: string;
  type: ClaimDocumentType;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  appraisalProcessId?: string;
  estimateId?: string;
}

// ============================================================
// APPRAISAL PROCESS — PANEL MEMBERS
// ============================================================

/**
 * Party appraiser — chosen by one side of the dispute.
 * side: 'insured' | 'insurer'
 * Must be independent and competent. Not required to be neutral, but must be honest.
 */
export interface Appraiser {
  id: string;
  side: 'insured' | 'insurer';
  name: string;
  firm?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseState?: string;
  appointedDate?: string; // ISO date
  estimateId?: string;    // link to their AppraisalEstimate
}

/**
 * Umpire — neutral third-party decision maker.
 * Selected by agreement of the two appraisers, or by court if they cannot agree.
 * Key legal rule: any two of the three panel members can sign a binding award.
 */
export interface Umpire {
  id: string;
  name: string;
  firm?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseState?: string;
  appointedBy: 'agreement' | 'court';
  appointmentDate?: string; // ISO date
  feeSplit?: string;         // e.g. "50/50"
}

export type AppraisalPanelStatus = 'forming' | 'active' | 'complete';

/**
 * Appraisal Panel — the three-party decision body.
 * Insured Appraiser + Insurer Appraiser + Umpire
 * Any two signatures = binding award.
 */
export interface AppraisalPanel {
  insuredAppraiser?: Appraiser;
  insurerAppraiser?: Appraiser;
  umpire?: Umpire;
  status: AppraisalPanelStatus;
  panelFormedDate?: string; // ISO date — when all three are appointed
}

// ============================================================
// APPRAISAL ESTIMATES & AWARD
// ============================================================

/**
 * Line item in a damage estimate (scope of loss).
 * Embedded in AppraisalEstimate.scopeItems
 */
export interface DamageLineItem {
  id: string;
  category: string;        // e.g. "Roofing", "HVAC", "Interior"
  description: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;       // cents
  totalRCV?: number;       // cents — replacement cost value
  depreciation?: number;   // cents
  totalACV?: number;       // cents — actual cash value
  disputed?: boolean;
}

export type AppraisalEstimateStatus = 'draft' | 'submitted' | 'disputed' | 'agreed';

/**
 * Appraisal Estimate — prepared by one side's appraiser.
 * Stored at: llcs/{llcId}/insuranceClaims/{claimId}/appraisalProcesses/{processId}/estimates/{estimateId}
 */
export interface AppraisalEstimate {
  id: string;
  appraisalProcessId: string;
  claimId: string;
  llcId: string;

  preparedBySide: 'insured' | 'insurer';
  appraiserId?: string;

  date?: string; // ISO date

  // All in cents
  replacementCostValue?: number;
  actualCashValue?: number;
  depreciation?: number;

  scopeItems: DamageLineItem[];
  status: AppraisalEstimateStatus;
  notes?: string;

  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type AppraisalAwardStatus = 'draft' | 'signed' | 'confirmed' | 'vacated';

/**
 * Appraisal Award — the final binding determination.
 * Embedded in AppraisalProcess when the panel reaches a decision.
 * Decides: Amount of Loss ONLY (not coverage, not payment conditions).
 */
export interface AppraisalAward {
  awardDate: string; // ISO date
  signedBy: 'both_appraisers' | 'insured_appraiser_and_umpire' | 'insurer_appraiser_and_umpire';
  awardAmount: number;            // cents — total amount of loss
  replacementCostValue?: number;  // cents
  actualCashValue?: number;       // cents
  depreciation?: number;          // cents
  scopeItems?: DamageLineItem[];
  conditions?: string;
  status: AppraisalAwardStatus;
}

// ============================================================
// APPRAISAL SUPPORTING STRUCTURES
// ============================================================

/**
 * Court action taken during the appraisal process.
 * Embedded in AppraisalProcess.courtActions
 */
export interface AppraisalCourtAction {
  id: string;
  type: 'appoint_umpire' | 'confirm_award' | 'vacate_award' | 'compel_appraisal';
  filingDate: string; // ISO date
  status: 'filed' | 'pending' | 'granted' | 'denied';
  docketNumber?: string;
  court?: string;
  outcome?: string;
  notes?: string;
}

/**
 * Disputed item — a line where insured and insurer positions differ.
 * Embedded in AppraisalProcess.disputedItems
 */
export interface DisputedItem {
  id: string;
  description: string;
  insuredPosition?: number;  // cents
  insurerPosition?: number;  // cents
  resolvedAmount?: number;   // cents — set after award
  resolution?: 'agreed' | 'umpire_decided' | 'withdrawn';
}

// ============================================================
// APPRAISAL PROCESS
// ============================================================

/**
 * Appraisal Process — formal appraisal invoked under the policy's appraisal clause.
 * Stored at: llcs/{llcId}/insuranceClaims/{claimId}/appraisalProcesses/{processId}
 *
 * Important: Appraisal decides Amount of Loss ONLY.
 * Coverage disputes and payment disputes are separate (see InsuranceClaim.disputeType).
 */
export interface AppraisalProcess {
  id: string;
  claimId: string;
  llcId: string;

  status: AppraisalProcessStatus;
  demandDate: string;            // ISO date — when appraisal was formally demanded
  demandedBy: 'insured' | 'insurer';

  panel: AppraisalPanel;
  disputedItems: DisputedItem[];
  award?: AppraisalAward;
  courtActions: AppraisalCourtAction[];

  notes?: string;

  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateAppraisalProcessInput {
  demandDate: string;
  demandedBy: 'insured' | 'insurer';
  notes?: string;
}

export interface UpdateAppraisalProcessInput {
  status?: AppraisalProcessStatus;
  panel?: Partial<AppraisalPanel>;
  disputedItems?: DisputedItem[];
  award?: AppraisalAward | null;
  courtActions?: AppraisalCourtAction[];
  notes?: string;
}

export interface CreateAppraisalEstimateInput {
  preparedBySide: 'insured' | 'insurer';
  appraiserId?: string;
  date?: string;
  replacementCostValue?: number;
  actualCashValue?: number;
  depreciation?: number;
  scopeItems?: DamageLineItem[];
  status?: AppraisalEstimateStatus;
  notes?: string;
}

export type UpdateAppraisalEstimateInput = Partial<CreateAppraisalEstimateInput>;

// ============================================================
// DISPLAY LABELS & COLORS
// ============================================================

export const INSURANCE_POLICY_TYPE_LABELS: Record<InsurancePolicyType, string> = {
  property: 'Property / Dwelling',
  general_liability: 'General Liability',
  flood: 'Flood',
  umbrella: 'Umbrella',
  earthquake: 'Earthquake',
  builders_risk: "Builder's Risk",
  renters: "Renter's (HO-8)",
  commercial_liability: 'Commercial Liability',
  other: 'Other',
};

export const INSURANCE_POLICY_STATUS_LABELS: Record<InsurancePolicyStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const INSURANCE_POLICY_STATUS_COLORS: Record<InsurancePolicyStatus, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

export const INSURANCE_CLAIM_STATUS_LABELS: Record<InsuranceClaimStatus, string> = {
  open: 'Open',
  under_review: 'Under Review',
  approved: 'Approved',
  denied: 'Denied',
  settled: 'Settled',
  closed: 'Closed',
};

export const INSURANCE_CLAIM_STATUS_COLORS: Record<InsuranceClaimStatus, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  settled: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-500',
};

export const APPRAISAL_PROCESS_STATUS_LABELS: Record<AppraisalProcessStatus, string> = {
  demanded: 'Demanded',
  panel_forming: 'Panel Forming',
  estimating: 'Estimating',
  in_dispute: 'In Dispute',
  awarded: 'Awarded',
  court_intervention: 'Court Intervention',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

export const APPRAISAL_PROCESS_STATUS_COLORS: Record<AppraisalProcessStatus, string> = {
  demanded: 'bg-yellow-100 text-yellow-800',
  panel_forming: 'bg-blue-100 text-blue-800',
  estimating: 'bg-purple-100 text-purple-800',
  in_dispute: 'bg-orange-100 text-orange-800',
  awarded: 'bg-green-100 text-green-800',
  court_intervention: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  withdrawn: 'bg-gray-100 text-gray-500',
};

export const CLAIM_DOCUMENT_TYPE_LABELS: Record<ClaimDocumentType, string> = {
  damage_photo: 'Damage Photo',
  damage_video: 'Damage Video',
  repair_estimate: 'Repair Estimate',
  repair_invoice: 'Repair Invoice / Receipt',
  adjuster_report: 'Adjuster Report',
  proof_of_loss: 'Proof of Loss',
  policy_document: 'Policy / Coverage Document',
  denial_letter: 'Denial Letter',
  mitigation_records: 'Mitigation Records',
  appraisal_demand: 'Demand for Appraisal',
  appraisal_estimate: 'Appraisal Estimate',
  appraisal_award: 'Appraisal Award',
  umpire_agreement: 'Umpire Selection Agreement',
  umpire_petition: 'Umpire Petition (Court)',
  expert_report: 'Expert / Consultant Report',
  correspondence: 'Correspondence',
  legal_filing: 'Legal Filing',
  settlement: 'Settlement Agreement',
  other: 'Other',
};

export const INSURANCE_CAUSE_OF_LOSS_LABELS: Record<InsuranceCauseOfLoss, string> = {
  fire: 'Fire',
  water: 'Water / Water Damage',
  wind: 'Wind',
  hail: 'Hail',
  theft: 'Theft',
  vandalism: 'Vandalism',
  vehicle_collision: 'Vehicle Collision',
  liability: 'Liability',
  mold: 'Mold',
  other: 'Other',
};

// ============================================================
// CLAIM TASKS
// ============================================================

export interface ClaimTask {
  id: string;
  llcId: string;
  claimId: string;
  title: string;
  notes?: string;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: FirebaseFirestore.Timestamp | string;
  completedByUserId?: string;
  createdByUserId: string;
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
}

export interface CreateClaimTaskInput {
  title: string;
  notes?: string;
  dueDate?: string;
}

export interface UpdateClaimTaskInput {
  title?: string;
  notes?: string;
  dueDate?: string;
  completed?: boolean;
}

// ============================================================
// CLAIM ACTIVITIES
// ============================================================

export const CLAIM_ACTIVITY_TYPES = {
  note: 'note',
  correspondence: 'correspondence',
  phone_call: 'phone_call',
  email: 'email',
  request_for_info: 'request_for_info',
  inspection: 'inspection',
  status_update: 'status_update',
  document_submission: 'document_submission',
  meeting: 'meeting',
  other: 'other',
} as const;

export type ClaimActivityType = (typeof CLAIM_ACTIVITY_TYPES)[keyof typeof CLAIM_ACTIVITY_TYPES];

export const CLAIM_ACTIVITY_TYPE_LABELS: Record<ClaimActivityType, string> = {
  note: 'Note',
  correspondence: 'Correspondence',
  phone_call: 'Phone Call',
  email: 'Email',
  request_for_info: 'Request for Info',
  inspection: 'Inspection',
  status_update: 'Status Update',
  document_submission: 'Document Submission',
  meeting: 'Meeting',
  other: 'Other',
};

export const CLAIM_ACTIVITY_TYPE_COLORS: Record<ClaimActivityType, string> = {
  note: 'bg-secondary text-secondary-foreground',
  correspondence: 'bg-blue-100 text-blue-800',
  phone_call: 'bg-green-100 text-green-800',
  email: 'bg-indigo-100 text-indigo-800',
  request_for_info: 'bg-yellow-100 text-yellow-800',
  inspection: 'bg-orange-100 text-orange-800',
  status_update: 'bg-purple-100 text-purple-800',
  document_submission: 'bg-teal-100 text-teal-800',
  meeting: 'bg-pink-100 text-pink-800',
  other: 'bg-secondary text-secondary-foreground',
};

export interface ClaimActivity {
  id: string;
  llcId: string;
  claimId: string;
  type: ClaimActivityType;
  title: string;
  notes?: string;
  occurredAt?: string; // YYYY-MM-DD
  createdByUserId: string;
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
}

export interface CreateClaimActivityInput {
  type: ClaimActivityType;
  title: string;
  notes?: string;
  occurredAt?: string;
}

export interface UpdateClaimActivityInput {
  type?: ClaimActivityType;
  title?: string;
  notes?: string;
  occurredAt?: string;
}
