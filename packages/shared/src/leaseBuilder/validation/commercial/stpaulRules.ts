/**
 * St. Paul-Specific Commercial Validation Rules
 */

import type { ValidationRule } from '../../../types/leaseBuilder';

export const commercialStPaulRules: ValidationRule[] = [
  {
    id: 'spc-zoning-required',
    leaseClass: 'commercial',
    description: 'Zoning confirmation must be acknowledged for St. Paul commercial properties',
    severity: 'error',
    field: 'propertyProfile.zoningConfirmed',
    condition: { type: 'custom', customFn: 'stpZoningRequired' },
    message: 'You must confirm that the tenant\'s intended use complies with St. Paul zoning requirements.',
    helpText: 'St. Paul has specific zoning regulations that govern permitted commercial uses by area. Before finalizing a commercial lease, confirm that the tenant\'s intended business use is allowed under the property\'s zoning classification.',
    appliesTo: 'stpaul',
  },
];
