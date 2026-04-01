import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  InsurancePolicy,
  InsuranceClaim,
  CreateInsurancePolicyInput,
  UpdateInsurancePolicyInput,
  CreateInsuranceClaimInput,
  UpdateInsuranceClaimInput,
} from '@shared/types';

// ============================================================
// INSURANCE POLICIES
// ============================================================

/**
 * Create an insurance policy.
 */
export async function createInsurancePolicy(
  llcId: string,
  input: CreateInsurancePolicyInput,
  actorUserId: string
): Promise<InsurancePolicy> {
  const policyRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insurancePolicies')
    .doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const policyData = {
    llcId,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    ...(input.propertyId && { propertyId: input.propertyId }),
    ...(input.propertyName && { propertyName: input.propertyName }),
    ...(input.unitId && { unitId: input.unitId }),
    ...(input.unitLabel && { unitLabel: input.unitLabel }),
    policyType: input.policyType,
    status: input.status ?? 'active',
    carrier: input.carrier,
    policyNumber: input.policyNumber,
    effectiveDate: input.effectiveDate,
    expirationDate: input.expirationDate,
    ...(input.coverageAmount !== undefined && { coverageAmount: input.coverageAmount }),
    ...(input.deductible !== undefined && { deductible: input.deductible }),
    ...(input.premium !== undefined && { premium: input.premium }),
    ...(input.premiumFrequency && { premiumFrequency: input.premiumFrequency }),
    ...(input.agentName && { agentName: input.agentName }),
    ...(input.agentPhone && { agentPhone: input.agentPhone }),
    ...(input.agentEmail && { agentEmail: input.agentEmail }),
    ...(input.notes && { notes: input.notes }),
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(policyRef, policyData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'insurance_policy',
    entityId: policyRef.id,
    entityPath: `llcs/${llcId}/insurancePolicies/${policyRef.id}`,
    changes: { after: { carrier: input.carrier, policyNumber: input.policyNumber } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: policyRef.id,
    ...policyData,
    createdAt: new Date().toISOString() as unknown as InsurancePolicy['createdAt'],
  } as InsurancePolicy;
}

/**
 * Get a single insurance policy by ID.
 */
export async function getInsurancePolicy(
  llcId: string,
  policyId: string
): Promise<InsurancePolicy | null> {
  const doc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insurancePolicies')
    .doc(policyId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as InsurancePolicy;
}

/**
 * List all insurance policies for an LLC.
 * Optionally filter by entityType or entityId.
 */
export async function listInsurancePolicies(
  llcId: string,
  options?: { entityType?: 'property' | 'tenant'; entityId?: string; propertyId?: string }
): Promise<InsurancePolicy[]> {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insurancePolicies')
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

  if (options?.entityType) {
    query = query.where('entityType', '==', options.entityType);
  }
  if (options?.entityId) {
    query = query.where('entityId', '==', options.entityId);
  }
  if (options?.propertyId) {
    query = query.where('propertyId', '==', options.propertyId);
  }

  const snapshot = await query.limit(200).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as InsurancePolicy);
}

/**
 * Update an insurance policy.
 */
export async function updateInsurancePolicy(
  llcId: string,
  policyId: string,
  input: UpdateInsurancePolicyInput,
  actorUserId: string
): Promise<InsurancePolicy> {
  const policyRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insurancePolicies')
    .doc(policyId);

  const snap = await policyRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Policy not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const updates = {
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.update(policyRef, updates);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'insurance_policy',
    entityId: policyId,
    entityPath: `llcs/${llcId}/insurancePolicies/${policyId}`,
    changes: { after: input },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await policyRef.get();
  return { id: updated.id, ...updated.data() } as InsurancePolicy;
}

/**
 * Delete an insurance policy.
 */
export async function deleteInsurancePolicy(
  llcId: string,
  policyId: string,
  actorUserId: string
): Promise<void> {
  const policyRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insurancePolicies')
    .doc(policyId);

  const snap = await policyRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Policy not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.delete(policyRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'insurance_policy',
    entityId: policyId,
    entityPath: `llcs/${llcId}/insurancePolicies/${policyId}`,
    changes: { before: { policyNumber: snap.data()?.policyNumber } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

// ============================================================
// INSURANCE CLAIMS
// ============================================================

/**
 * Create an insurance claim.
 */
export async function createInsuranceClaim(
  llcId: string,
  input: CreateInsuranceClaimInput,
  actorUserId: string
): Promise<InsuranceClaim> {
  const claimRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const claimData = {
    llcId,
    ...(input.policyId && { policyId: input.policyId }),
    ...(input.policyNumber && { policyNumber: input.policyNumber }),
    ...(input.carrier && { carrier: input.carrier }),
    ...(input.entityType && { entityType: input.entityType }),
    ...(input.entityId && { entityId: input.entityId }),
    entityName: input.entityName,
    ...(input.propertyId && { propertyId: input.propertyId }),
    ...(input.propertyName && { propertyName: input.propertyName }),
    ...(input.unitId && { unitId: input.unitId }),
    ...(input.unitLabel && { unitLabel: input.unitLabel }),
    ...(input.claimNumber && { claimNumber: input.claimNumber }),
    ...(input.insuredName && { insuredName: input.insuredName }),
    ...(input.insuredPhone && { insuredPhone: input.insuredPhone }),
    ...(input.insuredEmail && { insuredEmail: input.insuredEmail }),
    ...(input.disputeType && { disputeType: input.disputeType }),
    ...(input.causeOfLoss && { causeOfLoss: input.causeOfLoss }),
    dateOfLoss: input.dateOfLoss,
    ...(input.dateFiled && { dateFiled: input.dateFiled }),
    description: input.description,
    status: input.status ?? 'open',
    ...(input.reportedAmount !== undefined && { reportedAmount: input.reportedAmount }),
    ...(input.offeredAmount !== undefined && { offeredAmount: input.offeredAmount }),
    ...(input.settledAmount !== undefined && { settledAmount: input.settledAmount }),
    ...(input.replacementCostValue !== undefined && { replacementCostValue: input.replacementCostValue }),
    ...(input.actualCashValue !== undefined && { actualCashValue: input.actualCashValue }),
    ...(input.depreciation !== undefined && { depreciation: input.depreciation }),
    adjusters: input.adjusters ?? [],
    experts: input.experts ?? [],
    attorneys: input.attorneys ?? [],
    ...(input.notes && { notes: input.notes }),
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(claimRef, claimData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'insurance_claim',
    entityId: claimRef.id,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimRef.id}`,
    changes: { after: { ...(input.policyId && { policyId: input.policyId }), dateOfLoss: input.dateOfLoss } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: claimRef.id,
    ...claimData,
    createdAt: new Date().toISOString() as unknown as InsuranceClaim['createdAt'],
  } as InsuranceClaim;
}

/**
 * Get a single insurance claim by ID.
 */
export async function getInsuranceClaim(
  llcId: string,
  claimId: string
): Promise<InsuranceClaim | null> {
  const doc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as InsuranceClaim;
}

/**
 * List all claims for an LLC, optionally filtered by policyId or entityId.
 */
export async function listInsuranceClaims(
  llcId: string,
  options?: { policyId?: string; entityId?: string; status?: string }
): Promise<InsuranceClaim[]> {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

  if (options?.policyId) {
    query = query.where('policyId', '==', options.policyId);
  }
  if (options?.entityId) {
    query = query.where('entityId', '==', options.entityId);
  }
  if (options?.status) {
    query = query.where('status', '==', options.status);
  }

  const snapshot = await query.limit(200).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as InsuranceClaim);
}

/**
 * Update an insurance claim.
 */
export async function updateInsuranceClaim(
  llcId: string,
  claimId: string,
  input: UpdateInsuranceClaimInput,
  actorUserId: string
): Promise<InsuranceClaim> {
  const claimRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId);

  const snap = await claimRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Claim not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const updates = {
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.update(claimRef, updates);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'insurance_claim',
    entityId: claimId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}`,
    changes: { after: input },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await claimRef.get();
  return { id: updated.id, ...updated.data() } as InsuranceClaim;
}

/**
 * Delete an insurance claim.
 */
export async function deleteInsuranceClaim(
  llcId: string,
  claimId: string,
  actorUserId: string
): Promise<void> {
  const claimRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId);

  const snap = await claimRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Claim not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.delete(claimRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'insurance_claim',
    entityId: claimId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}`,
    changes: { before: { claimNumber: snap.data()?.claimNumber, policyId: snap.data()?.policyId } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
