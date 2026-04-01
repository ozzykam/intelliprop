import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ClaimDocument, CreateClaimDocumentInput } from '@shared/types';

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export { ALLOWED_CONTENT_TYPES as CLAIM_DOCUMENT_ALLOWED_CONTENT_TYPES };

/**
 * Generate a signed upload URL for a claim document.
 * Storage path: llcs/{llcId}/insurance/claims/{claimId}/documents/{timestamp}_{fileName}
 */
export async function generateClaimDocumentUploadUrl(
  llcId: string,
  claimId: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; storagePath: string }> {
  const storagePath = `llcs/${llcId}/insurance/claims/${claimId}/documents/${Date.now()}_${fileName}`;
  const bucket = adminStorage.bucket();
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
 * Create a claim document metadata record after upload completes.
 */
export async function createClaimDocument(
  llcId: string,
  claimId: string,
  input: CreateClaimDocumentInput,
  actorUserId: string
): Promise<ClaimDocument> {
  const docRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('documents')
    .doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const docData = {
    claimId,
    llcId,
    title: input.title,
    description: input.description ?? null,
    type: input.type,
    fileName: input.fileName,
    storagePath: input.storagePath,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    ...(input.appraisalProcessId && { appraisalProcessId: input.appraisalProcessId }),
    ...(input.estimateId && { estimateId: input.estimateId }),
    uploadedByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(docRef, docData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'claim_document',
    entityId: docRef.id,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/documents/${docRef.id}`,
    changes: { after: { title: input.title, type: input.type, fileName: input.fileName } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: docRef.id,
    claimId,
    llcId,
    title: input.title,
    description: input.description,
    type: input.type,
    fileName: input.fileName,
    storagePath: input.storagePath,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    appraisalProcessId: input.appraisalProcessId,
    estimateId: input.estimateId,
    uploadedByUserId: actorUserId,
    createdAt: new Date().toISOString() as unknown as ClaimDocument['createdAt'],
  };
}

/**
 * List all documents for a claim.
 */
export async function listClaimDocuments(
  llcId: string,
  claimId: string
): Promise<ClaimDocument[]> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('documents')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      claimId,
      llcId,
      title: d.title,
      description: d.description ?? undefined,
      type: d.type,
      fileName: d.fileName,
      storagePath: d.storagePath,
      contentType: d.contentType,
      sizeBytes: d.sizeBytes,
      appraisalProcessId: d.appraisalProcessId ?? undefined,
      estimateId: d.estimateId ?? undefined,
      uploadedByUserId: d.uploadedByUserId,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    } as ClaimDocument;
  });
}

/**
 * Generate a signed download URL for a claim document.
 */
export async function generateClaimDocumentDownloadUrl(storagePath: string): Promise<string> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(storagePath);

  const [downloadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return downloadUrl;
}

/**
 * Delete a claim document (metadata + storage file).
 */
export async function deleteClaimDocument(
  llcId: string,
  claimId: string,
  documentId: string,
  actorUserId: string
): Promise<void> {
  const docRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('insuranceClaims')
    .doc(claimId)
    .collection('documents')
    .doc(documentId);

  const snap = await docRef.get();
  if (!snap.exists) throw new Error('NOT_FOUND: Document not found');

  const docData = snap.data();
  if (!docData) throw new Error('NOT_FOUND: Document data empty');

  // Delete from Storage (soft-fail if already gone)
  try {
    const bucket = adminStorage.bucket();
    await bucket.file(docData.storagePath).delete();
  } catch {
    // File may already be deleted
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();
  batch.delete(docRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'claim_document',
    entityId: documentId,
    entityPath: `llcs/${llcId}/insuranceClaims/${claimId}/documents/${documentId}`,
    changes: { before: { title: docData.title, fileName: docData.fileName } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
