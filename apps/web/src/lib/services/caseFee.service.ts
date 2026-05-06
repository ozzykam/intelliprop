import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { LegalFeeType, LegalFeeStatus } from '@shared/types';

export interface CreateCaseFeeInput {
  feeType: LegalFeeType;
  description: string;
  amountCents: number;
  date: string;
  paidDate?: string;
  status?: LegalFeeStatus;
  invoiceNumber?: string;
  notes?: string;
}

export interface UpdateCaseFeeInput {
  feeType?: LegalFeeType;
  description?: string;
  amountCents?: number;
  date?: string;
  paidDate?: string;
  status?: LegalFeeStatus;
  invoiceNumber?: string;
  notes?: string;
}

export interface CaseFeeRecord {
  id: string;
  caseId: string;
  llcId: string;
  feeType: LegalFeeType;
  description: string;
  amountCents: number;
  date: string;
  paidDate?: string;
  status: LegalFeeStatus;
  invoiceNumber?: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

function docToRecord(doc: FirebaseFirestore.DocumentSnapshot, llcId: string, caseId: string): CaseFeeRecord {
  const d = doc.data()!;
  return {
    id: doc.id,
    caseId,
    llcId,
    feeType: d.feeType as LegalFeeType,
    description: d.description,
    amountCents: d.amountCents,
    date: d.date,
    paidDate: d.paidDate || undefined,
    status: (d.status || 'pending') as LegalFeeStatus,
    invoiceNumber: d.invoiceNumber || undefined,
    notes: d.notes || undefined,
    createdByUserId: d.createdByUserId,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() || undefined,
  };
}

function feesCollection(llcId: string, caseId: string) {
  return adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('fees');
}

/**
 * Create a legal fee record within a case.
 */
export async function createCaseFee(
  llcId: string,
  caseId: string,
  input: CreateCaseFeeInput,
  actorUserId: string
): Promise<CaseFeeRecord> {
  const feeRef = feesCollection(llcId, caseId).doc();
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const feeData = {
    caseId,
    llcId,
    feeType: input.feeType,
    description: input.description,
    amountCents: input.amountCents,
    date: input.date,
    paidDate: input.paidDate || null,
    status: input.status || 'pending',
    invoiceNumber: input.invoiceNumber || null,
    notes: input.notes || null,
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(feeRef, feeData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'case_fee',
    entityId: feeRef.id,
    entityPath: `llcs/${llcId}/cases/${caseId}/fees/${feeRef.id}`,
    changes: { after: { feeType: input.feeType, amountCents: input.amountCents, description: input.description } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: feeRef.id,
    caseId,
    llcId,
    feeType: input.feeType,
    description: input.description,
    amountCents: input.amountCents,
    date: input.date,
    paidDate: input.paidDate,
    status: input.status || 'pending',
    invoiceNumber: input.invoiceNumber,
    notes: input.notes,
    createdByUserId: actorUserId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * List all fees for a case (ordered by date descending).
 */
export async function listCaseFees(llcId: string, caseId: string): Promise<CaseFeeRecord[]> {
  const snap = await feesCollection(llcId, caseId)
    .orderBy('date', 'desc')
    .get();

  return snap.docs.map((doc) => docToRecord(doc, llcId, caseId));
}

/**
 * Get a single fee record.
 */
export async function getCaseFee(
  llcId: string,
  caseId: string,
  feeId: string
): Promise<CaseFeeRecord | null> {
  const doc = await feesCollection(llcId, caseId).doc(feeId).get();
  if (!doc.exists) return null;
  return docToRecord(doc, llcId, caseId);
}

/**
 * Update a fee record.
 */
export async function updateCaseFee(
  llcId: string,
  caseId: string,
  feeId: string,
  input: UpdateCaseFeeInput,
  actorUserId: string
): Promise<CaseFeeRecord> {
  const feeRef = feesCollection(llcId, caseId).doc(feeId);
  const feeDoc = await feeRef.get();

  if (!feeDoc.exists) {
    throw new Error('NOT_FOUND: Fee not found');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.feeType !== undefined) updateData.feeType = input.feeType;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amountCents !== undefined) updateData.amountCents = input.amountCents;
  if (input.date !== undefined) updateData.date = input.date;
  if (input.paidDate !== undefined) updateData.paidDate = input.paidDate;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.invoiceNumber !== undefined) updateData.invoiceNumber = input.invoiceNumber;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.update(feeRef, updateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'case_fee',
    entityId: feeId,
    entityPath: `llcs/${llcId}/cases/${caseId}/fees/${feeId}`,
    changes: {
      before: { feeType: feeDoc.data()?.feeType, amountCents: feeDoc.data()?.amountCents },
      after: updateData,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await getCaseFee(llcId, caseId, feeId);
  if (!updated) throw new Error('INTERNAL_ERROR: Failed to read updated fee');
  return updated;
}

/**
 * Delete a fee record.
 */
export async function deleteCaseFee(
  llcId: string,
  caseId: string,
  feeId: string,
  actorUserId: string
): Promise<void> {
  const feeRef = feesCollection(llcId, caseId).doc(feeId);
  const feeDoc = await feeRef.get();

  if (!feeDoc.exists) {
    throw new Error('NOT_FOUND: Fee not found');
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.delete(feeRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'case_fee',
    entityId: feeId,
    entityPath: `llcs/${llcId}/cases/${caseId}/fees/${feeId}`,
    changes: {
      before: { feeType: feeDoc.data()?.feeType, amountCents: feeDoc.data()?.amountCents },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
