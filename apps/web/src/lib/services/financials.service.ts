import { adminDb } from '@/lib/firebase/admin';

export interface ARChargeDetail {
  chargeId: string;
  period: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
}

export interface ARLeaseRow {
  leaseId: string;
  llcId: string;
  llcName: string;
  propertyId: string;
  propertyName: string;
  unitIds: string[];
  unitNumbers: string;   // comma-joined display string
  rentAmount: number;    // monthly, cents (from publishedLeases.monthlyRent)
  dueDay: number;
  leaseEndDate: string;
  overdueAmount: number;
  overdueCharges: ARChargeDetail[];
}

export interface ARPropertyGroup {
  propertyId: string;
  propertyName: string;
  monthlyIncome: number;
  overdueAmount: number;
  leases: ARLeaseRow[];
}

export interface ARLlcGroup {
  llcId: string;
  llcName: string;
  monthlyIncome: number;
  overdueAmount: number;
  properties: ARPropertyGroup[];
}

export interface ARData {
  totalMonthlyIncome: number;
  totalOverdue: number;
  llcs: ARLlcGroup[];
  overdueByLease: ARLeaseRow[];
}

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

async function getArForLlc(
  llcId: string,
  llcName: string,
  today: string
): Promise<ARLlcGroup & { leaseRows: ARLeaseRow[] }> {
  const llcRef = adminDb.collection('llcs').doc(llcId);

  const [propertiesSnap, publishedLeasesSnap, chargesSnap, allUnitsSnap] = await Promise.all([
    llcRef.collection('properties').where('status', '!=', 'sold').get(),
    llcRef.collection('publishedLeases').where('status', '==', 'active').get(),
    llcRef.collection('charges').where('status', 'in', ['open', 'partial']).get(),
    adminDb.collectionGroup('units').get(),
  ]);

  // Map propertyId → display name
  const propertyMap = new Map<string, string>();
  for (const doc of propertiesSnap.docs) {
    const d = doc.data();
    const name: string =
      d.name ||
      (d.address ? `${d.address.street1}${d.address.city ? ', ' + d.address.city : ''}` : '') ||
      doc.id;
    propertyMap.set(doc.id, name);
  }

  const propertyIds = new Set(propertiesSnap.docs.map(d => d.id));

  // Map unitId → unit number, filtered to this LLC's properties
  const unitMap = new Map<string, string>();
  for (const doc of allUnitsSnap.docs) {
    const propertyRef = doc.ref.parent.parent;
    if (propertyRef && propertyIds.has(propertyRef.id)) {
      const d = doc.data();
      unitMap.set(doc.id, d.unitNumber ?? d.number ?? doc.id);
    }
  }

  // Build overdue charge details per publishedLease ID
  const overdueByLease = new Map<string, { amount: number; charges: ARChargeDetail[] }>();
  for (const doc of chargesSnap.docs) {
    const c = doc.data();
    if (c.dueDate < today && c.leaseId) {
      const existing = overdueByLease.get(c.leaseId) ?? { amount: 0, charges: [] };
      const net = (c.amount || 0) - (c.paidAmount || 0);
      existing.amount += net;
      existing.charges.push({
        chargeId: doc.id,
        period: c.period ?? c.description ?? '',
        amount: c.amount || 0,
        paidAmount: c.paidAmount || 0,
        dueDate: c.dueDate,
      });
      overdueByLease.set(c.leaseId, existing);
    }
  }

  // Build lease rows from publishedLeases
  const leaseRows: ARLeaseRow[] = [];
  for (const doc of publishedLeasesSnap.docs) {
    const pl = doc.data();
    const propertyId: string = pl.propertyId ?? '';
    const propertyName = propertyMap.get(propertyId) ?? propertyId;
    const unitIds: string[] = pl.unitIds ?? [];
    const unitNumbers = unitIds.map(id => unitMap.get(id) ?? id).join(', ') || '—';
    const overdue = overdueByLease.get(doc.id) ?? { amount: 0, charges: [] };

    leaseRows.push({
      leaseId: doc.id,
      llcId,
      llcName,
      propertyId,
      propertyName,
      unitIds,
      unitNumbers,
      rentAmount: pl.monthlyRent ?? 0,
      dueDay: pl.dueDay ?? 1,
      leaseEndDate: pl.endDate ?? '',
      overdueAmount: overdue.amount,
      overdueCharges: overdue.charges,
    });
  }

  // Group leases by property
  const propertyGroups = new Map<string, ARPropertyGroup>();

  for (const row of leaseRows) {
    if (!propertyGroups.has(row.propertyId)) {
      propertyGroups.set(row.propertyId, {
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        monthlyIncome: 0,
        overdueAmount: 0,
        leases: [],
      });
    }
    const pg = propertyGroups.get(row.propertyId)!;
    pg.monthlyIncome += row.rentAmount;
    pg.overdueAmount += row.overdueAmount;
    pg.leases.push(row);
  }

  const properties = Array.from(propertyGroups.values());
  const monthlyIncome = properties.reduce((sum, p) => sum + p.monthlyIncome, 0);
  const overdueAmount = properties.reduce((sum, p) => sum + p.overdueAmount, 0);

  return {
    llcId,
    llcName,
    monthlyIncome,
    overdueAmount,
    properties,
    leaseRows,
  };
}

export async function getAccountsReceivable(userId: string, accountId?: string): Promise<ARData> {
  const today = new Date().toISOString().slice(0, 10);
  const userLlcs = await getUserLlcs(userId, accountId);

  if (userLlcs.length === 0) {
    return { totalMonthlyIncome: 0, totalOverdue: 0, llcs: [], overdueByLease: [] };
  }

  const results = await Promise.all(
    userLlcs.map(llc => getArForLlc(llc.id, llc.legalName, today))
  );

  let totalMonthlyIncome = 0;
  let totalOverdue = 0;
  const llcs: ARLlcGroup[] = [];
  const allLeaseRows: ARLeaseRow[] = [];

  for (const result of results) {
    const { leaseRows, ...llcGroup } = result;
    totalMonthlyIncome += llcGroup.monthlyIncome;
    totalOverdue += llcGroup.overdueAmount;
    llcs.push(llcGroup);
    allLeaseRows.push(...leaseRows);
  }

  const overdueByLease = allLeaseRows
    .filter(r => r.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount);

  return { totalMonthlyIncome, totalOverdue, llcs, overdueByLease };
}
