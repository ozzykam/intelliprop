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

/**
 * Generates monthly rent charges for all active published leases.
 *
 * Runs hourly. For each LLC, checks if today's day-of-month matches a lease's
 * dueDay. If so and a charge hasn't already been generated for this period,
 * creates an 'open' rent charge in the charges subcollection.
 */
export const generateMonthlyCharges = onSchedule('every 1 hours', async () => {
  const llcsSnapshot = await collections.llcs().get();

  for (const llcDoc of llcsSnapshot.docs) {
    const llc = llcDoc.data();
    const llcId = llcDoc.id;
    const timezone = llc.settings?.timezone || 'America/New_York';

    const { day: dayOfMonth, month, year } = getLocalDate(timezone);
    const currentPeriod = `${year}-${String(month).padStart(2, '0')}`;
    const todayStr = `${currentPeriod}-${String(dayOfMonth).padStart(2, '0')}`;

    // Query active published leases where dueDay matches today
    const leasesSnapshot = await collections
      .publishedLeases(llcId)
      .where('status', '==', 'active')
      .where('dueDay', '==', dayOfMonth)
      .get();

    let chargesGenerated = 0;

    for (const leaseDoc of leasesSnapshot.docs) {
      const lease = leaseDoc.data();

      // Skip if charge already generated for this period
      if (lease.lastChargeGeneratedPeriod === currentPeriod) {
        continue;
      }

      // Verify lease start date has passed
      if (lease.startDate > todayStr) {
        continue;
      }

      // For fixed-term leases, verify we haven't passed the end date
      if (lease.endDate && lease.endDate < todayStr) {
        continue;
      }

      const batch = db.batch();

      // Create charge document
      const chargeRef = collections.charges(llcId).doc();
      batch.set(chargeRef, {
        llcId,
        leaseId: leaseDoc.id,
        publishedLeaseId: leaseDoc.id,
        tenantUserId: lease.tenantIds?.[0] || null,
        period: currentPeriod,
        type: 'rent',
        description: `Rent for ${MONTH_NAMES[month]} ${year}`,
        amount: lease.monthlyRent,
        paidAmount: 0,
        status: 'open',
        dueDate: todayStr,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update published lease with last charge generated period
      batch.update(collections.publishedLeases(llcId).doc(leaseDoc.id), {
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

/**
 * Applies late fees to unpaid/partially-paid rent charges whose grace period has expired.
 *
 * Runs hourly. For each LLC, finds active published leases with late fee terms,
 * then checks for open/partial rent charges past their grace period that haven't
 * already had a late fee applied. Creates a late_fee charge and links it to the
 * original rent charge for idempotency.
 */
export const applyLateFees = onSchedule('every 1 hours', async () => {
  const llcsSnapshot = await collections.llcs().get();

  for (const llcDoc of llcsSnapshot.docs) {
    const llc = llcDoc.data();
    const llcId = llcDoc.id;
    const timezone = llc.settings?.timezone || 'America/New_York';

    const { day: dayOfMonth, month, year } = getLocalDate(timezone);
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;

    // Query active published leases that have late fee terms
    const leasesSnapshot = await collections
      .publishedLeases(llcId)
      .where('status', '==', 'active')
      .where('lateFeeType', 'in', ['flat', 'percentage'])
      .get();

    let feesApplied = 0;

    for (const leaseDoc of leasesSnapshot.docs) {
      const lease = leaseDoc.data();
      const gracePeriodDays: number = lease.gracePeriodDays ?? 0;

      // Find open/partial rent charges for this lease without a late fee already applied
      const chargesSnapshot = await collections
        .charges(llcId)
        .where('publishedLeaseId', '==', leaseDoc.id)
        .where('type', '==', 'rent')
        .where('status', 'in', ['open', 'partial'])
        .get();

      for (const chargeDoc of chargesSnapshot.docs) {
        const charge = chargeDoc.data();

        // Skip if late fee already applied
        if (charge.lateFeeChargeId) continue;

        // Check if grace period has expired
        const dueDate = charge.dueDate as string;
        if (!dueDate) continue;

        const graceDeadline = addDays(dueDate, gracePeriodDays);
        if (todayStr <= graceDeadline) continue;

        // Calculate late fee amount
        let feeAmount: number;
        if (lease.lateFeeType === 'flat') {
          feeAmount = lease.lateFeeAmount || 0;
        } else {
          // percentage
          feeAmount = Math.round((charge.amount * (lease.lateFeeAmount || 0)) / 100);
          if (lease.lateFeeMaxAmount && feeAmount > lease.lateFeeMaxAmount) {
            feeAmount = lease.lateFeeMaxAmount;
          }
        }

        if (feeAmount <= 0) continue;

        // Parse period from the original charge for the description
        const periodParts = (charge.period as string || '').split('-');
        const chargeMonth = parseInt(periodParts[1] || '0', 10);
        const chargeYear = periodParts[0] || '';
        const monthName = MONTH_NAMES[chargeMonth] || '';

        const batch = db.batch();

        // Create late fee charge
        const lateFeeRef = collections.charges(llcId).doc();
        batch.set(lateFeeRef, {
          llcId,
          leaseId: charge.leaseId || leaseDoc.id,
          publishedLeaseId: leaseDoc.id,
          tenantUserId: charge.tenantUserId || null,
          period: charge.period,
          type: 'late_fee',
          linkedChargeId: chargeDoc.id,
          description: `Late fee for ${monthName} ${chargeYear} rent`,
          amount: feeAmount,
          paidAmount: 0,
          status: 'open',
          dueDate: todayStr,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Update original charge with late fee reference
        batch.update(chargeDoc.ref, {
          lateFeeChargeId: lateFeeRef.id,
          lateFeeAppliedAt: todayStr,
        });

        await batch.commit();
        feesApplied++;
      }
    }

    if (feesApplied > 0) {
      console.log(`Applied ${feesApplied} late fees for LLC ${llcId}`);
    }
  }
});

/**
 * Add days to a YYYY-MM-DD date string. Returns a YYYY-MM-DD string.
 */
function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ry = date.getFullYear();
  const rm = String(date.getMonth() + 1).padStart(2, '0');
  const rd = String(date.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}
