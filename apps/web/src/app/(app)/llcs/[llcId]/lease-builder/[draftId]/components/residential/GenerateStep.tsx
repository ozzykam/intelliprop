'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

export default function GenerateStep({ draft, llcId }: StepProps) {
  const router = useRouter();
  const isAddendumMode = !!draft.amendingPublishedLeaseId;

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; printableHtml?: string; documents: { title: string; type: string }[] } | null>(null);
  const [error, setError] = useState('');

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishedLeaseId, setPublishedLeaseId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState('');

  // Addendum state
  const [creatingAddendum, setCreatingAddendum] = useState(false);
  const [addendumCreated, setAddendumCreated] = useState(false);
  const [addendumError, setAddendumError] = useState('');
  const [addendumHtml, setAddendumHtml] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draft.id}/generate-pdf`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Generation failed');
      }
    } catch {
      setError('Failed to generate lease package');
    } finally {
      setGenerating(false);
    }
  }

  function openPrintPreview() {
    if (!result?.printableHtml) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(result.printableHtml);
      win.document.close();
    }
  }

  async function handlePublish() {
    if (!result) return;
    setPublishing(true);
    setPublishError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, packageId: result.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishedLeaseId(data.data.id);
      } else {
        setPublishError(data.error?.message || 'Failed to publish lease');
      }
    } catch {
      setPublishError('Failed to publish lease');
    } finally {
      setPublishing(false);
    }
  }

  async function handleCreateAddendum() {
    setCreatingAddendum(true);
    setAddendumError('');
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${draft.amendingPublishedLeaseId}/addenda/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftId: draft.id }),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setAddendumCreated(true);
        if (data.data?.printableHtml) {
          setAddendumHtml(data.data.printableHtml);
        }
      } else {
        setAddendumError(data.error?.message || 'Failed to create addendum');
      }
    } catch {
      setAddendumError('Failed to create addendum');
    } finally {
      setCreatingAddendum(false);
    }
  }

  // ADDENDUM MODE
  if (isAddendumMode) {
    if (addendumCreated) {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-medium">Addendum Created</h2>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              Addendum created successfully!
            </p>
            <p className="text-xs text-green-700">
              Print and sign the addendum, then accept it on the published lease page to apply the changes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {addendumHtml && (
              <button
                onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(addendumHtml);
                    win.document.close();
                  }
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Open Print Preview
              </button>
            )}
            <Link
              href={`/llcs/${llcId}/published-leases/${draft.amendingPublishedLeaseId}`}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              View Published Lease
            </Link>
            <Link
              href={`/llcs/${llcId}/leases`}
              className="px-6 py-3 border border-input rounded-md hover:bg-secondary transition-colors text-sm font-medium"
            >
              Back to Leases
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-lg font-medium">Create Addendum</h2>
        <p className="text-sm text-muted-foreground">
          Review your changes and create an addendum to the existing lease. This will generate an addendum document for signing.
        </p>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <p className="text-sm font-medium text-amber-800">Amendment Mode</p>
          <p className="text-xs text-amber-700">
            This draft is an amendment to an existing published lease. The addendum will need to be printed, signed, and then accepted on the published lease page before changes take effect.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreateAddendum}
            disabled={creatingAddendum}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {creatingAddendum ? 'Creating Addendum...' : 'Create Addendum'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-input rounded-md hover:bg-secondary transition-colors text-sm font-medium"
          >
            Go Back
          </button>
        </div>

        {addendumError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{addendumError}</div>
        )}
      </div>
    );
  }

  // NORMAL PUBLISH MODE
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Generate & Download</h2>

      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your lease package is ready to be generated. This will create the final lease document with all disclosures and addenda, and save it to your records.
          </p>

          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <p className="text-sm font-medium">Package will include:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>&#8226; Minnesota Residential Lease Agreement</li>
              {(draft.triggeredDisclosures ?? []).map((id) => (
                <li key={id}>&#8226; {id.replace(/^disclosure-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</li>
              ))}
              {(draft.triggeredOverlays ?? []).map((id) => (
                <li key={id}>&#8226; {id.replace(/^addendum-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
          >
            {generating ? 'Generating...' : 'Generate Lease Package'}
          </button>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
          )}
        </div>
      ) : publishedLeaseId ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              Lease published successfully!
            </p>
            <p className="text-xs text-green-700">
              The lease is now active and visible in the Published Leases section.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/llcs/${llcId}/published-leases/${publishedLeaseId}`}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
            >
              View Published Lease
            </Link>
            <Link
              href={`/llcs/${llcId}/leases`}
              className="px-6 py-3 border border-input rounded-md hover:bg-secondary transition-colors text-sm font-medium"
            >
              Back to Leases
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              Lease package generated successfully!
            </p>
            <p className="text-xs text-green-700">Package ID: {result.id}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Documents in package:</p>
            <ul className="space-y-1">
              {result.documents.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm">
                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded capitalize">
                    {doc.type.replace('_', ' ')}
                  </span>
                  {doc.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openPrintPreview}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Open Print Preview
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {publishing ? 'Publishing...' : 'Publish Lease'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Print Preview opens in a new tab. Publishing makes this lease active and trackable.
          </p>

          {publishError && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{publishError}</div>
          )}
        </div>
      )}
    </div>
  );
}
