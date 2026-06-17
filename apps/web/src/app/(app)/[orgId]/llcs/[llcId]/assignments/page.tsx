'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  AssignmentOfClaim,
  AocStatus,
  AssignmentClaimType,
  AOC_STATUS_LABELS,
  AOC_STATUS_COLORS,
  ASSIGNMENT_CLAIM_TYPE_LABELS,
} from '@shared/types';

interface AssignmentsPageProps {
  params: Promise<{ orgId: string; llcId: string }>;
}

function formatDate(iso: string): string {
  const parts = iso.split('-').map(Number);
  const year = parts[0] ?? 2000;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function AssignmentsPage({ params }: AssignmentsPageProps) {
  const { orgId, llcId } = use(params);
  const [assignments, setAssignments] = useState<AssignmentOfClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/aoc`);
      const data = await res.json();
      if (data.ok) {
        setAssignments(data.data);
      } else {
        setError(data.error?.message || 'Failed to load assignments');
      }
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [llcId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = useMemo(() => {
    let result = assignments;
    if (statusFilter) result = result.filter(a => a.status === statusFilter);
    if (typeFilter) result = result.filter(a => a.claimType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        a =>
          a.assignee.name.toLowerCase().includes(q) ||
          a.claimDescription.toLowerCase().includes(q) ||
          (a.tenantName?.toLowerCase().includes(q) ?? false) ||
          (a.insuranceClaimNumber?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [assignments, statusFilter, typeFilter, search]);

  const handleDelete = async (id: string, assigneeName: string) => {
    if (!confirm(`Delete assignment to "${assigneeName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/llcs/${llcId}/aoc/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id));
      } else {
        alert(data.error?.message || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete assignment');
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading assignments...</div>;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assignments of Claim</h1>
        <Link
          href={`/${orgId}/llcs/${llcId}/assignments/new`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          + New Assignment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search assignee, description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm flex-1 min-w-48"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {(Object.entries(AOC_STATUS_LABELS) as [AocStatus, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All Types</option>
          {(Object.entries(ASSIGNMENT_CLAIM_TYPE_LABELS) as [AssignmentClaimType, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {assignments.length > 0 && (
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} of {assignments.length} assignments
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No assignments of claim yet.</p>
          <Link
            href={`/${orgId}/llcs/${llcId}/assignments/new`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            New Assignment
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No assignments match your filters.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Assignee</th>
                <th className="text-left px-4 py-3 font-medium">Claim Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Effective Date</th>
                <th className="text-left px-4 py-3 font-medium">Value</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/${orgId}/llcs/${llcId}/assignments/${a.id}`} className="hover:underline">
                      <div className="font-medium">{a.assignee.name}</div>
                      <div className="text-muted-foreground text-xs capitalize">{a.assignee.entityType}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ASSIGNMENT_CLAIM_TYPE_LABELS[a.claimType as AssignmentClaimType] ?? a.claimType}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${AOC_STATUS_COLORS[a.status as AocStatus] ?? 'bg-gray-100'}`}>
                      {AOC_STATUS_LABELS[a.status as AocStatus] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(a.effectiveDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.claimValueCents !== undefined ? formatCents(a.claimValueCents) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${orgId}/llcs/${llcId}/assignments/${a.id}`}
                      className="inline-flex p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                    {a.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(a.id, a.assignee.name)}
                        className="inline-flex p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
