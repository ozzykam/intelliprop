/**
 * Validation Rule Registry
 *
 * Exports all validation rules organized by lease class and jurisdiction.
 */

import type { ValidationRule, LeaseClass } from '../../types/leaseBuilder';
import { residentialStateRules } from './residential/stateRules';
import { residentialMinneapolisRules } from './residential/minneapolisRules';
import { residentialStPaulRules } from './residential/stpaulRules';
import { commercialStateRules } from './commercial/stateRules';
import { commercialMinneapolisRules } from './commercial/minneapolisRules';
import { commercialStPaulRules } from './commercial/stpaulRules';

export const allResidentialRules: ValidationRule[] = [
  ...residentialStateRules,
  ...residentialMinneapolisRules,
  ...residentialStPaulRules,
];

export const allCommercialRules: ValidationRule[] = [
  ...commercialStateRules,
  ...commercialMinneapolisRules,
  ...commercialStPaulRules,
];

export const allValidationRules: ValidationRule[] = [
  ...allResidentialRules,
  ...allCommercialRules,
];

/**
 * Get all validation rules for a given lease class.
 */
export function getValidationRulesForClass(leaseClass: LeaseClass): ValidationRule[] {
  return leaseClass === 'residential' ? allResidentialRules : allCommercialRules;
}

// Re-export individual rule sets
export { residentialStateRules } from './residential/stateRules';
export { residentialMinneapolisRules } from './residential/minneapolisRules';
export { residentialStPaulRules } from './residential/stpaulRules';
export { commercialStateRules } from './commercial/stateRules';
export { commercialMinneapolisRules } from './commercial/minneapolisRules';
export { commercialStPaulRules } from './commercial/stpaulRules';
