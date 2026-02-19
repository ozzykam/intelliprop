import { z } from 'zod';

export const publishLeaseInputSchema = z.object({
  draftId: z.string().min(1),
  packageId: z.string().min(1),
});

export const updatePublishedLeaseSchema = z.object({
  accepted: z.boolean().optional(),
  status: z.enum(['active', 'terminated', 'expired']).optional(),
});

export const generateUploadUrlInputSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
});

export const confirmUploadInputSchema = z.object({
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().positive(),
});

export const finalizeAddendumInputSchema = z.object({
  draftId: z.string().min(1),
});

export const expressLeaseDetailsSchema = z.object({
  petPolicy: z.enum(['allowed', 'not_allowed', 'case_by_case']).optional(),
  petDeposit: z.number().int().min(0).optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  utilitiesIncluded: z.array(z.string()).optional(),
  specialTerms: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

export const expressLeaseInputSchema = z.object({
  leaseClass: z.enum(['residential', 'commercial']),
  propertyId: z.string().min(1),
  unitIds: z.array(z.string().min(1)).min(1),
  tenantIds: z.array(z.string().min(1)).min(1),
  leaseType: z.enum(['fixed_term', 'month_to_month']),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  monthlyRent: z.number().int().positive(),
  dueDay: z.number().int().min(1).max(28),
  depositAmount: z.number().int().min(0),
  gracePeriodDays: z.number().int().min(0).default(0),
  lateFeeType: z.enum(['flat', 'percentage', 'none']).default('none'),
  lateFeeAmount: z.number().int().min(0).optional(),
  lateFeeMaxAmount: z.number().int().min(0).optional(),
  status: z.enum(['active', 'terminated', 'expired']).default('active'),
  expressDetails: expressLeaseDetailsSchema.optional(),
}).refine(
  (data) => data.leaseType !== 'fixed_term' || (data.endDate && data.endDate.length > 0),
  { message: 'End date is required for fixed-term leases', path: ['endDate'] }
);

export const addNoteInputSchema = z.object({
  text: z.string().min(1).max(2000),
});

export type PublishLeaseInput = z.infer<typeof publishLeaseInputSchema>;
export type UpdatePublishedLeaseInput = z.infer<typeof updatePublishedLeaseSchema>;
export type GenerateUploadUrlInput = z.infer<typeof generateUploadUrlInputSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadInputSchema>;
export type FinalizeAddendumInput = z.infer<typeof finalizeAddendumInputSchema>;
export type AddNoteInput = z.infer<typeof addNoteInputSchema>;
export type ExpressLeaseInput = z.infer<typeof expressLeaseInputSchema>;
