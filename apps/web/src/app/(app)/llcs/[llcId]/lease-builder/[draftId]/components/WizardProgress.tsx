'use client';

import type { WizardStepMeta, WizardStep } from '@shared/types/leaseBuilder';

interface WizardProgressProps {
  steps: WizardStepMeta[];
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}

export default function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max gap-1">
        {steps.map((step, idx) => {
          const isComplete = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isClickable = onStepClick && idx <= currentIndex;

          return (
            <div key={step.key} className="flex items-center">
              {idx > 0 && (
                <div
                  className={`w-8 h-0.5 ${
                    isComplete ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground font-medium'
                    : isComplete
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
                    : 'bg-muted text-muted-foreground'
                }`}
                title={step.description}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium border border-current">
                  {isComplete ? '\u2713' : idx + 1}
                </span>
                {step.shortLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
