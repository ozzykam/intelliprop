import { Timestamp, Address, EmergencyContact } from './common';
import { EmployeeCapabilities } from './rbac';

/**
 * Activation type - matches tenant type for consistency
 */
export type ActivationType = 'individual' | 'business';

/**
 * Role being activated
 */
export type ActivationRole = 'tenant' | 'employee' | 'manager' | 'admin';

/**
 * Activation status
 */
export type ActivationStatus = 'pending' | 'activated' | 'expired';

/**
 * Base fields shared by all activation types
 */
interface BaseActivation {
  id: string;
  type: ActivationType;
  role: ActivationRole;

  // Name
  firstName: string;
  middleInitial?: string;
  lastName: string;

  // Verification
  dateOfBirth: string; // ISO date string YYYY-MM-DD

  // Contact
  email?: string;
  phone?: string;

  // Assignments (for staff roles)
  llcIds: string[];
  propertyIds: string[];
  capabilities?: EmployeeCapabilities;
  // Assignee designation
  isAssignee?: boolean;
  assigneeEntityType?: 'individual' | 'company';
  // Contact / address
  mailingAddress?: Address;
  emergencyContact?: EmergencyContact;

  // Link to tenant record (for tenant role)
  tenantId?: string;

  // Status tracking
  status: ActivationStatus;
  createdBy: string; // Staff UID who created this
  createdAt: Timestamp;
  expiresAt: Timestamp;

  // Activation tracking
  activatedAt?: Timestamp;
  activatedUserId?: string; // Firebase Auth UID after activation
}

/**
 * Residential/Individual activation - uses SSN for verification
 */
export interface IndividualActivation extends BaseActivation {
  type: 'individual';
  ssn4: string; // Last 4 digits of SSN
}

/**
 * Business activation - uses EIN and business name for verification
 */
export interface BusinessActivation extends BaseActivation {
  type: 'business';
  einLast4: string; // Last 4 digits of EIN
  businessName: string;
}

/**
 * Discriminated union of all activation types
 */
export type PendingActivation = IndividualActivation | BusinessActivation;

/**
 * Input for creating a residential activation
 */
export interface CreateIndividualActivationInput {
  type: 'individual';
  role: ActivationRole;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  dateOfBirth: string;
  ssn4: string;
  email?: string;
  phone?: string;
  llcIds?: string[];
  propertyIds?: string[];
  capabilities?: EmployeeCapabilities;
  tenantId?: string;
  isAssignee?: boolean;
  assigneeEntityType?: 'individual' | 'company';
  mailingAddress?: Address;
  emergencyContact?: EmergencyContact;
}

/**
 * Input for creating a business activation
 */
export interface CreateBusinessActivationInput {
  type: 'business';
  role: ActivationRole;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  dateOfBirth: string;
  einLast4: string;
  businessName: string;
  email?: string;
  phone?: string;
  llcIds?: string[];
  propertyIds?: string[];
  capabilities?: EmployeeCapabilities;
  tenantId?: string;
  isAssignee?: boolean;
  assigneeEntityType?: 'individual' | 'company';
  mailingAddress?: Address;
  emergencyContact?: EmergencyContact;
}

/**
 * Union type for creating activations
 */
export type CreateActivationInput =
  | CreateIndividualActivationInput
  | CreateBusinessActivationInput;

/**
 * Verification input for residential (individual)
 */
export interface IndividualVerificationInput {
  type: 'individual';
  dateOfBirth: string;
  ssn4: string;
}

/**
 * Verification input for business
 */
export interface BusinessVerificationInput {
  type: 'business';
  dateOfBirth: string;
  einLast4: string;
  businessName: string;
}

/**
 * Union type for verification input
 */
export type VerificationInput =
  | IndividualVerificationInput
  | BusinessVerificationInput;

/**
 * Result of successful verification
 */
export interface VerificationResult {
  activationId: string;
  verificationToken: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  role: ActivationRole;
}

/**
 * Result of name confirmation
 */
export interface ConfirmationResult {
  confirmationToken: string;
  activationId: string;
  email?: string;
}

/**
 * Input for creating account
 */
export interface CreateAccountInput {
  email: string;
  password: string;
  confirmationToken: string;
}
