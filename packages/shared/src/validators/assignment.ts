import { z } from 'zod';
import { AOC_EXHIBIT_KEYS } from '../types/assignment';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const aocAssigneeSchema = z.object({
  name: z.string().min(1).max(300),
  entityType: z.enum(['individual', 'company']),
  address: z.string().min(5).max(500),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export const aocStep1Schema = z.object({
  claimType: z.enum(['rent_debt', 'insurance_claim', 'general_monetary']),
  claimDescription: z.string().min(10).max(2000),
  claimValueCents: z.number().int().min(0).optional(),
  tenantId: z.string().optional(),
  tenantName: z.string().max(200).optional(),
  propertyAddress: z.string().max(500).optional(),
  insuranceClaimId: z.string().optional(),
  insuranceClaimNumber: z.string().max(100).optional(),
  insurer: z.string().max(200).optional(),
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
});

export const createAssignmentSchema = aocStep1Schema.merge(aocStep2Schema).merge(aocStep3Schema);

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  status: z.enum(['draft', 'executed', 'active', 'collected', 'closed']).optional(),
  executedDate: isoDateSchema.optional(),
  documentHtml: z.string().optional(),
});
