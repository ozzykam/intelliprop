import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ClaimTask, CreateClaimTaskInput, UpdateClaimTaskInput } from '@shared/types';

function taskRef(llcId: string, claimId: string, taskId?: string) {
  const col = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('tasks');
  return taskId ? col.doc(taskId) : col.doc();
}

function auditRef(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
}

export async function createClaimTask(
  llcId: string,
  claimId: string,
  input: CreateClaimTaskInput,
  actorUserId: string
): Promise<ClaimTask> {
  const ref = taskRef(llcId, claimId);

  const data = {
    llcId,
    claimId,
    title: input.title,
    ...(input.notes && { notes: input.notes }),
    ...(input.dueDate && { dueDate: input.dueDate }),
    completed: false,
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(ref, data);
  batch.set(auditRef(llcId), {
    actorUserId,
    action: 'create',
    entityType: 'claim_task',
    entityId: ref.id,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/tasks/${ref.id}`,
    changes: { after: { title: input.title } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: ref.id,
    ...data,
    createdAt: new Date().toISOString(),
  } as unknown as ClaimTask;
}

export async function listClaimTasks(llcId: string, claimId: string): Promise<ClaimTask[]> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('tasks')
    .orderBy('createdAt', 'asc')
    .limit(200)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClaimTask);
}

export async function getClaimTask(
  llcId: string,
  claimId: string,
  taskId: string
): Promise<ClaimTask | null> {
  const doc = await taskRef(llcId, claimId, taskId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ClaimTask;
}

export async function updateClaimTask(
  llcId: string,
  claimId: string,
  taskId: string,
  input: UpdateClaimTaskInput,
  actorUserId: string
): Promise<ClaimTask> {
  const ref = taskRef(llcId, claimId, taskId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Task not found');

  const current = snap.data()!;

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.completed === true && current.completed !== true) {
    updates.completedAt = FieldValue.serverTimestamp();
    updates.completedByUserId = actorUserId;
  } else if (input.completed === false) {
    updates.completedAt = FieldValue.delete();
    updates.completedByUserId = FieldValue.delete();
  }

  const batch = adminDb.batch();
  batch.update(ref, updates);
  batch.set(auditRef(llcId), {
    actorUserId,
    action: 'update',
    entityType: 'claim_task',
    entityId: taskId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/tasks/${taskId}`,
    changes: { after: input },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() } as ClaimTask;
}

export async function deleteClaimTask(
  llcId: string,
  claimId: string,
  taskId: string,
  actorUserId: string
): Promise<void> {
  const ref = taskRef(llcId, claimId, taskId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Task not found');

  const batch = adminDb.batch();
  batch.delete(ref);
  batch.set(auditRef(llcId), {
    actorUserId,
    action: 'delete',
    entityType: 'claim_task',
    entityId: taskId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/tasks/${taskId}`,
    changes: { before: { title: snap.data()?.title } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
