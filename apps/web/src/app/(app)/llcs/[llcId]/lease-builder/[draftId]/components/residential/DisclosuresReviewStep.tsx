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

const DISCLOSURE_LABELS: Record<string, string> = {
  'disclosure-lead-paint': 'Lead-Based Paint Disclosure (pre-1978 property)',
  'disclosure-bed-bug': 'Bed Bug Disclosure (MN Stat. 504B.161)',
  'disclosure-dv-notice': 'Domestic Violence Notice (MN Stat. 504B.206)',
  'disclosure-tenant-rights': 'Minnesota Tenant Rights Summary',
  'disclosure-shared-utility': 'Shared Utility Disclosure (MN Stat. 504B.215)',
  'disclosure-mpls-tenant-protections': 'Minneapolis Tenant Protections Disclosure',
  'disclosure-rental-license': 'Minneapolis Rental License Disclosure',
  'disclosure-stp-rent-stabilization': 'St. Paul Rent Stabilization Disclosure',
};

const ADDENDA_LABELS: Record<string, string> = {
  'addendum-pet': 'Pet Addendum',
  'addendum-smoking': 'Smoking Policy Addendum',
  'addendum-utilities': 'Shared Utility Addendum',
  'addendum-renters-insurance': 'Renters Insurance Addendum',
  'addendum-move-in-checklist': 'Move-In/Move-Out Checklist',
  'addendum-parking': 'Parking Addendum',
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
        // Validation is best-effort at this stage
      } finally {
        setLoading(false);
      }
    }

    runValidation();
  }, [llcId, draft.id]);

  const disclosures = draft.triggeredDisclosures ?? [];
  const overlays = draft.triggeredOverlays ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Disclosures & Overlays Review</h2>

      <p className="text-sm text-muted-foreground">
        Based on the information you&apos;ve provided, the following disclosures and addenda will be automatically included in your lease package.
      </p>

      {/* Required Disclosures */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Required Disclosures</h3>
        {disclosures.length > 0 ? (
          <ul className="space-y-2">
            {disclosures.map((id) => (
              <li key={id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm">
                <span className="text-green-600 font-medium">&#10003;</span>
                {DISCLOSURE_LABELS[id] ?? id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No additional disclosures triggered.</p>
        )}
      </div>

      {/* Triggered Addenda */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Addenda</h3>
        {overlays.length > 0 ? (
          <ul className="space-y-2">
            {overlays.map((id) => (
              <li key={id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm">
                <span className="text-blue-600 font-medium">+</span>
                {ADDENDA_LABELS[id] ?? id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No addenda triggered.</p>
        )}
      </div>

      {/* Validation Results */}
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
