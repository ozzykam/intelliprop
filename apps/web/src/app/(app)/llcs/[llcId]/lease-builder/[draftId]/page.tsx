'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import type { LeaseBuilderDraft, WizardStep, WizardStepMeta } from '@shared/types/leaseBuilder';
import { RESIDENTIAL_STEPS, COMMERCIAL_STEPS } from '@shared/types/leaseBuilder';
import WizardProgress from './components/WizardProgress';
import WizardNavigation from './components/WizardNavigation';
import CityOverlayBanner from './components/CityOverlayBanner';

/** Strip draft to only the fields the update API accepts */
function toUpdatableFields(data: Partial<LeaseBuilderDraft>): Partial<LeaseBuilderDraft> {
  const {
    currentStep, propertyId, unitIds, tenantIds, leaseType, signerUserId,
    propertyProfile, residential, commercial,
    triggeredDisclosures, triggeredOverlays, reviewedAt, status, saveAsDefault,
  } = data;
  return {
    ...(currentStep !== undefined && { currentStep }),
    ...(propertyId !== undefined && { propertyId }),
    ...(unitIds !== undefined && { unitIds }),
    ...(tenantIds !== undefined && { tenantIds }),
    ...(signerUserId !== undefined && { signerUserId }),
    ...(leaseType !== undefined && { leaseType }),
    ...(propertyProfile !== undefined && { propertyProfile }),
    ...(residential !== undefined && { residential }),
    ...(commercial !== undefined && { commercial }),
    ...(triggeredDisclosures !== undefined && { triggeredDisclosures }),
    ...(triggeredOverlays !== undefined && { triggeredOverlays }),
    ...(reviewedAt !== undefined && { reviewedAt }),
    ...(status !== undefined && { status }),
    ...(saveAsDefault !== undefined && { saveAsDefault }),
  };
}

// Residential steps
import PropertySelectionStep from './components/residential/PropertySelectionStep';
import ResPropertyProfileStep from './components/residential/PropertyProfileStep';
import RentTermsStep from './components/residential/RentTermsStep';
import ResDepositTermsStep from './components/residential/DepositTermsStep';
import UtilityTermsStep from './components/residential/UtilityTermsStep';
import OccupancyTermsStep from './components/residential/OccupancyTermsStep';
import PolicyTermsStep from './components/residential/PolicyTermsStep';
import EntryTermsStep from './components/residential/EntryTermsStep';
import ResDisclosuresReviewStep from './components/residential/DisclosuresReviewStep';
import ResReviewStep from './components/residential/ReviewStep';
import ResGenerateStep from './components/residential/GenerateStep';

// Commercial steps
import CommPropertySelectionStep from './components/commercial/PropertySelectionStep';
import CommPropertyProfileStep from './components/commercial/PropertyProfileStep';
import LeaseStructureStep from './components/commercial/LeaseStructureStep';
import FinancialTermsStep from './components/commercial/FinancialTermsStep';
import CommDepositTermsStep from './components/commercial/DepositTermsStep';
import UseAndBuildoutStep from './components/commercial/UseAndBuildoutStep';
import OperationsStep from './components/commercial/OperationsStep';
import RiskTermsStep from './components/commercial/RiskTermsStep';
import CommDisclosuresReviewStep from './components/commercial/DisclosuresReviewStep';
import CommReviewStep from './components/commercial/ReviewStep';
import CommGenerateStep from './components/commercial/GenerateStep';

interface PageProps {
  params: Promise<{ llcId: string; draftId: string }>;
}

export default function WizardPage({ params }: PageProps) {
  const { llcId, draftId } = use(params);
  const [draft, setDraft] = useState<LeaseBuilderDraft & { id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draftId}`);
        const data = await res.json();
        if (data.ok) {
          setDraft(data.data);
        } else {
          setError(data.error?.message || 'Failed to load draft');
        }
      } catch {
        setError('Failed to load draft');
      } finally {
        setLoading(false);
      }
    }
    loadDraft();
  }, [llcId, draftId]);

  const saveDraft = useCallback(async (updates: Partial<LeaseBuilderDraft>) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toUpdatableFields(updates)),
      });
      const data = await res.json();
      if (data.ok) {
        setDraft(data.data);
        return true;
      } else {
        setError(data.error?.message || 'Failed to save');
        return false;
      }
    } catch {
      setError('Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }, [llcId, draftId]);

  const updateDraftLocal = useCallback((updates: Partial<LeaseBuilderDraft>) => {
    setDraft((prev) => prev ? { ...prev, ...updates } as LeaseBuilderDraft & { id: string } : prev);
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading draft...</p>;
  }

  if (error && !draft) {
    return (
      <div>
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
          {error}
        </div>
        <Link
          href={`/llcs/${llcId}/leases`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Leases
        </Link>
      </div>
    );
  }

  if (!draft) return null;

  const steps: WizardStepMeta[] = draft.leaseClass === 'residential' ? RESIDENTIAL_STEPS : COMMERCIAL_STEPS;
  const currentStepIndex = steps.findIndex((s) => s.key === draft.currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  function goToStep(step: WizardStep) {
    updateDraftLocal({ currentStep: step });
  }

  function sanitizeDraftForSave(d: LeaseBuilderDraft): Partial<LeaseBuilderDraft> {
    if (!d.commercial?.risk) return d;
    if (d.commercial.risk.personalGuaranteeRequired) return d;
    return {
      ...d,
      commercial: {
        ...d.commercial,
        risk: {
          ...d.commercial.risk,
          personalGuaranteeType: undefined,
          personalGuaranteeCap: undefined,
          includePrimaryContactAsGuarantor: undefined,
          guarantors: undefined,
        },
      },
    };
  }

  async function goNext() {
    const nextStep = steps[currentStepIndex + 1];
    if (!nextStep) return;
    const saved = await saveDraft({ ...sanitizeDraftForSave(draft), currentStep: nextStep.key });
    if (saved) {
      updateDraftLocal({ currentStep: nextStep.key });
    }
  }

  async function goBack() {
    const prevStep = steps[currentStepIndex - 1];
    if (!prevStep) return;
    updateDraftLocal({ currentStep: prevStep.key });
  }

  async function handleSave() {
    if (draft) {
      await saveDraft(sanitizeDraftForSave(draft));
    }
  }

  const stepProps = {
    draft,
    llcId,
    updateDraft: updateDraftLocal,
    saveDraft,
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <Link
          href={`/llcs/${llcId}/leases`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Leases
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold capitalize">{draft.leaseClass} Lease</h1>
        {draft.status === 'completed' && (
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
            Completed
          </span>
        )}
      </div>

      <div className="mb-6">
        <WizardProgress
          steps={steps}
          currentStep={draft.currentStep}
          onStepClick={goToStep}
        />
      </div>

      {draft.propertyProfile?.city && (
        <div className="mb-4">
          <CityOverlayBanner
            city={draft.propertyProfile.city}
            leaseClass={draft.leaseClass}
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Step Content */}
        {draft.leaseClass === 'residential' ? (
          <ResidentialStepContent step={draft.currentStep} {...stepProps} />
        ) : (
          <CommercialStepContent step={draft.currentStep} {...stepProps} />
        )}

        {/* Navigation */}
        <WizardNavigation
          onBack={!isFirstStep ? goBack : undefined}
          onNext={!isLastStep ? goNext : undefined}
          onSave={handleSave}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          loading={saving}
          nextLabel={
            draft.currentStep === 'review' ? 'Generate Lease' :
            draft.currentStep === 'generate' ? undefined :
            undefined
          }
        />
      </div>
    </div>
  );
}

// ============================================================================
// STEP CONTENT ROUTERS
// ============================================================================

interface StepContentProps {
  step: WizardStep;
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

function ResidentialStepContent({ step, ...props }: StepContentProps) {
  switch (step) {
    case 'property_selection': return <PropertySelectionStep {...props} />;
    case 'property_profile': return <ResPropertyProfileStep {...props} />;
    case 'rent_terms': return <RentTermsStep {...props} />;
    case 'deposit_terms': return <ResDepositTermsStep {...props} />;
    case 'utility_terms': return <UtilityTermsStep {...props} />;
    case 'occupancy_terms': return <OccupancyTermsStep {...props} />;
    case 'policy_terms': return <PolicyTermsStep {...props} />;
    case 'entry_terms': return <EntryTermsStep {...props} />;
    case 'disclosures_review': return <ResDisclosuresReviewStep {...props} />;
    case 'review': return <ResReviewStep {...props} />;
    case 'generate': return <ResGenerateStep {...props} />;
    default: return <p className="text-sm text-muted-foreground">Unknown step</p>;
  }
}

function CommercialStepContent({ step, ...props }: StepContentProps) {
  switch (step) {
    case 'property_selection': return <CommPropertySelectionStep {...props} />;
    case 'property_profile': return <CommPropertyProfileStep {...props} />;
    case 'lease_structure': return <LeaseStructureStep {...props} />;
    case 'financial_terms': return <FinancialTermsStep {...props} />;
    case 'deposit_terms': return <CommDepositTermsStep {...props} />;
    case 'use_and_buildout': return <UseAndBuildoutStep {...props} />;
    case 'operations': return <OperationsStep {...props} />;
    case 'risk_terms': return <RiskTermsStep {...props} />;
    case 'disclosures_review': return <CommDisclosuresReviewStep {...props} />;
    case 'review': return <CommReviewStep {...props} />;
    case 'generate': return <CommGenerateStep {...props} />;
    default: return <p className="text-sm text-muted-foreground">Unknown step</p>;
  }
}
