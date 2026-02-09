'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe/stripeClient';
import { PaymentForm } from './PaymentForm';
import { SavedMethodSelector } from './SavedMethodSelector';
import { ChargeStatus, ChargeType } from '@shared/types';

interface PayableCharge {
  id: string;
  llcId: string;
  leaseId: string;
  propertyAddress: string;
  unitNumber: string;
  type: ChargeType;
  description?: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: ChargeStatus;
  dueDate: string;
  period: string;
}

interface PaymentFlowProps {
  charges: PayableCharge[];
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getChargeTypeLabel(type: ChargeType): string {
  const labels: Record<ChargeType, string> = {
    rent: 'Rent',
    late_fee: 'Late Fee',
    utility: 'Utility',
    deposit: 'Deposit',
    pet_deposit: 'Pet Deposit',
    pet_rent: 'Pet Rent',
    parking: 'Parking',
    damage: 'Damage',
    other: 'Other',
  };
  return labels[type] || type;
}

export function PaymentFlow({ charges }: PaymentFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<'review' | 'payment' | 'error'>('review');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  const totalBalance = charges.reduce((sum, c) => sum + c.balance, 0);

  // All charges should belong to the same lease/LLC
  const llcId = charges[0]?.llcId;
  const leaseId = charges[0]?.leaseId;

  const handleProceedToPayment = async () => {
    if (!llcId || !leaseId) {
      setError('Missing lease information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/billing/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeIds: charges.map(c => c.id),
          llcId,
          leaseId,
          paymentMethodId: selectedMethodId || undefined,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to initialize payment');
        setStep('error');
        return;
      }

      // If payment was auto-confirmed with a saved method, redirect to confirmation
      if (data.data.confirmed) {
        router.push(
          `/portal/billing/payments/${data.data.paymentId}?llcId=${llcId}&status=success`
        );
        return;
      }

      setClientSecret(data.data.clientSecret);
      setPaymentId(data.data.paymentId);
      setAmountCents(data.data.amountCents);
      setStep('payment');
    } catch {
      setError('Failed to initialize payment. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error || 'An error occurred'}
        </div>
        <button
          onClick={() => { setStep('review'); setError(null); }}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (step === 'payment' && clientSecret) {
    const stripePromise = getStripePromise();
    const returnUrl = `${window.location.origin}/portal/billing/payments/${paymentId}?llcId=${llcId}&status=success`;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Payment</span>
            <span className="text-xl font-bold">{formatCurrency(amountCents)}</span>
          </div>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                borderRadius: '6px',
              },
            },
          }}
        >
          <PaymentForm amountCents={amountCents} returnUrl={returnUrl} />
        </Elements>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Charges list */}
      <div className="border rounded-lg divide-y">
        {charges.map((charge) => (
          <div key={charge.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{getChargeTypeLabel(charge.type)}</p>
              <p className="text-sm text-muted-foreground">
                {charge.period} &middot; Due {formatDate(charge.dueDate)}
              </p>
              {charge.propertyAddress && (
                <p className="text-xs text-muted-foreground mt-1">
                  {charge.propertyAddress} - Unit {charge.unitNumber}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(charge.balance)}</p>
              {charge.paidAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(charge.amount)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold">{formatCurrency(totalBalance)}</span>
      </div>

      {/* Saved payment method selector */}
      <SavedMethodSelector
        selected={selectedMethodId}
        onSelect={setSelectedMethodId}
      />

      {/* Proceed button */}
      <button
        onClick={handleProceedToPayment}
        disabled={loading || totalBalance <= 0}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
      >
        {loading
          ? 'Initializing Payment...'
          : selectedMethodId
            ? `Pay ${formatCurrency(totalBalance)}`
            : 'Proceed to Payment'
        }
      </button>
    </div>
  );
}
