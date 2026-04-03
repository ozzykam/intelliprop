'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AssignmentOfClaim,
  AocStatus,
  AssignmentClaimType,
  AOC_STATUS_LABELS,
  AOC_STATUS_COLORS,
  ASSIGNMENT_CLAIM_TYPE_LABELS,
  AOC_STATUS_TRANSITIONS,
} from '@shared/types';
import { generateAocDocument, generateNoticeToObligor } from '@shared/assignmentOfClaim/generator';

interface DetailPageProps {
  params: Promise<{ llcId: string; assignmentId: string }>;
}

function formatDate(iso: string): string {
  const parts = iso.split('-').map(Number);
  const year = parts[0] ?? 2000;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function GridRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value ?? '—'}</dd>
    </div>
  );
}

export default function AssignmentDetailPage({ params }: DetailPageProps) {
  const { llcId, assignmentId } = use(params);
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [assignment, setAssignment] = useState<AssignmentOfClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'document'>('overview');
  const [statusTransitioning, setStatusTransitioning] = useState(false);
  const [executedDate, setExecutedDate] = useState('');
  const [showExecutedDateInput, setShowExecutedDateInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AocStatus | ''>('');
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const noticeRef = useRef<HTMLIFrameElement>(null);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/aoc/${assignmentId}`);
      const data = await res.json();
      if (data.ok) {
        setAssignment(data.data);
      } else {
        setError(data.error?.message || 'Failed to load assignment');
      }
    } catch {
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [llcId, assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleStatusChange = (newStatus: AocStatus) => {
    setPendingStatus(newStatus);
    if (newStatus === 'executed') {
      setShowExecutedDateInput(true);
      return;
    }
    void applyStatusTransition(newStatus, undefined);
  };

  const applyStatusTransition = async (newStatus: AocStatus, execDate: string | undefined) => {
    if (!assignment) return;
    setStatusTransitioning(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (execDate) body.executedDate = execDate;

      const res = await fetch(`/api/llcs/${llcId}/aoc/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setAssignment(data.data);
        setShowExecutedDateInput(false);
        setPendingStatus('');
        setExecutedDate('');
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusTransitioning(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!assignment) return;
    setGeneratingDoc(true);
    const html = generateAocDocument(assignment);
    try {
      const res = await fetch(`/api/llcs/${llcId}/aoc/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHtml: html }),
      });
      const data = await res.json();
      if (data.ok) {
        setAssignment(data.data);
      } else {
        alert(data.error?.message || 'Failed to save document');
      }
    } catch {
      alert('Failed to generate document');
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!confirm(`Delete this assignment of claim? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/aoc/${assignmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        router.push(`/llcs/${llcId}/assignments`);
      } else {
        alert(data.error?.message || 'Failed to delete');
        setDeleting(false);
      }
    } catch {
      alert('Failed to delete assignment');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!assignment) return <div className="text-muted-foreground">Assignment not found.</div>;

  const allowedTransitions = AOC_STATUS_TRANSITIONS[assignment.status as AocStatus] ?? [];
  const claimTypeLabel = ASSIGNMENT_CLAIM_TYPE_LABELS[assignment.claimType as AssignmentClaimType] ?? assignment.claimType;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/llcs/${llcId}/assignments`} className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Assignments
          </Link>
          <h1 className="text-2xl font-bold">Assignment of Claim</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            To: {assignment.assignee.name} · {claimTypeLabel}
          </p>
        </div>
        <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${AOC_STATUS_COLORS[assignment.status as AocStatus] ?? 'bg-gray-100'}`}>
          {AOC_STATUS_LABELS[assignment.status as AocStatus] ?? assignment.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {(['overview', 'document'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status transition */}
          {allowedTransitions.length > 0 && (
            <div className="p-4 border rounded-lg bg-secondary/20 space-y-3">
              <div className="text-sm font-medium">Update Status</div>
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={statusTransitioning}
                    className="px-3 py-1.5 text-xs border rounded-md hover:bg-secondary/50 disabled:opacity-60"
                  >
                    Mark {AOC_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {showExecutedDateInput && pendingStatus === 'executed' && (
                <div className="flex items-end gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Execution Date</label>
                    <input
                      type="date"
                      value={executedDate}
                      onChange={e => setExecutedDate(e.target.value)}
                      className="border rounded-md px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => void applyStatusTransition('executed', executedDate || undefined)}
                    disabled={statusTransitioning}
                    className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
                  >
                    {statusTransitioning ? 'Saving...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => { setShowExecutedDateInput(false); setPendingStatus(''); }}
                    className="px-3 py-1.5 text-xs border rounded-md hover:bg-secondary/50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Summary grid */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Claim Details</h2>
            <dl className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <GridRow label="Claim Type" value={claimTypeLabel} />
              <GridRow label="Effective Date" value={formatDate(assignment.effectiveDate)} />
              {assignment.expirationDate && (
                <GridRow label="Expiration Date" value={formatDate(assignment.expirationDate)} />
              )}
              {assignment.claimValueCents !== undefined && (
                <GridRow label="Claim Value" value={formatCents(assignment.claimValueCents)} />
              )}
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Description</dt>
                <dd className="text-sm mt-0.5">{assignment.claimDescription}</dd>
              </div>
              {assignment.tenantName && <GridRow label="Tenant" value={assignment.tenantName} />}
              {assignment.propertyAddress && <GridRow label="Property" value={assignment.propertyAddress} />}
              {assignment.insurer && <GridRow label="Insurer" value={assignment.insurer} />}
              {assignment.insuranceClaimNumber && <GridRow label="Claim Number" value={assignment.insuranceClaimNumber} />}
              {assignment.tenantId && (
                <div>
                  <dt className="text-xs text-muted-foreground">Tenant Record</dt>
                  <dd className="text-sm mt-0.5">
                    <Link href={`/llcs/${llcId}/tenants/${assignment.tenantId}`} className="text-primary hover:underline">
                      View Tenant
                    </Link>
                  </dd>
                </div>
              )}
              {assignment.insuranceClaimId && (
                <div>
                  <dt className="text-xs text-muted-foreground">Insurance Claim</dt>
                  <dd className="text-sm mt-0.5">
                    <Link href={`/llcs/${llcId}/insurance/claims/${assignment.insuranceClaimId}`} className="text-primary hover:underline">
                      View Insurance Claim
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Assignee</h2>
            <dl className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <GridRow label="Name" value={assignment.assignee.name} />
              <GridRow label="Type" value={assignment.assignee.entityType === 'company' ? 'Company' : 'Individual'} />
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="text-sm mt-0.5">{assignment.assignee.address}</dd>
              </div>
              {assignment.assignee.phone && <GridRow label="Phone" value={assignment.assignee.phone} />}
              {assignment.assignee.email && <GridRow label="Email" value={assignment.assignee.email} />}
            </dl>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Terms</h2>
            <dl className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <GridRow
                label="Consideration"
                value={
                  assignment.considerationCents === 0
                    ? '$1.00 (nominal)'
                    : formatCents(assignment.considerationCents)
                }
              />
              <GridRow label="Title Warranty" value={assignment.warrantsGoodTitle ? 'Warrants Good Title' : 'As-Is / No Warranty'} />
              {assignment.specialConditions && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Special Conditions</dt>
                  <dd className="text-sm mt-0.5 whitespace-pre-wrap">{assignment.specialConditions}</dd>
                </div>
              )}
              {assignment.executedDate && <GridRow label="Executed Date" value={formatDate(assignment.executedDate)} />}
            </dl>
          </div>

          {/* Draft actions */}
          {assignment.status === 'draft' && (
            <div className="pt-2 border-t flex gap-2">
              <Link
                href={`/llcs/${llcId}/assignments/${assignmentId}/edit`}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary/50"
              >
                Edit Draft
              </Link>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete Assignment'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document Tab */}
      {activeTab === 'document' && (
        <div>
          {assignment.documentHtml ? (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary/50"
                >
                  Print
                </button>
                <button
                  onClick={() => void handleGenerateDocument()}
                  disabled={generatingDoc}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary/50 disabled:opacity-60"
                >
                  {generatingDoc ? 'Regenerating...' : 'Regenerate Document'}
                </button>
                <button
                  onClick={() => setShowNotice(v => !v)}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary/50"
                >
                  {showNotice ? 'Hide Notice Letter' : 'View Notice Letter'}
                </button>
              </div>
              <iframe
                ref={iframeRef}
                srcDoc={assignment.documentHtml}
                style={{ width: '100%', height: '800px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                title="Assignment of Claim"
              />
              {showNotice && (
                <div className="mt-6">
                  <div className="text-sm font-medium mb-2">Notice to Obligor (Exhibit A)</div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => noticeRef.current?.contentWindow?.print()}
                      className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary/50"
                    >
                      Print Notice
                    </button>
                  </div>
                  <iframe
                    ref={noticeRef}
                    srcDoc={generateNoticeToObligor(assignment)}
                    style={{ width: '100%', height: '500px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                    title="Notice to Obligor"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg">
              <p className="text-muted-foreground mb-4">No document generated yet.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => void handleGenerateDocument()}
                  disabled={generatingDoc}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
                >
                  {generatingDoc ? 'Generating...' : 'Generate Document'}
                </button>
                <button
                  onClick={() => setShowNotice(v => !v)}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-secondary/50"
                >
                  {showNotice ? 'Hide Notice Letter' : 'View Notice Letter'}
                </button>
              </div>
              {showNotice && (
                <div className="mt-6 text-left">
                  <div className="text-sm font-medium mb-2">Notice to Obligor (Exhibit A)</div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => noticeRef.current?.contentWindow?.print()}
                      className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary/50"
                    >
                      Print Notice
                    </button>
                  </div>
                  <iframe
                    ref={noticeRef}
                    srcDoc={generateNoticeToObligor(assignment)}
                    style={{ width: '100%', height: '500px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                    title="Notice to Obligor"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
