'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

interface OnboardingState {
  createdFirstLlc: boolean;
  createdFirstProperty: boolean;
  createdFirstUnit: boolean;
  addedFirstTenant: boolean;
}

interface Props {
  orgId: string;
}

const STEPS = [
  {
    key: 'createdFirstLlc' as const,
    label: 'Create your first business',
    description: 'Add an LLC, corporation, or other business entity.',
    href: (orgId: string) => `/${orgId}/llcs/new`,
    cta: 'Add Business',
  },
  {
    key: 'createdFirstProperty' as const,
    label: 'Add your first property',
    description: 'Enter a property address and details.',
    href: (orgId: string) => `/${orgId}/llcs`,
    cta: 'Add Property',
  },
  {
    key: 'createdFirstUnit' as const,
    label: 'Create your first unit',
    description: 'Add a rentable unit to your property.',
    href: (orgId: string) => `/${orgId}/llcs`,
    cta: 'Add Unit',
  },
  {
    key: 'addedFirstTenant' as const,
    label: 'Add your first tenant',
    description: 'Create a tenant record and set up a lease.',
    href: (orgId: string) => `/tenants?orgId=${orgId}`,
    cta: 'Add Tenant',
  },
];

export default function OnboardingTracker({ orgId }: Props) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadAndSync() {
      try {
        const orgDoc = await getDoc(doc(db, 'accounts', orgId));
        if (!orgDoc.exists()) return;

        const data = orgDoc.data();
        const onboarding: OnboardingState = data.onboarding ?? {
          createdFirstLlc: false,
          createdFirstProperty: false,
          createdFirstUnit: false,
          addedFirstTenant: false,
        };

        // Lazily check completion for any unmarked steps
        const updates: Partial<OnboardingState> = {};

        if (!onboarding.createdFirstLlc) {
          const llcSnap = await getDocs(
            query(collection(db, 'llcs'), where('accountId', '==', orgId), limit(1))
          );
          if (!llcSnap.empty) updates.createdFirstLlc = true;
        }

        if (!onboarding.addedFirstTenant) {
          const tenantSnap = await getDocs(
            query(collection(db, 'tenants'), where('accountId', '==', orgId), limit(1))
          );
          if (!tenantSnap.empty) updates.addedFirstTenant = true;
        }

        const merged = { ...onboarding, ...updates };
        setState(merged);

        if (Object.keys(updates).length > 0) {
          const updatePayload: Record<string, boolean> = {};
          for (const [k, v] of Object.entries(updates)) {
            updatePayload[`onboarding.${k}`] = v as boolean;
          }
          await updateDoc(doc(db, 'accounts', orgId), updatePayload);
        }
      } catch { /* non-critical */ }
    }

    loadAndSync();
  }, [orgId]);

  if (!state || dismissed) return null;

  const completedCount = Object.values(state).filter(Boolean).length;
  const allComplete = completedCount === STEPS.length;

  if (allComplete) return null;

  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="mb-6 bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Get started with IntelliProp</p>
            <p className="text-xs text-slate-500">{completedCount} of {STEPS.length} steps complete</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500 font-medium">{pct}%</span>
          </div>
          <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y">
        {STEPS.map((step, i) => {
          const complete = state[step.key];
          return (
            <div key={step.key} className={`px-5 py-3.5 flex items-center gap-4 ${complete ? 'opacity-50' : ''}`}>
              {/* Check / number */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 ${
                complete
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-slate-300 text-slate-400'
              }`}>
                {complete ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${complete ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {step.label}
                </p>
                {!complete && <p className="text-xs text-slate-500">{step.description}</p>}
              </div>

              {!complete && (
                <Link
                  href={step.href(orgId)}
                  className="flex-shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
