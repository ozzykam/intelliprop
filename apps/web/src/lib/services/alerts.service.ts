import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type AlertType = 'lease_expiring' | 'charge_overdue' | 'payment_due' | 'case_hearing' | 'task_due' | 'mortgage_payment_due' | 'claim_task_due' | 'court_deadline';
export type AlertSeverity = 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  llcId: string;
  llcName: string;
  entityType: string;
  entityId: string;
  caseId?: string;
  claimId?: string;
  dueDate?: string;
  amount?: number;
}

/**
 * Get all LLCs accessible to a user
 */
async function getUserLlcs(userId: string): Promise<{ id: string; legalName: string }[]> {
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
 * Get alerts for a single LLC
 */
async function getLlcAlerts(llcId: string, llcName: string): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const futureDate30 = thirtyDaysFromNow.toISOString().slice(0, 10);
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
  const futureDate60 = sixtyDaysFromNow.toISOString().slice(0, 10);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const futureDate7 = sevenDaysFromNow.toISOString().slice(0, 10);
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
  const futureDate5 = fiveDaysFromNow.toISOString().slice(0, 10);

  const llcRef = adminDb.collection('llcs').doc(llcId);

  // Fetch all alert sources in parallel
  const [leasesSnap, chargesSnap, casesSnap, tasksSnap, claimsSnap, deadlinesSnap] = await Promise.all([
    // Active leases expiring within 60 days
    llcRef.collection('leases').where('status', '==', 'active').get(),
    // Open/partial charges
    llcRef.collection('charges').where('status', 'in', ['open', 'partial']).get(),
    // Open cases with upcoming hearings
    llcRef.collection('cases').where('status', 'in', ['open', 'stayed']).get(),
    // Pending tasks (query all cases for tasks)
    adminDb.collectionGroup('tasks').where('status', 'in', ['pending', 'in_progress']).get(),
    // All claims — used to fetch claim tasks per-claim (avoids needing a collection group index)
    llcRef.collection('insuranceClaims').get(),
    // Pending court deadlines for this LLC
    adminDb.collectionGroup('deadlines').where('llcId', '==', llcId).where('status', '==', 'pending').get(),
  ]);

  // Fetch incomplete tasks for each claim in parallel
  const claimTaskSnaps = await Promise.all(
    claimsSnap.docs.map(claimDoc =>
      claimDoc.ref.collection('tasks').where('completed', '==', false).get()
    )
  );
  const claimTaskDocs = claimTaskSnaps.flatMap(snap => snap.docs);

  // Process expiring / expired leases (still marked active)
  for (const doc of leasesSnap.docs) {
    const lease = doc.data();
    if (!lease.endDate) continue;

    if (lease.endDate < today) {
      // Already expired but still active — overdue alert
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(lease.endDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `lease-${doc.id}`,
        type: 'lease_expiring',
        severity: 'critical',
        title: 'Lease Expired',
        description: `Lease expired ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
        llcId,
        llcName,
        entityType: 'lease',
        entityId: doc.id,
        dueDate: lease.endDate,
      });
    } else if (lease.endDate <= futureDate60) {
      const daysUntilExpiry = Math.ceil(
        (new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `lease-${doc.id}`,
        type: 'lease_expiring',
        severity: daysUntilExpiry <= 30 ? 'critical' : 'warning',
        title: 'Lease Expiring',
        description: `Lease expires in ${daysUntilExpiry} days`,
        llcId,
        llcName,
        entityType: 'lease',
        entityId: doc.id,
        dueDate: lease.endDate,
      });
    }
  }

  // Process overdue charges
  for (const doc of chargesSnap.docs) {
    const charge = doc.data();
    if (charge.dueDate < today) {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(charge.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const outstanding = (charge.amount || 0) - (charge.paidAmount || 0);

      alerts.push({
        id: `charge-${doc.id}`,
        type: 'charge_overdue',
        severity: daysOverdue > 30 ? 'critical' : 'warning',
        title: 'Overdue Charge',
        description: `$${(outstanding / 100).toFixed(2)} overdue by ${daysOverdue} days`,
        llcId,
        llcName,
        entityType: 'charge',
        entityId: doc.id,
        dueDate: charge.dueDate,
        amount: outstanding,
      });
    }
  }

  // Process upcoming payments due within 5 days
  for (const doc of chargesSnap.docs) {
    const charge = doc.data();
    // Due date is today or in the future, but within 5 days
    if (charge.dueDate >= today && charge.dueDate <= futureDate5) {
      const daysUntilDue = Math.ceil(
        (new Date(charge.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const outstanding = (charge.amount || 0) - (charge.paidAmount || 0);

      // Only alert if there's an outstanding balance
      if (outstanding > 0) {
        alerts.push({
          id: `payment-${doc.id}`,
          type: 'payment_due',
          severity: daysUntilDue <= 2 ? 'critical' : 'warning',
          title: 'Payment Due',
          description: daysUntilDue === 0
            ? `$${(outstanding / 100).toFixed(2)} due today`
            : `$${(outstanding / 100).toFixed(2)} due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
          llcId,
          llcName,
          entityType: 'charge',
          entityId: doc.id,
          dueDate: charge.dueDate,
          amount: outstanding,
        });
      }
    }
  }

  // Process case hearings (upcoming + overdue on open cases)
  for (const doc of casesSnap.docs) {
    const caseData = doc.data();
    if (!caseData.nextHearingDate) continue;

    if (caseData.nextHearingDate < today) {
      // Past hearing still on an open/stayed case
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(caseData.nextHearingDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `case-${doc.id}`,
        type: 'case_hearing',
        severity: 'critical',
        title: 'Hearing Overdue',
        description: `${caseData.caseType || 'Case'} hearing was ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
        llcId,
        llcName,
        entityType: 'case',
        entityId: doc.id,
        dueDate: caseData.nextHearingDate,
      });
    } else if (caseData.nextHearingDate <= futureDate30) {
      const daysUntilHearing = Math.ceil(
        (new Date(caseData.nextHearingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `case-${doc.id}`,
        type: 'case_hearing',
        severity: daysUntilHearing <= 7 ? 'critical' : 'warning',
        title: 'Upcoming Hearing',
        description: `${caseData.caseType || 'Case'} hearing in ${daysUntilHearing} days`,
        llcId,
        llcName,
        entityType: 'case',
        entityId: doc.id,
        dueDate: caseData.nextHearingDate,
      });
    }
  }

  // Process due tasks (upcoming + overdue, filter to this LLC)
  for (const doc of tasksSnap.docs) {
    const task = doc.data();
    const caseRef = doc.ref.parent.parent;
    if (!caseRef) continue;

    // Check if this task belongs to a case in this LLC
    const casePath = caseRef.path;
    if (!casePath.startsWith(`llcs/${llcId}/`)) continue;

    if (!task.dueDate) continue;

    if (task.dueDate < today) {
      // Overdue task
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `task-${doc.id}`,
        type: 'task_due',
        severity: 'critical',
        title: 'Task Overdue',
        description: task.title || `Task overdue by ${daysOverdue} days`,
        llcId,
        llcName,
        entityType: 'task',
        entityId: doc.id,
        caseId: caseRef.id,
        dueDate: task.dueDate,
      });
    } else if (task.reminderDate && task.reminderDate <= today) {
      alerts.push({
        id: `task-${doc.id}`,
        type: 'task_due',
        severity: 'warning',
        title: 'Task Reminder',
        description: task.title || 'Task reminder',
        llcId,
        llcName,
        entityType: 'task',
        entityId: doc.id,
        caseId: caseRef.id,
        dueDate: task.dueDate,
      });
    }
  }

  // Process claim tasks with due dates (upcoming + overdue)
  for (const doc of claimTaskDocs) {
    const task = doc.data();
    if (!task.dueDate) continue;

    const claimRef = doc.ref.parent.parent;
    if (!claimRef) continue;

    if (task.dueDate < today) {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `claim-task-${doc.id}`,
        type: 'claim_task_due',
        severity: 'critical',
        title: 'Claim Task Overdue',
        description: task.title || `Task overdue by ${daysOverdue} days`,
        llcId,
        llcName,
        entityType: 'claim_task',
        entityId: doc.id,
        claimId: claimRef.id,
        dueDate: task.dueDate,
      });
    } else if (task.dueDate <= futureDate7) {
      const daysUntilDue = Math.ceil(
        (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `claim-task-${doc.id}`,
        type: 'claim_task_due',
        severity: daysUntilDue <= 2 ? 'critical' : 'warning',
        title: 'Claim Task Due',
        description: task.title || `Task due in ${daysUntilDue} days`,
        llcId,
        llcName,
        entityType: 'claim_task',
        entityId: doc.id,
        claimId: claimRef.id,
        dueDate: task.dueDate,
      });
    }
  }

  // Process pending court deadlines (overdue always; upcoming only if reminderDate <= today)
  for (const doc of deadlinesSnap.docs) {
    const dl = doc.data();
    if (!dl.dueDate) continue;

    const deadlineRef = doc.ref; // llcs/{llcId}/cases/{caseId}/deadlines/{deadlineId}
    const caseRef = deadlineRef.parent.parent;
    if (!caseRef) continue;

    if (dl.dueDate < today) {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(dl.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `deadline-${doc.id}`,
        type: 'court_deadline',
        severity: 'critical',
        title: 'Court Deadline Missed',
        description: `${dl.description} — overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`,
        llcId,
        llcName,
        entityType: 'deadline',
        entityId: doc.id,
        caseId: caseRef.id,
        dueDate: dl.dueDate,
      });
    } else if (dl.reminderDate && dl.reminderDate <= today) {
      alerts.push({
        id: `deadline-${doc.id}`,
        type: 'court_deadline',
        severity: 'warning',
        title: 'Court Deadline Reminder',
        description: `${dl.description}`,
        llcId,
        llcName,
        entityType: 'deadline',
        entityId: doc.id,
        caseId: caseRef.id,
        dueDate: dl.dueDate,
      });
    }
  }

  return alerts;
}

/**
 * Persist an acknowledged alert ID so it never surfaces again for this user.
 */
export async function acknowledgeAlert(userId: string, alertId: string): Promise<void> {
  await adminDb.collection('users').doc(userId).set(
    { acknowledgedAlertIds: FieldValue.arrayUnion(alertId) },
    { merge: true }
  );
}

/**
 * Get mortgage payment alerts (super-admin only)
 */
async function getMortgageAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const today = new Date();
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(today.getDate() + 5);
  const futureDateStr = fiveDaysFromNow.toISOString().slice(0, 10);

  const mortgagesSnap = await adminDb
    .collection('mortgages')
    .where('status', '==', 'active')
    .where('nextPaymentDate', '<=', futureDateStr)
    .get();

  for (const doc of mortgagesSnap.docs) {
    const mortgage = doc.data();
    const daysUntil = Math.ceil(
      (new Date(mortgage.nextPaymentDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Format amount for display
    const amount = mortgage.totalPayment || 0;
    const formattedAmount = '$' + (amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });

    alerts.push({
      id: `mortgage-${doc.id}`,
      type: 'mortgage_payment_due',
      severity: daysUntil <= 2 ? 'critical' : 'warning',
      title: daysUntil <= 0 ? 'Mortgage Payment Due TODAY' : `Mortgage Payment Due in ${daysUntil} days`,
      description: `${mortgage.propertyAddress} - ${formattedAmount} to ${mortgage.lender}`,
      llcId: mortgage.llcId,
      llcName: mortgage.llcName,
      entityType: 'mortgage',
      entityId: doc.id,
      dueDate: mortgage.nextPaymentDate,
      amount: mortgage.totalPayment,
    });
  }

  return alerts;
}

/**
 * Get all alerts across all user's LLCs, excluding acknowledged ones.
 */
export async function getOwnerAlerts(userId: string): Promise<Alert[]> {
  const [userLlcs, userDoc] = await Promise.all([
    getUserLlcs(userId),
    adminDb.collection('users').doc(userId).get(),
  ]);

  const acknowledgedIds = new Set<string>(userDoc.data()?.acknowledgedAlertIds ?? []);
  const isSuperAdmin = userDoc.exists && userDoc.data()?.isSuperAdmin === true;

  const allAlerts: Alert[] = [];

  // Fetch LLC alerts if user has access to any LLCs
  if (userLlcs.length > 0) {
    const alertPromises = userLlcs.map(llc => getLlcAlerts(llc.id, llc.legalName));
    const alertArrays = await Promise.all(alertPromises);
    allAlerts.push(...alertArrays.flat());
  }

  // Fetch mortgage alerts for super-admins
  if (isSuperAdmin) {
    const mortgageAlerts = await getMortgageAlerts();
    allAlerts.push(...mortgageAlerts);
  }

  // Sort by severity (critical first) then by due date
  allAlerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  // Filter out acknowledged alerts
  return allAlerts.filter(a => !acknowledgedIds.has(a.id));
}
