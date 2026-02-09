import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { getStripe } from '@/lib/stripe/stripeServer';
import { getTenantLinksForUser } from '@/lib/services/portal.service';

/**
 * POST /api/portal/billing/pay
 * Creates a Stripe PaymentIntent for the authenticated tenant.
 * Proxies to the createPaymentIntent Cloud Function.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { chargeIds, llcId, leaseId, paymentMethodId } = body;

    if (!chargeIds || !Array.isArray(chargeIds) || chargeIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'chargeIds is required' },
        { status: 400 }
      );
    }

    if (!llcId || !leaseId) {
      return NextResponse.json(
        { ok: false, error: 'llcId and leaseId are required' },
        { status: 400 }
      );
    }

    // Look up tenant's tenantId from their tenantLinks
    const tenantLinks = await getTenantLinksForUser(user.uid);
    const link = tenantLinks.find(l => l.llcId === llcId || !l.llcId);
    if (!link || !link.tenantId) {
      return NextResponse.json(
        { ok: false, error: 'No tenant link found for this LLC' },
        { status: 403 }
      );
    }

    // Compute amount from charge balances
    let totalAmountCents = 0;
    const allocations: { chargeId: string; amount: number }[] = [];

    for (const chargeId of chargeIds) {
      const chargeDoc = await adminDb
        .collection('llcs')
        .doc(llcId)
        .collection('charges')
        .doc(chargeId)
        .get();

      if (!chargeDoc.exists) {
        return NextResponse.json(
          { ok: false, error: `Charge ${chargeId} not found` },
          { status: 400 }
        );
      }

      const charge = chargeDoc.data()!;
      if (charge.status !== 'open' && charge.status !== 'partial') {
        return NextResponse.json(
          { ok: false, error: `Charge ${chargeId} is not payable` },
          { status: 400 }
        );
      }

      // Verify charge belongs to a lease the tenant has access to
      if (!charge.tenantUserIds?.includes(user.uid)) {
        return NextResponse.json(
          { ok: false, error: 'Access denied to one or more charges' },
          { status: 403 }
        );
      }

      const chargeBalance = charge.amount - (charge.paidAmount || 0);
      if (chargeBalance > 0) {
        totalAmountCents += chargeBalance;
        allocations.push({ chargeId, amount: chargeBalance });
      }
    }

    if (totalAmountCents <= 0) {
      return NextResponse.json(
        { ok: false, error: 'No balance due on selected charges' },
        { status: 400 }
      );
    }

    // Get tenant's stripeCustomerId
    const tenantDoc = await adminDb.collection('tenants').doc(link.tenantId).get();
    const stripeCustomerId = tenantDoc.data()?.stripeCustomerId;

    // Get LLC for connected account
    const llcDoc = await adminDb.collection('llcs').doc(llcId).get();
    const connectedAccountId = llcDoc.data()?.stripeConnectedAccountId;

    // Create PaymentIntent via Stripe SDK
    const stripe = getStripe();

    // Create payment record in Firestore
    const paymentRef = adminDb
      .collection('llcs')
      .doc(llcId)
      .collection('payments')
      .doc();
    const paymentId = paymentRef.id;

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: totalAmountCents,
      currency: 'usd',
      metadata: {
        paymentId,
        llcId,
        leaseId,
        tenantId: link.tenantId,
        chargeIds: chargeIds.join(','),
      },
      payment_method_types: ['us_bank_account', 'card'],
    };

    if (stripeCustomerId) {
      paymentIntentParams.customer = stripeCustomerId;
    }

    if (connectedAccountId) {
      paymentIntentParams.transfer_data = {
        destination: connectedAccountId,
      };
    }

    // If a saved payment method was provided, auto-confirm
    if (paymentMethodId && stripeCustomerId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirm = true;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Save payment record
    await paymentRef.set({
      llcId,
      leaseId,
      tenantId: link.tenantId,
      amount: totalAmountCents,
      currency: 'usd',
      status: 'requires_payment_method',
      stripePaymentIntentId: paymentIntent.id,
      appliedTo: allocations,
      createdAt: new Date(),
    });

    const confirmed = paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing';

    return NextResponse.json({
      ok: true,
      data: {
        paymentId,
        clientSecret: paymentIntent.client_secret,
        amountCents: totalAmountCents,
        confirmed,
      },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
