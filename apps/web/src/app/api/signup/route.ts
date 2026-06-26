import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { createOrg } from '@/lib/services/account.service';
import { getStripe } from '@/lib/stripe/stripeServer';
import { FieldValue } from 'firebase-admin/firestore';
import type { OrgPlan } from '@shared/types';

/**
 * POST /api/signup
 * Self-serve account creation flow.
 * Creates a Firebase Auth user, Firestore user doc, org account, optional Stripe customer.
 * Returns a custom auth token so the client can sign in immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
      propertiesCount: number;
      unitsCount: number;
      plan: OrgPlan;
      paymentMethodId?: string;
    };

    const { firstName, lastName, email, phone, password, propertiesCount, unitsCount, plan, paymentMethodId } = body;

    if (!firstName || !lastName || !email || !password || !plan) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Missing required fields' } }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Password must be at least 8 characters' } }, { status: 400 });
    }

    // 1. Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
    });
    const uid = userRecord.uid;

    // 2. Create Firestore user document
    await adminDb.collection('users').doc(uid).set({
      email,
      displayName: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      phoneNumber: phone ?? null,
      userType: 'staff',
      isSuperAdmin: true,
      isPlatformSuperAdmin: false,
      isPlatformAdmin: false,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });

    // 3. Create the org account
    const org = await createOrg(
      { name: `${firstName}'s Portfolio`, ownerUserId: uid },
      uid
    );
    const orgId = org.id;

    // 4. Stripe: create customer + attach payment method (Starter/Professional only)
    let stripeCustomerId: string | undefined;
    let stripePaymentMethodId: string | undefined;

    if (paymentMethodId) {
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`.trim(),
        phone: phone ?? undefined,
        metadata: { orgId, uid },
      });
      stripeCustomerId = customer.id;

      await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      stripePaymentMethodId = paymentMethodId;
    }

    // 5. Update org with plan, trial end, Stripe refs, and onboarding state
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await adminDb.collection('accounts').doc(orgId).update({
      plan,
      trialEndsAt,
      ...(stripeCustomerId && { stripeCustomerId }),
      ...(stripePaymentMethodId && { stripePaymentMethodId }),
      propertiesCount: propertiesCount ?? 0,
      unitsCount: unitsCount ?? 0,
      onboarding: {
        createdFirstLlc: false,
        createdFirstProperty: false,
        createdFirstUnit: false,
        addedFirstTenant: false,
      },
    });

    // Also stamp accountIds on user doc
    await adminDb.collection('users').doc(uid).update({
      accountIds: FieldValue.arrayUnion(orgId),
    });

    // 6. Generate custom auth token so client can sign in immediately
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ ok: true, data: { orgId, customToken } }, { status: 201 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    // Firebase auth/email-already-exists
    if (msg.includes('email-already-exists') || msg.includes('EMAIL_EXISTS')) {
      return NextResponse.json({ ok: false, error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } }, { status: 409 });
    }
    console.error('[POST /api/signup]', error);
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create account' } }, { status: 500 });
  }
}
