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

export type PublishLeaseInput = z.infer<typeof publishLeaseInputSchema>;
export type UpdatePublishedLeaseInput = z.infer<typeof updatePublishedLeaseSchema>;
export type GenerateUploadUrlInput = z.infer<typeof generateUploadUrlInputSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadInputSchema>;
export type FinalizeAddendumInput = z.infer<typeof finalizeAddendumInputSchema>;
