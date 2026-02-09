import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { getStripe } from '@/lib/stripe/stripeServer';
import { getTenantLinksForUser } from '@/lib/services/portal.service';

/**
 * DELETE /api/portal/payment-methods/[id]
 * Detaches a saved payment method from the tenant's Stripe Customer.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: paymentMethodId } = await params;

    // Look up tenant's stripeCustomerId
    const tenantLinks = await getTenantLinksForUser(user.uid);
    const link = tenantLinks[0];
    if (!link || !link.tenantId) {
      return NextResponse.json(
        { ok: false, error: 'No tenant profile found' },
        { status: 403 }
      );
    }

    const tenantDoc = await adminDb
      .collection('tenants')
      .doc(link.tenantId)
      .get();
    const stripeCustomerId = tenantDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: 'No payment methods on file' },
        { status: 400 }
      );
    }

    // Verify the payment method belongs to this customer
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error detaching payment method:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
