import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ClaimActivity, CreateClaimActivityInput, UpdateClaimActivityInput } from '@shared/types';

function activityRef(llcId: string, claimId: string, activityId?: string) {
  const col = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('activities');
  return activityId ? col.doc(activityId) : col.doc();
}

function auditRef(llcId: string) {
  return adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
}

export async function createClaimActivity(
  llcId: string,
  claimId: string,
  input: CreateClaimActivityInput,
  actorUserId: string
): Promise<ClaimActivity> {
  const ref = activityRef(llcId, claimId);

  const data = {
    llcId,
    claimId,
    type: input.type,
    title: input.title,
    ...(input.notes && { notes: input.notes }),
    ...(input.occurredAt && { occurredAt: input.occurredAt }),
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(ref, data);
  batch.set(auditRef(llcId), {
    actorUserId,
    action: 'create',
    entityType: 'claim_activity',
    entityId: ref.id,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/activities/${ref.id}`,
    changes: { after: { type: input.type, title: input.title } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: ref.id,
    ...data,
    createdAt: new Date().toISOString(),
  } as unknown as ClaimActivity;
}

export async function listClaimActivities(
  llcId: string,
  claimId: string
): Promise<ClaimActivity[]> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('activities')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClaimActivity);
}

export async function getClaimActivity(
  llcId: string,
  claimId: string,
  activityId: string
): Promise<ClaimActivity | null> {
  const doc = await activityRef(llcId, claimId, activityId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ClaimActivity;
}

export async function updateClaimActivity(
  llcId: string,
  claimId: string,
  activityId: string,
  input: UpdateClaimActivityInput,
  actorUserId: string
): Promise<ClaimActivity> {
  const ref = activityRef(llcId, claimId, activityId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Activity not found');

  const batch = adminDb.batch();
  batch.update(ref, { ...input, updatedAt: FieldValue.serverTimestamp() });
  batch.set(auditRef(llcId), {
    actorUserId,
    action: 'update',
    entityType: 'claim_activity',
    entityId: activityId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/activities/${activityId}`,
    changes: { after: input },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() } as ClaimActivity;
}

export async function deleteClaimActivity(
  llcId: string,
  claimId: string,
  activityId: string,
  actorUserId: string
): Promise<void> {
  const ref = activityRef(llcId, claimId, activityId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Activity not found');

  const batch = adminDb.batch();
  batch.delete(ref);
  batch.set(auditRef(llcId), {
    actorUserId,
    action: 'delete',
    entityType: 'claim_activity',
    entityId: activityId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/activities/${activityId}`,
    changes: { before: { type: snap.data()?.type, title: snap.data()?.title } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
