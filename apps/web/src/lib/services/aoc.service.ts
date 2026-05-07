import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  AssignmentOfClaim,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AocStatus,
  AOC_STATUS_TRANSITIONS,
} from '@shared/types';

/**
 * Create an Assignment of Claim.
 * Firestore path: llcs/{llcId}/assignments/{assignmentId}
 */
export async function createAoc(
  llcId: string,
  input: CreateAssignmentInput,
  actorUserId: string
): Promise<AssignmentOfClaim> {
  // Fetch LLC to denormalize llcName and llcAddress
  const llcDoc = await adminDb.collection('llcs').doc(llcId).get();
  const llcData = llcDoc.data() ?? {};
  const llcName: string = llcData.legalName ?? llcData.name ?? llcId;
  const llcAddress: string | undefined = llcData.address ?? undefined;
  const llcPhone: string | undefined = llcData.phone ?? llcData.phoneNumber ?? undefined;
  const llcEmail: string | undefined = llcData.email ?? undefined;

  const aocRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('assignments')
    .doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const aocData = {
    llcId,
    llcName,
    ...(llcAddress && { llcAddress }),
    ...(llcPhone && { llcPhone }),
    ...(llcEmail && { llcEmail }),
    claimType: input.claimType,
    claimDescription: input.claimDescription,
    ...(input.claimValueCents !== undefined && { claimValueCents: input.claimValueCents }),
    ...(input.tenantId && { tenantId: input.tenantId }),
    ...(input.tenantName && { tenantName: input.tenantName }),
    ...(input.tenantAddress && { tenantAddress: input.tenantAddress }),
    ...(input.tenantPhone && { tenantPhone: input.tenantPhone }),
    ...(input.tenantEmail && { tenantEmail: input.tenantEmail }),
    ...(input.propertyAddress && { propertyAddress: input.propertyAddress }),
    ...(input.insuranceClaimId && { insuranceClaimId: input.insuranceClaimId }),
    ...(input.insuranceClaimNumber && { insuranceClaimNumber: input.insuranceClaimNumber }),
    ...(input.insurer && { insurer: input.insurer }),
    assignee: input.assignee,
    considerationCents: input.considerationCents,
    effectiveDate: input.effectiveDate,
    ...(input.expirationDate && { expirationDate: input.expirationDate }),
    warrantsGoodTitle: input.warrantsGoodTitle,
    ...(input.specialConditions && { specialConditions: input.specialConditions }),
    ...(input.requiresNotarization && { requiresNotarization: input.requiresNotarization }),
    ...(input.exhibits && input.exhibits.length > 0 && { exhibits: input.exhibits }),
    ...(input.assignorSignatoryName && { assignorSignatoryName: input.assignorSignatoryName }),
    ...(input.assignorTitle && { assignorTitle: input.assignorTitle }),
    ...(input.assigneeSignatoryName && { assigneeSignatoryName: input.assigneeSignatoryName }),
    ...(input.assigneeTitle && { assigneeTitle: input.assigneeTitle }),
    ...(input.caseId && { caseId: input.caseId }),
    ...(input.obligors && input.obligors.length > 0 && { obligors: input.obligors }),
    status: 'draft' as AocStatus,
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(aocRef, aocData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'assignment_of_claim',
    entityId: aocRef.id,
    entityPath: `llcs/${llcId}/assignments/${aocRef.id}`,
    changes: { after: { claimType: input.claimType, effectiveDate: input.effectiveDate } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: aocRef.id,
    ...aocData,
    createdAt: new Date().toISOString() as unknown as AssignmentOfClaim['createdAt'],
  } as AssignmentOfClaim;
}

/**
 * Get a single Assignment of Claim by ID.
 */
export async function getAoc(
  llcId: string,
  assignmentId: string
): Promise<AssignmentOfClaim | null> {
  const doc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('assignments')
    .doc(assignmentId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as AssignmentOfClaim;
}

/**
 * List Assignments of Claim for an LLC, optionally filtered.
 */
export async function listAocs(
  llcId: string,
  options?: { status?: string; claimType?: string; caseId?: string }
): Promise<AssignmentOfClaim[]> {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('assignments')
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

  if (options?.caseId) {
    query = query.where('caseId', '==', options.caseId);
  } else if (options?.status) {
    query = query.where('status', '==', options.status);
  }
  if (!options?.caseId && options?.claimType) {
    query = query.where('claimType', '==', options.claimType);
  }

  const snapshot = await query.limit(200).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AssignmentOfClaim);
}

/**
 * Update an Assignment of Claim.
 * Validates status transitions when status changes.
 */
export async function updateAoc(
  llcId: string,
  assignmentId: string,
  input: UpdateAssignmentInput,
  actorUserId: string
): Promise<AssignmentOfClaim> {
  const aocRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('assignments')
    .doc(assignmentId);

  const snap = await aocRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Assignment not found');

  const current = snap.data() as AssignmentOfClaim;

  // Validate status transition
  if (input.status && input.status !== current.status) {
    const allowed = AOC_STATUS_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new Error(
        `INVALID_TRANSITION: Cannot transition from '${current.status}' to '${input.status}'. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const updates = {
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.update(aocRef, updates);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'assignment_of_claim',
    entityId: assignmentId,
    entityPath: `llcs/${llcId}/assignments/${assignmentId}`,
    changes: { after: input },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await aocRef.get();
  return { id: updated.id, ...updated.data() } as AssignmentOfClaim;
}

/**
 * Delete an Assignment of Claim (only draft status allowed).
 */
export async function deleteAoc(
  llcId: string,
  assignmentId: string,
  actorUserId: string
): Promise<void> {
  const aocRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('assignments')
    .doc(assignmentId);

  const snap = await aocRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Assignment not found');

  const data = snap.data() as AssignmentOfClaim;
  if (data.status !== 'draft') {
    throw new Error('CANNOT_DELETE: Only draft assignments may be deleted');
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.delete(aocRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'assignment_of_claim',
    entityId: assignmentId,
    entityPath: `llcs/${llcId}/assignments/${assignmentId}`,
    changes: { before: { claimType: data.claimType, effectiveDate: data.effectiveDate } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
