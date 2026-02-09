'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentStatus } from '@shared/types';

interface TenantPayment {
  id: string;
  llcId: string;
  leaseId: string;
  propertyAddress: string;
  unitNumber: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
    checkNumber?: string;
  };
  appliedTo: { chargeId: string; amount: number }[];
  createdAt: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusBadge(status: PaymentStatus) {
  const styles: Record<PaymentStatus, string> = {
    requires_payment_method: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    requires_confirmation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    succeeded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    canceled: 'bg-muted text-muted-foreground',
    refunded: 'bg-muted text-muted-foreground',
  };
  const labels: Record<PaymentStatus, string> = {
    requires_payment_method: 'Pending',
    requires_confirmation: 'Confirming',
    processing: 'Processing',
    succeeded: 'Completed',
    failed: 'Failed',
    canceled: 'Canceled',
    refunded: 'Refunded',
  };
  return (
    <span className={`px-3 py-1 text-sm rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function getPaymentMethodDisplay(method: TenantPayment['paymentMethod']): { label: string; detail: string } {
  if (method.type === 'card') {
    return {
      label: 'Credit/Debit Card',
      detail: method.brand ? `${method.brand} ending in ${method.last4}` : `Card ending in ${method.last4 || '****'}`,
    };
  }
  if (method.type === 'check') {
    return {
      label: 'Check',
      detail: method.checkNumber ? `Check #${method.checkNumber}` : 'Paper check',
    };
  }
  if (method.type === 'us_bank_account' || method.type === 'ach') {
    return {
      label: 'Bank Account (ACH)',
      detail: method.last4 ? `Account ending in ${method.last4}` : 'Bank account',
    };
  }
  if (method.type === 'cash') {
    return {
      label: 'Cash',
      detail: 'Cash payment',
    };
  }
  return {
    label: method.type.charAt(0).toUpperCase() + method.type.slice(1),
    detail: 'Payment',
  };
}

function PaymentDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paymentId = params.paymentId as string;
  const llcId = searchParams.get('llcId');
  const paymentStatus = searchParams.get('status');
  const isPostPayment = paymentStatus === 'success';

  const [payment, setPayment] = useState<TenantPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayment() {
      if (!llcId) {
        setError('Missing LLC ID');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/portal/billing/payments/${paymentId}?llcId=${llcId}`);
        const data = await res.json();
        if (data.ok) {
          setPayment(data.data);
        } else {
          setError(data.error || 'Failed to load payment');
        }
      } catch {
        setError('Failed to load payment');
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();

    // For post-payment, poll for status updates (webhook may not have processed yet)
    if (isPostPayment) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/portal/billing/payments/${paymentId}?llcId=${llcId}`);
          const data = await res.json();
          if (data.ok) {
            setPayment(data.data);
            if (data.data.status === 'succeeded' || data.data.status === 'failed') {
              clearInterval(interval);
            }
          }
        } catch { /* polling is best-effort */ }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [paymentId, llcId, isPostPayment]);

  if (loading) {
    return (
      <div>
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Billing
        </Link>
        <div className="space-y-4">
          <div className="h-8 bg-muted/30 rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div>
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Billing
        </Link>
        <div className="p-6 border rounded-lg border-destructive/50 bg-destructive/10">
          <p className="text-destructive">{error || 'Payment not found'}</p>
        </div>
      </div>
    );
  }

  const paymentMethod = getPaymentMethodDisplay(payment.paymentMethod);

  return (
    <div>
      <Link
        href="/portal/billing"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Billing
      </Link>

      {/* Success Banner */}
      {isPostPayment && (
        <div className="p-4 mb-6 rounded-lg bg-green-100 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <p className="font-medium text-green-800 dark:text-green-400">
            Payment submitted successfully!
          </p>
          <p className="text-sm text-green-700 dark:text-green-500 mt-1">
            {payment.status === 'succeeded'
              ? 'Your payment has been confirmed and applied to your charges.'
              : payment.status === 'processing'
                ? 'Your payment is being processed. This may take a few minutes for card payments or a few days for bank transfers.'
                : payment.status === 'failed'
                  ? 'Unfortunately, your payment could not be processed. Please try again.'
                  : 'Your payment is being confirmed. This page will update automatically.'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Receipt</h1>
          <p className="text-muted-foreground">{payment.propertyAddress} - Unit {payment.unitNumber}</p>
        </div>
        {getStatusBadge(payment.status)}
      </div>

      {/* Details Card */}
      <div className="border rounded-lg p-6">
        {/* Amount */}
        <div className="text-center pb-6 mb-6 border-b">
          <p className="text-sm text-muted-foreground mb-1">Payment Amount</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(payment.amount)}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Payment Date</p>
            <p className="font-medium">{formatDateTime(payment.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="font-medium">{paymentMethod.label}</p>
            <p className="text-sm text-muted-foreground">{paymentMethod.detail}</p>
          </div>
        </div>

        {/* Applied To */}
        {payment.appliedTo && payment.appliedTo.length > 0 && (
          <div className="pt-6 border-t">
            <h3 className="font-medium mb-3">Applied to Charges</h3>
            <div className="space-y-2">
              {payment.appliedTo.map((application, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded"
                >
                  <span className="text-sm text-muted-foreground">
                    Charge #{application.chargeId.slice(-6)}
                  </span>
                  <span className="font-medium">{formatCurrency(application.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation ID */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">Confirmation ID</p>
          <p className="font-mono text-sm">{payment.id}</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentDetailPage() {
  return (
    <Suspense fallback={
      <div>
        <div className="h-4 bg-muted/30 rounded w-24 mb-4 animate-pulse" />
        <div className="h-8 bg-muted/30 rounded w-1/3 mb-6 animate-pulse" />
        <div className="h-64 bg-muted/30 rounded animate-pulse" />
      </div>
    }>
      <PaymentDetailContent />
    </Suspense>
  );
}
