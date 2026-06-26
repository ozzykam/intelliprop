'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '../../layout';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/month',
    units: 'Up to 10 units',
    description: 'For individual landlords getting organized.',
    features: ['Property & unit management', 'Tenant management', 'Lease tracking', 'Charge & payment tracking', 'Tenant portal'],
    cta: 'Start Free Trial',
    featured: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$149',
    period: '/month',
    units: 'Up to 50 units',
    description: 'For growing portfolios that need every tool.',
    features: ['Everything in Starter', 'Legal case management', 'Insurance claims', 'Staff timesheets', 'Work orders', 'Financial dashboards'],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    units: 'Unlimited units',
    description: 'For large portfolios and PM firms.',
    features: ['Everything in Professional', 'Multiple organizations', 'Custom onboarding', 'Dedicated account manager', 'SLA guarantees'],
    cta: 'Contact Sales',
    featured: false,
  },
] as const;

const STORAGE_KEY = 'intelliprop_signup';

export default function SignupPlanPage() {
  const router = useRouter();

  useEffect(() => {
    // Guard: must have completed step 1
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved.email) router.replace('/signup');
    } catch {
      router.replace('/signup');
    }
  }, [router]);

  function handleSelect(planId: string) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, plan: planId }));
    } catch { /* ignore */ }

    if (planId === 'enterprise') {
      router.push('/signup/confirm');
    } else {
      router.push('/signup/payment');
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-center mb-8">
        <StepIndicator current={1} />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Choose your plan</h1>
        <p className="text-slate-500 text-sm">All plans include a 14-day free trial. No charge until day 15.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => (
          <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col relative ${
            plan.featured ? 'border-primary ring-2 ring-primary shadow-md' : 'border-slate-200'
          }`}>
            {plan.featured && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
              </div>
            )}

            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h2>
              <p className="text-slate-500 text-xs mb-3">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{plan.units}</p>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <svg className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelect(plan.id)}
              className={`w-full py-2.5 rounded-md text-sm font-semibold transition-opacity ${
                plan.featured
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        <button onClick={() => router.back()} className="underline hover:text-slate-600">← Back</button>
      </p>
    </div>
  );
}
