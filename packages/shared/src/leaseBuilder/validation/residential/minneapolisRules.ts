/**
 * Minneapolis-Specific Residential Validation Rules
 */

import type { ValidationRule } from '../../../types/leaseBuilder';

export const residentialMinneapolisRules: ValidationRule[] = [
  {
    id: 'mpls-res-rental-license-warning',
    leaseClass: 'residential',
    description: 'Warn if Minneapolis rental license status is unknown or missing',
    severity: 'warning',
    field: 'propertyProfile.minneapolisLicenseStatus',
    condition: { type: 'custom', customFn: 'mplsLicenseCheck' },
    message: 'Minneapolis requires rental licensing for most rental properties. Operating without a license may expose you to penalties.',
    helpText: 'The City of Minneapolis requires a rental license for most residential rental properties. You indicated that this property may not be licensed or you are unsure of its status. Please verify your license status with the City of Minneapolis before renting.',
    appliesTo: 'minneapolis',
  },
  {
    id: 'mpls-res-just-cause-required',
    leaseClass: 'residential',
    description: 'Minneapolis requires just cause for lease nonrenewal/termination',
    severity: 'error',
    field: 'leaseClass',
    condition: { type: 'required' },
    message: 'Minneapolis requires just cause for certain lease terminations. The lease has been adjusted to include compliant language.',
    helpText: 'Under Minneapolis ordinance, landlords cannot terminate or decline to renew a lease without just cause for covered properties. The lease builder automatically includes compliant termination language for Minneapolis properties.',
    appliesTo: 'minneapolis',
  },
  {
    id: 'mpls-res-habitability-protected',
    leaseClass: 'residential',
    description: 'Cannot include tenant waiver of habitability in Minneapolis',
    severity: 'error',
    field: 'leaseClass',
    condition: { type: 'required' },
    message: 'Minneapolis does not allow tenants to waive habitability rights. This lease includes strong habitability compliance language.',
    helpText: 'Minneapolis has active housing enforcement. The lease cannot include any language suggesting the tenant waives their right to habitable living conditions.',
    appliesTo: 'minneapolis',
  },
  {
    id: 'mpls-res-tenant-protections-required',
    leaseClass: 'residential',
    description: 'Minneapolis tenant protections addendum must be included',
    severity: 'error',
    field: 'triggeredDisclosures',
    condition: { type: 'required' },
    message: 'Minneapolis tenant protections disclosure is required and has been automatically included.',
    helpText: 'Minneapolis requires that tenants receive a summary of their rights under local ordinances, including just cause protections and housing standards.',
    appliesTo: 'minneapolis',
  },
];
