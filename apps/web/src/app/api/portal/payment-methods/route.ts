import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import { getStripe } from '@/lib/stripe/stripeServer';
import { getTenantLinksForUser } from '@/lib/services/portal.service';

/**
 * GET /api/portal/payment-methods
 * List saved payment methods for the authenticated tenant.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get tenant's stripeCustomerId
    const tenantLinks = await getTenantLinksForUser(user.uid);
    const link = tenantLinks[0];
    if (!link || !link.tenantId) {
      return NextResponse.json({ ok: true, data: { methods: [] } });
    }

    const tenantDoc = await adminDb.collection('tenants').doc(link.tenantId).get();
    const stripeCustomerId = tenantDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json({ ok: true, data: { methods: [] } });
    }

    const stripe = getStripe();

    // Fetch both card and bank account methods
    const [cards, bankAccounts] = await Promise.all([
      stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card' }),
      stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'us_bank_account' }),
    ]);

    const methods = [
      ...cards.data.map((pm) => ({
        id: pm.id,
        type: 'card' as const,
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand || '',
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
      ...bankAccounts.data.map((pm) => ({
        id: pm.id,
        type: 'us_bank_account' as const,
        last4: pm.us_bank_account?.last4 || '',
        bankName: pm.us_bank_account?.bank_name || '',
      })),
    ];

    return NextResponse.json({ ok: true, data: { methods } });
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list payment methods' },
      { status: 500 }
    );
  }
}
