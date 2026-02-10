import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue } from 'firebase-admin/firestore';
import { collections, db } from '../firebase/admin';

/**
 * Get the current local date parts for a given timezone.
 */
function getLocalDate(timezone: string): { day: number; month: number; year: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  let day = 0;
  let month = 0;
  let year = 0;
  for (const part of parts) {
    if (part.type === 'day') day = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'year') year = parseInt(part.value, 10);
  }

  return { day, month, year };
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const generateMonthlyCharges = onSchedule('every 1 hours', async () => {
  const llcsSnapshot = await collections.llcs().get();

  for (const llcDoc of llcsSnapshot.docs) {
    const llc = llcDoc.data();
    const llcId = llcDoc.id;
    const timezone = llc.settings?.timezone || 'America/New_York';

    const { day: dayOfMonth, month, year } = getLocalDate(timezone);
    const currentPeriod = `${year}-${String(month).padStart(2, '0')}`;

    // Query active leases where dueDay matches today
    const leasesSnapshot = await collections
      .leases(llcId)
      .where('status', '==', 'active')
      .where('dueDay', '==', dayOfMonth)
      .get();

    let chargesGenerated = 0;
    const todayStr = `${currentPeriod}-${String(dayOfMonth).padStart(2, '0')}`;

    for (const leaseDoc of leasesSnapshot.docs) {
      const lease = leaseDoc.data();

      // Skip if charge already generated for this period
      if (lease.lastChargeGeneratedPeriod === currentPeriod) {
        continue;
      }

      // Verify lease is active for this period
      if (lease.startDate > todayStr || lease.endDate < todayStr) {
        continue;
      }

      const batch = db.batch();

      // Create charge document
      const chargeRef = collections.charges(llcId).doc();
      batch.set(chargeRef, {
        llcId,
        leaseId: leaseDoc.id,
        tenantUserId: lease.tenantUserIds?.[0] || null,
        period: currentPeriod,
        type: 'rent',
        description: `Rent for ${MONTH_NAMES[month]} ${year}`,
        amount: lease.rentAmount,
        paidAmount: 0,
        status: 'open',
        dueDate: todayStr,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update lease with last charge generated period
      batch.update(collections.leases(llcId).doc(leaseDoc.id), {
        lastChargeGeneratedPeriod: currentPeriod,
      });

      await batch.commit();
      chargesGenerated++;
    }

    if (chargesGenerated > 0) {
      console.log(`Generated ${chargesGenerated} rent charges for LLC ${llcId}`);
    }
  }
});
