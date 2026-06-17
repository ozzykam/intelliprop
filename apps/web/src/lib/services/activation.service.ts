import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import {
  PendingActivation,
  ActivationStatus,
  ActivationRole,
  VerificationResult,
  ConfirmationResult,
  UserType,
  CreateActivationInput,
  VerificationInput,
} from '@shared/types';

const COLLECTION = 'pendingActivations';
const EXPIRATION_DAYS = 30;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a pending activation record
 */
export async function createActivation(
  input: CreateActivationInput,
  createdBy: string
): Promise<PendingActivation> {
  const now = FieldValue.serverTimestamp();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);

  const baseData = {
    type: input.type,
    role: input.role,
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    llcIds: input.llcIds || [],
    propertyIds: input.propertyIds || [],
    status: 'pending' as ActivationStatus,
    createdBy,
    createdAt: now,
    expiresAt: { seconds: Math.floor(expiresAt.getTime() / 1000), nanoseconds: 0 },
  };

  // Add optional fields
  const data: Record<string, unknown> = { ...baseData };

  if (input.email) {
    data.email = input.email;
  }
  if (input.phone) {
    data.phone = input.phone;
  }
  if (input.middleInitial) {
    data.middleInitial = input.middleInitial;
  }
  if (input.capabilities) {
    data.capabilities = input.capabilities;
  }
  if (input.tenantId) {
    data.tenantId = input.tenantId;
  }
  if (input.isAssignee) {
    data.isAssignee = input.isAssignee;
  }
  if (input.assigneeEntityType) {
    data.assigneeEntityType = input.assigneeEntityType;
  }
  if (input.mailingAddress) {
    data.mailingAddress = input.mailingAddress;
  }
  if (input.emergencyContact) {
    data.emergencyContact = input.emergencyContact;
  }

  // Add type-specific fields
  if (input.type === 'individual') {
    data.ssn4 = input.ssn4;
  } else {
    data.einLast4 = input.einLast4;
    data.businessName = input.businessName;
  }

  const docRef = await adminDb.collection(COLLECTION).add(data);

  return {
    id: docRef.id,
    ...data,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
  } as PendingActivation;
}

/**
 * Get an activation by ID
 */
export async function getActivation(activationId: string): Promise<PendingActivation | null> {
  const doc = await adminDb.collection(COLLECTION).doc(activationId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() } as PendingActivation;
}

/**
 * List activations with optional filters
 */
export async function listActivations(options?: {
  status?: ActivationStatus;
  role?: ActivationRole;
  llcId?: string;
  createdBy?: string;
  limit?: number;
}): Promise<PendingActivation[]> {
  let query = adminDb.collection(COLLECTION).orderBy('createdAt', 'desc');

  if (options?.status) {
    query = query.where('status', '==', options.status);
  }
  if (options?.role) {
    query = query.where('role', '==', options.role);
  }
  if (options?.createdBy) {
    query = query.where('createdBy', '==', options.createdBy);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PendingActivation[];

  // Filter by llcId if specified (array-contains)
  if (options?.llcId) {
    results = results.filter(a => a.llcIds.includes(options.llcId!));
  }

  return results;
}

/**
 * Cancel/expire an activation
 */
export async function cancelActivation(activationId: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(activationId).update({
    status: 'expired',
  });
}

/**
 * Verify identity - Step 1 of activation flow
 * Returns verification token and masked name if match found
 */
export async function verifyIdentity(input: VerificationInput): Promise<VerificationResult | null> {
  // Build query based on input type
  let query = adminDb.collection(COLLECTION)
    .where('status', '==', 'pending')
    .where('type', '==', input.type)
    .where('dateOfBirth', '==', input.dateOfBirth);

  if (input.type === 'individual') {
    query = query.where('ssn4', '==', input.ssn4);
  } else {
    query = query.where('einLast4', '==', input.einLast4);
    // Note: businessName comparison is case-insensitive, done client-side
  }

  const snapshot = await query.get();

  if (snapshot.empty || snapshot.docs.length === 0) {
    return null;
  }

  // For commercial, filter by business name (case-insensitive)
  let matchingDoc = snapshot.docs[0]!;
  if (input.type === 'business') {
    const match = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.businessName?.toLowerCase() === input.businessName.toLowerCase();
    });
    if (!match) {
      return null;
    }
    matchingDoc = match;
  }

  const activation = { id: matchingDoc.id, ...matchingDoc.data() } as PendingActivation;

  // Check if expired
  const expiresAt = activation.expiresAt as { seconds: number };
  if (expiresAt.seconds * 1000 < Date.now()) {
    // Mark as expired
    await adminDb.collection(COLLECTION).doc(activation.id).update({ status: 'expired' });
    return null;
  }

  // Generate verification token (valid for 15 minutes)
  const verificationToken = generateToken();
  const tokenExpiresAt = Date.now() + 15 * 60 * 1000;
  await adminDb.collection(COLLECTION).doc(activation.id).update({
    verificationToken,
    verificationTokenExpiresAt: tokenExpiresAt,
  });

  return {
    activationId: activation.id,
    verificationToken,
    firstName: activation.firstName,
    middleInitial: activation.middleInitial,
    lastName: activation.lastName,
    role: activation.role,
  };
}

/**
 * Confirm name - Step 2 of activation flow
 * Validates verification token and returns confirmation token
 */
export async function confirmName(
  activationId: string,
  verificationToken: string
): Promise<ConfirmationResult | null> {
  // Verify activation still exists and is pending
  const activation = await getActivation(activationId);
  if (!activation || activation.status !== 'pending') {
    return null;
  }

  // Validate verification token from the activation document
  const doc = activation as PendingActivation & {
    verificationToken?: string;
    verificationTokenExpiresAt?: number;
  };
  if (
    !doc.verificationToken ||
    doc.verificationToken !== verificationToken ||
    !doc.verificationTokenExpiresAt ||
    doc.verificationTokenExpiresAt < Date.now()
  ) {
    return null;
  }

  // Generate confirmation token (valid for 30 minutes) and clear verification token
  const confirmationToken = generateToken();
  const tokenExpiresAt = Date.now() + 30 * 60 * 1000;
  await adminDb.collection(COLLECTION).doc(activationId).update({
    verificationToken: FieldValue.delete(),
    verificationTokenExpiresAt: FieldValue.delete(),
    confirmationToken,
    confirmationTokenExpiresAt: tokenExpiresAt,
  });

  // Look up tenant email if this is a tenant activation
  let email: string | undefined;
  if (activation.tenantId) {
    const tenantDoc = await adminDb.collection('tenants').doc(activation.tenantId).get();
    if (tenantDoc.exists) {
      email = tenantDoc.data()?.email;
    }
  }

  return {
    confirmationToken,
    activationId,
    email,
  };
}

/**
 * Create account - Step 3 of activation flow
 * Creates Firebase Auth user, Firestore user record, and links/assignments
 */
export async function createAccount(
  email: string,
  password: string,
  confirmationToken: string
): Promise<{ userId: string; userType: UserType }> {
  // Look up the activation by confirmation token
  const snapshot = await adminDb.collection(COLLECTION)
    .where('confirmationToken', '==', confirmationToken)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('Invalid or expired confirmation token');
  }

  const activationDoc = snapshot.docs[0]!;
  const activationData = activationDoc.data() as { confirmationTokenExpiresAt?: number };

  if (!activationData.confirmationTokenExpiresAt || activationData.confirmationTokenExpiresAt < Date.now()) {
    throw new Error('Invalid or expired confirmation token');
  }

  const activationId = activationDoc.id;
  const activation = { id: activationId, ...activationDoc.data() } as PendingActivation;

  if (!activation || activation.status !== 'pending') {
    throw new Error('Activation not found or already used');
  }

  // Check if email is already in use
  try {
    await adminAuth.getUserByEmail(email);
    throw new Error('Email already in use');
  } catch (error: unknown) {
    const authError = error as { code?: string };
    if (authError.code !== 'auth/user-not-found') {
      throw error;
    }
    // Email not found, good to proceed
  }

  // Create Firebase Auth user
  const displayName = activation.middleInitial
    ? `${activation.firstName} ${activation.middleInitial}. ${activation.lastName}`
    : `${activation.firstName} ${activation.lastName}`;

  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName,
  });

  const userId = userRecord.uid;
  const userType: UserType = activation.role === 'tenant' ? 'tenant' : 'staff';

  // Create Firestore user record
  const userData: Record<string, unknown> = {
    email,
    displayName,
    userType,
    status: 'active',
    isPlatformSuperAdmin: false,
    isSuperAdmin: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (activation.isAssignee) {
    userData.isAssignee = true;
    if (activation.assigneeEntityType) userData.assigneeEntityType = activation.assigneeEntityType;
  }
  if (activation.phone) userData.phoneNumber = activation.phone;
  if (activation.mailingAddress) userData.mailingAddress = activation.mailingAddress;
  if (activation.emergencyContact) userData.emergencyContact = activation.emergencyContact;

  // For tenants, add tenant links
  if (activation.role === 'tenant' && activation.tenantId) {
    let llcIdsForLinks = activation.llcIds.filter(id => id);

    // If no LLCs specified, discover them from existing leases
    if (llcIdsForLinks.length === 0) {
      const leasesSnap = await adminDb
        .collectionGroup('leases')
        .where('tenantIds', 'array-contains', activation.tenantId)
        .where('status', 'in', ['draft', 'active'])
        .get();

      const discoveredLlcIds = new Set<string>();
      for (const doc of leasesSnap.docs) {
        const leaseData = doc.data();
        if (leaseData.llcId) {
          discoveredLlcIds.add(leaseData.llcId);
        }
      }
      llcIdsForLinks = Array.from(discoveredLlcIds);
    }

    if (llcIdsForLinks.length > 0) {
      userData.tenantLinks = llcIdsForLinks.map(llcId => ({
        llcId,
        tenantId: activation.tenantId!,
      }));
    } else {
      // No LLCs found yet — store link without llcId so it can be populated later
      userData.tenantLinks = [{ llcId: '', tenantId: activation.tenantId }];
    }
  } else {
    userData.tenantLinks = [];
  }

  await adminDb.collection('users').doc(userId).set(userData);

  // For staff roles, create user assignment
  if (activation.role !== 'tenant' && activation.llcIds.length > 0) {
    const assignmentData = {
      userId,
      role: activation.role,
      llcIds: activation.llcIds,
      propertyIds: activation.propertyIds,
      capabilities: activation.capabilities || {
        workOrderAccess: true,
        taskAccess: true,
        paymentProcessing: false,
      },
      status: 'active',
      assignedByUserId: activation.createdBy,
      createdAt: FieldValue.serverTimestamp(),
    };
    await adminDb.collection('userAssignments').add(assignmentData);
  }

  // For admin role, also create LLC membership
  if (activation.role === 'admin') {
    for (const llcId of activation.llcIds) {
      await adminDb.collection('llcs').doc(llcId).collection('members').doc(userId).set({
        userId,
        role: 'admin',
        status: 'active',
        joinedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // For tenants, update the tenant record with userId and add userId to leases
  if (activation.role === 'tenant' && activation.tenantId) {
    await adminDb.collection('tenants').doc(activation.tenantId).update({
      userId,
      updates: FieldValue.arrayUnion({
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      }),
    });

    // Add userId to tenantUserIds on all leases that reference this tenant
    const leaseSnap = await adminDb
      .collectionGroup('leases')
      .where('tenantIds', 'array-contains', activation.tenantId)
      .get();

    for (const leaseDoc of leaseSnap.docs) {
      await leaseDoc.ref.update({
        tenantUserIds: FieldValue.arrayUnion(userId),
      });
    }
  }

  // Mark activation as activated and clear confirmation token
  await adminDb.collection(COLLECTION).doc(activationId).update({
    status: 'activated',
    activatedAt: FieldValue.serverTimestamp(),
    activatedUserId: userId,
    confirmationToken: FieldValue.delete(),
    confirmationTokenExpiresAt: FieldValue.delete(),
  });

  return { userId, userType };
}

/**
 * Override activate - Super-admin bypasses the user-facing verification flow
 * and directly creates an account for a pending activation.
 */
export async function overrideActivation(
  activationId: string,
  email: string,
  password: string
): Promise<{ userId: string; userType: UserType }> {
  const activation = await getActivation(activationId);
  if (!activation || activation.status !== 'pending') {
    throw new Error('Activation not found or already used');
  }

  // Check if email is already in use
  try {
    await adminAuth.getUserByEmail(email);
    throw new Error('Email already in use');
  } catch (error: unknown) {
    const authError = error as { code?: string };
    if (authError.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  const displayName = activation.middleInitial
    ? `${activation.firstName} ${activation.middleInitial}. ${activation.lastName}`
    : `${activation.firstName} ${activation.lastName}`;

  const userRecord = await adminAuth.createUser({ email, password, displayName });
  const userId = userRecord.uid;
  const userType: UserType = activation.role === 'tenant' ? 'tenant' : 'staff';

  const userData: Record<string, unknown> = {
    email,
    displayName,
    userType,
    status: 'active',
    isPlatformSuperAdmin: false,
    isSuperAdmin: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (activation.isAssignee) {
    userData.isAssignee = true;
    if (activation.assigneeEntityType) userData.assigneeEntityType = activation.assigneeEntityType;
  }
  if (activation.phone) userData.phoneNumber = activation.phone;
  if (activation.mailingAddress) userData.mailingAddress = activation.mailingAddress;
  if (activation.emergencyContact) userData.emergencyContact = activation.emergencyContact;

  if (activation.role === 'tenant' && activation.tenantId) {
    let llcIdsForLinks = activation.llcIds.filter(id => id);
    if (llcIdsForLinks.length === 0) {
      const leasesSnap = await adminDb
        .collectionGroup('leases')
        .where('tenantIds', 'array-contains', activation.tenantId)
        .where('status', 'in', ['draft', 'active'])
        .get();
      const discoveredLlcIds = new Set<string>();
      for (const doc of leasesSnap.docs) {
        const leaseData = doc.data();
        if (leaseData.llcId) discoveredLlcIds.add(leaseData.llcId);
      }
      llcIdsForLinks = Array.from(discoveredLlcIds);
    }
    userData.tenantLinks = llcIdsForLinks.length > 0
      ? llcIdsForLinks.map(llcId => ({ llcId, tenantId: activation.tenantId! }))
      : [{ llcId: '', tenantId: activation.tenantId }];
  } else {
    userData.tenantLinks = [];
  }

  await adminDb.collection('users').doc(userId).set(userData);

  if (activation.role !== 'tenant' && activation.llcIds.length > 0) {
    const assignmentData = {
      userId,
      role: activation.role,
      llcIds: activation.llcIds,
      propertyIds: activation.propertyIds,
      capabilities: activation.capabilities || {
        workOrderAccess: true,
        taskAccess: true,
        paymentProcessing: false,
      },
      status: 'active',
      assignedByUserId: activation.createdBy,
      createdAt: FieldValue.serverTimestamp(),
    };
    await adminDb.collection('userAssignments').add(assignmentData);
  }

  if (activation.role === 'admin') {
    for (const llcId of activation.llcIds) {
      await adminDb.collection('llcs').doc(llcId).collection('members').doc(userId).set({
        userId,
        role: 'admin',
        status: 'active',
        joinedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  if (activation.role === 'tenant' && activation.tenantId) {
    await adminDb.collection('tenants').doc(activation.tenantId).update({
      userId,
      updates: FieldValue.arrayUnion({ updatedAt: new Date().toISOString(), updatedBy: userId }),
    });
    const leaseSnap = await adminDb
      .collectionGroup('leases')
      .where('tenantIds', 'array-contains', activation.tenantId)
      .get();
    for (const leaseDoc of leaseSnap.docs) {
      await leaseDoc.ref.update({ tenantUserIds: FieldValue.arrayUnion(userId) });
    }
  }

  await adminDb.collection(COLLECTION).doc(activationId).update({
    status: 'activated',
    activatedAt: FieldValue.serverTimestamp(),
    activatedUserId: userId,
  });

  return { userId, userType };
}

/**
 * Check if user can create activation with given role
 */
export function canCreateActivation(
  context: {
    isPlatformSuperAdmin: boolean;
    effectiveRole: string | null;
    adminOfLlcIds: string[];
    assignedLlcIds: string[];
    assignedPropertyIds: string[];
  },
  targetRole: ActivationRole,
  llcIds: string[],
  propertyIds: string[]
): boolean {
  // Platform super-admin can create any type
  if (context.isPlatformSuperAdmin) {
    return true;
  }

  // Admin can create manager, employee, tenant within their LLC(s)
  if (context.effectiveRole === 'admin') {
    if (targetRole === 'admin') return false; // Admins can't create other admins
    // Verify all llcIds are ones the admin has access to
    return llcIds.every(id => context.adminOfLlcIds.includes(id));
  }

  // Manager can create employee, tenant within their property scope
  if (context.effectiveRole === 'manager') {
    if (targetRole !== 'employee' && targetRole !== 'tenant') return false;
    // Verify all llcIds are assigned and properties are in scope
    const validLlcs = llcIds.every(id => context.assignedLlcIds.includes(id));
    const validProps = propertyIds.length === 0 ||
      propertyIds.every(id => context.assignedPropertyIds.includes(id));
    return validLlcs && validProps;
  }

  return false;
}
