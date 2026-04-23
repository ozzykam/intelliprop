import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UnitImageRecord {
  id: string;
  llcId: string;
  propertyId: string;
  unitId: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  caption?: string;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt?: string;
  url?: string;
}

export interface CreateUnitImageInput {
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  caption?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Generate a signed v4 upload URL for a unit image (15-minute expiry).
 */
export async function generateUploadUrl(
  llcId: string,
  propertyId: string,
  unitId: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; storagePath: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(`INVALID_INPUT: Content type not allowed. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  const storagePath = `llcs/${llcId}/properties/${propertyId}/units/${unitId}/images/${Date.now()}_${fileName}`;
  const bucket = adminStorage.bucket();
  const file = bucket.file(storagePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  return { uploadUrl, storagePath };
}

/**
 * Save image metadata to Firestore after upload.
 */
export async function createUnitImage(
  llcId: string,
  propertyId: string,
  unitId: string,
  input: CreateUnitImageInput,
  actorUserId: string
): Promise<UnitImageRecord> {
  const docRef = adminDb
    .collection('llcs').doc(llcId)
    .collection('properties').doc(propertyId)
    .collection('units').doc(unitId)
    .collection('images').doc();

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const docData = {
    llcId,
    propertyId,
    unitId,
    storagePath: input.storagePath,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    caption: input.caption || null,
    uploadedByUserId: actorUserId,
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.set(docRef, docData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'unit_image',
    entityId: docRef.id,
    entityPath: `llcs/${llcId}/properties/${propertyId}/units/${unitId}/images/${docRef.id}`,
    changes: { after: { fileName: input.fileName, unitId } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: docRef.id,
    llcId,
    propertyId,
    unitId,
    storagePath: input.storagePath,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    caption: input.caption,
    uploadedByUserId: actorUserId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * List all images for a unit, each with a 1-hour signed read URL.
 */
export async function listUnitImages(
  llcId: string,
  propertyId: string,
  unitId: string
): Promise<UnitImageRecord[]> {
  const snap = await adminDb
    .collection('llcs').doc(llcId)
    .collection('properties').doc(propertyId)
    .collection('units').doc(unitId)
    .collection('images')
    .orderBy('createdAt', 'desc')
    .get();

  const bucket = adminStorage.bucket();

  const records = await Promise.all(
    snap.docs.map(async (doc) => {
      const d = doc.data();

      let url = '';
      try {
        const [signedUrl] = await bucket.file(d.storagePath).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
        });
        url = signedUrl;
      } catch {
        // file may not exist yet; return empty url
      }

      return {
        id: doc.id,
        llcId,
        propertyId,
        unitId,
        storagePath: d.storagePath,
        fileName: d.fileName,
        contentType: d.contentType,
        sizeBytes: d.sizeBytes,
        caption: d.caption || undefined,
        uploadedByUserId: d.uploadedByUserId,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: d.updatedAt?.toDate?.()?.toISOString(),
        url,
      };
    })
  );

  return records;
}

/**
 * Update the caption of a unit image.
 */
export async function updateUnitImage(
  llcId: string,
  propertyId: string,
  unitId: string,
  imageId: string,
  updates: { caption?: string },
  actorUserId: string
): Promise<UnitImageRecord> {
  const docRef = adminDb
    .collection('llcs').doc(llcId)
    .collection('properties').doc(propertyId)
    .collection('units').doc(unitId)
    .collection('images').doc(imageId);

  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error('NOT_FOUND: Image not found');
  }

  await docRef.update({
    caption: updates.caption ?? null,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUserId: actorUserId,
  });

  const d = docSnap.data()!;
  return {
    id: imageId,
    llcId,
    propertyId,
    unitId,
    storagePath: d.storagePath,
    fileName: d.fileName,
    contentType: d.contentType,
    sizeBytes: d.sizeBytes,
    caption: updates.caption,
    uploadedByUserId: d.uploadedByUserId,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete a unit image from Storage and Firestore.
 */
export async function deleteUnitImage(
  llcId: string,
  propertyId: string,
  unitId: string,
  imageId: string,
  actorUserId: string
): Promise<void> {
  const docRef = adminDb
    .collection('llcs').doc(llcId)
    .collection('properties').doc(propertyId)
    .collection('units').doc(unitId)
    .collection('images').doc(imageId);

  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error('NOT_FOUND: Image not found');
  }

  const d = docSnap.data()!;

  // Delete from Storage (best-effort)
  try {
    await adminStorage.bucket().file(d.storagePath).delete();
  } catch {
    // file may already be gone
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();
  batch.delete(docRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'unit_image',
    entityId: imageId,
    entityPath: `llcs/${llcId}/properties/${propertyId}/units/${unitId}/images/${imageId}`,
    changes: { before: { fileName: d.fileName } },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
