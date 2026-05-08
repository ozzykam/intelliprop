'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import type { ARData, ARLlcGroup, ARPropertyGroup, ARLeaseRow } from '@/lib/services/financials.service';

function formatCents(cents: number) {
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function oldestDueDate(charges: ARLeaseRow['overdueCharges']) {
  if (!charges.length) return '—';
  return charges.map(c => c.dueDate).sort()[0];
}

export default function FinancialsPage() {
  const [data, setData] = useState<ARData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLlcs, setExpandedLlcs] = useState<Set<string>>(new Set());
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/financials')
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          setData(res.data);
          setExpandedLlcs(new Set(res.data.llcs.map((l: ARLlcGroup) => l.llcId)));
          setExpandedProps(
            new Set(
              res.data.llcs.flatMap((l: ARLlcGroup) =>
                l.properties.map((p: ARPropertyGroup) => p.propertyId)
              )
            )
          );
        } else {
          setError(res.error?.message ?? 'Failed to load financials');
        }
      })
      .catch(() => setError('Failed to load financials'))
      .finally(() => setLoading(false));
  }, []);

  function toggleLlc(llcId: string) {
    setExpandedLlcs(prev => {
      const next = new Set(prev);
      if (next.has(llcId)) next.delete(llcId);
      else next.add(llcId);
      return next;
    });
  }

  function toggleProp(propertyId: string) {
    setExpandedProps(prev => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financials</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Total Monthly Expected Income"
          value={formatCents(data.totalMonthlyIncome) + ' / mo'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Total Overdue Rent"
          value={formatCents(data.totalOverdue)}
          variant={data.totalOverdue > 0 ? 'danger' : 'default'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Accounts Receivable */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Accounts Receivable</h2>

        {/* Overdue card */}
        {data.totalOverdue > 0 && (
          <div className="border border-red-500/50 rounded-lg overflow-hidden">
            <div className="bg-red-50/50 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-destructive">Overdue Rent</span>
              <span className="font-bold text-destructive">{formatCents(data.totalOverdue)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Property / Unit(s)</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">LLC</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Overdue</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Oldest Due</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Charges</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdueByLease.map(row => (
                    <tr key={row.leaseId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2">
                        <div className="font-medium">{row.propertyName}</div>
                        <div className="text-muted-foreground text-xs">Unit {row.unitNumbers}</div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{row.llcName}</td>
                      <td className="px-4 py-2 text-right font-medium text-destructive">
                        {formatCents(row.overdueAmount)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {oldestDueDate(row.overdueCharges)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {row.overdueCharges.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Income breakdown tree */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b">
            <span className="font-semibold">
              Expected Monthly Income — {formatCents(data.totalMonthlyIncome)} / mo
            </span>
          </div>

          {data.llcs.length === 0 && (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No active published leases found.
            </div>
          )}

          {data.llcs.map(llc => (
            <div key={llc.llcId} className="border-b last:border-0">
              {/* LLC row */}
              <button
                onClick={() => toggleLlc(llc.llcId)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform ${expandedLlcs.has(llc.llcId) ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-semibold">{llc.llcName}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatCents(llc.monthlyIncome)} / mo
                </span>
              </button>

              {/* Properties */}
              {expandedLlcs.has(llc.llcId) && (
                <div className="border-t">
                  {llc.properties.map(property => (
                    <div key={property.propertyId} className="border-b last:border-0">
                      {/* Property row */}
                      <button
                        onClick={() => toggleProp(property.propertyId)}
                        className="w-full flex items-center justify-between pl-8 pr-4 py-2 hover:bg-muted/20 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedProps.has(property.propertyId) ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-sm font-medium">{property.propertyName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCents(property.monthlyIncome)} / mo
                        </span>
                      </button>

                      {/* Lease rows */}
                      {expandedProps.has(property.propertyId) && (
                        <div className="border-t bg-muted/10">
                          {property.leases.length === 0 && (
                            <div className="pl-16 pr-4 py-2 text-xs text-muted-foreground">No active leases</div>
                          )}
                          {property.leases.map(lease => (
                            <div
                              key={lease.leaseId}
                              className="flex items-center justify-between pl-16 pr-4 py-2 border-b last:border-0 text-sm"
                            >
                              <span className="text-muted-foreground">Unit {lease.unitNumbers}</span>
                              <div className="flex items-center gap-6 text-right">
                                <span className="font-medium">{formatCents(lease.rentAmount)} / mo</span>
                                <span className="text-muted-foreground text-xs">
                                  Due day {lease.dueDay}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  Ends {lease.leaseEndDate || 'Month-to-Month'}
                                </span>
                                {lease.overdueAmount > 0 && (
                                  <span className="text-destructive text-xs font-medium">
                                    {formatCents(lease.overdueAmount)} overdue
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
