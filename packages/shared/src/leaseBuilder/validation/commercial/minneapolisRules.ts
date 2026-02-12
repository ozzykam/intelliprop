/**
 * Minneapolis-Specific Commercial Validation Rules
 */

import type { ValidationRule } from '../../../types/leaseBuilder';

export const commercialMinneapolisRules: ValidationRule[] = [
  {
    id: 'mc-zoning-required',
    leaseClass: 'commercial',
    description: 'Zoning confirmation must be acknowledged for Minneapolis commercial properties',
    severity: 'error',
    field: 'propertyProfile.zoningConfirmed',
    condition: { type: 'custom', customFn: 'mplsZoningRequired' },
    message: 'You must confirm that the tenant\'s intended use complies with Minneapolis zoning requirements.',
    helpText: 'Minneapolis has specific zoning regulations that govern permitted commercial uses by area. Before finalizing a commercial lease, confirm that the tenant\'s intended business use is allowed under the property\'s zoning classification. Contact the City of Minneapolis Planning Department for verification.',
    appliesTo: 'minneapolis',
  },
  {
    id: 'mc-environmental-protected',
    leaseClass: 'commercial',
    description: 'Cannot remove environmental indemnity for Minneapolis commercial properties',
    severity: 'error',
    field: 'commercial.operations.environmentalComplianceIncluded',
    condition: { type: 'custom', customFn: 'environmentalRequired' },
    message: 'Environmental compliance and indemnity clause cannot be removed. Minneapolis has active environmental enforcement.',
    helpText: 'Minneapolis actively enforces environmental regulations. The environmental compliance clause protects both landlord and tenant from contamination liability and must remain in the lease.',
    appliesTo: 'minneapolis',
  },
];
