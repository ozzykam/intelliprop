'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';

interface SetupFormProps {
  returnUrl: string;
}

export function SetupForm({ returnUrl }: SetupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // Only reaches here if there's an error (otherwise redirects)
    if (submitError) {
      setError(submitError.message || 'Failed to save payment method.');
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
        {loading ? 'Saving...' : 'Save Payment Method'}
      </button>
    </form>
  );
}
