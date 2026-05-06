import { Timestamp } from './common';

// ── Exhibit definitions ────────────────────────────────────────────────────

export const AOC_EXHIBIT_KEYS = [
  'lease',
  'payment_history',
  'eviction_notice',
  'insurance_policy',
  'proof_of_loss',
  'appraisal',
  'contract_invoice',
  'demand_letters',
  'correspondence',
  'member_resolution',
] as const;

export type AocExhibitKey = (typeof AOC_EXHIBIT_KEYS)[number];

export interface AocExhibitDef {
  key: AocExhibitKey;
  label: string;
  description: string;
  claimTypes: ('rent_debt' | 'insurance_claim' | 'general_monetary')[];
}

export const AOC_EXHIBIT_DEFINITIONS: AocExhibitDef[] = [
  {
    key: 'lease',
    label: 'Lease Agreement',
    description: 'The lease or rental agreement underlying the tenancy',
    claimTypes: ['rent_debt'],
  },
  {
    key: 'payment_history',
    label: 'Payment History / Ledger',
    description: 'Account ledger showing rent charges and payments',
    claimTypes: ['rent_debt'],
  },
  {
    key: 'eviction_notice',
    label: 'Eviction / Demand Notice',
    description: 'Notice to quit, pay or vacate, or demand for rent',
    claimTypes: ['rent_debt'],
  },
  {
    key: 'insurance_policy',
    label: 'Insurance Policy',
    description: 'Relevant sections of the insurance policy',
    claimTypes: ['insurance_claim'],
  },
  {
    key: 'proof_of_loss',
    label: 'Proof of Loss / Claim Submission',
    description: 'Filed proof of loss or claim documentation',
    claimTypes: ['insurance_claim'],
  },
  {
    key: 'appraisal',
    label: 'Appraisal / Damage Estimate',
    description: 'Appraisal, repair estimate, or adjuster report',
    claimTypes: ['insurance_claim'],
  },
  {
    key: 'contract_invoice',
    label: 'Contract / Invoice',
    description: 'The underlying contract or invoice giving rise to the claim',
    claimTypes: ['general_monetary'],
  },
  {
    key: 'demand_letters',
    label: 'Demand Letter(s)',
    description: 'Pre-suit demand letters sent to the obligor',
    claimTypes: ['rent_debt', 'insurance_claim', 'general_monetary'],
  },
  {
    key: 'correspondence',
    label: 'Correspondence',
    description: 'Relevant communications with the obligor',
    claimTypes: ['rent_debt', 'insurance_claim', 'general_monetary'],
  },
  {
    key: 'member_resolution',
    label: 'LLC Member Resolution',
    description: 'Member or manager written consent authorizing this assignment',
    claimTypes: ['rent_debt', 'insurance_claim', 'general_monetary'],
  },
];

export const AOC_STATUSES = {
  draft: 'draft',
  executed: 'executed',
  active: 'active',
  collected: 'collected',
  closed: 'closed',
} as const;
export type AocStatus = (typeof AOC_STATUSES)[keyof typeof AOC_STATUSES];

export const ASSIGNMENT_CLAIM_TYPES = {
  rent_debt: 'rent_debt',
  insurance_claim: 'insurance_claim',
  general_monetary: 'general_monetary',
} as const;
export type AssignmentClaimType = (typeof ASSIGNMENT_CLAIM_TYPES)[keyof typeof ASSIGNMENT_CLAIM_TYPES];

export interface AocAssignee {
  name: string;
  entityType: 'individual' | 'company';
  address: string;
  phone?: string;
  email?: string;
}

export interface AssignmentOfClaim {
  id: string;
  llcId: string;
  llcName: string;
  llcAddress?: string;

  // Step 1 — Claim details
  claimType: AssignmentClaimType;
  claimDescription: string;
  claimValueCents?: number;
  // rent_debt optional links
  tenantId?: string;
  tenantName?: string;
  tenantAddress?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  propertyAddress?: string;
  // insurance_claim optional links
  insuranceClaimId?: string;
  insuranceClaimNumber?: string;
  insurer?: string;

  // Step 2 — Assignee
  assignee: AocAssignee;

  // Step 3 — Terms
  considerationCents: number;
  effectiveDate: string;
  expirationDate?: string;
  warrantsGoodTitle: boolean;
  specialConditions?: string;
  requiresNotarization?: boolean;
  exhibits?: AocExhibitKey[];
  assignorSignatoryName?: string;
  assignorTitle?: string;
  assigneeSignatoryName?: string;
  assigneeTitle?: string;

  // Generated document
  documentHtml?: string;

  // Execution
  executedDate?: string;
  executedByUserId?: string;

  status: AocStatus;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateAssignmentInput {
  claimType: AssignmentClaimType;
  claimDescription: string;
  claimValueCents?: number;
  tenantId?: string;
  tenantName?: string;
  tenantAddress?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  propertyAddress?: string;
  insuranceClaimId?: string;
  insuranceClaimNumber?: string;
  insurer?: string;
  assignee: AocAssignee;
  considerationCents: number;
  effectiveDate: string;
  expirationDate?: string;
  warrantsGoodTitle: boolean;
  specialConditions?: string;
  requiresNotarization?: boolean;
  exhibits?: AocExhibitKey[];
  assignorSignatoryName?: string;
  assignorTitle?: string;
  assigneeSignatoryName?: string;
  assigneeTitle?: string;
}

export type UpdateAssignmentInput = Partial<CreateAssignmentInput> & {
  status?: AocStatus;
  executedDate?: string;
  documentHtml?: string;
};

// Display constants
export const AOC_STATUS_LABELS: Record<AocStatus, string> = {
  draft: 'Draft',
  executed: 'Executed',
  active: 'Active',
  collected: 'Collected',
  closed: 'Closed',
};

export const AOC_STATUS_COLORS: Record<AocStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  executed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  collected: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-400',
};

export const ASSIGNMENT_CLAIM_TYPE_LABELS: Record<AssignmentClaimType, string> = {
  rent_debt: 'Rent / Tenant Debt',
  insurance_claim: 'Insurance Claim',
  general_monetary: 'General Monetary Claim',
};

// Valid status transitions (enforced in service)
export const AOC_STATUS_TRANSITIONS: Record<AocStatus, AocStatus[]> = {
  draft: ['executed'],
  executed: ['active', 'closed'],
  active: ['collected', 'closed'],
  collected: ['closed'],
  closed: [],
};
