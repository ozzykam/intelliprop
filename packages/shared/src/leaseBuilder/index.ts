// Constants
export * from './constants';

// Engine
export { resolvePath, evaluateCondition, evaluateClauseConditions, filterApplicableClauses } from './engine/conditionEvaluator';
export { evaluateValidationRule, validateDraft, getValidationErrors, getValidationWarnings, canProceed } from './engine/validator';
export {
  assembleLease,
  replacePlaceholders,
  applyOverlayRules,
  determineTriggeredDisclosures,
  determineTriggeredAddenda,
} from './engine/assembler';
export type { AssemblyResult } from './engine/assembler';

// Overlays
export { getCityOverlay, hasOverlay } from './overlays';

// Validation Rules
export { getValidationRulesForClass, allValidationRules } from './validation';

// Clause Registries
export { residentialClauseRegistry } from './residential/clauses';
export { commercialClauseRegistry } from './commercial/clauses';

// Templates
export * from './residential/templates';
export * from './commercial/templates';
