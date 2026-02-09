import { onRequest } from 'firebase-functions/v2/https';
import { Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { verifyFirebaseToken } from '../../auth/verifyFirebaseToken';
import { collections, db } from '../../firebase/admin';
import { getStripe } from '../../stripe/stripe';

const createIntentSchema = z.object({
  llcId: z.string().min(1),
  leaseId: z.string().min(1),
  tenantId: z.string().min(1),
  chargeIds: z.array(z.string()).min(1),
  currency: z.string().default('usd'),
});

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

export const createPaymentIntent = onRequest(
  { cors: true },
  async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      return jsonResponse(res, 405, {
        ok: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      });
    }

    // Verify authentication
    const user = await verifyFirebaseToken(req);
    if (!user) {
      return jsonResponse(res, 401, {
        ok: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    // Validate request body
    const parseResult = createIntentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return jsonResponse(res, 400, {
        ok: false,
        error: { code: 'INVALID_REQUEST', message: 'Invalid request body' },
      });
    }

    const { llcId, leaseId, tenantId, chargeIds, currency } = parseResult.data;

    try {
      // Verify tenant can only pay their own charges (use global tenants collection)
      const tenantDoc = await collections.globalTenants().doc(tenantId).get();
      if (!tenantDoc.exists) {
        return jsonResponse(res, 404, {
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        });
      }

      const tenantData = tenantDoc.data()!;
      if (tenantData.userId !== user.uid) {
        return jsonResponse(res, 403, {
          ok: false,
          error: { code: 'PERMISSION_DENIED', message: 'Cannot pay charges for another tenant' },
        });
      }

      // Get LLC for Stripe connected account
      const llcDoc = await collections.llcs().doc(llcId).get();
      if (!llcDoc.exists) {
        return jsonResponse(res, 404, {
          ok: false,
          error: { code: 'NOT_FOUND', message: 'LLC not found' },
        });
      }
      const llc = llcDoc.data();
      const connectedAccountId = llc?.stripeConnectedAccountId;

      // Compute authoritative amount from charge balances and build FIFO allocations
      let totalAmountCents = 0;
      const allocations: { chargeId: string; amount: number }[] = [];
      const chargeRefs = chargeIds.map((id) => collections.charges(llcId).doc(id));
      const chargeDocs = await db.getAll(...chargeRefs);

      for (const doc of chargeDocs) {
        if (!doc.exists) {
          return jsonResponse(res, 400, {
            ok: false,
            error: { code: 'INVALID_CHARGE', message: `Charge ${doc.id} not found` },
          });
        }
        const charge = doc.data()!;
        if (charge.status !== 'open' && charge.status !== 'partial') {
          return jsonResponse(res, 400, {
            ok: false,
            error: { code: 'INVALID_CHARGE', message: `Charge ${doc.id} is not payable (status: ${charge.status})` },
          });
        }
        if (charge.leaseId !== leaseId) {
          return jsonResponse(res, 400, {
            ok: false,
            error: { code: 'INVALID_CHARGE', message: `Charge ${doc.id} does not belong to lease` },
          });
        }
        const chargeBalance = charge.amount - (charge.paidAmount || 0);
        if (chargeBalance > 0) {
          totalAmountCents += chargeBalance;
          allocations.push({ chargeId: doc.id, amount: chargeBalance });
        }
      }

      if (totalAmountCents <= 0) {
        return jsonResponse(res, 400, {
          ok: false,
          error: { code: 'INVALID_AMOUNT', message: 'No balance due on selected charges' },
        });
      }

      // Create payment record in Firestore
      const paymentRef = collections.payments(llcId).doc();
      const paymentId = paymentRef.id;

      // Build Stripe PaymentIntent params
      const stripe = getStripe();
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalAmountCents,
        currency,
        metadata: {
          paymentId,
          llcId,
          leaseId,
          tenantId,
          chargeIds: chargeIds.join(','),
        },
        payment_method_types: ['us_bank_account', 'card'],
      };

      // Attach Stripe Customer if tenant has one
      if (tenantData.stripeCustomerId) {
        paymentIntentParams.customer = tenantData.stripeCustomerId;
      }

      // If LLC has connected account, use destination charges
      if (connectedAccountId) {
        paymentIntentParams.transfer_data = {
          destination: connectedAccountId,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      // Save payment record with correct allocations
      await paymentRef.set({
        llcId,
        leaseId,
        tenantId,
        amount: totalAmountCents,
        currency,
        status: 'requires_payment_method',
        stripePaymentIntentId: paymentIntent.id,
        appliedTo: allocations,
        createdAt: new Date(),
      });

      return jsonResponse(res, 200, {
        ok: true,
        data: {
          paymentId,
          stripePaymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amountCents: totalAmountCents,
          currency,
        },
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return jsonResponse(res, 500, {
        ok: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment intent' },
      });
    }
  }
);
