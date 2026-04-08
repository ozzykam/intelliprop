import { Timestamp, Address, EmergencyContact } from './common';

/**
 * Tenant type discriminator
 */
export type TenantType = 'individual' | 'business';

/**
 * Business type for commercial tenants
 */
export type BusinessType = 'llc' | 'corporation' | 'sole_proprietorship' | 'partnership' | 'nonprofit' | 'other';

/**
 * Record of a tenant update for audit trail
 */
export interface TenantUpdate {
  updatedAt: Timestamp;
  updatedBy: string; // Firebase Auth UID of user who made the update
}

/**
 * Base tenant fields shared by both types
 */
export interface BaseTenant {
  id: string;
  type: TenantType;
  userId?: string; // Firebase Auth UID if tenant has portal login
  stripeCustomerId?: string; // Stripe Customer ID for payment methods
  email: string;
  phone?: string;
  notes?: string;
  createdAt: Timestamp;
  createdBy: string; // Firebase Auth UID of user who created this tenant
  updates?: TenantUpdate[]; // Audit trail of updates
}

/**
 * Individual tenant - an individual person
 */
export interface IndividualTenant extends BaseTenant {
  type: 'individual';
  firstName: string;
  middleInitial?: string;
  lastName: string;
  dateOfBirth?: string; // ISO date string
  ssn4?: string; // Last 4 digits only
  emergencyContact?: EmergencyContact;
}

/**
 * Business tenant - a business entity
 */
export interface BusinessTenant extends BaseTenant {
  type: 'business';
  businessName: string;
  dba?: string; // "Doing business as" name
  businessType: BusinessType;
  einLast4?: string; // Last 4 of EIN
  stateOfIncorporation?: string; // 2-letter state code
  primaryContact: PrimaryContact;
}

/**
 * Discriminated union of all tenant types
 */
export type Tenant = IndividualTenant | BusinessTenant;

export type { EmergencyContact };

export interface PrimaryContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: Address;
}

/**
 * Tenant user ID mapping (for tenant portal access)
 * Links a Firebase Auth user to their tenant record
 */
export interface TenantUserMapping {
  tenantId: string;
  userId: string; // Firebase Auth UID
}
