import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ChargeType, ChargeStatus } from '@shared/types';

export interface CreateChargeInput {
  leaseId?: string;
  publishedLeaseId?: string;
  period: string; // YYYY-MM
  type: ChargeType;
  description?: string;
  amount: number; // In cents
  dueDate: string; // ISO date
  linkedChargeId?: string; // For late fees linked to original charge
}

export interface ChargeWithId {
  id: string;
  llcId: string;
  leaseId: string;
  publishedLeaseId?: string;
  tenantUserId?: string;
  period: string;
  type: ChargeType;
  description?: string;
  amount: number;
  paidAmount: number;
  status: ChargeStatus;
  dueDate: string;
  linkedChargeId?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChargeBalance {
  totalCharges: number;
  totalPaid: number;
  balance: number;
  overdueAmount: number;
  openCharges: number;
}

/**
 * Create a new charge for a lease.
 */
export async function createCharge(
  llcId: string,
  input: CreateChargeInput,
  actorUserId: string
): Promise<ChargeWithId> {
  let tenantUserIds: string[] = [];
  let resolvedLeaseId: string;

  if (input.publishedLeaseId) {
    // Published lease path
    const publishedLeaseDoc = await adminDb
      .collection('llcs')
      .doc(llcId)
      .collection('publishedLeases')
      .doc(input.publishedLeaseId)
      .get();

    if (!publishedLeaseDoc.exists) {
      throw new Error('NOT_FOUND: Published lease not found');
    }

    const publishedLeaseData = publishedLeaseDoc.data();
    tenantUserIds = publishedLeaseData?.tenantIds || [];
    // Same dual-key pattern as nightly scheduler: leaseId = publishedLeaseId
    resolvedLeaseId = input.publishedLeaseId;
  } else {
    // Legacy lease path
    const leaseDoc = await adminDb
      .collection('llcs')
      .doc(llcId)
      .collection('leases')
      .doc(input.leaseId!)
      .get();

    if (!leaseDoc.exists) {
      throw new Error('NOT_FOUND: Lease not found');
    }

    const leaseData = leaseDoc.data();
    tenantUserIds = leaseData?.tenantUserIds || [];
    resolvedLeaseId = input.leaseId!;
  }

  const chargeRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .doc();

  const chargeData: Record<string, unknown> = {
    llcId,
    leaseId: resolvedLeaseId,
    tenantUserIds,
    tenantUserId: tenantUserIds[0] || null,
    period: input.period,
    type: input.type,
    description: input.description || null,
    amount: input.amount,
    paidAmount: 0,
    status: 'open' as ChargeStatus,
    dueDate: input.dueDate,
    linkedChargeId: input.linkedChargeId || null,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (input.publishedLeaseId) {
    chargeData.publishedLeaseId = input.publishedLeaseId;
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.set(chargeRef, chargeData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'charge',
    entityId: chargeRef.id,
    entityPath: `llcs/${llcId}/charges/${chargeRef.id}`,
    changes: {
      after: {
        leaseId: resolvedLeaseId,
        publishedLeaseId: input.publishedLeaseId || undefined,
        type: input.type,
        amount: input.amount,
        period: input.period,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: chargeRef.id,
    llcId,
    leaseId: resolvedLeaseId,
    publishedLeaseId: input.publishedLeaseId,
    period: input.period,
    type: input.type,
    description: input.description,
    amount: input.amount,
    paidAmount: 0,
    status: 'open',
    dueDate: input.dueDate,
    linkedChargeId: input.linkedChargeId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get a single charge by ID.
 */
export async function getCharge(
  llcId: string,
  chargeId: string
): Promise<ChargeWithId | null> {
  const chargeDoc = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .doc(chargeId)
    .get();

  if (!chargeDoc.exists) {
    return null;
  }

  const data = chargeDoc.data();
  if (!data) {
    return null;
  }
  return {
    id: chargeDoc.id,
    llcId: data.llcId,
    leaseId: data.leaseId,
    publishedLeaseId: data.publishedLeaseId || undefined,
    tenantUserId: data.tenantUserId,
    period: data.period,
    type: data.type as ChargeType,
    description: data.description || undefined,
    amount: data.amount,
    paidAmount: data.paidAmount || 0,
    status: data.status as ChargeStatus,
    dueDate: data.dueDate,
    linkedChargeId: data.linkedChargeId || undefined,
    voidedAt: data.voidedAt?.toDate?.()?.toISOString() || undefined,
    voidedBy: data.voidedBy || undefined,
    voidReason: data.voidReason || undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || undefined,
  };
}

/**
 * List charges for a lease.
 */
export async function listChargesForLease(
  llcId: string,
  leaseId: string,
  status?: ChargeStatus
): Promise<ChargeWithId[]> {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .where('leaseId', '==', leaseId)
    .orderBy('dueDate', 'desc') as FirebaseFirestore.Query;

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      llcId: data.llcId,
      leaseId: data.leaseId,
      publishedLeaseId: data.publishedLeaseId || undefined,
      tenantUserId: data.tenantUserId,
      period: data.period,
      type: data.type as ChargeType,
      description: data.description || undefined,
      amount: data.amount,
      paidAmount: data.paidAmount || 0,
      status: data.status as ChargeStatus,
      dueDate: data.dueDate,
      linkedChargeId: data.linkedChargeId || undefined,
      voidedAt: data.voidedAt?.toDate?.()?.toISOString() || undefined,
      voidedBy: data.voidedBy || undefined,
      voidReason: data.voidReason || undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || undefined,
    };
  });
}

/**
 * List all charges for an LLC with optional filters.
 */
export async function listCharges(
  llcId: string,
  filters?: {
    status?: ChargeStatus;
    type?: ChargeType;
    leaseId?: string;
    publishedLeaseId?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<ChargeWithId[]> {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .orderBy('dueDate', 'desc') as FirebaseFirestore.Query;

  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters?.type) {
    query = query.where('type', '==', filters.type);
  }
  if (filters?.leaseId) {
    query = query.where('leaseId', '==', filters.leaseId);
  }
  if (filters?.publishedLeaseId) {
    query = query.where('publishedLeaseId', '==', filters.publishedLeaseId);
  }

  const snapshot = await query.get();

  let charges = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      llcId: data.llcId,
      leaseId: data.leaseId,
      publishedLeaseId: data.publishedLeaseId || undefined,
      tenantUserId: data.tenantUserId,
      period: data.period,
      type: data.type as ChargeType,
      description: data.description || undefined,
      amount: data.amount,
      paidAmount: data.paidAmount || 0,
      status: data.status as ChargeStatus,
      dueDate: data.dueDate,
      linkedChargeId: data.linkedChargeId || undefined,
      voidedAt: data.voidedAt?.toDate?.()?.toISOString() || undefined,
      voidedBy: data.voidedBy || undefined,
      voidReason: data.voidReason || undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || undefined,
    };
  });

  // Apply date filters client-side
  const fromDate = filters?.fromDate;
  const toDate = filters?.toDate;
  if (fromDate) {
    charges = charges.filter((c) => c.dueDate >= fromDate);
  }
  if (toDate) {
    charges = charges.filter((c) => c.dueDate <= toDate);
  }

  return charges;
}

/**
 * Get open (unpaid) charges for a lease.
 */
export async function getOpenChargesForLease(
  llcId: string,
  leaseId: string
): Promise<ChargeWithId[]> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .where('leaseId', '==', leaseId)
    .where('status', 'in', ['open', 'partial'])
    .orderBy('dueDate', 'asc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      llcId: data.llcId,
      leaseId: data.leaseId,
      publishedLeaseId: data.publishedLeaseId || undefined,
      tenantUserId: data.tenantUserId,
      period: data.period,
      type: data.type as ChargeType,
      description: data.description || undefined,
      amount: data.amount,
      paidAmount: data.paidAmount || 0,
      status: data.status as ChargeStatus,
      dueDate: data.dueDate,
      linkedChargeId: data.linkedChargeId || undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || undefined,
    };
  });
}

/**
 * Calculate the balance for a lease (total owed minus total paid).
 */
export async function getChargeBalance(
  llcId: string,
  leaseId: string
): Promise<ChargeBalance> {
  const charges = await listChargesForLease(llcId, leaseId);
  const today = new Date().toISOString().slice(0, 10);

  let totalCharges = 0;
  let totalPaid = 0;
  let overdueAmount = 0;
  let openCharges = 0;

  for (const charge of charges) {
    if (charge.status === 'void') continue;

    totalCharges += charge.amount;
    totalPaid += charge.paidAmount;

    if (charge.status === 'open' || charge.status === 'partial') {
      openCharges++;
      const remaining = charge.amount - charge.paidAmount;
      if (charge.dueDate < today) {
        overdueAmount += remaining;
      }
    }
  }

  return {
    totalCharges,
    totalPaid,
    balance: totalCharges - totalPaid,
    overdueAmount,
    openCharges,
  };
}

/**
 * Void a charge (cannot void if already paid/partial).
 */
export async function voidCharge(
  llcId: string,
  chargeId: string,
  reason: string,
  actorUserId: string
): Promise<ChargeWithId> {
  const chargeRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .doc(chargeId);

  const chargeDoc = await chargeRef.get();

  if (!chargeDoc.exists) {
    throw new Error('NOT_FOUND: Charge not found');
  }

  const data = chargeDoc.data();
  if (!data) {
    throw new Error('NOT_FOUND: Charge data not found');
  }

  if (data.status === 'paid') {
    throw new Error('INVALID_STATUS: Cannot void a fully paid charge');
  }

  if (data.status === 'partial') {
    throw new Error('INVALID_STATUS: Cannot void a partially paid charge. Refund payments first.');
  }

  if (data.status === 'void') {
    throw new Error('ALREADY_VOID: Charge is already voided');
  }

  const updateData = {
    status: 'void' as ChargeStatus,
    voidedAt: FieldValue.serverTimestamp(),
    voidedBy: actorUserId,
    voidReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.update(chargeRef, updateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'void',
    entityType: 'charge',
    entityId: chargeId,
    entityPath: `llcs/${llcId}/charges/${chargeId}`,
    changes: {
      before: { status: data.status },
      after: { status: 'void', voidReason: reason },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: chargeId,
    llcId: data.llcId,
    leaseId: data.leaseId,
    publishedLeaseId: data.publishedLeaseId || undefined,
    period: data.period,
    type: data.type as ChargeType,
    description: data.description || undefined,
    amount: data.amount,
    paidAmount: data.paidAmount || 0,
    status: 'void',
    dueDate: data.dueDate,
    linkedChargeId: data.linkedChargeId || undefined,
    voidedBy: actorUserId,
    voidReason: reason,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * List charges for a published lease.
 */
export async function listChargesForPublishedLease(
  llcId: string,
  publishedLeaseId: string,
  status?: ChargeStatus
): Promise<ChargeWithId[]> {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .where('publishedLeaseId', '==', publishedLeaseId)
    .orderBy('dueDate', 'desc') as FirebaseFirestore.Query;

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      llcId: data.llcId,
      leaseId: data.leaseId,
      publishedLeaseId: data.publishedLeaseId || undefined,
      tenantUserId: data.tenantUserId,
      period: data.period,
      type: data.type as ChargeType,
      description: data.description || undefined,
      amount: data.amount,
      paidAmount: data.paidAmount || 0,
      status: data.status as ChargeStatus,
      dueDate: data.dueDate,
      linkedChargeId: data.linkedChargeId || undefined,
      voidedAt: data.voidedAt?.toDate?.()?.toISOString() || undefined,
      voidedBy: data.voidedBy || undefined,
      voidReason: data.voidReason || undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || undefined,
    };
  });
}

/**
 * Get open (unpaid) charges for a published lease.
 */
export async function getOpenChargesForPublishedLease(
  llcId: string,
  publishedLeaseId: string
): Promise<ChargeWithId[]> {
  const snapshot = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .where('publishedLeaseId', '==', publishedLeaseId)
    .where('status', 'in', ['open', 'partial'])
    .orderBy('dueDate', 'asc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      llcId: data.llcId,
      leaseId: data.leaseId,
      publishedLeaseId: data.publishedLeaseId || undefined,
      tenantUserId: data.tenantUserId,
      period: data.period,
      type: data.type as ChargeType,
      description: data.description || undefined,
      amount: data.amount,
      paidAmount: data.paidAmount || 0,
      status: data.status as ChargeStatus,
      dueDate: data.dueDate,
      linkedChargeId: data.linkedChargeId || undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || undefined,
    };
  });
}

/**
 * Calculate the balance for a published lease.
 */
export async function getChargeBalanceForPublishedLease(
  llcId: string,
  publishedLeaseId: string
): Promise<ChargeBalance> {
  const charges = await listChargesForPublishedLease(llcId, publishedLeaseId);
  const today = new Date().toISOString().slice(0, 10);

  let totalCharges = 0;
  let totalPaid = 0;
  let overdueAmount = 0;
  let openCharges = 0;

  for (const charge of charges) {
    if (charge.status === 'void') continue;

    totalCharges += charge.amount;
    totalPaid += charge.paidAmount;

    if (charge.status === 'open' || charge.status === 'partial') {
      openCharges++;
      const remaining = charge.amount - charge.paidAmount;
      if (charge.dueDate < today) {
        overdueAmount += remaining;
      }
    }
  }

  return {
    totalCharges,
    totalPaid,
    balance: totalCharges - totalPaid,
    overdueAmount,
    openCharges,
  };
}

/**
 * Update charge status based on payment.
 * Called internally when payments are applied.
 */
export async function updateChargePayment(
  llcId: string,
  chargeId: string,
  paymentAmount: number,
  actorUserId: string
): Promise<void> {
  const chargeRef = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('charges')
    .doc(chargeId);

  const chargeDoc = await chargeRef.get();

  if (!chargeDoc.exists) {
    throw new Error('NOT_FOUND: Charge not found');
  }

  const data = chargeDoc.data();
  if (!data) {
    throw new Error('NOT_FOUND: Charge data not found');
  }
  const currentPaid = data.paidAmount || 0;
  const newPaidAmount = currentPaid + paymentAmount;

  let newStatus: ChargeStatus;
  if (newPaidAmount >= data.amount) {
    newStatus = 'paid';
  } else if (newPaidAmount > 0) {
    newStatus = 'partial';
  } else {
    newStatus = 'open';
  }

  const updateData = {
    paidAmount: newPaidAmount,
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const batch = adminDb.batch();
  batch.update(chargeRef, updateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'charge',
    entityId: chargeId,
    entityPath: `llcs/${llcId}/charges/${chargeId}`,
    changes: {
      before: { paidAmount: currentPaid, status: data.status },
      after: { paidAmount: newPaidAmount, status: newStatus },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
