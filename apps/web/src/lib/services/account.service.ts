import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  Organization,
  OrgMember,
  CreateOrgInput,
  UpdateOrgInput,
  AddOrgMemberInput,
  UpdateOrgMemberInput,
} from '@shared/types';

export async function createOrg(
  input: CreateOrgInput,
  actorUserId: string
): Promise<{ id: string; name: string; ownerUserId: string; status: 'active'; createdBy: string }> {
  const orgRef = adminDb.collection('accounts').doc();
  const memberRef = orgRef.collection('accountMembers').doc(input.ownerUserId);

  const orgData = {
    name: input.name,
    ownerUserId: input.ownerUserId,
    status: 'active' as const,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorUserId,
  };

  const batch = adminDb.batch();
  batch.set(orgRef, orgData);
  batch.set(memberRef, {
    userId: input.ownerUserId,
    role: 'owner' as const,
    status: 'active' as const,
    addedAt: FieldValue.serverTimestamp(),
    addedByUserId: actorUserId,
  });
  await batch.commit();

  return { id: orgRef.id, name: orgData.name, ownerUserId: orgData.ownerUserId, status: orgData.status, createdBy: actorUserId };
}

export async function getOrg(accountId: string): Promise<(Organization & { id: string }) | null> {
  const doc = await adminDb.collection('accounts').doc(accountId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Organization & { id: string };
}

export async function updateOrg(
  accountId: string,
  input: UpdateOrgInput,
  actorUserId: string
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp(), updatedBy: actorUserId };
  if (input.name !== undefined) updates.name = input.name;
  if (input.status !== undefined) updates.status = input.status;
  await adminDb.collection('accounts').doc(accountId).update(updates);
}

export async function listOrgs(): Promise<(Organization & { id: string })[]> {
  const snap = await adminDb.collection('accounts').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Organization & { id: string });
}

export async function listOrgMembers(
  accountId: string
): Promise<(OrgMember & { userId: string })[]> {
  const snap = await adminDb
    .collection('accounts')
    .doc(accountId)
    .collection('accountMembers')
    .get();
  return snap.docs.map(d => ({ userId: d.id, ...d.data() }) as OrgMember & { userId: string });
}

export async function addOrgMember(
  accountId: string,
  input: AddOrgMemberInput,
  actorUserId: string
): Promise<void> {
  const memberRef = adminDb
    .collection('accounts')
    .doc(accountId)
    .collection('accountMembers')
    .doc(input.userId);

  await memberRef.set({
    userId: input.userId,
    role: input.role,
    status: 'active',
    addedAt: FieldValue.serverTimestamp(),
    addedByUserId: actorUserId,
  });
}

export async function updateOrgMember(
  accountId: string,
  userId: string,
  input: UpdateOrgMemberInput,
  actorUserId: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUserId: actorUserId,
  };
  if (input.role !== undefined) updates.role = input.role;
  if (input.status !== undefined) updates.status = input.status;

  await adminDb
    .collection('accounts')
    .doc(accountId)
    .collection('accountMembers')
    .doc(userId)
    .update(updates);
}

export async function removeOrgMember(
  accountId: string,
  userId: string,
  actorUserId: string
): Promise<void> {
  await adminDb
    .collection('accounts')
    .doc(accountId)
    .collection('accountMembers')
    .doc(userId)
    .update({
      status: 'disabled',
      removedAt: FieldValue.serverTimestamp(),
      removedByUserId: actorUserId,
    });
}

export async function listOrgLlcs(
  accountId: string
): Promise<{ id: string; legalName: string; status: string }[]> {
  const snap = await adminDb
    .collection('llcs')
    .where('accountId', '==', accountId)
    .get();
  return snap.docs.map(d => ({
    id: d.id,
    legalName: d.data().legalName as string,
    status: d.data().status as string,
  }));
}

export async function assignLlcToOrg(
  llcId: string,
  accountId: string,
  actorUserId: string
): Promise<void> {
  await adminDb.collection('llcs').doc(llcId).update({
    accountId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorUserId,
  });
}
