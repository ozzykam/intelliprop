import { onRequest } from 'firebase-functions/v2/https';
import { Response } from 'express';
import Stripe from 'stripe';
import { getStripe } from '../../stripe/stripe';
import { getEnv } from '../../config/env';
import { collections } from '../../firebase/admin';
import { applyPaymentToCharges } from '../../services/chargeUpdater';
import { FieldValue } from 'firebase-admin/firestore';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

function jsonResponse<T>(res: Response, status: number, body: ApiResponse<T>) {
  res.status(status).json(body);
}

export const stripeWebhook = onRequest(
  { cors: false, invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') {
      return jsonResponse(res, 405, {
        ok: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      });
    }

    const env = getEnv();
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return jsonResponse(res, 400, {
        ok: false,
        error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe signature' },
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return jsonResponse(res, 400, {
        ok: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' },
      });
    }

    // Idempotency check
    const eventRef = collections.stripeEvents().doc(event.id);
    const existingEvent = await eventRef.get();
    if (existingEvent.exists) {
      return jsonResponse(res, 200, { ok: true, data: { message: 'Already processed' } });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await eventRef.set({
        type: event.type,
        processedAt: FieldValue.serverTimestamp(),
      });

      return jsonResponse(res, 200, { ok: true, data: { received: true } });
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      return jsonResponse(res, 500, {
        ok: false,
        error: { code: 'PROCESSING_ERROR', message: 'Error processing webhook' },
      });
    }
  }
);

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { llcId, paymentId, leaseId, tenantId } = paymentIntent.metadata;

  if (!llcId || !paymentId) {
    console.error('Missing metadata on PaymentIntent:', paymentIntent.id);
    return;
  }

  const paymentRef = collections.payments(llcId).doc(paymentId);
  const paymentDoc = await paymentRef.get();

  if (!paymentDoc.exists) {
    console.error(`Payment ${paymentId} not found in LLC ${llcId}`);
    return;
  }

  const paymentData = paymentDoc.data()!;

  // Skip if already succeeded
  if (paymentData.status === 'succeeded') {
    return;
  }

  // Get payment method details
  const paymentMethodDetails = await extractPaymentMethodDetails(paymentIntent);

  // Get receipt URL from the charge if available
  let receiptUrl: string | undefined;
  let stripeChargeId: string | undefined;
  if (paymentIntent.latest_charge) {
    try {
      const stripe = getStripe();
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge.id;
      const charge = await stripe.charges.retrieve(chargeId);
      receiptUrl = charge.receipt_url || undefined;
      stripeChargeId = charge.id;
    } catch (err) {
      console.warn('Could not retrieve charge details:', err);
    }
  }

  // Update payment document
  const updateData: Record<string, unknown> = {
    status: 'succeeded',
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (paymentMethodDetails) {
    updateData.paymentMethod = paymentMethodDetails;
  }
  if (receiptUrl) {
    updateData.receiptUrl = receiptUrl;
  }
  if (stripeChargeId) {
    updateData.stripeChargeId = stripeChargeId;
  }

  await paymentRef.update(updateData);

  // Apply allocations to charges
  const allocations = paymentData.appliedTo as { chargeId: string; amount: number }[];
  if (allocations && allocations.length > 0) {
    await applyPaymentToCharges(llcId, allocations);
  }

  console.log(`Payment ${paymentId} succeeded for lease ${leaseId}, tenant ${tenantId}`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { llcId, paymentId } = paymentIntent.metadata;

  if (!llcId || !paymentId) {
    console.error('Missing metadata on failed PaymentIntent:', paymentIntent.id);
    return;
  }

  const paymentRef = collections.payments(llcId).doc(paymentId);
  const paymentDoc = await paymentRef.get();

  if (!paymentDoc.exists) {
    console.error(`Payment ${paymentId} not found in LLC ${llcId}`);
    return;
  }

  const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

  await paymentRef.update({
    status: 'failed',
    failureReason,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Payment ${paymentId} failed: ${failureReason}`);
}

async function extractPaymentMethodDetails(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ type: string; last4?: string; brand?: string; bankName?: string } | null> {
  let pm = paymentIntent.payment_method;
  if (!pm) return null;

  // If payment_method is just a string ID, retrieve the full object from Stripe
  if (typeof pm === 'string') {
    try {
      const stripe = getStripe();
      pm = await stripe.paymentMethods.retrieve(pm);
    } catch (err) {
      console.warn('Could not retrieve payment method:', err);
      return null;
    }
  }

  if (pm.type === 'card' && pm.card) {
    return {
      type: 'card',
      last4: pm.card.last4 || undefined,
      brand: pm.card.brand || undefined,
    };
  }

  if (pm.type === 'us_bank_account' && pm.us_bank_account) {
    return {
      type: 'us_bank_account',
      last4: pm.us_bank_account.last4 || undefined,
      bankName: pm.us_bank_account.bank_name || undefined,
    };
  }

  return { type: pm.type };
}
