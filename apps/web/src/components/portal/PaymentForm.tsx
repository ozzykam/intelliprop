'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
  amountCents: number;
  returnUrl: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function PaymentForm({ amountCents, returnUrl }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // Only reaches here if there's an error (otherwise redirects)
    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
      >
        {loading ? 'Processing...' : `Pay ${formatCurrency(amountCents)}`}
      </button>
    </form>
  );
}
