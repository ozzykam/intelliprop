'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe/stripeClient';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { StepIndicator } from '../../layout';

const STORAGE_KEY = 'intelliprop_signup';

function PaymentForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved.email || !saved.plan || saved.plan === 'enterprise') {
        router.replace('/signup');
        return;
      }
      setPlan(saved.plan);
    } catch {
      router.replace('/signup');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      if (pmError) throw new Error(pmError.message);

      // Read signup data
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');

      // Call signup API
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: saved.firstName,
          lastName: saved.lastName,
          email: saved.email,
          phone: saved.phone || undefined,
          password: saved.password,
          propertiesCount: saved.properties || 0,
          unitsCount: saved.units || 0,
          plan: saved.plan,
          paymentMethodId: paymentMethod!.id,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || 'Signup failed');

      // Sign in with custom token
      await signInWithCustomToken(auth, data.data.customToken);

      // Clear session storage
      sessionStorage.removeItem(STORAGE_KEY);

      // Redirect to org dashboard
      router.replace(`/${data.data.orgId}?onboarding=true`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const planLabel = plan === 'starter' ? 'Starter — $49/month' : 'Professional — $149/month';

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <StepIndicator current={2} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Save your payment method</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your card will be saved on file. <strong>You won't be charged until after your 14-day free trial ends.</strong>
        </p>

        {plan && (
          <div className="mb-5 flex items-center justify-between bg-slate-50 border rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Selected plan</span>
            <span className="text-sm font-semibold text-primary">{planLabel}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Card details</label>
            <div className="border rounded-md px-3 py-3 focus-within:ring-2 focus-within:ring-primary">
              <CardElement options={{
                style: {
                  base: { fontSize: '14px', color: '#0f172a', '::placeholder': { color: '#94a3b8' } },
                }
              }} />
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-500">
            <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your payment information is encrypted and processed securely by Stripe. IntelliProp never stores your card number.
          </div>

          <button type="submit" disabled={submitting || !stripe}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Creating your account...' : 'Start Free Trial →'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          <button onClick={() => router.back()} className="underline hover:text-slate-600">← Change plan</button>
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Elements stripe={getStripePromise()}>
      <PaymentForm />
    </Elements>
  );
}
