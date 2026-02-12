'use client';

import { useState, useEffect } from 'react';
import type { LeaseBuilderDraft, ValidationResult } from '@shared/types/leaseBuilder';
import ComplianceWarning from '../ComplianceWarning';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const ADDENDA_LABELS: Record<string, string> = {
  'addendum-work-letter': 'Work Letter Agreement',
  'addendum-personal-guarantee': 'Personal Guarantee',
  'addendum-cam-reconciliation': 'CAM Reconciliation Addendum',
  'addendum-rent-step-schedule': 'Rent Step Schedule',
};

export default function DisclosuresReviewStep({ draft, llcId }: StepProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runValidation() {
      setLoading(true);
      try {
        const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draft.id}/validate`, {
          method: 'POST',
        });
        const data = await res.json();
        if (data.ok) {
          setValidationResults(data.data.results);
        }
      } catch {
        // best effort
      } finally {
        setLoading(false);
      }
    }
    runValidation();
  }, [llcId, draft.id]);

  const overlays = draft.triggeredOverlays ?? [];
  const city = draft.propertyProfile?.city?.toLowerCase() ?? '';
  const isMinneapolis = city === 'minneapolis';
  const isStPaul = city === 'st. paul' || city === 'saint paul' || city === 'st paul';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Disclosures & Overlays Review</h2>

      <p className="text-sm text-muted-foreground">
        Based on the information you&apos;ve provided, the following addenda and city-specific provisions will be included.
      </p>

      {/* City Overlay Info */}
      {(isMinneapolis || isStPaul) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <span className="font-medium">City Overlay:</span>{' '}
          {isMinneapolis && 'Minneapolis commercial overlay — zoning confirmation, signage compliance, and enhanced environmental provisions apply.'}
          {isStPaul && 'St. Paul commercial overlay — zoning confirmation and restaurant/liquor licensing provisions may apply.'}
        </div>
      )}

      {/* Triggered Addenda */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Addenda Included</h3>
        {overlays.length > 0 ? (
          <ul className="space-y-2">
            {overlays.map((id) => (
              <li key={id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm">
                <span className="text-blue-600 font-medium">+</span>
                {ADDENDA_LABELS[id] ?? id.replace(/^addendum-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No additional addenda triggered.</p>
        )}
      </div>

      {/* Standard Clauses Always Included */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Standard Clauses (always included)</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>&#8226; Environmental Compliance & Hazmat Indemnity</li>
          <li>&#8226; ADA Compliance</li>
          <li>&#8226; Casualty & Condemnation</li>
          <li>&#8226; Governing Law & Entire Agreement</li>
        </ul>
      </div>

      {/* Validation */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Running compliance checks...</p>
      ) : (
        <ComplianceWarning results={validationResults} />
      )}

      {validationResults.length > 0 && validationResults.every((r) => r.passed) && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          All compliance checks passed.
        </div>
      )}
    </div>
  );
}
