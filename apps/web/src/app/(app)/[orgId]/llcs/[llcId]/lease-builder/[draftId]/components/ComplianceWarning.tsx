'use client';

import type { ValidationResult } from '@shared/types/leaseBuilder';

interface ComplianceWarningProps {
  results: ValidationResult[];
}

export default function ComplianceWarning({ results }: ComplianceWarningProps) {
  const errors = results.filter((r) => r.severity === 'error' && !r.passed);
  const warnings = results.filter((r) => r.severity === 'warning' && !r.passed);

  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-medium text-destructive mb-2">
            Compliance Errors (must be resolved)
          </p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e) => (
              <li key={e.ruleId} className="text-sm text-destructive">
                {e.message}
                {e.helpText && (
                  <span className="text-xs text-destructive/70 ml-1">({e.helpText})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Compliance Warnings
          </p>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((w) => (
              <li key={w.ruleId} className="text-sm text-yellow-800">
                {w.message}
                {w.helpText && (
                  <span className="text-xs text-yellow-600 ml-1">({w.helpText})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
