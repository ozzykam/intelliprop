'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe/stripeClient';
import { SetupForm } from '@/components/portal/SetupForm';
import Link from 'next/link';

interface SavedMethod {
  id: string;
  type: 'card' | 'us_bank_account';
  last4: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
}

function PaymentMethodsContent() {
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<SavedMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/payment-methods');
      const data = await res.json();
      if (data.ok) {
        setMethods(data.data.methods);
      }
    } catch {
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  // Handle redirect back from Stripe setup
  useEffect(() => {
    const setupStatus = searchParams.get('setup_intent');
    const redirectStatus = searchParams.get('redirect_status');
    if (setupStatus && redirectStatus === 'succeeded') {
      setSuccessMessage('Payment method added successfully.');
      fetchMethods();
    }
  }, [searchParams, fetchMethods]);

  const handleAddMethod = async () => {
    setSetupLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/payment-methods/setup', {
        method: 'POST',
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to start setup');
        return;
      }

      setClientSecret(data.data.clientSecret);
      setShowAddForm(true);
    } catch {
      setError('Failed to start payment method setup');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRemoveMethod = async (methodId: string) => {
    setRemoving(methodId);
    setError(null);

    try {
      const res = await fetch(`/api/portal/payment-methods/${methodId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to remove payment method');
        return;
      }

      setMethods((prev) => prev.filter((m) => m.id !== methodId));
    } catch {
      setError('Failed to remove payment method');
    } finally {
      setRemoving(null);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setClientSecret(null);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Link
          href="/portal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Portal
        </Link>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Saved methods list */}
      {methods.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {methods.map((method) => (
            <div
              key={method.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-muted rounded flex items-center justify-center text-xs font-semibold uppercase">
                  {method.type === 'card'
                    ? method.brand || 'Card'
                    : 'Bank'}
                </div>
                <div>
                  <p className="font-medium">
                    {method.type === 'card'
                      ? `${capitalize(method.brand || 'Card')} ending in ${method.last4}`
                      : `${method.bankName || 'Bank account'} ending in ${method.last4}`}
                  </p>
                  {method.type === 'card' && method.expMonth && method.expYear && (
                    <p className="text-sm text-muted-foreground">
                      Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveMethod(method.id)}
                disabled={removing === method.id}
                className="text-sm text-destructive hover:text-destructive/80 disabled:opacity-50"
              >
                {removing === method.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No saved payment methods.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a payment method to make future payments faster.
          </p>
        </div>
      )}

      {/* Add payment method */}
      {showAddForm && clientSecret ? (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add Payment Method</h2>
            <button
              onClick={handleCancelAdd}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <Elements
            stripe={getStripePromise()}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: { borderRadius: '6px' },
              },
            }}
          >
            <SetupForm
              returnUrl={`${window.location.origin}/portal/payment-methods?setup_intent=true&redirect_status=succeeded`}
            />
          </Elements>
        </div>
      ) : (
        <button
          onClick={handleAddMethod}
          disabled={setupLoading}
          className="w-full py-3 px-4 border-2 border-dashed rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
        >
          {setupLoading ? 'Setting up...' : '+ Add Payment Method'}
        </button>
      )}
    </div>
  );
}

export default function PaymentMethodsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <PaymentMethodsContent />
    </Suspense>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
