'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentFlow } from '@/components/portal/PaymentFlow';
import { ChargeType, ChargeStatus } from '@shared/types';

interface TenantCharge {
  id: string;
  llcId: string;
  leaseId: string;
  propertyAddress: string;
  unitNumber: string;
  period: string;
  type: ChargeType;
  description?: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: ChargeStatus;
  dueDate: string;
  createdAt: string;
}

function PayPageContent() {
  const searchParams = useSearchParams();
  const chargeId = searchParams.get('chargeId');
  const llcId = searchParams.get('llcId');

  const [charges, setCharges] = useState<TenantCharge[]>([]);
  const [allCharges, setAllCharges] = useState<TenantCharge[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharges() {
      try {
        if (chargeId && llcId) {
          // Fetch specific charge
          const res = await fetch(`/api/portal/billing/charges/${chargeId}?llcId=${llcId}`);
          const data = await res.json();
          if (data.ok) {
            setCharges([data.data]);
          } else {
            setError(data.error || 'Failed to load charge');
          }
        } else {
          // Fetch all open charges
          const res = await fetch('/api/portal/billing/charges?limit=100&status=open');
          const data = await res.json();
          if (data.ok) {
            const openCharges = (data.data.items as TenantCharge[]).filter(
              (c) => c.status === 'open' || c.status === 'partial'
            );
            setAllCharges(openCharges);
            // Pre-select all by default
            setSelectedIds(new Set(openCharges.map((c) => c.id)));
          } else {
            setError(data.error || 'Failed to load charges');
          }
        }
      } catch {
        setError('Failed to load charges');
      } finally {
        setLoading(false);
      }
    }
    fetchCharges();
  }, [chargeId, llcId]);

  if (loading) {
    return (
      <div>
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          &larr; Back to Billing
        </Link>
        <div className="space-y-4">
          <div className="h-8 bg-muted/30 rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          &larr; Back to Billing
        </Link>
        <div className="p-6 border rounded-lg border-destructive/50 bg-destructive/10">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // If we have a specific charge, go straight to payment flow
  if (charges.length > 0) {
    return (
      <div>
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          &larr; Back to Billing
        </Link>
        <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>
        <div className="max-w-lg mx-auto">
          <PaymentFlow charges={charges} />
        </div>
      </div>
    );
  }

  // Selection mode — group charges by lease
  const toggleCharge = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCharges = allCharges.filter((c) => selectedIds.has(c.id));

  // Group by leaseId — payment flow requires all charges from same lease
  const leaseIds = new Set(selectedCharges.map((c) => c.leaseId));
  const multipleLeases = leaseIds.size > 1;

  if (allCharges.length === 0) {
    return (
      <div>
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          &larr; Back to Billing
        </Link>
        <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>
        <div className="p-6 border rounded-lg bg-muted/30 text-center">
          <p className="text-muted-foreground">No open charges found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/portal/billing"
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
      >
        &larr; Back to Billing
      </Link>
      <h1 className="text-2xl font-bold mb-2">Make a Payment</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Select the charges you want to pay. All selected charges must be from the same lease.
      </p>

      {multipleLeases && (
        <div className="p-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-sm mb-4">
          Please select charges from only one lease at a time.
        </div>
      )}

      <div className="max-w-lg mx-auto space-y-6">
        <div className="border rounded-lg divide-y">
          {allCharges.map((charge) => (
            <label
              key={charge.id}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/20"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(charge.id)}
                onChange={() => toggleCharge(charge.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {charge.type === 'rent' ? 'Rent' : charge.type} &middot; {charge.period}
                </p>
                <p className="text-xs text-muted-foreground">
                  {charge.propertyAddress} - Unit {charge.unitNumber}
                </p>
              </div>
              <span className="font-semibold text-sm">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(charge.balance / 100)}
              </span>
            </label>
          ))}
        </div>

        {selectedCharges.length > 0 && !multipleLeases && (
          <PaymentFlow charges={selectedCharges} />
        )}
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="h-4 bg-muted/30 rounded w-24 mb-4 animate-pulse" />
          <div className="h-8 bg-muted/30 rounded w-1/3 mb-6 animate-pulse" />
          <div className="h-64 bg-muted/30 rounded animate-pulse" />
        </div>
      }
    >
      <PayPageContent />
    </Suspense>
  );
}
