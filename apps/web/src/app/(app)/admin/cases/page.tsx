'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AdminCase {
  id: string;
  llcId: string;
  llcName: string;
  propertyId?: string;
  propertyAddress?: string;
  court: string;
  jurisdiction: string;
  docketNumber?: string;
  caseType: string;
  status: string;
  visibility: string;
  opposingPartyNames: string[];
  ourCounselNames: string[];
  filingDate?: string;
  nextHearingDate?: string;
  nextCourtDate?: { date: string; time?: string; type: string; judge?: string };
  taskCount: number;
  openTaskCount: number;
  documentCount: number;
  resolution?: { type: string; date: string; amount?: number };
  createdAt: string;
}

interface AdminTask {
  id: string;
  caseId: string;
  llcId: string;
  llcName: string;
  opposingPartyName: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface LLC {
  id: string;
  legalName: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  stayed: 'bg-yellow-100 text-yellow-800',
  settled: 'bg-green-100 text-green-800',
  judgment: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const CASE_TYPE_LABELS: Record<string, string> = {
  code_violation: 'Code Violation',
  collections: 'Collections',
  contract_dispute: 'Contract Dispute',
  conciliation: 'Conciliation',
  eviction: 'Eviction',
  personal_injury: 'Personal Injury',
  property_damage: 'Property Damage',
  other: 'Other',
};

const COURT_DATE_TYPE_LABELS: Record<string, string> = {
  hearing: 'Hearing',
  trial: 'Trial',
  motion: 'Motion',
  status_conference: 'Status Conference',
  pretrial_conference: 'Pretrial Conference',
  mediation: 'Mediation',
  settlement_conference: 'Settlement Conference',
  arraignment: 'Arraignment',
  sentencing: 'Sentencing',
  other: 'Other',
};

const CASE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'stayed', label: 'Stayed' },
  { value: 'settled', label: 'Settled' },
  { value: 'judgment', label: 'Judgment' },
  { value: 'closed', label: 'Closed' },
];

const CASE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'code_violation', label: 'Code Violation' },
  { value: 'collections', label: 'Collections' },
  { value: 'conciliation', label: 'Conciliation' },
  { value: 'contract_dispute', label: 'Contract Dispute' },
  { value: 'eviction', label: 'Eviction' },
  { value: 'personal_injury', label: 'Personal Injury' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'other', label: 'Other' },
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function AdminCasesPage() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [activeTasks, setActiveTasks] = useState<AdminTask[]>([]);
  const [llcs, setLlcs] = useState<LLC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [llcFilter, setLlcFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLlcs = async () => {
    try {
      const res = await fetch('/api/llcs');
      const data = await res.json();
      if (data.ok) {
        setLlcs(data.data);
      }
    } catch {
      console.error('Failed to fetch LLCs');
    }
  };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (llcFilter) params.set('llcId', llcFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (caseTypeFilter) params.set('caseType', caseTypeFilter);

      const res = await fetch(`/api/admin/cases?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setCases(data.data);
        setActiveTasks(data.activeTasks || []);
      } else {
        setError(data.error?.message || 'Failed to fetch cases');
      }
    } catch {
      setError('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  }, [llcFilter, statusFilter, caseTypeFilter]);

  useEffect(() => {
    fetchLlcs();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Client-side search filter
  const filteredCases = cases.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.opposingPartyNames.some(n => n.toLowerCase().includes(search)) ||
      c.court.toLowerCase().includes(search) ||
      (c.docketNumber || '').toLowerCase().includes(search) ||
      c.llcName.toLowerCase().includes(search)
    );
  });

  // Summary stats
  const totalCases = filteredCases.length;
  const openCases = filteredCases.filter(c => c.status === 'open').length;
  const casesWithHearings = filteredCases.filter(c => c.nextCourtDate).length;
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Admin
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">All Legal Cases</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Cases</div>
          <div className="text-2xl font-bold">{totalCases}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Open Cases</div>
          <div className="text-2xl font-bold text-blue-600">{openCases}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Upcoming Hearings</div>
          <div className="text-2xl font-bold text-purple-600">{casesWithHearings}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Party, court, docket..."
            className="px-3 py-2 border rounded-md text-sm w-48"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">LLC</label>
          <select
            value={llcFilter}
            onChange={(e) => setLlcFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All LLCs</option>
            {llcs.map(llc => (
              <option key={llc.id} value={llc.id}>{llc.legalName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {CASE_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Case Type</label>
          <select
            value={caseTypeFilter}
            onChange={(e) => setCaseTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {CASE_TYPES.map(t => (
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
        <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
      )}

      {/* Main content: Table + Sidebar */}
      {!loading && (
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Table Section */}
          <div className="flex-1 min-w-0">
            {filteredCases.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">LLC</th>
                        <th className="text-left px-4 py-3 font-medium">Opposing Party</th>
                        <th className="text-left px-4 py-3 font-medium">Court / Jurisdiction</th>
                        <th className="text-left px-4 py-3 font-medium">Type</th>
                        <th className="text-center px-4 py-3 font-medium">Status</th>
                        <th className="text-left px-4 py-3 font-medium">Next Hearing</th>
                        <th className="text-center px-4 py-3 font-medium">Tasks</th>
                        <th className="text-left px-4 py-3 font-medium">Filed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.map((c) => (
                        <tr key={`${c.llcId}-${c.id}`} className="border-t hover:bg-secondary/20">
                          <td className="px-4 py-3">
                            <Link
                              href={`/llcs/${c.llcId}`}
                              className="text-primary hover:underline"
                            >
                              {c.llcName}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/llcs/${c.llcId}/legal/${c.id}`}
                              className="hover:underline"
                            >
                              {c.opposingPartyNames.length > 0
                                ? c.opposingPartyNames[0]
                                : 'Unknown'}
                            </Link>
                            {c.opposingPartyNames.length > 1 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                +{c.opposingPartyNames.length - 1}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div>{c.court}</div>
                            <div className="text-xs text-muted-foreground">{c.jurisdiction}</div>
                          </td>
                          <td className="px-4 py-3">
                            {CASE_TYPE_LABELS[c.caseType] || c.caseType}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[c.status] || 'bg-gray-100'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {c.nextCourtDate ? (
                              <div>
                                <div>{formatDate(c.nextCourtDate.date)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {COURT_DATE_TYPE_LABELS[c.nextCourtDate.type] || c.nextCourtDate.type}
                                </div>
                              </div>
                            ) : c.nextHearingDate ? (
                              <div>{formatDate(c.nextHearingDate)}</div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {c.taskCount > 0 ? (
                              <span className={c.openTaskCount > 0 ? 'text-orange-600 font-medium' : ''}>
                                {c.openTaskCount}/{c.taskCount}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(c.filingDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">No cases found</p>
              </div>
            )}
          </div>

          {/* Active Tasks Sidebar */}
          <div className="w-full xl:w-80 flex-shrink-0">
            <div className="border rounded-lg">
              <div className="px-4 py-3 border-b bg-secondary/30">
                <h2 className="font-semibold text-sm">
                  Active Tasks{' '}
                  <span className="text-muted-foreground font-normal">({activeTasks.length})</span>
                </h2>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-300px)] divide-y">
                {activeTasks.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No active tasks
                  </div>
                ) : (
                  activeTasks.map((task) => {
                    const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
                    return (
                      <div key={`${task.llcId}-${task.caseId}-${task.id}`} className="p-3">
                        <Link
                          href={`/llcs/${task.llcId}/legal/${task.caseId}/tasks`}
                          className="text-sm font-medium hover:underline text-primary block"
                        >
                          {task.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.opposingPartyName} &middot; {task.llcName}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {task.dueDate && (
                            <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              {isOverdue ? 'Overdue: ' : 'Due: '}
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
