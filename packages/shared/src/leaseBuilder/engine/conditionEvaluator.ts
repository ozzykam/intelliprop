/**
 * Condition Evaluator
 *
 * Evaluates ClauseCondition objects against a LeaseBuilderDraft to determine
 * whether a clause should be included in the final lease package.
 */

import type { ClauseCondition, ClauseDefinition, LeaseBuilderDraft } from '../../types/leaseBuilder';

/**
 * Resolves a dot-path string to a value within the draft object.
 * e.g. "residential.policies.petPolicy" → draft.residential?.policies?.petPolicy
 */
export function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Evaluates a single condition against the draft.
 */
export function evaluateCondition(draft: LeaseBuilderDraft, condition: ClauseCondition): boolean {
  const fieldValue = resolvePath(draft as unknown as Record<string, unknown>, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'not_equals':
      return fieldValue !== condition.value;

    case 'in':
      if (!Array.isArray(condition.value)) return false;
      return (condition.value as unknown[]).includes(fieldValue);

    case 'not_in':
      if (!Array.isArray(condition.value)) return true;
      return !(condition.value as unknown[]).includes(fieldValue);

    case 'gt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue > condition.value;

    case 'lt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue < condition.value;

    case 'gte':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue >= condition.value;

    case 'lte':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue <= condition.value;

    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;

    case 'truthy':
      return !!fieldValue;

    default:
      return false;
  }
}

/**
 * Evaluates all conditions for a clause (AND logic — all must pass).
 * If a clause has no conditions, it is considered applicable (always included).
 */
export function evaluateClauseConditions(
  draft: LeaseBuilderDraft,
  conditions?: ClauseCondition[]
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((condition) => evaluateCondition(draft, condition));
}

/**
 * Filters a clause registry to only clauses applicable to the given draft.
 * Checks both leaseClass membership and condition evaluation.
 */
export function filterApplicableClauses(
  draft: LeaseBuilderDraft,
  clauses: ClauseDefinition[]
): ClauseDefinition[] {
  return clauses.filter((clause) => {
    // Check lease class compatibility
    if (clause.leaseClass !== 'both' && clause.leaseClass !== draft.leaseClass) {
      return false;
    }

    // Required clauses always included (for their class)
    if (clause.isRequired) return true;

    // Conditional clauses must pass all conditions
    return evaluateClauseConditions(draft, clause.conditions);
  });
}
