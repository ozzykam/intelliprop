import { z } from 'zod';
import { AOC_EXHIBIT_KEYS } from '../types/assignment';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const obligorSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
  entityType: z.enum(['individual', 'llc', 'corporation', 'partnership', 'trust', 'unknown']).optional(),
  role: z.enum(['tenant', 'lease_signatory', 'business_owner', 'manager', 'guarantor', 'other', 'unknown']).optional(),
});

export const aocAssigneeSchema = z.object({
  name: z.string().min(1).max(300),
  entityType: z.enum(['individual', 'company']),
  address: z.string().min(5).max(500),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export const aocStep1Schema = z.object({
  claimType: z.enum(['rent_debt', 'insurance_claim', 'general_monetary']),
  claimDescription: z.string().min(10).max(10000),
  claimValueCents: z.number().int().min(0).optional(),
  tenantId: z.string().optional(),
  tenantName: z.string().max(200).optional(),
  tenantAddress: z.string().max(500).optional(),
  tenantPhone: z.string().max(30).optional(),
  tenantEmail: z.string().email().optional().or(z.literal('')),
  propertyAddress: z.string().max(500).optional(),
  insuranceClaimId: z.string().optional(),
  insuranceClaimNumber: z.string().max(100).optional(),
  insurer: z.string().max(200).optional(),
  caseId: z.string().optional(),
  obligors: z.array(obligorSchema).optional(),
});

export const aocStep2Schema = z.object({ assignee: aocAssigneeSchema });

export const aocStep3Schema = z.object({
  considerationCents: z.number().int().min(0),
  effectiveDate: isoDateSchema,
  expirationDate: isoDateSchema.optional(),
  warrantsGoodTitle: z.boolean(),
  specialConditions: z.string().max(5000).optional(),
  requiresNotarization: z.boolean().optional(),
  exhibits: z.array(z.enum(AOC_EXHIBIT_KEYS)).optional(),
  assignorSignatoryName: z.string().max(200).optional(),
  assignorTitle: z.string().max(200).optional(),
  assigneeSignatoryName: z.string().max(200).optional(),
  assigneeTitle: z.string().max(200).optional(),
});

export const createAssignmentSchema = aocStep1Schema.merge(aocStep2Schema).merge(aocStep3Schema);

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  status: z.enum(['draft', 'executed', 'active', 'collected', 'closed']).optional(),
  executedDate: isoDateSchema.optional(),
  documentHtml: z.string().optional(),
  noticeSignatoryName: z.string().max(200).optional(),
  noticeSignedDate: isoDateSchema.optional(),
});
