import { db } from '../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface ChargeAllocation {
  chargeId: string;
  amount: number;
}

/**
 * Apply payment allocations to charges, updating paidAmount and status.
 * Uses batched writes for atomicity.
 */
export async function applyPaymentToCharges(
  llcId: string,
  allocations: ChargeAllocation[]
): Promise<void> {
  if (allocations.length === 0) return;

  const batch = db.batch();

  for (const allocation of allocations) {
    const chargeRef = db
      .collection('llcs')
      .doc(llcId)
      .collection('charges')
      .doc(allocation.chargeId);

    const chargeDoc = await chargeRef.get();
    if (!chargeDoc.exists) {
      console.warn(`Charge ${allocation.chargeId} not found, skipping`);
      continue;
    }

    const data = chargeDoc.data()!;
    const currentPaid = data.paidAmount || 0;
    const newPaidAmount = currentPaid + allocation.amount;

    let newStatus: string;
    if (newPaidAmount >= data.amount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    } else {
      newStatus = 'open';
    }

    batch.update(chargeRef, {
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}
