/**
 * Published Lease Types
 *
 * Represents a lease that has been published from a completed lease builder draft.
 * Published leases are the "active" leases tracked for admin workflow, acceptance,
 * signed document uploads, and addenda.
 */

import type { LeaseClass } from './leaseBuilder';

export interface PublishedLease {
  id: string;
  llcId: string;
  draftId: string;
  packageId: string;
  leaseClass: LeaseClass;

  // Denormalized key data (from draft, for display without joins)
  propertyId: string;
  unitIds: string[];
  tenantIds: string[];
  signerUserId?: string;
  leaseType: 'fixed_term' | 'month_to_month';
  startDate: string;        // ISO date
  endDate?: string;         // ISO date (fixed-term only)
  monthlyRent: number;      // cents
  dueDay: number;
  depositAmount: number;    // cents

  // Late fee terms (denormalized from draft)
  gracePeriodDays: number;
  lateFeeType: 'flat' | 'percentage' | 'none';
  lateFeeAmount?: number;    // cents (flat) or percentage value (e.g. 5 = 5%)
  lateFeeMaxAmount?: number; // cents (cap for percentage type)

  // Admin workflow
  accepted: boolean;
  acceptedAt?: string;      // ISO datetime
  acceptedByUserId?: string;

  // Signed document uploads
  signedDocuments: SignedDocument[];

  // Addenda
  addenda: LeaseAddendum[];

  // Status
  status: 'active' | 'terminated' | 'expired';

  // Metadata
  publishedAt: string;      // ISO datetime
  publishedByUserId: string;
  createdAt: string;         // ISO datetime
  updatedAt?: string;        // ISO datetime
}

export interface SignedDocument {
  id: string;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  uploadedAt: string; // ISO datetime
}

export interface LeaseAddendum {
  id: string;
  addendumNumber: number;
  draftId: string;       // new draft created for addendum
  packageId: string;     // new package generated
  changes: AddendumChange[];
  accepted: boolean;
  acceptedAt?: string;        // ISO datetime
  acceptedByUserId?: string;
  signedDocuments: SignedDocument[];
  createdAt: string;     // ISO datetime
  createdByUserId: string;
}

export interface AddendumChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}
