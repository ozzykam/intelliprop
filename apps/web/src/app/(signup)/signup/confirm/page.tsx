'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

const STORAGE_KEY = 'intelliprop_signup';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPayment = searchParams.get('paid') === 'true';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved.email) { router.replace('/signup'); return; }
      if (saved.plan !== 'enterprise' && !fromPayment) { router.replace('/signup/plan'); return; }
      setFirstName(saved.firstName || '');

      // Auto-submit for Enterprise (no payment method needed)
      if (saved.plan === 'enterprise' && !done) {
        submitEnterprise(saved);
      }
    } catch {
      router.replace('/signup');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitEnterprise(saved: Record<string, unknown>) {
    setSubmitting(true);
    try {
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
          plan: 'enterprise',
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || 'Signup failed');

      await signInWithCustomToken(auth, data.data.customToken);
      sessionStorage.removeItem(STORAGE_KEY);
      setOrgId(data.data.orgId);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Setting up your account…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button onClick={() => router.push('/signup')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Enterprise confirmation screen
  if (done && orgId) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {firstName ? `Welcome, ${firstName}!` : "You're in!"}
          </h1>
          <p className="text-slate-500 text-sm mb-2">
            Your account is ready and your <span className="font-medium">14-day free trial</span> has started.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Our sales team will reach out within <strong>1–2 business days</strong> to discuss your Enterprise plan and custom onboarding.
          </p>
          <Link href={`/${orgId}?onboarding=true`}
            className="inline-block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md text-sm hover:opacity-90 transition-opacity">
            Go to your account →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
