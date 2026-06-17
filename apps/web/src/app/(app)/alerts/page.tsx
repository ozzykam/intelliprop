'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, alertIcons, getAlertLink } from '@/components/dashboard/AlertsPanel';

const ALERT_TYPE_LABELS: Record<string, string> = {
  lease_expiring: 'Lease Expiring',
  charge_overdue: 'Charge Overdue',
  payment_due: 'Payment Due',
  case_hearing: 'Case Hearing',
  task_due: 'Task Due',
  mortgage_payment_due: 'Mortgage Due',
};

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'lease_expiring', label: 'Lease Expiring' },
  { value: 'charge_overdue', label: 'Charge Overdue' },
  { value: 'payment_due', label: 'Payment Due' },
  { value: 'case_hearing', label: 'Case Hearing' },
  { value: 'task_due', label: 'Task Due' },
  { value: 'mortgage_payment_due', label: 'Mortgage Due' },
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const orgsRes = await fetch('/api/me/orgs');
        const orgsData = await orgsRes.json();
        const orgId: string | undefined = orgsData.ok && orgsData.data.length > 0
          ? orgsData.data[0].id
          : undefined;

        const url = orgId ? `/api/alerts?orgId=${orgId}` : '/api/alerts';
        const res = await fetch(url);
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

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    return true;
  });

  const totalCount = filteredAlerts.length;
  const criticalCount = filteredAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = filteredAlerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/llcs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">All Alerts</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Alerts</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Warning</div>
          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {SEVERITY_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {TYPE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
      )}

      {/* Table */}
      {!loading && (
        filteredAlerts.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Severity</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">LLC</th>
                    <th className="text-left px-4 py-3 font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAlerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="hover:bg-secondary/20 cursor-pointer"
                      onClick={() => { window.location.href = getAlertLink(alert); }}
                    >
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}>
                            {alertIcons[alert.type]}
                          </span>
                          <span>{ALERT_TYPE_LABELS[alert.type] || alert.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {alert.title}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {alert.description}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/llcs/${alert.llcId}`}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {alert.llcName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(alert.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground">No alerts found</p>
          </div>
        )
      )}
    </div>
  );
}
