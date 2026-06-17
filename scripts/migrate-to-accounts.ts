/**
 * Migration: Introduce multi-tenant accounts layer
 *
 * What this does:
 * 1. Creates a "Default Account" in the `accounts` collection
 * 2. Adds the superAdmin user as owner in `accounts/{id}/accountMembers`
 * 3. Updates all LLCs that lack `accountId` with the default account ID
 * 4. Backfills `accountId` and `llcId` on global tenant documents
 *    by tracing users/{userId}.tenantLinks[].llcId → llcs/{llcId}.accountId
 * 5. Flags orphaned tenants (no traceable LLC) with needsManualReview: true
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json \
 *   npx ts-node --esm scripts/migrate-to-accounts.ts
 *
 * Safe to re-run: skips items already migrated.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const BATCH_SIZE = 400;

// Accept --owner <userId> flag to explicitly set the platform owner
const ownerFlagIndex = process.argv.indexOf('--owner');
const OWNER_ID_OVERRIDE: string | null = ownerFlagIndex !== -1 ? (process.argv[ownerFlagIndex + 1] ?? null) : null;

async function main() {
  console.log('=== Starting accounts migration ===\n');

  // ── Step 1: Find the superAdmin user ──────────────────────────────────────
  console.log('1. Resolving platform owner user...');
  let superAdminUserId: string;

  if (OWNER_ID_OVERRIDE) {
    superAdminUserId = OWNER_ID_OVERRIDE;
    console.log(`   Using --owner flag: ${superAdminUserId}`);
  } else {
    const usersSnap = await db.collection('users')
      .where('isPlatformSuperAdmin', '==', true)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      throw new Error(
        'No user with isPlatformSuperAdmin == true found.\n' +
        'Pass the owner user ID explicitly: --owner <userId>'
      );
    }
    superAdminUserId = usersSnap.docs[0].id;
    console.log(`   Found via isSuperAdmin: ${superAdminUserId}`);
  }

  // ── Step 2: Create default account (idempotent) ───────────────────────────
  console.log('\n2. Creating Default Account...');
  const existingSnap = await db.collection('accounts')
    .where('name', '==', 'Default Account')
    .limit(1)
    .get();

  let defaultAccountId: string;

  if (!existingSnap.empty) {
    defaultAccountId = existingSnap.docs[0].id;
    console.log(`   Default Account already exists: ${defaultAccountId}`);
  } else {
    const accountRef = db.collection('accounts').doc();
    const memberRef = accountRef.collection('accountMembers').doc(superAdminUserId);

    const batch = db.batch();
    batch.set(accountRef, {
      name: 'Default Account',
      ownerUserId: superAdminUserId,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: superAdminUserId,
    });
    batch.set(memberRef, {
      userId: superAdminUserId,
      role: 'owner',
      status: 'active',
      addedAt: FieldValue.serverTimestamp(),
      addedByUserId: superAdminUserId,
    });
    await batch.commit();

    defaultAccountId = accountRef.id;
    console.log(`   Created Default Account: ${defaultAccountId}`);
  }

  // ── Step 3: Backfill LLCs ─────────────────────────────────────────────────
  console.log('\n3. Backfilling LLCs with accountId...');
  const allLlcsSnap = await db.collection('llcs').get();
  const llcsToUpdate = allLlcsSnap.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => !d.data().accountId);
  console.log(`   ${llcsToUpdate.length} LLCs need accountId (${allLlcsSnap.size} total)`);

  // Build a map of llcId → accountId for later use in tenant backfill
  const llcAccountMap = new Map<string, string>();
  for (const doc of allLlcsSnap.docs) {
    const accountId = doc.data().accountId as string | undefined ?? defaultAccountId;
    llcAccountMap.set(doc.id, accountId);
  }

  for (let i = 0; i < llcsToUpdate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of llcsToUpdate.slice(i, i + BATCH_SIZE)) {
      batch.update(doc.ref, {
        accountId: defaultAccountId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      llcAccountMap.set(doc.id, defaultAccountId);
    }
    await batch.commit();
    console.log(`   Updated ${Math.min(i + BATCH_SIZE, llcsToUpdate.length)} / ${llcsToUpdate.length}`);
  }

  // ── Step 4: Backfill tenants via tenantLinks ──────────────────────────────
  console.log('\n4. Backfilling tenants with accountId + llcId...');
  const allTenantsSnap = await db.collection('tenants').get();
  const tenantsToUpdate = allTenantsSnap.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => !d.data().accountId);
  console.log(`   ${tenantsToUpdate.length} tenants need backfill (${allTenantsSnap.size} total)`);

  // Build tenantId → {llcId, accountId} from users.tenantLinks
  const tenantLlcMap = new Map<string, { llcId: string; accountId: string }>();

  const allUsersSnap = await db.collection('users').get();
  for (const userDoc of allUsersSnap.docs) {
    const tenantLinks = (userDoc.data().tenantLinks || []) as { llcId: string; tenantId: string }[];
    for (const link of tenantLinks) {
      if (link.tenantId && link.llcId) {
        const accountId = llcAccountMap.get(link.llcId) ?? defaultAccountId;
        tenantLlcMap.set(link.tenantId, { llcId: link.llcId, accountId });
      }
    }
  }

  let updatedTenants = 0;
  let orphanedTenants = 0;

  for (let i = 0; i < tenantsToUpdate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of tenantsToUpdate.slice(i, i + BATCH_SIZE)) {
      const mapping = tenantLlcMap.get(doc.id);
      if (mapping) {
        batch.update(doc.ref, {
          accountId: mapping.accountId,
          llcId: mapping.llcId,
          updatedAt: FieldValue.serverTimestamp(),
        });
        updatedTenants++;
      } else {
        // Orphaned tenant — assign to default account but flag for review
        batch.update(doc.ref, {
          accountId: defaultAccountId,
          llcId: null,
          needsManualReview: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        orphanedTenants++;
      }
    }
    await batch.commit();
    console.log(`   Processed ${Math.min(i + BATCH_SIZE, tenantsToUpdate.length)} / ${tenantsToUpdate.length}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Migration complete ===');
  console.log(`   Default Account ID : ${defaultAccountId}`);
  console.log(`   LLCs updated       : ${llcsToUpdate.length}`);
  console.log(`   Tenants updated    : ${updatedTenants}`);
  console.log(`   Orphaned tenants   : ${orphanedTenants} (flagged needsManualReview)`);

  if (orphanedTenants > 0) {
    console.log('\n⚠  Review orphaned tenants:');
    console.log('   db.collection("tenants").where("needsManualReview", "==", true).get()');
  }
}

main().catch(err => {
  console.error('\n✖ Migration failed:', err);
  process.exit(1);
});
