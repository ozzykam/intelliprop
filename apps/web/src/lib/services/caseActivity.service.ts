import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ActivityType, ActivityVisibility } from '@shared/types';

export interface CreateActivityInput {
  activityType: ActivityType;
  description: string;
  relatedTaskId?: string;
  relatedCourtDateId?: string;
  relatedDocumentId?: string;
  visibility?: ActivityVisibility;
}

export interface UpdateActivityInput {
  activityType?: ActivityType;
  description?: string;
  relatedTaskId?: string | null;
  relatedCourtDateId?: string | null;
  relatedDocumentId?: string | null;
  visibility?: ActivityVisibility;
}

export interface ActivityEditRecord {
  description: string;
  editedAt: string;
  editedByUserId: string;
}

export interface ActivityRecord {
  id: string;
  caseId: string;
  llcId: string;
  activityType: ActivityType;
  description: string;
  relatedTaskId?: string;
  relatedCourtDateId?: string;
  relatedDocumentId?: string;
  visibility: ActivityVisibility;
  createdByUserId: string;
  editHistory?: ActivityEditRecord[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create an activity within a case.
 */
export async function createCaseActivity(
  llcId: string,
  caseId: string,
  input: CreateActivityInput,
  actorUserId: string
): Promise<ActivityRecord> {
  const activityRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('activities')
    .doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const activityData = {
    caseId,
    llcId,
    activityType: input.activityType,
    description: input.description,
    relatedTaskId: input.relatedTaskId || null,
    relatedCourtDateId: input.relatedCourtDateId || null,
    relatedDocumentId: input.relatedDocumentId || null,
    visibility: input.visibility || 'internal',
    createdByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(activityRef, activityData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'case_activity',
    entityId: activityRef.id,
    entityPath: `llcs/${llcId}/cases/${caseId}/activities/${activityRef.id}`,
    changes: { after: { activityType: input.activityType, description: input.description } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: activityRef.id,
    caseId,
    llcId,
    activityType: input.activityType,
    description: input.description,
    relatedTaskId: input.relatedTaskId,
    relatedCourtDateId: input.relatedCourtDateId,
    relatedDocumentId: input.relatedDocumentId,
    visibility: input.visibility || 'internal',
    createdByUserId: actorUserId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * List activities for a case (reverse chronological).
 */
export async function listCaseActivities(llcId: string, caseId: string): Promise<ActivityRecord[]> {
  const snap = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('activities')
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      caseId,
      llcId,
      activityType: d.activityType as ActivityType,
      description: d.description,
      relatedTaskId: d.relatedTaskId || undefined,
      relatedCourtDateId: d.relatedCourtDateId || undefined,
      relatedDocumentId: d.relatedDocumentId || undefined,
      visibility: (d.visibility || 'internal') as ActivityVisibility,
      createdByUserId: d.createdByUserId,
      editHistory: d.editHistory || undefined,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() || undefined,
    };
  });
}

/**
 * Get a single activity.
 */
export async function getCaseActivity(
  llcId: string,
  caseId: string,
  activityId: string
): Promise<ActivityRecord | null> {
  const doc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('activities')
    .doc(activityId)
    .get();

  if (!doc.exists) return null;

  const d = doc.data()!;
  return {
    id: doc.id,
    caseId,
    llcId,
    activityType: d.activityType as ActivityType,
    description: d.description,
    relatedTaskId: d.relatedTaskId || undefined,
    relatedCourtDateId: d.relatedCourtDateId || undefined,
    relatedDocumentId: d.relatedDocumentId || undefined,
    visibility: (d.visibility || 'internal') as ActivityVisibility,
    createdByUserId: d.createdByUserId,
    editHistory: d.editHistory || undefined,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() || undefined,
  };
}

/**
 * Update an activity. Pushes old description to editHistory before overwriting.
 */
export async function updateCaseActivity(
  llcId: string,
  caseId: string,
  activityId: string,
  input: UpdateActivityInput,
  actorUserId: string
): Promise<ActivityRecord> {
  const activityRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('activities')
    .doc(activityId);

  const activityDoc = await activityRef.get();
  if (!activityDoc.exists) {
    throw new Error('NOT_FOUND: Activity not found');
  }

  const currentData = activityDoc.data()!;
  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  // If description is changing, push old description to editHistory
  if (input.description !== undefined && input.description !== currentData.description) {
    const editEntry: ActivityEditRecord = {
      description: currentData.description,
      editedAt: new Date().toISOString(),
      editedByUserId: actorUserId,
    };
    updateData.editHistory = FieldValue.arrayUnion(editEntry);
  }

  if (input.activityType !== undefined) updateData.activityType = input.activityType;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.relatedTaskId !== undefined) updateData.relatedTaskId = input.relatedTaskId;
  if (input.relatedCourtDateId !== undefined) updateData.relatedCourtDateId = input.relatedCourtDateId;
  if (input.relatedDocumentId !== undefined) updateData.relatedDocumentId = input.relatedDocumentId;
  if (input.visibility !== undefined) updateData.visibility = input.visibility;

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.update(activityRef, updateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'case_activity',
    entityId: activityId,
    entityPath: `llcs/${llcId}/cases/${caseId}/activities/${activityId}`,
    changes: {
      before: { activityType: currentData.activityType, description: currentData.description },
      after: updateData,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const updated = await getCaseActivity(llcId, caseId, activityId);
  if (!updated) throw new Error('INTERNAL_ERROR: Failed to read updated activity');
  return updated;
}

/**
 * Delete an activity.
 */
export async function deleteCaseActivity(
  llcId: string,
  caseId: string,
  activityId: string,
  actorUserId: string
): Promise<void> {
  const activityRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('cases')
    .doc(caseId)
    .collection('activities')
    .doc(activityId);

  const activityDoc = await activityRef.get();
  if (!activityDoc.exists) {
    throw new Error('NOT_FOUND: Activity not found');
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.delete(activityRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'case_activity',
    entityId: activityId,
    entityPath: `llcs/${llcId}/cases/${caseId}/activities/${activityId}`,
    changes: { before: { activityType: activityDoc.data()?.activityType, description: activityDoc.data()?.description } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
