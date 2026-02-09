'use client';

import { useEffect, useState } from 'react';

interface SavedMethod {
  id: string;
  type: 'card' | 'us_bank_account';
  last4: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
}

interface SavedMethodSelectorProps {
  onSelect: (methodId: string | null) => void;
  selected: string | null;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function SavedMethodSelector({
  onSelect,
  selected,
}: SavedMethodSelectorProps) {
  const [methods, setMethods] = useState<SavedMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMethods() {
      try {
        const res = await fetch('/api/portal/payment-methods');
        const data = await res.json();
        if (data.ok && data.data.methods.length > 0) {
          setMethods(data.data.methods);
        }
      } catch {
        // Silently fail — user can still pay with a new method
      } finally {
        setLoading(false);
      }
    }
    fetchMethods();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Loading saved payment methods...
      </div>
    );
  }

  if (methods.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Payment Method</p>

      <div className="border rounded-lg divide-y">
        {methods.map((method) => (
          <label
            key={method.id}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onSelect(method.id)}
              className="accent-primary"
            />
            <div className="w-10 h-7 bg-muted rounded flex items-center justify-center text-xs font-semibold uppercase">
              {method.type === 'card' ? method.brand || 'Card' : 'Bank'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {method.type === 'card'
                  ? `${capitalize(method.brand || 'Card')} ending in ${method.last4}`
                  : `${method.bankName || 'Bank account'} ending in ${method.last4}`}
              </p>
              {method.type === 'card' && method.expMonth && method.expYear && (
                <p className="text-xs text-muted-foreground">
                  Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                </p>
              )}
            </div>
          </label>
        ))}

        {/* New method option */}
        <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value=""
            checked={selected === null}
            onChange={() => onSelect(null)}
            className="accent-primary"
          />
          <div className="w-10 h-7 bg-muted rounded flex items-center justify-center text-xs">
            +
          </div>
          <p className="text-sm font-medium">Use a new payment method</p>
        </label>
      </div>
    </div>
  );
}
