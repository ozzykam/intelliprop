/**
 * St. Paul-Specific Residential Validation Rules
 */

import type { ValidationRule } from '../../../types/leaseBuilder';

export const residentialStPaulRules: ValidationRule[] = [
  {
    id: 'stp-res-rent-cap-exceeded',
    leaseClass: 'residential',
    description: 'Rent increase exceeds St. Paul rent stabilization cap',
    severity: 'error',
    field: 'residential.rent.monthlyRent',
    condition: { type: 'custom', customFn: 'stPaulRentCapCheck' },
    message: 'The rent increase exceeds the allowed annual cap under St. Paul rent stabilization. The maximum annual increase is 3% or CPI (whichever is greater).',
    helpText: 'St. Paul\'s rent stabilization ordinance limits annual rent increases to 3% or the Consumer Price Index (CPI), whichever is greater, for covered properties. If you believe your property is exempt, please update the rent stabilization status in the Property Profile step.',
    appliesTo: 'stpaul',
  },
  {
    id: 'stp-res-auto-escalation-blocked',
    leaseClass: 'residential',
    description: 'Automatic rent escalation clauses exceeding cap are not allowed',
    severity: 'error',
    field: 'residential.rent.monthlyRent',
    condition: { type: 'custom', customFn: 'stPaulRentCapCheck' },
    message: 'Automatic annual rent escalation clauses that exceed the rent stabilization cap are prohibited for covered properties in St. Paul.',
    helpText: 'St. Paul does not allow lease clauses that automatically increase rent above the allowed annual cap. Any rent increases must comply with the rent stabilization ordinance.',
    appliesTo: 'stpaul',
  },
  {
    id: 'stp-res-stabilization-addendum-required',
    leaseClass: 'residential',
    description: 'Rent stabilization addendum must be included when property is subject',
    severity: 'error',
    field: 'propertyProfile.stPaulRentStabilization',
    condition: {
      type: 'required_if',
      dependsOnField: 'propertyProfile.stPaulRentStabilization',
      dependsOnValue: 'subject',
    },
    message: 'The St. Paul Rent Stabilization Disclosure Addendum is required for properties subject to rent stabilization and has been automatically included.',
    helpText: 'Properties subject to St. Paul rent stabilization must include a disclosure addendum informing tenants of their rights under the ordinance.',
    appliesTo: 'stpaul',
  },
  {
    id: 'stp-res-rent-increase-notice',
    leaseClass: 'residential',
    description: 'Required advance notice period for rent increases on renewal',
    severity: 'error',
    field: 'residential.rent.monthlyRent',
    condition: { type: 'custom', customFn: 'stPaulRentCapCheck' },
    message: 'St. Paul requires at least 90 days advance written notice before a rent increase takes effect.',
    helpText: 'Under St. Paul\'s rent stabilization ordinance, landlords must provide tenants with at least 90 days written notice before any rent increase. This applies to both lease renewals and month-to-month rent changes.',
    appliesTo: 'stpaul',
  },
  {
    id: 'stp-res-exemption-uncertain',
    leaseClass: 'residential',
    description: 'Warn if rent stabilization exemption status is uncertain',
    severity: 'warning',
    field: 'propertyProfile.stPaulRentStabilization',
    condition: { type: 'required' },
    message: 'You indicated you are unsure whether this property is subject to St. Paul rent stabilization. Please confirm your property\'s status before finalizing the lease.',
    helpText: 'Common exemptions from St. Paul rent stabilization include: new construction (certificate of occupancy within 20 years), owner-occupied duplexes, and certain affordable housing properties. Contact the St. Paul Department of Safety and Inspections for confirmation.',
    appliesTo: 'stpaul',
  },
];
