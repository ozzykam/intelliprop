import { z } from 'zod';

/**
 * Activation role enum
 */
export const activationRoleSchema = z.enum(['tenant', 'employee', 'manager', 'admin']);

/**
 * Employee capabilities schema - all fields required
 */
const capabilitiesSchema = z.object({
  workOrderAccess: z.boolean(),
  taskAccess: z.boolean(),
  paymentProcessing: z.boolean(),
});

/**
 * Create a residential (individual) activation
 */
export const createIndividualActivationSchema = z.object({
  type: z.literal('individual'),
  role: activationRoleSchema,
  firstName: z.string().min(1).max(100),
  middleInitial: z.string().max(1).optional(),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ssn4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
  llcIds: z.array(z.string()).optional(),
  propertyIds: z.array(z.string()).optional(),
  capabilities: capabilitiesSchema.optional(),
  tenantId: z.string().optional(),
});

/**
 * Create a commercial (business) activation
 */
export const createBusinessActivationSchema = z.object({
  type: z.literal('business'),
  role: activationRoleSchema,
  firstName: z.string().min(1).max(100),
  middleInitial: z.string().max(1).optional(),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  einLast4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
  businessName: z.string().min(1).max(200),
  llcIds: z.array(z.string()).optional(),
  propertyIds: z.array(z.string()).optional(),
  capabilities: capabilitiesSchema.optional(),
  tenantId: z.string().optional(),
});

/**
 * Discriminated union for creating any activation type
 */
export const createActivationSchema = z.discriminatedUnion('type', [
  createIndividualActivationSchema,
  createBusinessActivationSchema,
]);

/**
 * Verify identity - residential (individual)
 */
export const verifyIndividualSchema = z.object({
  type: z.literal('individual'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ssn4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
});

/**
 * Verify identity - commercial (business)
 */
export const verifyBusinessSchema = z.object({
  type: z.literal('business'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  einLast4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
  businessName: z.string().min(1).max(200),
});

/**
 * Discriminated union for verification
 */
export const verifyIdentitySchema = z.discriminatedUnion('type', [
  verifyIndividualSchema,
  verifyBusinessSchema,
]);

/**
 * Confirm name step
 */
export const confirmNameSchema = z.object({
  activationId: z.string().min(1),
  verificationToken: z.string().min(1),
});

/**
 * Create account step
 */
export const createAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmationToken: z.string().min(1),
});

// Inferred types from schemas (use these when validating input)
export type ValidatedCreateIndividualActivation = z.infer<typeof createIndividualActivationSchema>;
export type ValidatedCreateBusinessActivation = z.infer<typeof createBusinessActivationSchema>;
export type ValidatedCreateActivation = z.infer<typeof createActivationSchema>;
export type ValidatedVerifyIndividual = z.infer<typeof verifyIndividualSchema>;
export type ValidatedVerifyBusiness = z.infer<typeof verifyBusinessSchema>;
export type ValidatedVerifyIdentity = z.infer<typeof verifyIdentitySchema>;
export type ValidatedConfirmName = z.infer<typeof confirmNameSchema>;
export type ValidatedCreateAccount = z.infer<typeof createAccountSchema>;
