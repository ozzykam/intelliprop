import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface TransferResult {
  propertyId: string;
  sourceLlcId: string;
  destLlcId: string;
  counts: {
    units: number;
    leases: number;
    leaseDocuments: number;
    publishedLeases: number;
    charges: number;
    payments: number;
    workOrders: number;
    totalOps: number;
    batchCount: number;
  };
}

export class TransferError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'SAME_LLC' | 'ALREADY_EXISTS' | 'INTERNAL'
  ) {
    super(message);
    this.name = 'TransferError';
  }
}

/**
 * Chunk an array into groups of a given size.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Transfer a property and all related data from one LLC to another.
 *
 * Copies every document to the destination LLC (with updated llcId fields)
 * then deletes from the source. SETs are committed before DELETEs so data
 * is never lost even if a batch fails mid-way.
 */
export async function transferProperty(
  sourceLlcId: string,
  propertyId: string,
  destLlcId: string,
  actorUserId: string
): Promise<TransferResult> {
  // --- 1. Validate ---
  if (sourceLlcId === destLlcId) {
    throw new TransferError('Source and destination LLC cannot be the same', 'SAME_LLC');
  }

  const [sourceLlcDoc, destLlcDoc] = await Promise.all([
    adminDb.collection('llcs').doc(sourceLlcId).get(),
    adminDb.collection('llcs').doc(destLlcId).get(),
  ]);

  if (!sourceLlcDoc.exists) {
    throw new TransferError('Source LLC not found', 'NOT_FOUND');
  }
  if (!destLlcDoc.exists) {
    throw new TransferError('Destination LLC not found', 'NOT_FOUND');
  }

  const sourcePropertyRef = adminDb
    .collection('llcs').doc(sourceLlcId)
    .collection('properties').doc(propertyId);
  const sourcePropertyDoc = await sourcePropertyRef.get();

  if (!sourcePropertyDoc.exists) {
    throw new TransferError('Property not found in source LLC', 'NOT_FOUND');
  }

  // Check no collision at dest
  const destPropertyRef = adminDb
    .collection('llcs').doc(destLlcId)
    .collection('properties').doc(propertyId);
  const destPropertyDoc = await destPropertyRef.get();

  if (destPropertyDoc.exists) {
    throw new TransferError('A property with this ID already exists in the destination LLC', 'ALREADY_EXISTS');
  }

  // --- 2. Read all related docs ---
  const propertyData = sourcePropertyDoc.data()!;

  // Units subcollection
  const unitsSnap = await adminDb
    .collection('llcs').doc(sourceLlcId)
    .collection('properties').doc(propertyId)
    .collection('units').get();

  // Leases where propertyId matches
  const leasesSnap = await adminDb
    .collection('llcs').doc(sourceLlcId)
    .collection('leases')
    .where('propertyId', '==', propertyId)
    .get();

  const leaseIds = leasesSnap.docs.map(d => d.id);

  // Lease documents subcollection (per lease)
  const leaseDocResults = await Promise.all(
    leasesSnap.docs.map(leaseDoc =>
      adminDb
        .collection('llcs').doc(sourceLlcId)
        .collection('leases').doc(leaseDoc.id)
        .collection('documents').get()
        .then(snap => ({ leaseId: leaseDoc.id, docs: snap.docs }))
    )
  );

  // Charges and Payments -- query by leaseId in chunks of 30
  const leaseIdChunks = chunk(leaseIds, 30);

  const chargesResults = await Promise.all(
    leaseIdChunks.map(ids =>
      adminDb
        .collection('llcs').doc(sourceLlcId)
        .collection('charges')
        .where('leaseId', 'in', ids)
        .get()
    )
  );
  const allChargeDocs = chargesResults.flatMap(snap => snap.docs);

  const paymentsResults = await Promise.all(
    leaseIdChunks.map(ids =>
      adminDb
        .collection('llcs').doc(sourceLlcId)
        .collection('payments')
        .where('leaseId', 'in', ids)
        .get()
    )
  );
  const allPaymentDocs = paymentsResults.flatMap(snap => snap.docs);

  // Work orders where propertyId matches
  const workOrdersSnap = await adminDb
    .collection('llcs').doc(sourceLlcId)
    .collection('workOrders')
    .where('propertyId', '==', propertyId)
    .get();

  // Published leases where propertyId matches
  const publishedLeasesSnap = await adminDb
    .collection('llcs').doc(sourceLlcId)
    .collection('publishedLeases')
    .where('propertyId', '==', propertyId)
    .get();

  // --- 3. Build operations ---
  type Op = { type: 'set'; ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }
    | { type: 'delete'; ref: FirebaseFirestore.DocumentReference };

  const sets: Op[] = [];
  const deletes: Op[] = [];

  // Helper: copy doc with llcId override
  const addCopy = (
    sourceRef: FirebaseFirestore.DocumentReference,
    destRef: FirebaseFirestore.DocumentReference,
    data: Record<string, unknown>
  ) => {
    const copied = { ...data, llcId: destLlcId };
    sets.push({ type: 'set', ref: destRef, data: copied });
    deletes.push({ type: 'delete', ref: sourceRef });
  };

  // Property
  addCopy(
    sourcePropertyRef,
    destPropertyRef,
    propertyData as Record<string, unknown>
  );

  // Units
  for (const unitDoc of unitsSnap.docs) {
    const destUnitRef = adminDb
      .collection('llcs').doc(destLlcId)
      .collection('properties').doc(propertyId)
      .collection('units').doc(unitDoc.id);
    addCopy(unitDoc.ref, destUnitRef, unitDoc.data() as Record<string, unknown>);
  }

  // Leases
  for (const leaseDoc of leasesSnap.docs) {
    const destLeaseRef = adminDb
      .collection('llcs').doc(destLlcId)
      .collection('leases').doc(leaseDoc.id);
    addCopy(leaseDoc.ref, destLeaseRef, leaseDoc.data() as Record<string, unknown>);
  }

  // Lease documents
  for (const { leaseId, docs } of leaseDocResults) {
    for (const docSnap of docs) {
      const destDocRef = adminDb
        .collection('llcs').doc(destLlcId)
        .collection('leases').doc(leaseId)
        .collection('documents').doc(docSnap.id);
      // Don't override llcId for lease documents -- just copy data as-is
      sets.push({ type: 'set', ref: destDocRef, data: docSnap.data() as Record<string, unknown> });
      deletes.push({ type: 'delete', ref: docSnap.ref });
    }
  }

  // Charges
  for (const chargeDoc of allChargeDocs) {
    const destChargeRef = adminDb
      .collection('llcs').doc(destLlcId)
      .collection('charges').doc(chargeDoc.id);
    addCopy(chargeDoc.ref, destChargeRef, chargeDoc.data() as Record<string, unknown>);
  }

  // Payments
  for (const paymentDoc of allPaymentDocs) {
    const destPaymentRef = adminDb
      .collection('llcs').doc(destLlcId)
      .collection('payments').doc(paymentDoc.id);
    addCopy(paymentDoc.ref, destPaymentRef, paymentDoc.data() as Record<string, unknown>);
  }

  // Work orders
  for (const woDoc of workOrdersSnap.docs) {
    const destWoRef = adminDb
      .collection('llcs').doc(destLlcId)
      .collection('workOrders').doc(woDoc.id);
    addCopy(woDoc.ref, destWoRef, woDoc.data() as Record<string, unknown>);
  }

  // Published leases (addenda, notes, signedDocuments are array fields on the doc)
  for (const plDoc of publishedLeasesSnap.docs) {
    const destPlRef = adminDb
      .collection('llcs').doc(destLlcId)
      .collection('publishedLeases').doc(plDoc.id);
    addCopy(plDoc.ref, destPlRef, plDoc.data() as Record<string, unknown>);
  }

  // Audit logs (SET only, no delete)
  const counts = {
    units: unitsSnap.docs.length,
    leases: leasesSnap.docs.length,
    leaseDocuments: leaseDocResults.reduce((sum, r) => sum + r.docs.length, 0),
    publishedLeases: publishedLeasesSnap.docs.length,
    charges: allChargeDocs.length,
    payments: allPaymentDocs.length,
    workOrders: workOrdersSnap.docs.length,
    totalOps: 0,
    batchCount: 0,
  };

  const auditMeta = {
    propertyId,
    propertyAddress: propertyData.address?.street1 || propertyData.name || propertyId,
    sourceLlcId,
    destLlcId,
    counts: { ...counts },
  };

  const sourceAuditRef = adminDb
    .collection('llcs').doc(sourceLlcId)
    .collection('auditLogs').doc();
  sets.push({
    type: 'set',
    ref: sourceAuditRef,
    data: {
      actorUserId,
      action: 'transfer_out',
      entityType: 'property',
      entityId: propertyId,
      entityPath: `llcs/${sourceLlcId}/properties/${propertyId}`,
      changes: { metadata: auditMeta },
      createdAt: FieldValue.serverTimestamp(),
    },
  });

  const destAuditRef = adminDb
    .collection('llcs').doc(destLlcId)
    .collection('auditLogs').doc();
  sets.push({
    type: 'set',
    ref: destAuditRef,
    data: {
      actorUserId,
      action: 'transfer_in',
      entityType: 'property',
      entityId: propertyId,
      entityPath: `llcs/${destLlcId}/properties/${propertyId}`,
      changes: { metadata: auditMeta },
      createdAt: FieldValue.serverTimestamp(),
    },
  });

  // --- 4. Commit: all SETs first, then all DELETEs ---
  const allOps: Op[] = [...sets, ...deletes];
  counts.totalOps = allOps.length;

  const batches = chunk(allOps, 490);
  counts.batchCount = batches.length;

  for (const batchOps of batches) {
    const batch = adminDb.batch();
    for (const op of batchOps) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data);
      } else {
        batch.delete(op.ref);
      }
    }
    await batch.commit();
  }

  return {
    propertyId,
    sourceLlcId,
    destLlcId,
    counts,
  };
}
