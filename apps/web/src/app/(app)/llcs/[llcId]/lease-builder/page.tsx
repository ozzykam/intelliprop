'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LeaseBuilderDraft, LeaseClass } from '@shared/types/leaseBuilder';

interface PageProps {
  params: Promise<{ llcId: string }>;
}

export default function LeaseBuilderPage({ params }: PageProps) {
  const { llcId } = use(params);
  const router = useRouter();
  const [drafts, setDrafts] = useState<(LeaseBuilderDraft & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDrafts() {
      try {
        const res = await fetch(`/api/llcs/${llcId}/lease-builder`);
        const data = await res.json();
        if (data.ok) {
          setDrafts(data.data);
        }
      } catch {
        setError('Failed to load drafts');
      } finally {
        setLoading(false);
      }
    }

    loadDrafts();
  }, [llcId]);

  async function createDraft(leaseClass: LeaseClass) {
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseClass }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/llcs/${llcId}/lease-builder/${data.data.id}`);
      } else {
        setError(data.error?.message || 'Failed to create draft');
      }
    } catch {
      setError('Failed to create draft');
    } finally {
      setCreating(false);
    }
  }

  async function deleteDraft(draftId: string) {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draftId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setDrafts(drafts.filter((d) => d.id !== draftId));
      }
    } catch {
      setError('Failed to delete draft');
    }
  }

  const inProgressDrafts = drafts.filter((d) => d.status === 'in_progress');
  const completedDrafts = drafts.filter((d) => d.status === 'completed');

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lease Builder</h1>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* New Draft Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3">Create New Lease</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => createDraft('residential')}
            disabled={creating}
            className="p-6 border border-input rounded-lg hover:bg-secondary/50 transition-colors text-left disabled:opacity-50"
          >
            <p className="text-lg font-medium mb-1">Residential Lease</p>
            <p className="text-sm text-muted-foreground">
              Minnesota residential lease with compliance guardrails, city overlays, and required disclosures.
            </p>
          </button>
          <button
            onClick={() => createDraft('commercial')}
            disabled={creating}
            className="p-6 border border-input rounded-lg hover:bg-secondary/50 transition-colors text-left disabled:opacity-50"
          >
            <p className="text-lg font-medium mb-1">Commercial Lease</p>
            <p className="text-sm text-muted-foreground">
              Minnesota commercial lease with NNN/Gross/Modified Gross structures, CAM, TI allowances, and more.
            </p>
          </button>
        </div>
      </div>

      {/* In Progress Drafts */}
      {inProgressDrafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">In Progress</h2>
          <div className="space-y-2">
            {inProgressDrafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between p-4 border border-input rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{draft.leaseClass}</span>
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                      In Progress
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Step: {draft.currentStep?.replace(/_/g, ' ')} | Created: {formatDate(draft.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/llcs/${llcId}/lease-builder/${draft.id}`}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </Link>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Drafts */}
      {completedDrafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Completed</h2>
          <div className="space-y-2">
            {completedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between p-4 border border-input rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{draft.leaseClass}</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reviewed: {draft.reviewedAt ? formatDate(draft.reviewedAt) : 'N/A'}
                  </p>
                </div>
                <Link
                  href={`/llcs/${llcId}/lease-builder/${draft.id}`}
                  className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Loading drafts...</p>
      )}

      {!loading && drafts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No lease drafts yet. Create one above to get started.
        </p>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
