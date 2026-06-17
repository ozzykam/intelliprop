'use client';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextLabel?: string;
  loading?: boolean;
  canProceed?: boolean;
}

export default function WizardNavigation({
  onBack,
  onNext,
  onSave,
  isFirstStep = false,
  isLastStep = false,
  nextLabel,
  loading = false,
  canProceed = true,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div>
        {!isFirstStep && onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={loading || !canProceed}
            className="px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving...' : nextLabel || (isLastStep ? 'Generate' : 'Next')}
          </button>
        )}
      </div>
    </div>
  );
}
