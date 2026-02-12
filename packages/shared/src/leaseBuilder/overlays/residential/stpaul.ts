/**
 * St. Paul Residential Overlay
 *
 * Activates when propertyProfile.city === 'St. Paul' for residential leases.
 * Implements rent stabilization, just cause eviction, advance notice requirements,
 * and rent increase history disclosure.
 */

import type { CityOverlay } from '../../../types/leaseBuilder';
import { TEMPLATE_VERSIONS } from '../../constants';

export const stPaulResidentialOverlay: CityOverlay = {
  id: 'overlay-stp-residential',
  leaseClass: 'residential',
  cityName: 'St. Paul',
  version: TEMPLATE_VERSIONS.STP_RESIDENTIAL_OVERLAY,
  lastReviewedDate: '2026-02-11',

  rules: [
    // Rule 1: Replace standard termination clause with St. Paul just-cause version
    {
      id: 'stp-rule-just-cause',
      description: 'Replace standard termination clause with St. Paul just-cause compliant version.',
      type: 'replace_clause',
      targetClauseId: 'res-termination-default',
      replacementClauseId: 'res-termination-default-stp',
    },

    // Rule 2: Replace fixed-term expiration with just-cause version
    {
      id: 'stp-rule-fixed-end-just-cause',
      description: 'Replace fixed-term expiration clause to comply with St. Paul tenant protections.',
      type: 'replace_clause',
      targetClauseId: 'res-termination-fixed-end',
      replacementClauseId: 'res-termination-fixed-end-stp',
      conditions: [
        { field: 'leaseType', operator: 'equals', value: 'fixed_term' },
      ],
    },

    // Rule 3: Add rent stabilization addendum (for covered properties)
    {
      id: 'stp-rule-rent-stabilization-addendum',
      description: 'Auto-include St. Paul rent stabilization disclosure addendum for covered properties.',
      type: 'add_clause',
      additionalClauseId: 'disclosure-stp-rent-stabilization',
      conditions: [
        { field: 'propertyProfile.stPaulRentStabilization', operator: 'equals', value: 'subject' },
      ],
    },

    // Rule 4: Add rent stabilization validation (block rent exceeding cap)
    {
      id: 'stp-rule-rent-cap-validation',
      description: 'Activate rent cap validation for covered properties.',
      type: 'modify_validation',
      validationRuleId: 'stp-res-rent-cap-exceeded',
      conditions: [
        { field: 'propertyProfile.stPaulRentStabilization', operator: 'equals', value: 'subject' },
      ],
    },

    // Rule 5: Remove any automatic escalation clauses that exceed the cap
    {
      id: 'stp-rule-block-auto-escalation',
      description: 'Block automatic rent escalation that would exceed the rent stabilization cap.',
      type: 'add_warning',
      warningMessage: 'This property is subject to St. Paul rent stabilization. Annual rent increases are limited to 3% or CPI (whichever is greater). Automatic escalation clauses exceeding this limit are not permitted.',
      conditions: [
        { field: 'propertyProfile.stPaulRentStabilization', operator: 'equals', value: 'subject' },
      ],
    },

    // Rule 6: Add rent increase history disclosure for renewals
    {
      id: 'stp-rule-rent-history',
      description: 'Prompt for rent increase history on renewal leases.',
      type: 'add_warning',
      warningMessage: 'For renewal leases in St. Paul, landlords must provide at least 90 days advance notice of any rent increase. Please verify that proper notice was given.',
    },

    // Rule 7: Warning for uncertain exemption status
    {
      id: 'stp-rule-exemption-warning',
      description: 'Warn landlord to confirm exemption status.',
      type: 'add_warning',
      warningMessage: 'You indicated you are unsure about rent stabilization exemption. Common exemptions include: new construction (CO within 20 years), owner-occupied duplexes, and certain affordable housing. Please confirm before finalizing.',
      conditions: [
        { field: 'propertyProfile.stPaulRentStabilization', operator: 'equals', value: 'unsure' },
      ],
    },
  ],

  // Disclosures automatically included for all St. Paul residential leases
  requiredDisclosures: [
    'disclosure-stp-rent-stabilization',
  ],

  // Addenda
  requiredAddenda: [],
};
