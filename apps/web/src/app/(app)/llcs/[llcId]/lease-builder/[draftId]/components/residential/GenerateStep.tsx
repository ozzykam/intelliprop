'use client';

import { useState } from 'react';
import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

export default function GenerateStep({ draft, llcId }: StepProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; printableHtml?: string; documents: { title: string; type: string }[] } | null>(null);
  const [error, setError] = useState('');

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

          <button
            onClick={openPrintPreview}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Open Print Preview
          </button>
          <p className="text-xs text-muted-foreground">
            Opens in a new tab. Use your browser&apos;s print dialog (Ctrl+P / Cmd+P) to save as PDF.
          </p>
        </div>
      )}
    </div>
  );
}
