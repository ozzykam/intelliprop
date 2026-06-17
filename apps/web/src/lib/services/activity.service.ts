import { adminDb } from '@/lib/firebase/admin';
import { getUser } from '@/lib/services/user.service';

export interface ActivityItem {
  id: string;
  llcId: string;
  llcName: string;
  action: 'create' | 'update' | 'delete' | 'void';
  entityType: string;
  entityId: string;
  description: string;
  actorUserId: string;
  createdAt: string;
}

/**
 * Get LLCs accessible to a user, optionally scoped to a specific org account.
 */
async function getUserLlcs(userId: string, accountId?: string): Promise<{ id: string; legalName: string }[]> {
  if (accountId) {
    const snap = await adminDb
      .collection('llcs')
      .where('accountId', '==', accountId)
      .where('status', '==', 'active')
      .get();
    return snap.docs.map(d => ({ id: d.id, legalName: d.data().legalName || 'Unknown' }));
  }

  const membershipsSnapshot = await adminDb
    .collectionGroup('members')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const llcs: { id: string; legalName: string }[] = [];

  for (const memberDoc of membershipsSnapshot.docs) {
    const llcRef = memberDoc.ref.parent.parent;
    if (llcRef) {
      const llcDoc = await llcRef.get();
      if (llcDoc.exists && llcDoc.data()?.status === 'active') {
        llcs.push({
          id: llcDoc.id,
          legalName: llcDoc.data()?.legalName || 'Unknown',
        });
      }
    }
  }

  return llcs;
}

/**
 * Format entity type for display
 */
function formatEntityType(entityType: string): string {
  const typeMap: Record<string, string> = {
    llc: 'LLC',
    property: 'Property',
    unit: 'Unit',
    tenant: 'Tenant',
    lease: 'Lease',
    charge: 'Charge',
    payment: 'Payment',
    case: 'Case',
    task: 'Task',
    document: 'Document',
    member: 'Member',
  };
  return typeMap[entityType] || entityType;
}

/**
 * Generate description from audit log entry
 */
function generateDescription(action: string, entityType: string, changes?: Record<string, unknown>): string {
  const formattedType = formatEntityType(entityType);
  const actionVerb = action === 'create' ? 'Created' :
                     action === 'update' ? 'Updated' :
                     action === 'delete' ? 'Deleted' :
                     action === 'void' ? 'Voided' : action;

  // Try to extract a name or identifier from changes
  let identifier = '';
  if (changes?.after) {
    const after = changes.after as Record<string, unknown>;
    identifier = (after.legalName || after.name || after.title || after.unitNumber || '') as string;
  }

  if (identifier) {
    return `${actionVerb} ${formattedType.toLowerCase()} "${identifier}"`;
  }

  return `${actionVerb} ${formattedType.toLowerCase()}`;
}

/**
 * Get recent activity for a single LLC
 */
async function getLlcActivity(llcId: string, llcName: string, limit: number): Promise<ActivityItem[]> {
  const auditLogsSnap = await adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('auditLogs')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return auditLogsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      llcId,
      llcName,
      action: data.action || 'update',
      entityType: data.entityType || 'unknown',
      entityId: data.entityId || '',
      description: generateDescription(data.action, data.entityType, data.changes),
      actorUserId: data.actorUserId || '',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });
}

/**
 * Get recent activity across the user's LLCs, scoped to an org when accountId is provided.
 */
export async function getRecentActivity(userId: string, limit = 20, accountId?: string): Promise<ActivityItem[]> {
  const userLlcs = await getUserLlcs(userId, accountId);

  if (userLlcs.length === 0) {
    return [];
  }

  // Fetch activity for all LLCs in parallel (get more per LLC to ensure we have enough after merging)
  const perLlcLimit = Math.max(10, Math.ceil(limit / userLlcs.length) * 2);
  const activityPromises = userLlcs.map(llc => getLlcActivity(llc.id, llc.legalName, perLlcLimit));
  const activityArrays = await Promise.all(activityPromises);

  // Flatten and sort by createdAt (most recent first)
  const allActivity = activityArrays.flat();

  allActivity.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return allActivity.slice(0, limit);
}

export interface PaginatedActivityOptions {
  page: number;   // 1-based
  limit: number;  // 1–200
}

export interface PaginatedActivityResult {
  items: (ActivityItem & { actorDisplayName: string })[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Get paginated activity across the user's LLCs with actor display names resolved.
 * Scoped to an org when accountId is provided.
 */
export async function getPaginatedActivity(
  userId: string,
  options: PaginatedActivityOptions,
  accountId?: string
): Promise<PaginatedActivityResult> {
  const { page, limit } = options;
  const userLlcs = await getUserLlcs(userId, accountId);

  if (userLlcs.length === 0) {
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  // Fetch a generous amount per LLC to get an accurate total (cap at 500 total)
  const perLlcCap = Math.ceil(500 / userLlcs.length);
  const activityPromises = userLlcs.map(llc => getLlcActivity(llc.id, llc.legalName, perLlcCap));
  const activityArrays = await Promise.all(activityPromises);

  // Flatten and sort by createdAt desc
  const allActivity = activityArrays.flat();
  allActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = allActivity.length;
  const start = (page - 1) * limit;
  const pageItems = allActivity.slice(start, start + limit);

  // Resolve actor display names
  const uniqueActorIds = [...new Set(pageItems.map(item => item.actorUserId).filter(Boolean))];
  const userMap = new Map<string, string>();

  await Promise.all(
    uniqueActorIds.map(async (actorId) => {
      const user = await getUser(actorId);
      userMap.set(actorId, user?.displayName || user?.email || 'Unknown User');
    })
  );

  const items = pageItems.map(item => ({
    ...item,
    actorDisplayName: userMap.get(item.actorUserId) || 'Unknown User',
  }));

  return { items, total, page, limit, hasMore: page * limit < total };
}
