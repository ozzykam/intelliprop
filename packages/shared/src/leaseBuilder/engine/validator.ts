/**
 * Validation Engine
 *
 * Runs validation rules against a LeaseBuilderDraft and returns results.
 * Supports state-level rules, city-specific rules, and lease-class-specific rules.
 */

import type { LeaseBuilderDraft, ValidationRule, ValidationResult } from '../../types/leaseBuilder';
import { resolvePath } from './conditionEvaluator';
import { MN_LIMITS, STP_RENT_STABILIZATION } from '../constants';

/**
 * Custom validation functions referenced by ValidationRule.condition.customFn
 */
const CUSTOM_VALIDATORS: Record<string, (draft: LeaseBuilderDraft) => boolean> = {

  /** Checks if late fee percentage exceeds MN statutory max */
  lateFeePercentageExceedsMax: (draft) => {
    const rent = draft.residential?.rent;
    if (!rent || rent.lateFeeType !== 'percentage') return true; // passes (not applicable)
    return (rent.lateFeeAmount ?? 0) <= MN_LIMITS.MAX_LATE_FEE_PERCENT;
  },

  /** Checks if St. Paul rent increase exceeds allowed cap */
  stPaulRentCapCheck: (draft) => {
    const rent = draft.residential?.rent;
    if (!rent || !rent.priorRentAmount || !rent.monthlyRent) return true;
    const maxAllowedIncrease = rent.priorRentAmount * (STP_RENT_STABILIZATION.MAX_ANNUAL_INCREASE_PERCENT / 100);
    const actualIncrease = rent.monthlyRent - rent.priorRentAmount;
    return actualIncrease <= maxAllowedIncrease;
  },

  /** Checks if property requires lead paint disclosure */
  requiresLeadPaintDisclosure: (draft) => {
    if (!draft.propertyProfile?.yearBuilt) return true; // can't check, passes
    if (draft.propertyProfile.yearBuilt >= MN_LIMITS.LEAD_PAINT_YEAR_THRESHOLD) return true;
    // Pre-1978: disclosure must be in triggered list
    return draft.triggeredDisclosures.includes('disclosure-lead-paint');
  },

  /** Commercial: Checks for CAM + Gross lease conflict */
  camGrossConflict: (draft) => {
    const financial = draft.commercial?.financial;
    const structure = draft.commercial?.leaseStructure;
    if (!financial || !structure) return true;
    if (structure.leaseType === 'gross' && financial.camEnabled) return false;
    return true;
  },

  /** Commercial: Checks for escalation type conflict */
  escalationConflict: (draft) => {
    const financial = draft.commercial?.financial;
    if (!financial) return true;
    // Only one escalation type can be active — this is enforced by the enum
    // but we also check step schedule is provided if that type is selected
    if (financial.escalationType === 'step_schedule') {
      return (financial.escalationStepSchedule?.length ?? 0) > 0;
    }
    return true;
  },

  /** Commercial: Environmental compliance cannot be removed */
  environmentalRequired: (draft) => {
    const ops = draft.commercial?.operations;
    if (!ops) return true;
    return ops.environmentalComplianceIncluded === true;
  },

  /** Minneapolis: zoning must be confirmed for commercial */
  mplsZoningRequired: (draft) => {
    return draft.propertyProfile?.zoningConfirmed === true;
  },

  /** St. Paul: zoning must be confirmed for commercial */
  stpZoningRequired: (draft) => {
    return draft.propertyProfile?.zoningConfirmed === true;
  },
};

/**
 * Evaluates a single validation rule against the draft.
 */
export function evaluateValidationRule(
  draft: LeaseBuilderDraft,
  rule: ValidationRule
): ValidationResult {
  let passed = true;

  switch (rule.condition.type) {
    case 'required': {
      const value = resolvePath(draft as unknown as Record<string, unknown>, rule.field);
      passed = value !== undefined && value !== null && value !== '';
      break;
    }

    case 'required_if': {
      const depValue = resolvePath(
        draft as unknown as Record<string, unknown>,
        rule.condition.dependsOnField ?? ''
      );
      if (depValue === rule.condition.dependsOnValue) {
        const value = resolvePath(draft as unknown as Record<string, unknown>, rule.field);
        passed = value !== undefined && value !== null && value !== '';
      }
      break;
    }

    case 'max_value': {
      const value = resolvePath(draft as unknown as Record<string, unknown>, rule.field);
      if (typeof value === 'number' && typeof rule.condition.value === 'number') {
        passed = value <= rule.condition.value;
      }
      break;
    }

    case 'min_value': {
      const value = resolvePath(draft as unknown as Record<string, unknown>, rule.field);
      if (typeof value === 'number' && typeof rule.condition.value === 'number') {
        passed = value >= rule.condition.value;
      }
      break;
    }

    case 'forbidden': {
      const value = resolvePath(draft as unknown as Record<string, unknown>, rule.field);
      passed = value === undefined || value === null || value === rule.condition.value;
      break;
    }

    case 'custom': {
      const fn = CUSTOM_VALIDATORS[rule.condition.customFn ?? ''];
      if (fn) {
        passed = fn(draft);
      }
      break;
    }
  }

  return {
    ruleId: rule.id,
    severity: rule.severity,
    field: rule.field,
    message: rule.message,
    helpText: rule.helpText,
    passed,
  };
}

/**
 * Runs all applicable validation rules against a draft.
 * Filters rules by lease class and city before evaluating.
 */
export function validateDraft(
  draft: LeaseBuilderDraft,
  rules: ValidationRule[]
): ValidationResult[] {
  const city = draft.propertyProfile?.city?.toLowerCase() ?? '';
  const isMinneapolis = city === 'minneapolis';
  const isStPaul = city === 'st. paul' || city === 'saint paul';

  const applicableRules = rules.filter((rule) => {
    // Check lease class
    if (rule.leaseClass !== 'both' && rule.leaseClass !== draft.leaseClass) {
      return false;
    }

    // Check city scope
    if (rule.appliesTo === 'minneapolis' && !isMinneapolis) return false;
    if (rule.appliesTo === 'stpaul' && !isStPaul) return false;

    return true;
  });

  return applicableRules.map((rule) => evaluateValidationRule(draft, rule));
}

/**
 * Checks if the draft has any hard-block validation errors.
 * Returns only the error-severity results that failed.
 */
export function getValidationErrors(results: ValidationResult[]): ValidationResult[] {
  return results.filter((r) => r.severity === 'error' && !r.passed);
}

/**
 * Checks if the draft has any warnings (non-blocking).
 */
export function getValidationWarnings(results: ValidationResult[]): ValidationResult[] {
  return results.filter((r) => r.severity === 'warning' && !r.passed);
}

/**
 * Returns true if the draft can proceed (no hard-block errors).
 */
export function canProceed(results: ValidationResult[]): boolean {
  return getValidationErrors(results).length === 0;
}
