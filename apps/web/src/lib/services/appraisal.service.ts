import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  AppraisalProcess,
  AppraisalEstimate,
  CreateAppraisalProcessInput,
  UpdateAppraisalProcessInput,
  CreateAppraisalEstimateInput,
  UpdateAppraisalEstimateInput,
} from '@shared/types';

// ============================================================
// APPRAISAL PROCESS
// ============================================================

/**
 * Initiate an appraisal process on a claim.
 * Stored at: llcs/{llcId}/insuranceClaims/{claimId}/appraisalProcesses/{processId}
 */
export async function createAppraisalProcess(
  llcId: string,
  claimId: string,
  input: CreateAppraisalProcessInput,
  actorUserId: string
): Promise<AppraisalProcess> {
  const processRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc();

  const claimRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId);

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const processData = {
    claimId,
    llcId,
    status: 'demanded',
    demandDate: input.demandDate,
    demandedBy: input.demandedBy,
    panel: { status: 'forming' },
    disputedItems: [],
    courtActions: [],
    ...(input.notes && { notes: input.notes }),
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(processRef, processData);
  // Link claim to this appraisal process
  batch.update(claimRef, {
    appraisalProcessId: processRef.id,
    disputeType: 'appraisal',
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'appraisal_process',
    entityId: processRef.id,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/appraisalProcesses/${processRef.id}`,
    changes: { after: { demandDate: input.demandDate, demandedBy: input.demandedBy } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: processRef.id,
    ...processData,
    panel: { status: 'forming' },
    createdAt: new Date().toISOString() as unknown as AppraisalProcess['createdAt'],
  } as AppraisalProcess;
}

/**
 * Get an appraisal process by ID.
 */
export async function getAppraisalProcess(
  llcId: string,
  claimId: string,
  processId: string
): Promise<AppraisalProcess | null> {
  const doc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as AppraisalProcess;
}

/**
 * Get the active appraisal process for a claim (there is typically only one).
 */
export async function getAppraisalProcessForClaim(
  llcId: string,
  claimId: string
): Promise<AppraisalProcess | null> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  if (!doc) return null;
  return { id: doc.id, ...doc.data() } as AppraisalProcess;
}

/**
 * Update an appraisal process (status, panel members, disputed items, award, court actions).
 */
export async function updateAppraisalProcess(
  llcId: string,
  claimId: string,
  processId: string,
  input: UpdateAppraisalProcessInput,
  actorUserId: string
): Promise<AppraisalProcess> {
  const processRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId);

  const snap = await processRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Appraisal process not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  // Merge panel partial update with existing panel data
  let updates: Record<string, unknown> = { ...input, updatedAt: FieldValue.serverTimestamp() };
  if (input.panel) {
    const existingPanel = snap.data()?.panel ?? { status: 'forming' };
    updates = {
      ...updates,
      panel: { ...existingPanel, ...input.panel },
    };
  }

  const batch = adminDb.batch();
  batch.update(processRef, updates);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'appraisal_process',
    entityId: processId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/appraisalProcesses/${processId}`,
    changes: { after: { status: input.status } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await processRef.get();
  return { id: updated.id, ...updated.data() } as AppraisalProcess;
}

// ============================================================
// APPRAISAL ESTIMATES
// ============================================================

/**
 * Create an appraisal estimate (one per side).
 */
export async function createAppraisalEstimate(
  llcId: string,
  claimId: string,
  processId: string,
  input: CreateAppraisalEstimateInput,
  actorUserId: string
): Promise<AppraisalEstimate> {
  const estimateRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId)
    .collection('estimates')
    .doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const estimateData = {
    appraisalProcessId: processId,
    claimId,
    llcId,
    preparedBySide: input.preparedBySide,
    ...(input.appraiserId && { appraiserId: input.appraiserId }),
    ...(input.date && { date: input.date }),
    ...(input.replacementCostValue !== undefined && { replacementCostValue: input.replacementCostValue }),
    ...(input.actualCashValue !== undefined && { actualCashValue: input.actualCashValue }),
    ...(input.depreciation !== undefined && { depreciation: input.depreciation }),
    scopeItems: input.scopeItems ?? [],
    status: input.status ?? 'draft',
    ...(input.notes && { notes: input.notes }),
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(estimateRef, estimateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'appraisal_estimate',
    entityId: estimateRef.id,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/appraisalProcesses/${processId}/estimates/${estimateRef.id}`,
    changes: { after: { preparedBySide: input.preparedBySide } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: estimateRef.id,
    ...estimateData,
    createdAt: new Date().toISOString() as unknown as AppraisalEstimate['createdAt'],
  } as AppraisalEstimate;
}

/**
 * List all estimates for an appraisal process.
 */
export async function listAppraisalEstimates(
  llcId: string,
  claimId: string,
  processId: string
): Promise<AppraisalEstimate[]> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId)
    .collection('estimates')
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AppraisalEstimate);
}

/**
 * Get a single estimate by ID.
 */
export async function getAppraisalEstimate(
  llcId: string,
  claimId: string,
  processId: string,
  estimateId: string
): Promise<AppraisalEstimate | null> {
  const doc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId)
    .collection('estimates')
    .doc(estimateId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as AppraisalEstimate;
}

/**
 * Update an appraisal estimate.
 */
export async function updateAppraisalEstimate(
  llcId: string,
  claimId: string,
  processId: string,
  estimateId: string,
  input: UpdateAppraisalEstimateInput,
  actorUserId: string
): Promise<AppraisalEstimate> {
  const estimateRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId)
    .collection('estimates')
    .doc(estimateId);

  const snap = await estimateRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Estimate not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.update(estimateRef, { ...input, updatedAt: FieldValue.serverTimestamp() });
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'appraisal_estimate',
    entityId: estimateId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/appraisalProcesses/${processId}/estimates/${estimateId}`,
    changes: { after: { status: input.status } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await estimateRef.get();
  return { id: updated.id, ...updated.data() } as AppraisalEstimate;
}

/**
 * Delete an appraisal estimate.
 */
export async function deleteAppraisalEstimate(
  llcId: string,
  claimId: string,
  processId: string,
  estimateId: string,
  actorUserId: string
): Promise<void> {
  const estimateRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('appraisalProcesses')
    .doc(processId)
    .collection('estimates')
    .doc(estimateId);

  const snap = await estimateRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Estimate not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.delete(estimateRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'appraisal_estimate',
    entityId: estimateId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/appraisalProcesses/${processId}/estimates/${estimateId}`,
    changes: { before: { preparedBySide: snap.data()?.preparedBySide } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
