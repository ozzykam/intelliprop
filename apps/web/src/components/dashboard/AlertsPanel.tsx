'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ReactNode } from 'react';

export interface Alert {
  id: string;
  type: 'lease_expiring' | 'charge_overdue' | 'payment_due' | 'case_hearing' | 'task_due' | 'mortgage_payment_due' | 'claim_task_due';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  llcId: string;
  llcName: string;
  entityType: string;
  entityId: string;
  caseId?: string;
  claimId?: string;
  dueDate?: string;
  amount?: number;
}

export const alertIcons: Record<string, ReactNode> = {
  lease_expiring: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  charge_overdue: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  payment_due: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  case_hearing: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  task_due: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  mortgage_payment_due: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  claim_task_due: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
};

export function getAlertLink(alert: Alert): string {
  switch (alert.entityType) {
    case 'lease':
      return `/llcs/${alert.llcId}/leases/${alert.entityId}`;
    case 'charge':
      return `/llcs/${alert.llcId}/leases`; // Navigate to leases, charges are under lease
    case 'case':
      return `/llcs/${alert.llcId}/legal/${alert.entityId}`;
    case 'task':
      return `/llcs/${alert.llcId}/legal/${alert.caseId}`;
    case 'claim_task':
      return `/llcs/${alert.llcId}/insurance/claims/${alert.claimId}`;
    case 'mortgage':
      return `/admin/mortgages/${alert.entityId}`;
    default:
      return `/llcs/${alert.llcId}`;
  }
}

interface AlertsPanelProps {
  maxItems?: number;
  compact?: boolean;
}

export default function AlertsPanel({ maxItems = 10, compact = false }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter(a => !hiddenIds.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  function hideAlert(id: string) {
    setHiddenIds(prev => new Set(prev).add(id));
  }

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();

        if (data.ok) {
          setAlerts(data.data);
        } else {
          setError(data.error?.message || 'Failed to load alerts');
        }
      } catch {
        setError('Failed to load alerts');
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  const header = (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 hover:opacity-70 transition-opacity"
      >
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="font-semibold">Alerts</h2>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-secondary rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-secondary rounded animate-pulse"></div>
          </div>
        ) : (
          <>
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                {warningCount} warning
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );

  const seeAllLink = (
    <div className="mt-3 text-right">
      <Link href="/alerts" className="text-sm text-muted-foreground hover:text-foreground">
        See All &rarr;
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div>
        {header}
        {expanded && (
          <div>
            <div className="animate-pulse">
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-secondary rounded"></div>
                ))}
              </div>
            </div>
            {seeAllLink}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header}
        {expanded && (
          <div>
            <div className="text-sm text-destructive">{error}</div>
            {seeAllLink}
          </div>
        )}
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div>
        {header}
        {expanded && (
          <div>
            <div className="text-sm text-muted-foreground py-4 text-center">
              No alerts - everything looks good!
            </div>
            {seeAllLink}
          </div>
        )}
      </div>
    );
  }

  const displayAlerts = visibleAlerts.slice(0, maxItems);
  const remainingCount = visibleAlerts.length - maxItems;

  return (
    <div>
      {header}
      {expanded && (
        <div>
          <div className="space-y-2">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border
                  ${alert.severity === 'critical'
                    ? 'border-red-500/50 bg-red-50/50'
                    : 'border-yellow-500/50 bg-yellow-50/50'
                  }
                `}
              >
                <Link
                  href={getAlertLink(alert)}
                  className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <div className={`
                    mt-0.5 shrink-0
                    ${alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}
                  `}>
                    {alertIcons[alert.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-sm font-medium
                        ${alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'}
                      `}>
                        {alert.title}
                      </span>
                      {!compact && (
                        <span className="text-xs text-muted-foreground">
                          {alert.llcName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.description}
                    </p>
                  </div>
                  {alert.dueDate && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(alert.dueDate.slice(0, 10) + 'T00:00:00').toLocaleDateString()}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => hideAlert(alert.id)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Hide this alert"
                >
                  hide
                </button>
              </div>
              ))}
          </div>

          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              +{remainingCount} more alert{remainingCount > 1 ? 's' : ''}
            </p>
          )}
          {seeAllLink}
        </div>
      )}
    </div>
  );
}
