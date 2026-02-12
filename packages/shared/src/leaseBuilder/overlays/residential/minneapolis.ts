/**
 * Minneapolis Residential Overlay
 *
 * Activates when propertyProfile.city === 'Minneapolis' for residential leases.
 * Implements just cause eviction, rental licensing, tenant protections,
 * habitability requirements, and crime-free housing compliance.
 */

import type { CityOverlay } from '../../../types/leaseBuilder';
import { TEMPLATE_VERSIONS } from '../../constants';

export const minneapolisResidentialOverlay: CityOverlay = {
  id: 'overlay-mpls-residential',
  leaseClass: 'residential',
  cityName: 'Minneapolis',
  version: TEMPLATE_VERSIONS.MPLS_RESIDENTIAL_OVERLAY,
  lastReviewedDate: '2026-02-11',

  rules: [
    // Rule 1: Replace standard termination clause with just-cause compliant version
    {
      id: 'mpls-rule-just-cause',
      description: 'Replace standard termination clause with Minneapolis just-cause compliant version. Removes "without cause" nonrenewal language for covered properties.',
      type: 'replace_clause',
      targetClauseId: 'res-termination-default',
      replacementClauseId: 'res-termination-default-mpls',
    },

    // Rule 2: Replace fixed-term expiration with just-cause version
    {
      id: 'mpls-rule-fixed-end-just-cause',
      description: 'Replace fixed-term expiration clause to prevent no-cause nonrenewal.',
      type: 'replace_clause',
      targetClauseId: 'res-termination-fixed-end',
      replacementClauseId: 'res-termination-fixed-end-mpls',
      conditions: [
        { field: 'leaseType', operator: 'equals', value: 'fixed_term' },
      ],
    },

    // Rule 3: Add Minneapolis tenant protections disclosure (non-removable)
    {
      id: 'mpls-rule-tenant-protections',
      description: 'Auto-include Minneapolis tenant protections disclosure addendum.',
      type: 'add_clause',
      additionalClauseId: 'disclosure-mpls-tenant-protections',
    },

    // Rule 4: Replace standard habitability clause with stronger Minneapolis version
    {
      id: 'mpls-rule-habitability',
      description: 'Replace standard maintenance clause with enhanced Minneapolis habitability compliance clause.',
      type: 'replace_clause',
      targetClauseId: 'res-maintenance-landlord',
      replacementClauseId: 'res-maintenance-landlord-mpls',
    },

    // Rule 5: Add rental license disclosure if status is uncertain or unlicensed
    {
      id: 'mpls-rule-rental-license',
      description: 'Add rental license status warning/disclosure.',
      type: 'add_clause',
      additionalClauseId: 'disclosure-mpls-rental-license',
    },

    // Rule 6: Add warning for unlicensed properties
    {
      id: 'mpls-rule-license-warning',
      description: 'Display warning to landlord about rental licensing requirement.',
      type: 'add_warning',
      warningMessage: 'This property is located in Minneapolis. Minneapolis requires rental licensing for most rental properties. Please ensure your property is properly licensed.',
      conditions: [
        { field: 'propertyProfile.minneapolisLicenseStatus', operator: 'not_equals', value: 'yes' },
      ],
    },
  ],

  // Disclosures automatically included for all Minneapolis residential leases
  requiredDisclosures: [
    'disclosure-mpls-tenant-protections',
    'disclosure-mpls-rental-license',
  ],

  // Addenda automatically included
  requiredAddenda: [],
};
