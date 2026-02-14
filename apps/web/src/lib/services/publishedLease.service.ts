/**
 * Published Lease Service
 *
 * Handles publishing leases from completed drafts, CRUD operations,
 * acceptance workflow, and signed document management.
 */

import { adminDb } from '@/lib/firebase/admin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import type { PublishedLease, SignedDocument, LeaseAddendum, AddendumChange } from '@shared/types/publishedLease';
import type { LeaseBuilderDraft, LeasePackage } from '@shared/types/leaseBuilder';
import { getMember } from '@/lib/services/member.service';
import { buildPrintableHtml } from '@/lib/services/pdfGenerator';

// ============================================================================
// COLLECTION HELPERS
// ============================================================================

function publishedLeasesCollection(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('publishedLeases');
}

function draftsCollection(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('leaseBuilderDrafts');
}

function packagesCollection(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('leasePackages');
}

// ============================================================================
// PUBLISH
// ============================================================================

/**
 * Publish a lease from a completed draft.
 * Creates a PublishedLease document and marks the draft as published.
 */
export async function publishLease(
  llcId: string,
  draftId: string,
  packageId: string,
  actorUserId: string
): Promise<PublishedLease & { id: string }> {
  // 1. Fetch draft — verify status is completed and not already published
  const draftDoc = await draftsCollection(llcId).doc(draftId).get();
  if (!draftDoc.exists) {
    throw new Error('NOT_FOUND: Draft not found');
  }
  const draft = { id: draftDoc.id, ...draftDoc.data() } as LeaseBuilderDraft & { id: string };

  if (draft.status !== 'completed') {
    throw new Error('INVALID_INPUT: Draft must be completed before publishing');
  }
  if (draft.published) {
    throw new Error('INVALID_INPUT: Draft has already been published');
  }

  // 2. Fetch the package
  const packageDoc = await packagesCollection(llcId).doc(packageId).get();
  if (!packageDoc.exists) {
    throw new Error('NOT_FOUND: Package not found');
  }
  const pkg = { id: packageDoc.id, ...packageDoc.data() } as LeasePackage & { id: string };

  // 3. Extract key fields from draft
  const isResidential = draft.leaseClass === 'residential';
  const monthlyRent = isResidential
    ? (draft.residential?.rent?.monthlyRent || 0)
    : (draft.commercial?.financial?.baseRentMonthly || 0);
  const dueDay = isResidential
    ? (draft.residential?.rent?.dueDay || 1)
    : (draft.commercial?.financial?.dueDay || 1);
  const startDate = isResidential
    ? (draft.residential?.rent?.startDate || '')
    : (draft.commercial?.leaseStructure?.startDate || '');
  const endDate = isResidential
    ? (draft.residential?.rent?.endDate || undefined)
    : (draft.commercial?.leaseStructure?.endDate || undefined);
  const depositAmount = isResidential
    ? (draft.residential?.deposit?.securityDeposit || 0)
    : (draft.commercial?.deposit?.securityDeposit || 0);

  // Extract late fee terms from draft
  let gracePeriodDays: number;
  let lateFeeType: 'flat' | 'percentage' | 'none';
  let lateFeeAmount: number | undefined;
  let lateFeeMaxAmount: number | undefined;

  if (isResidential) {
    gracePeriodDays = draft.residential?.rent?.gracePeriodDays ?? 0;
    lateFeeType = draft.residential?.rent?.lateFeeType ?? 'none';
    lateFeeAmount = draft.residential?.rent?.lateFeeAmount;
    lateFeeMaxAmount = draft.residential?.rent?.lateFeeMaxAmount;
  } else {
    gracePeriodDays = draft.commercial?.financial?.gracePeriodDays ?? 0;
    const commercialLateFee = draft.commercial?.financial?.lateFeeAmount;
    lateFeeType = commercialLateFee && commercialLateFee > 0 ? 'flat' : 'none';
    lateFeeAmount = commercialLateFee;
    lateFeeMaxAmount = undefined;
  }

  // 4. Create PublishedLease document
  const publishedLeaseRef = publishedLeasesCollection(llcId).doc();
  const now = new Date().toISOString();

  const publishedLease: Omit<PublishedLease, 'id'> = {
    llcId,
    draftId,
    packageId: pkg.id,
    leaseClass: draft.leaseClass,
    propertyId: draft.propertyId || '',
    unitIds: draft.unitIds || [],
    tenantIds: draft.tenantIds || [],
    signerUserId: draft.signerUserId,
    leaseType: draft.leaseType || 'fixed_term',
    startDate,
    endDate,
    monthlyRent,
    dueDay,
    depositAmount,
    gracePeriodDays,
    lateFeeType,
    lateFeeAmount,
    lateFeeMaxAmount,
    accepted: false,
    signedDocuments: [],
    addenda: [],
    status: 'active',
    publishedAt: now,
    publishedByUserId: actorUserId,
    createdAt: now,
  };

  // 5. Batch: create published lease + update draft
  const batch = adminDb.batch();

  // Strip undefined values for Firestore
  const sanitized = JSON.parse(JSON.stringify(publishedLease));
  batch.set(publishedLeaseRef, {
    ...sanitized,
    createdAt: FieldValue.serverTimestamp(),
  });

  batch.update(draftsCollection(llcId).doc(draftId), {
    published: true,
    publishedLeaseId: publishedLeaseRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'published_lease',
    entityId: publishedLeaseRef.id,
    entityPath: `llcs/${llcId}/publishedLeases/${publishedLeaseRef.id}`,
    changes: {
      after: {
        draftId,
        packageId: pkg.id,
        leaseClass: draft.leaseClass,
        monthlyRent,
        startDate,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { id: publishedLeaseRef.id, ...publishedLease };
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get a single published lease by ID.
 */
export async function getPublishedLease(
  llcId: string,
  publishedLeaseId: string
): Promise<(PublishedLease & { id: string }) | null> {
  const doc = await publishedLeasesCollection(llcId).doc(publishedLeaseId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as PublishedLease & { id: string };
}

/**
 * List published leases for an LLC.
 */
export async function listPublishedLeases(
  llcId: string,
  filters?: { status?: string; accepted?: boolean }
): Promise<(PublishedLease & { id: string })[]> {
  let query: FirebaseFirestore.Query = publishedLeasesCollection(llcId)
    .orderBy('createdAt', 'desc');

  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.accepted !== undefined) {
    query = query.where('accepted', '==', filters.accepted);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (PublishedLease & { id: string })[];
}

/**
 * Admin: list published leases across all LLCs with enriched data.
 */
export async function listAllPublishedLeases(
  filters?: { llcId?: string; status?: string; accepted?: boolean }
): Promise<{
  id: string;
  llcId: string;
  llcName: string;
  propertyAddress: string;
  unitNumbers: string;
  tenantNames: string[];
  leaseClass: string;
  monthlyRent: number;
  startDate: string;
  endDate?: string;
  leaseType: string;
  accepted: boolean;
  status: string;
  publishedAt: string;
  daysUntilExpiry: number | null;
}[]> {
  // Get all LLCs
  const llcsSnap = await adminDb.collection('llcs').get();
  const llcMap = new Map<string, string>();
  llcsSnap.docs.forEach(doc => {
    llcMap.set(doc.id, doc.data().legalName || 'Unknown LLC');
  });

  // Get all published leases using collectionGroup
  const publishedSnap = await adminDb.collectionGroup('publishedLeases').get();
  const today = new Date();

  const results: {
    id: string;
    llcId: string;
    llcName: string;
    propertyAddress: string;
    unitNumbers: string;
    tenantNames: string[];
    leaseClass: string;
    monthlyRent: number;
    startDate: string;
    endDate?: string;
    leaseType: string;
    accepted: boolean;
    status: string;
    publishedAt: string;
    daysUntilExpiry: number | null;
  }[] = [];

  for (const doc of publishedSnap.docs) {
    const lease = doc.data() as PublishedLease;
    const pathParts = doc.ref.path.split('/');
    if (pathParts.length < 2 || !pathParts[1]) continue;
    const llcId = pathParts[1];

    // Apply filters
    if (filters?.llcId && llcId !== filters.llcId) continue;
    if (filters?.status && lease.status !== filters.status) continue;
    if (filters?.accepted !== undefined && lease.accepted !== filters.accepted) continue;

    // Get property info
    let propertyAddress = 'Unknown';
    if (lease.propertyId) {
      const propDoc = await adminDb
        .collection('llcs').doc(llcId)
        .collection('properties').doc(lease.propertyId)
        .get();
      const prop = propDoc.data();
      if (prop?.address) {
        propertyAddress = `${prop.address.street1}, ${prop.address.city}, ${prop.address.state}`;
      }
    }

    // Get unit numbers
    let unitNumbers = '';
    if (lease.unitIds?.length) {
      const unitDocs = await Promise.all(
        lease.unitIds.map(uid =>
          adminDb.collection('llcs').doc(llcId)
            .collection('properties').doc(lease.propertyId)
            .collection('units').doc(uid).get()
        )
      );
      unitNumbers = unitDocs
        .filter(d => d.exists)
        .map(d => d.data()?.unitNumber || '')
        .filter(Boolean)
        .join(', ');
    }

    // Get tenant names
    const tenantNames: string[] = [];
    for (const tenantId of lease.tenantIds || []) {
      const tenantDoc = await adminDb
        .collection('tenants').doc(tenantId)
        .get();
      const tenant = tenantDoc.data();
      if (tenant) {
        if (tenant.type === 'business') {
          tenantNames.push(tenant.businessName || 'Unknown');
        } else {
          tenantNames.push(`${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Unknown');
        }
      }
    }

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (lease.endDate && lease.status === 'active') {
      const endDate = new Date(lease.endDate);
      daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    results.push({
      id: doc.id,
      llcId,
      llcName: llcMap.get(llcId) || 'Unknown LLC',
      propertyAddress,
      unitNumbers,
      tenantNames,
      leaseClass: lease.leaseClass,
      monthlyRent: lease.monthlyRent,
      startDate: lease.startDate,
      endDate: lease.endDate,
      leaseType: lease.leaseType,
      accepted: lease.accepted,
      status: lease.status,
      publishedAt: lease.publishedAt,
      daysUntilExpiry,
    });
  }

  // Sort by LLC name, then by published date descending
  results.sort((a, b) => {
    const llcCompare = a.llcName.localeCompare(b.llcName);
    if (llcCompare !== 0) return llcCompare;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  return results;
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Accept a published lease.
 */
export async function acceptLease(
  llcId: string,
  publishedLeaseId: string,
  actorUserId: string
): Promise<void> {
  const docRef = publishedLeasesCollection(llcId).doc(publishedLeaseId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error('NOT_FOUND: Published lease not found');

  await docRef.update({
    accepted: true,
    acceptedAt: new Date().toISOString(),
    acceptedByUserId: actorUserId,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update published lease status.
 */
export async function updatePublishedLeaseStatus(
  llcId: string,
  publishedLeaseId: string,
  status: 'active' | 'terminated' | 'expired',
  actorUserId: string
): Promise<void> {
  const docRef = publishedLeasesCollection(llcId).doc(publishedLeaseId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error('NOT_FOUND: Published lease not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.update(docRef, {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'published_lease',
    entityId: publishedLeaseId,
    entityPath: `llcs/${llcId}/publishedLeases/${publishedLeaseId}`,
    changes: {
      before: { status: doc.data()?.status },
      after: { status },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

// ============================================================================
// DOCUMENT UPLOAD
// ============================================================================

/**
 * Generate a signed upload URL for a document.
 */
export async function generateDocumentUploadUrl(
  llcId: string,
  publishedLeaseId: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; storagePath: string }> {
  const bucket = getStorage().bucket();
  const storagePath = `llcs/${llcId}/publishedLeases/${publishedLeaseId}/documents/${Date.now()}_${fileName}`;
  const file = bucket.file(storagePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  return { uploadUrl, storagePath };
}

/**
 * Generate a signed download URL for a document.
 */
export async function generateDocumentDownloadUrl(storagePath: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);

  const [downloadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return downloadUrl;
}

/**
 * Add a signed document to a published lease after upload completes.
 */
export async function addSignedDocument(
  llcId: string,
  publishedLeaseId: string,
  doc: {
    storagePath: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  },
  actorUserId: string
): Promise<SignedDocument> {
  const docRef = publishedLeasesCollection(llcId).doc(publishedLeaseId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) throw new Error('NOT_FOUND: Published lease not found');

  const signedDoc: SignedDocument = {
    id: `doc_${Date.now()}`,
    fileName: doc.fileName,
    storagePath: doc.storagePath,
    contentType: doc.contentType,
    sizeBytes: doc.sizeBytes,
    uploadedByUserId: actorUserId,
    uploadedAt: new Date().toISOString(),
  };

  await docRef.update({
    signedDocuments: FieldValue.arrayUnion(signedDoc),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return signedDoc;
}

/**
 * Remove a signed document from a published lease and delete from storage.
 */
export async function removeSignedDocument(
  llcId: string,
  publishedLeaseId: string,
  documentId: string,
  actorUserId: string
): Promise<void> {
  const docRef = publishedLeasesCollection(llcId).doc(publishedLeaseId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) throw new Error('NOT_FOUND: Published lease not found');

  const data = snapshot.data() as PublishedLease;
  const signedDoc = data.signedDocuments?.find(d => d.id === documentId);
  if (!signedDoc) throw new Error('NOT_FOUND: Document not found');

  // Delete from Storage
  try {
    const bucket = getStorage().bucket();
    await bucket.file(signedDoc.storagePath).delete();
  } catch {
    // File may already be deleted
  }

  // Remove from array
  const updatedDocs = (data.signedDocuments || []).filter(d => d.id !== documentId);

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.update(docRef, {
    signedDocuments: updatedDocs,
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'published_lease_document',
    entityId: documentId,
    entityPath: `llcs/${llcId}/publishedLeases/${publishedLeaseId}/documents/${documentId}`,
    changes: {
      before: { fileName: signedDoc.fileName },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

// ============================================================================
// ADDENDUM WORKFLOW
// ============================================================================

/**
 * Clone a draft for addendum editing.
 * Creates a new draft based on the latest source (original or last addendum draft).
 */
export async function cloneDraftForAddendum(
  llcId: string,
  publishedLeaseId: string,
  actorUserId: string
): Promise<{ draftId: string }> {
  // 1. Fetch published lease
  const leaseDoc = await publishedLeasesCollection(llcId).doc(publishedLeaseId).get();
  if (!leaseDoc.exists) throw new Error('NOT_FOUND: Published lease not found');
  const lease = leaseDoc.data() as PublishedLease;

  if (lease.status !== 'active') {
    throw new Error('INVALID_INPUT: Can only create addenda for active leases');
  }

  // 2. Determine source draft
  let sourceDraftId = lease.draftId;
  if (lease.addenda && lease.addenda.length > 0) {
    const lastAddendum = lease.addenda.at(-1);
    if (lastAddendum) {
      sourceDraftId = lastAddendum.draftId;
    }
  }

  // 3. Fetch source draft
  const sourceDraftDoc = await draftsCollection(llcId).doc(sourceDraftId).get();
  if (!sourceDraftDoc.exists) throw new Error('NOT_FOUND: Source draft not found');
  const sourceDraft = sourceDraftDoc.data() as LeaseBuilderDraft;

  // 4. Create new draft with cloned terms
  const newDraftRef = draftsCollection(llcId).doc();
  const now = new Date().toISOString();

  const clonedDraft: Omit<LeaseBuilderDraft, 'id'> = {
    llcId,
    leaseClass: sourceDraft.leaseClass,
    currentStep: 'property_selection',
    status: 'in_progress',
    propertyId: sourceDraft.propertyId,
    unitIds: sourceDraft.unitIds || [],
    tenantIds: sourceDraft.tenantIds || [],
    signerUserId: sourceDraft.signerUserId,
    leaseType: sourceDraft.leaseType,
    propertyProfile: sourceDraft.propertyProfile,
    residential: sourceDraft.residential,
    commercial: sourceDraft.commercial,
    triggeredDisclosures: sourceDraft.triggeredDisclosures || [],
    triggeredOverlays: sourceDraft.triggeredOverlays || [],
    templateVersion: sourceDraft.templateVersion,
    amendingPublishedLeaseId: publishedLeaseId,
    clonedFromDraftId: sourceDraftId,
    createdAt: now,
    updatedAt: now,
    createdByUserId: actorUserId,
  };

  // Strip undefined values for Firestore
  const sanitized = JSON.parse(JSON.stringify(clonedDraft));
  await newDraftRef.set({
    ...sanitized,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { draftId: newDraftRef.id };
}

// ============================================================================
// DIFF UTILITY
// ============================================================================

interface DiffFieldDef {
  path: string;
  label: string;
  format?: 'cents' | 'date' | 'percent' | 'string' | 'number';
}

const RESIDENTIAL_DIFF_FIELDS: DiffFieldDef[] = [
  // Rent
  { path: 'residential.rent.monthlyRent', label: 'Monthly Rent', format: 'cents' },
  { path: 'residential.rent.dueDay', label: 'Due Day', format: 'number' },
  { path: 'residential.rent.startDate', label: 'Start Date', format: 'date' },
  { path: 'residential.rent.endDate', label: 'End Date', format: 'date' },
  { path: 'residential.rent.gracePeriodDays', label: 'Grace Period (Days)', format: 'number' },
  { path: 'residential.rent.lateFeeType', label: 'Late Fee Type', format: 'string' },
  { path: 'residential.rent.lateFeeAmount', label: 'Late Fee Amount', format: 'cents' },
  { path: 'residential.rent.lateFeeMaxAmount', label: 'Late Fee Maximum', format: 'cents' },
  { path: 'residential.rent.returnedPaymentFee', label: 'Returned Payment Fee', format: 'cents' },
  { path: 'residential.rent.prorationMethod', label: 'Proration Method', format: 'string' },
  { path: 'residential.rent.holdoverTerms', label: 'Holdover Terms', format: 'string' },
  { path: 'residential.rent.noticeToTerminateDays', label: 'Notice to Terminate (Days)', format: 'number' },
  // Deposit
  { path: 'residential.deposit.securityDeposit', label: 'Security Deposit', format: 'cents' },
  { path: 'residential.deposit.petDeposit', label: 'Pet Deposit', format: 'cents' },
  { path: 'residential.deposit.keyFobDeposit', label: 'Key/Fob Deposit', format: 'cents' },
  { path: 'residential.deposit.useMoveinChecklist', label: 'Move-in Checklist', format: 'string' },
  // Occupancy
  { path: 'residential.occupancy.maxOccupants', label: 'Max Occupants', format: 'number' },
  { path: 'residential.occupancy.guestMaxConsecutiveDays', label: 'Guest Max Consecutive Days', format: 'number' },
  { path: 'residential.occupancy.guestMaxDaysPerYear', label: 'Guest Max Days/Year', format: 'number' },
  { path: 'residential.occupancy.sublettingAllowed', label: 'Subletting Allowed', format: 'string' },
  { path: 'residential.occupancy.sublettingRequiresConsent', label: 'Subletting Requires Consent', format: 'string' },
  { path: 'residential.occupancy.assignmentAllowed', label: 'Assignment Allowed', format: 'string' },
  // Policies
  { path: 'residential.policies.smokingPolicy', label: 'Smoking Policy', format: 'string' },
  { path: 'residential.policies.petPolicy', label: 'Pet Policy', format: 'string' },
  { path: 'residential.policies.rentersInsuranceRequired', label: 'Renters Insurance Required', format: 'string' },
  { path: 'residential.policies.rentersInsuranceMinCoverage', label: 'Insurance Min Coverage', format: 'cents' },
  { path: 'residential.policies.parkingIncluded', label: 'Parking Included', format: 'string' },
  { path: 'residential.policies.parkingSpaces', label: 'Parking Spaces', format: 'number' },
  { path: 'residential.policies.parkingFeePerMonth', label: 'Parking Fee/Month', format: 'cents' },
  { path: 'residential.policies.storageIncluded', label: 'Storage Included', format: 'string' },
  { path: 'residential.policies.storageFeePerMonth', label: 'Storage Fee/Month', format: 'cents' },
  { path: 'residential.policies.quietHoursEnabled', label: 'Quiet Hours Enabled', format: 'string' },
  { path: 'residential.policies.quietHoursStart', label: 'Quiet Hours Start', format: 'string' },
  { path: 'residential.policies.quietHoursEnd', label: 'Quiet Hours End', format: 'string' },
  { path: 'residential.policies.lockChangePolicy', label: 'Lock Change Policy', format: 'string' },
  // Entry
  { path: 'residential.entry.noticeHours', label: 'Entry Notice (Hours)', format: 'number' },
  { path: 'residential.entry.maintenanceRequestMethod', label: 'Maintenance Request Method', format: 'string' },
  { path: 'residential.entry.emergencyContactMethod', label: 'Emergency Contact Method', format: 'string' },
];

const COMMERCIAL_DIFF_FIELDS: DiffFieldDef[] = [
  // Lease Structure
  { path: 'commercial.leaseStructure.leaseType', label: 'Lease Type', format: 'string' },
  { path: 'commercial.leaseStructure.startDate', label: 'Start Date', format: 'date' },
  { path: 'commercial.leaseStructure.endDate', label: 'End Date', format: 'date' },
  { path: 'commercial.leaseStructure.noticeToTerminateDays', label: 'Notice to Terminate (Days)', format: 'number' },
  { path: 'commercial.leaseStructure.renewalOptions', label: 'Renewal Options', format: 'number' },
  { path: 'commercial.leaseStructure.renewalTermLength', label: 'Renewal Term Length', format: 'string' },
  { path: 'commercial.leaseStructure.renewalNoticePeriodDays', label: 'Renewal Notice (Days)', format: 'number' },
  // Financial
  { path: 'commercial.financial.baseRentMonthly', label: 'Base Rent (Monthly)', format: 'cents' },
  { path: 'commercial.financial.dueDay', label: 'Due Day', format: 'number' },
  { path: 'commercial.financial.gracePeriodDays', label: 'Grace Period (Days)', format: 'number' },
  { path: 'commercial.financial.lateFeeAmount', label: 'Late Fee Amount', format: 'cents' },
  { path: 'commercial.financial.defaultInterestRate', label: 'Default Interest Rate', format: 'percent' },
  { path: 'commercial.financial.escalationType', label: 'Escalation Type', format: 'string' },
  { path: 'commercial.financial.escalationFixedAmount', label: 'Escalation Fixed Amount', format: 'cents' },
  { path: 'commercial.financial.escalationPercentage', label: 'Escalation Percentage', format: 'percent' },
  { path: 'commercial.financial.camEnabled', label: 'CAM Enabled', format: 'string' },
  { path: 'commercial.financial.camProRataShare', label: 'CAM Pro-Rata Share', format: 'percent' },
  { path: 'commercial.financial.camIncludesPropertyTax', label: 'CAM Includes Property Tax', format: 'string' },
  { path: 'commercial.financial.camIncludesInsurance', label: 'CAM Includes Insurance', format: 'string' },
  { path: 'commercial.financial.camIncludesManagement', label: 'CAM Includes Management', format: 'string' },
  { path: 'commercial.financial.camManagementFeePercent', label: 'CAM Management Fee (%)', format: 'percent' },
  { path: 'commercial.financial.camIncludesUtilities', label: 'CAM Includes Utilities', format: 'string' },
  { path: 'commercial.financial.camReconciliationDays', label: 'CAM Reconciliation (Days)', format: 'number' },
  { path: 'commercial.financial.camAuditRights', label: 'CAM Audit Rights', format: 'string' },
  // Deposit
  { path: 'commercial.deposit.securityDeposit', label: 'Security Deposit', format: 'cents' },
  { path: 'commercial.deposit.depositReturnDays', label: 'Deposit Return (Days)', format: 'number' },
  // Use & Buildout
  { path: 'commercial.useAndBuildout.permittedUse', label: 'Permitted Use', format: 'string' },
  { path: 'commercial.useAndBuildout.exclusiveUse', label: 'Exclusive Use', format: 'string' },
  { path: 'commercial.useAndBuildout.exclusiveUseDescription', label: 'Exclusive Use Description', format: 'string' },
  { path: 'commercial.useAndBuildout.tiType', label: 'TI Type', format: 'string' },
  { path: 'commercial.useAndBuildout.tiAllowance', label: 'TI Allowance', format: 'cents' },
  { path: 'commercial.useAndBuildout.tiAllowanceScope', label: 'TI Allowance Scope', format: 'string' },
  { path: 'commercial.useAndBuildout.improvementOwnership', label: 'Improvement Ownership', format: 'string' },
  { path: 'commercial.useAndBuildout.signageAllowed', label: 'Signage Allowed', format: 'string' },
  { path: 'commercial.useAndBuildout.premisesCondition', label: 'Premises Condition', format: 'string' },
  // Operations
  { path: 'commercial.operations.utilityResponsibility', label: 'Utility Responsibility', format: 'string' },
  { path: 'commercial.operations.insuranceGLAmount', label: 'Insurance GL Amount', format: 'number' },
  { path: 'commercial.operations.insurancePropertyRequired', label: 'Property Insurance Required', format: 'string' },
  { path: 'commercial.operations.adaResponsibility', label: 'ADA Responsibility', format: 'string' },
  // Risk
  { path: 'commercial.risk.monetaryDefaultCureDays', label: 'Monetary Default Cure (Days)', format: 'number' },
  { path: 'commercial.risk.nonMonetaryDefaultCureDays', label: 'Non-Monetary Default Cure (Days)', format: 'number' },
  { path: 'commercial.risk.holdoverRentPercent', label: 'Holdover Rent (%)', format: 'number' },
  { path: 'commercial.risk.assignmentAllowed', label: 'Assignment Allowed', format: 'string' },
  { path: 'commercial.risk.assignmentConsentRequired', label: 'Assignment Consent Required', format: 'string' },
  { path: 'commercial.risk.assignmentConsentStandard', label: 'Assignment Consent Standard', format: 'string' },
  { path: 'commercial.risk.personalGuaranteeRequired', label: 'Personal Guarantee Required', format: 'string' },
  { path: 'commercial.risk.personalGuaranteeType', label: 'Personal Guarantee Type', format: 'string' },
  { path: 'commercial.risk.personalGuaranteeCap', label: 'Personal Guarantee Cap', format: 'cents' },
  { path: 'commercial.risk.indemnificationMutual', label: 'Mutual Indemnification', format: 'string' },
  { path: 'commercial.risk.casualtyTerminationRight', label: 'Casualty Termination Right', format: 'string' },
];

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function formatDiffValue(value: unknown, format?: string): string {
  if (value == null || value === undefined) return '(not set)';
  switch (format) {
    case 'cents':
      return '$' + (Number(value) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
    case 'date':
      return String(value);
    case 'percent':
      return `${value}%`;
    case 'number':
      return String(value);
    default:
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return String(value).replace(/_/g, ' ');
  }
}

/**
 * Compare two drafts and return a list of changes.
 */
export function diffDrafts(
  oldDraft: LeaseBuilderDraft,
  newDraft: LeaseBuilderDraft,
  leaseClass: string
): AddendumChange[] {
  const fields = leaseClass === 'residential' ? RESIDENTIAL_DIFF_FIELDS : COMMERCIAL_DIFF_FIELDS;
  const changes: AddendumChange[] = [];

  for (const field of fields) {
    const oldVal = getNestedValue(oldDraft as unknown as Record<string, unknown>, field.path);
    const newVal = getNestedValue(newDraft as unknown as Record<string, unknown>, field.path);

    const oldStr = JSON.stringify(oldVal ?? null);
    const newStr = JSON.stringify(newVal ?? null);

    if (oldStr !== newStr) {
      changes.push({
        field: field.path,
        label: field.label,
        oldValue: formatDiffValue(oldVal, field.format),
        newValue: formatDiffValue(newVal, field.format),
      });
    }
  }

  return changes;
}

// ============================================================================
// ADDENDUM DOCUMENT GENERATOR
// ============================================================================

interface AddendumTenantInfo {
  name: string;
  type: 'individual' | 'business';
  signerName?: string;  // primaryContact.name for business tenants
  signerTitle?: string; // primaryContact.title for business tenants
}

interface AddendumContext {
  leaseClass: string;
  propertyAddress: string;
  unitNumbers: string;
  tenants: AddendumTenantInfo[];
  landlordName: string;
  landlordSignerName: string;
  landlordSignerTitle: string;
  date: string;
}

function generateAddendumHtml(
  addendumNumber: number,
  changes: AddendumChange[],
  context: AddendumContext
): string {
  const changesList = changes
    .map(
      (c, i) =>
        `<p style="margin:0 0 8px 0;"><strong>${i + 1}. ${c.label}:</strong> Changed from "${c.oldValue}" to "${c.newValue}"</p>`
    )
    .join('\n');

  const tenantLabel = context.tenants.length > 1 ? 'Tenants' : 'Tenant';
  const tenantDisplay = context.tenants.length > 0
    ? context.tenants.map(t => t.name).join(', ')
    : 'Unknown';

  // Build signature block based on lease class
  let signatureBlock: string;

  if (context.leaseClass === 'commercial') {
    // Commercial: entity-to-entity with authorized representatives
    const tenantSigs = (context.tenants.length > 0 ? context.tenants : [{ name: '', type: 'business' as const, signerName: '', signerTitle: '' }]).map(
      (t) =>
`<p><strong>TENANT:</strong></p>
<p>${t.name}</p>
<p>By: ___________________________________</p>
<p>Printed Name: ${t.signerName || '___________________________________'}</p>
<p>Title: ${t.signerTitle || '___________________________________'}</p>
<p>Date: ___________________________________</p>`
    ).join('\n<br/>\n');

    signatureBlock = `
<p>IN WITNESS WHEREOF, the Parties have executed this Addendum as of the date last written below, each by a duly authorized representative.</p>
<p><strong>LANDLORD:</strong></p>
<p>${context.landlordName}<br/>
a Minnesota limited liability company</p>
<p>By: ___________________________________</p>
<p>Printed Name: ${context.landlordSignerName}</p>
<p>Title: ${context.landlordSignerTitle}</p>
<p>Date: ___________________________________</p>
<br/>
${tenantSigs}`;
  } else {
    // Residential: LLC landlord with authorized rep, individual tenant signatures
    const tenantSigs = (context.tenants.length > 0 ? context.tenants : [{ name: '', type: 'individual' as const }]).map(
      (t) =>
`<p>Signature: ___________________________________</p>
<p>Printed Name: ${t.name}</p>
<p>Date: ___________________________________</p>
<br/>`
    ).join('\n');

    signatureBlock = `
<p>By signing below, the parties acknowledge that they have read, understood, and agree to be bound by all terms and conditions of this Addendum.</p>
<p><strong>LANDLORD:</strong></p>
<p>${context.landlordName}<br/>
a Minnesota limited liability company</p>
<p>By: ___________________________________</p>
<p>Printed Name: ${context.landlordSignerName}</p>
<p>Title: ${context.landlordSignerTitle}</p>
<p>Date: ___________________________________</p>
<br/>
<p><strong>TENANT(S):</strong></p>
${tenantSigs}`;
  }

  return `<h1>ADDENDUM #${addendumNumber} TO LEASE AGREEMENT</h1>

<div style="margin-bottom: 24px;">
  <p><strong>Date:</strong> ${context.date}</p>
  <p><strong>Property:</strong> ${context.propertyAddress}</p>
  <p><strong>Unit(s):</strong> ${context.unitNumbers}</p>
  <p><strong>Landlord:</strong> ${context.landlordName}</p>
  <p><strong>${tenantLabel}:</strong> ${tenantDisplay}</p>
</div>

<p>This Addendum modifies the Lease Agreement between the above parties for the above premises.
The following terms are hereby amended:</p>

<div style="margin: 24px 0; padding: 16px; border: 1px solid #ccc;">
  ${changesList}
</div>

<p>All other terms and conditions of the original Lease Agreement, and any prior addenda,
remain in full force and effect.</p>

<p>In the event of any conflict between this Addendum and the original Lease Agreement,
the terms of this Addendum shall control.</p>

${signatureBlock}`;
}

// ============================================================================
// CREATE ADDENDUM
// ============================================================================

/**
 * Finalize an addendum: diff drafts, generate document, add to published lease.
 * Denormalized field updates are deferred until the addendum is accepted.
 */
export async function createAddendum(
  llcId: string,
  publishedLeaseId: string,
  addendumDraftId: string,
  actorUserId: string
): Promise<{ addendum: LeaseAddendum; printableHtml: string }> {
  // 1. Fetch published lease
  const leaseDoc = await publishedLeasesCollection(llcId).doc(publishedLeaseId).get();
  if (!leaseDoc.exists) throw new Error('NOT_FOUND: Published lease not found');
  const lease = leaseDoc.data() as PublishedLease;

  // 2. Fetch addendum draft and verify linkage
  const draftDoc = await draftsCollection(llcId).doc(addendumDraftId).get();
  if (!draftDoc.exists) throw new Error('NOT_FOUND: Addendum draft not found');
  const addendumDraft = { id: draftDoc.id, ...draftDoc.data() } as LeaseBuilderDraft;

  if (addendumDraft.amendingPublishedLeaseId !== publishedLeaseId) {
    throw new Error('INVALID_INPUT: Draft is not linked to this published lease');
  }

  // 3. Fetch source draft
  const sourceDraftId = addendumDraft.clonedFromDraftId;
  if (!sourceDraftId) throw new Error('INVALID_INPUT: Draft has no source draft reference');

  const sourceDraftDoc = await draftsCollection(llcId).doc(sourceDraftId).get();
  if (!sourceDraftDoc.exists) throw new Error('NOT_FOUND: Source draft not found');
  const sourceDraft = { id: sourceDraftDoc.id, ...sourceDraftDoc.data() } as LeaseBuilderDraft;

  // 4. Compute diff
  const changes = diffDrafts(sourceDraft, addendumDraft, addendumDraft.leaseClass);
  if (changes.length === 0) {
    throw new Error('INVALID_INPUT: No changes detected between drafts');
  }

  // 5. Build context for HTML generation (use published lease as authoritative source)
  let propertyAddress = 'Unknown';
  let unitNumbers = '';
  const tenants: AddendumTenantInfo[] = [];
  let landlordName = '';
  let landlordSignerName = '';
  let landlordSignerTitle = '';

  if (lease.propertyId) {
    const propDoc = await adminDb
      .collection('llcs').doc(llcId)
      .collection('properties').doc(lease.propertyId)
      .get();
    const prop = propDoc.data();
    if (prop?.address) {
      propertyAddress = `${prop.address.street1}, ${prop.address.city}, ${prop.address.state} ${prop.address.zip}`;
    }
  }

  if (lease.unitIds?.length && lease.propertyId) {
    const unitDocs = await Promise.all(
      lease.unitIds.map(uid =>
        adminDb.collection('llcs').doc(llcId)
          .collection('properties').doc(lease.propertyId)
          .collection('units').doc(uid).get()
      )
    );
    unitNumbers = unitDocs
      .filter(d => d.exists)
      .map(d => d.data()?.unitNumber || '')
      .filter(Boolean)
      .join(', ') || 'N/A';
  }

  if (lease.tenantIds?.length) {
    const tenantDocs = await Promise.all(
      lease.tenantIds.map(tid =>
        adminDb.collection('tenants').doc(tid).get()
      )
    );
    for (const doc of tenantDocs) {
      if (!doc.exists) continue;
      const t = doc.data();
      if (t?.type === 'business') {
        tenants.push({
          name: t.businessName || 'Unknown',
          type: 'business',
          signerName: t.primaryContact?.name || '',
          signerTitle: t.primaryContact?.title || '',
        });
      } else {
        tenants.push({
          name: `${t?.firstName || ''} ${t?.lastName || ''}`.trim() || 'Unknown',
          type: 'individual',
        });
      }
    }
  }

  // Fetch LLC name and authorized signer
  const llcDoc = await adminDb.collection('llcs').doc(llcId).get();
  landlordName = llcDoc.data()?.legalName || 'Unknown LLC';

  if (lease.signerUserId) {
    const signer = await getMember(llcId, lease.signerUserId);
    if (signer) {
      landlordSignerName = signer.displayName || '';
      landlordSignerTitle = signer.role === 'admin' ? 'Managing Member' : 'Authorized Representative';
    }
  }

  // 6. Generate addendum HTML
  const addendumNumber = (lease.addenda?.length || 0) + 1;
  const now = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const htmlContent = generateAddendumHtml(addendumNumber, changes, {
    leaseClass: lease.leaseClass,
    propertyAddress,
    unitNumbers,
    tenants,
    landlordName,
    landlordSignerName,
    landlordSignerTitle,
    date: dateStr,
  });

  // 7. Save as LeasePackage
  const packageRef = packagesCollection(llcId).doc();
  const addendumPackage: Omit<LeasePackage, 'id'> = {
    leaseId: publishedLeaseId,
    draftId: addendumDraftId,
    llcId,
    leaseClass: addendumDraft.leaseClass,
    generatedAt: now,
    templateVersion: addendumDraft.templateVersion,
    documents: [{
      type: 'addendum',
      title: `Addendum #${addendumNumber}`,
      htmlContent,
      pageOrder: 1,
      requiredByLaw: false,
      triggeredBy: 'Lease amendment',
      clauseIds: [],
    }],
    inputs: addendumDraft,
    clausesIncluded: [],
    overlaysApplied: [],
    validationResults: [],
    createdByUserId: actorUserId,
  };
  const sanitizedPkg = JSON.parse(JSON.stringify(addendumPackage));

  // 8. Build addendum record (accepted: false — deferred until explicit acceptance)
  const addendum: LeaseAddendum = {
    id: `addendum_${Date.now()}`,
    addendumNumber,
    draftId: addendumDraftId,
    packageId: packageRef.id,
    changes,
    accepted: false,
    signedDocuments: [],
    createdAt: now,
    createdByUserId: actorUserId,
  };

  // 10. Batch write
  const batch = adminDb.batch();

  batch.set(packageRef, {
    ...sanitizedPkg,
    createdAt: FieldValue.serverTimestamp(),
  });

  batch.update(publishedLeasesCollection(llcId).doc(publishedLeaseId), {
    addenda: FieldValue.arrayUnion(JSON.parse(JSON.stringify(addendum))),
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.update(draftsCollection(llcId).doc(addendumDraftId), {
    status: 'completed',
    updatedAt: FieldValue.serverTimestamp(),
  });

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'lease_addendum',
    entityId: addendum.id,
    entityPath: `llcs/${llcId}/publishedLeases/${publishedLeaseId}/addenda/${addendum.id}`,
    changes: {
      after: {
        addendumNumber,
        changesCount: changes.length,
        changesSummary: changes.map(c => `${c.label}: ${c.oldValue} → ${c.newValue}`),
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const printableHtml = buildPrintableHtml([{
    type: 'addendum',
    title: `Addendum #${addendumNumber}`,
    htmlContent,
    pageOrder: 1,
    requiredByLaw: false,
    clauseIds: [],
  }]);

  return { addendum, printableHtml };
}

// ============================================================================
// EXTRACT DENORMALIZED VALUES FROM DRAFT (shared helper)
// ============================================================================

function extractDenormalizedFromDraft(draft: LeaseBuilderDraft): Record<string, unknown> {
  const isResidential = draft.leaseClass === 'residential';
  const denormalized: Record<string, unknown> = {};

  if (isResidential) {
    const rent = draft.residential?.rent;
    const deposit = draft.residential?.deposit;
    if (rent) {
      denormalized.monthlyRent = rent.monthlyRent;
      denormalized.dueDay = rent.dueDay;
      denormalized.startDate = rent.startDate;
      denormalized.endDate = rent.endDate;
      denormalized.gracePeriodDays = rent.gracePeriodDays;
      denormalized.lateFeeType = rent.lateFeeType;
      denormalized.lateFeeAmount = rent.lateFeeAmount;
      denormalized.lateFeeMaxAmount = rent.lateFeeMaxAmount;
    }
    if (deposit) {
      denormalized.depositAmount = deposit.securityDeposit;
    }
  } else {
    const financial = draft.commercial?.financial;
    const structure = draft.commercial?.leaseStructure;
    const deposit = draft.commercial?.deposit;
    if (financial) {
      denormalized.monthlyRent = financial.baseRentMonthly;
      denormalized.dueDay = financial.dueDay;
      denormalized.gracePeriodDays = financial.gracePeriodDays ?? 0;
      denormalized.lateFeeType = financial.lateFeeAmount && financial.lateFeeAmount > 0 ? 'flat' : 'none';
      denormalized.lateFeeAmount = financial.lateFeeAmount;
      denormalized.lateFeeMaxAmount = undefined;
    }
    if (structure) {
      denormalized.startDate = structure.startDate;
      denormalized.endDate = structure.endDate;
    }
    if (deposit) {
      denormalized.depositAmount = deposit.securityDeposit;
    }
  }

  return denormalized;
}

// ============================================================================
// ACCEPT ADDENDUM
// ============================================================================

/**
 * Accept a pending addendum — applies denormalized field updates to the published lease.
 */
export async function acceptAddendum(
  llcId: string,
  publishedLeaseId: string,
  addendumId: string,
  actorUserId: string
): Promise<void> {
  // 1. Fetch published lease
  const leaseDoc = await publishedLeasesCollection(llcId).doc(publishedLeaseId).get();
  if (!leaseDoc.exists) throw new Error('NOT_FOUND: Published lease not found');
  const lease = leaseDoc.data() as PublishedLease;

  // 2. Find the addendum
  const addenda = lease.addenda || [];
  const addendumIndex = addenda.findIndex(a => a.id === addendumId);
  if (addendumIndex === -1) throw new Error('NOT_FOUND: Addendum not found');

  const addendum = addenda[addendumIndex]!;
  if (addendum.accepted) throw new Error('INVALID_INPUT: Addendum is already accepted');

  // 3. Fetch the addendum's draft to extract denormalized values
  const draftDoc = await draftsCollection(llcId).doc(addendum.draftId).get();
  if (!draftDoc.exists) throw new Error('NOT_FOUND: Addendum draft not found');
  const addendumDraft = draftDoc.data() as LeaseBuilderDraft;

  // 4. Extract denormalized values
  const denormalized = extractDenormalizedFromDraft(addendumDraft);

  // 5. Update the addendum entry in the array
  const now = new Date().toISOString();
  const updatedAddenda = [...addenda];
  updatedAddenda[addendumIndex] = {
    ...addendum,
    accepted: true,
    acceptedAt: now,
    acceptedByUserId: actorUserId,
  };

  // 6. Batch write
  const batch = adminDb.batch();
  const leaseRef = publishedLeasesCollection(llcId).doc(publishedLeaseId);

  const leaseUpdate: Record<string, unknown> = {
    addenda: JSON.parse(JSON.stringify(updatedAddenda)),
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const [key, val] of Object.entries(denormalized)) {
    if (val !== undefined) {
      leaseUpdate[key] = val;
    }
  }
  batch.update(leaseRef, leaseUpdate);

  // Audit log
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'lease_addendum',
    entityId: addendumId,
    entityPath: `llcs/${llcId}/publishedLeases/${publishedLeaseId}/addenda/${addendumId}`,
    changes: {
      after: {
        accepted: true,
        acceptedAt: now,
        denormalizedUpdates: Object.keys(denormalized),
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

// ============================================================================
// DELETE ADDENDUM
// ============================================================================

/**
 * Delete a pending (unaccepted) addendum from a published lease.
 * Marks the amendment draft as abandoned.
 */
export async function deleteAddendum(
  llcId: string,
  publishedLeaseId: string,
  addendumId: string,
  actorUserId: string
): Promise<void> {
  // 1. Fetch published lease
  const leaseDoc = await publishedLeasesCollection(llcId).doc(publishedLeaseId).get();
  if (!leaseDoc.exists) throw new Error('NOT_FOUND: Published lease not found');
  const lease = leaseDoc.data() as PublishedLease;

  // 2. Find the addendum
  const addenda = lease.addenda || [];
  const addendum = addenda.find(a => a.id === addendumId);
  if (!addendum) throw new Error('NOT_FOUND: Addendum not found');

  // 3. Cannot delete accepted addenda
  if (addendum.accepted) {
    throw new Error('INVALID_INPUT: Cannot delete an accepted addendum');
  }

  // 4. Remove from addenda array
  const updatedAddenda = addenda.filter(a => a.id !== addendumId);

  // 5. Batch write
  const batch = adminDb.batch();
  const leaseRef = publishedLeasesCollection(llcId).doc(publishedLeaseId);

  batch.update(leaseRef, {
    addenda: JSON.parse(JSON.stringify(updatedAddenda)),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Mark amendment draft as abandoned
  batch.update(draftsCollection(llcId).doc(addendum.draftId), {
    status: 'abandoned',
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Audit log
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'lease_addendum',
    entityId: addendumId,
    entityPath: `llcs/${llcId}/publishedLeases/${publishedLeaseId}/addenda/${addendumId}`,
    changes: {
      before: {
        addendumNumber: addendum.addendumNumber,
        changesCount: addendum.changes.length,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
