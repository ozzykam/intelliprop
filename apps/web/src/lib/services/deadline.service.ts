import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type CourtDeadlineStatus = 'pending' | 'met' | 'missed';

export interface CreateDeadlineInput {
  description: string;
  dueDate: string;
  reminderDate?: string;
  issuedDate?: string;
  issuedBy?: string;
  courtDateId?: string;
  status?: CourtDeadlineStatus;
  notes?: string;
}

export interface UpdateDeadlineInput {
  description?: string;
  dueDate?: string;
  reminderDate?: string;
  issuedDate?: string;
  issuedBy?: string;
  courtDateId?: string;
  status?: CourtDeadlineStatus;
  notes?: string;
}

export interface DeadlineRecord {
  id: string;
  caseId: string;
  llcId: string;
  description: string;
  dueDate: string;
  reminderDate?: string;
  issuedDate?: string;
  issuedBy?: string;
  courtDateId?: string;
  status: CourtDeadlineStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdByUserId: string;
}

function deadlinesRef(llcId: string, caseId: string) {
  return adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('deadlines');
}

/**
 * List deadlines for a case, ordered by dueDate ASC.
 */
export async function listDeadlines(llcId: string, caseId: string): Promise<DeadlineRecord[]> {
  const snap = await deadlinesRef(llcId, caseId).orderBy('dueDate', 'asc').get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      caseId,
      llcId,
      description: d.description,
      dueDate: d.dueDate,
      reminderDate: d.reminderDate || undefined,
      issuedDate: d.issuedDate || undefined,
      issuedBy: d.issuedBy || undefined,
      courtDateId: d.courtDateId || undefined,
      status: d.status as CourtDeadlineStatus,
      notes: d.notes || undefined,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() || undefined,
      createdByUserId: d.createdByUserId,
    };
  });
}

/**
 * Create a deadline within a case.
 */
export async function createDeadline(
  llcId: string,
  caseId: string,
  input: CreateDeadlineInput,
  actorUserId: string
): Promise<DeadlineRecord> {
  const ref = deadlinesRef(llcId, caseId).doc();
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const data = {
    caseId,
    llcId,
    description: input.description,
    dueDate: input.dueDate,
    reminderDate: input.reminderDate || null,
    issuedDate: input.issuedDate || null,
    issuedBy: input.issuedBy || null,
    courtDateId: input.courtDateId || null,
    status: input.status || 'pending',
    notes: input.notes || null,
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(ref, data);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'court_deadline',
    entityId: ref.id,
    entityPath: `llcs/${llcId}/cases/${caseId}/deadlines/${ref.id}`,
    changes: { after: { description: input.description, dueDate: input.dueDate } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: ref.id,
    caseId,
    llcId,
    description: input.description,
    dueDate: input.dueDate,
    reminderDate: input.reminderDate || undefined,
    issuedDate: input.issuedDate,
    issuedBy: input.issuedBy,
    courtDateId: input.courtDateId,
    status: (input.status || 'pending') as CourtDeadlineStatus,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    createdByUserId: actorUserId,
  };
}

/**
 * Update a deadline.
 */
export async function updateDeadline(
  llcId: string,
  caseId: string,
  deadlineId: string,
  input: UpdateDeadlineInput,
  actorUserId: string
): Promise<DeadlineRecord> {
  const ref = deadlinesRef(llcId, caseId).doc(deadlineId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Deadline not found');

  const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (input.description !== undefined) updateData.description = input.description;
  if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
  if (input.reminderDate !== undefined) updateData.reminderDate = input.reminderDate;
  if (input.issuedDate !== undefined) updateData.issuedDate = input.issuedDate;
  if (input.issuedBy !== undefined) updateData.issuedBy = input.issuedBy;
  if (input.courtDateId !== undefined) updateData.courtDateId = input.courtDateId;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();
  batch.update(ref, updateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'court_deadline',
    entityId: deadlineId,
    entityPath: `llcs/${llcId}/cases/${caseId}/deadlines/${deadlineId}`,
    changes: { after: updateData },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await ref.get();
  const d = updated.data()!;
  return {
    id: deadlineId,
    caseId,
    llcId,
    description: d.description,
    dueDate: d.dueDate,
    reminderDate: d.reminderDate || undefined,
    issuedDate: d.issuedDate || undefined,
    issuedBy: d.issuedBy || undefined,
    courtDateId: d.courtDateId || undefined,
    status: d.status as CourtDeadlineStatus,
    notes: d.notes || undefined,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() || undefined,
    createdByUserId: d.createdByUserId,
  };
}

/**
 * Delete a deadline.
 */
export async function deleteDeadline(
  llcId: string,
  caseId: string,
  deadlineId: string,
  actorUserId: string
): Promise<void> {
  const ref = deadlinesRef(llcId, caseId).doc(deadlineId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Deadline not found');

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();
  batch.delete(ref);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'court_deadline',
    entityId: deadlineId,
    entityPath: `llcs/${llcId}/cases/${caseId}/deadlines/${deadlineId}`,
    changes: { before: { description: snap.data()?.description } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
