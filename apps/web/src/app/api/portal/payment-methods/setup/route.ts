import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { getStripe } from '@/lib/stripe/stripeServer';
import { getTenantLinksForUser } from '@/lib/services/portal.service';

/**
 * POST /api/portal/payment-methods/setup
 * Creates a Stripe Customer (if needed) and SetupIntent for saving a payment method.
 */
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get tenant info
    const tenantLinks = await getTenantLinksForUser(user.uid);
    const link = tenantLinks[0];
    if (!link || !link.tenantId) {
      return NextResponse.json(
        { ok: false, error: 'No tenant profile found' },
        { status: 403 }
      );
    }

    const tenantId = link.tenantId;
    const tenantRef = adminDb.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();
    const tenantData = tenantDoc.data();

    if (!tenantData) {
      return NextResponse.json(
        { ok: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    let stripeCustomerId = tenantData.stripeCustomerId;

    // Create Stripe Customer if needed
    if (!stripeCustomerId) {
      const displayName = tenantData.middleInitial
        ? `${tenantData.firstName} ${tenantData.middleInitial}. ${tenantData.lastName}`
        : `${tenantData.firstName} ${tenantData.lastName}`;

      const customer = await stripe.customers.create({
        email: tenantData.email || undefined,
        name: displayName,
        metadata: { tenantId },
      });

      stripeCustomerId = customer.id;
      await tenantRef.update({ stripeCustomerId });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'us_bank_account'],
      metadata: { tenantId },
    });

    return NextResponse.json({
      ok: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      },
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to set up payment method' },
      { status: 500 }
    );
  }
}
