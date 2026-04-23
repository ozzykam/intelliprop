/**
 * Minneapolis Commercial Overlay
 *
 * Lighter than residential. Focuses on zoning, signage, sidewalk/snow
 * responsibility, and enhanced environmental compliance.
 */

import type { CityOverlay } from '../../../types/leaseBuilder';
import { TEMPLATE_VERSIONS } from '../../constants';

export const minneapolisCommercialOverlay: CityOverlay = {
  id: 'overlay-mpls-commercial',
  leaseClass: 'commercial',
  cityName: 'Minneapolis',
  version: TEMPLATE_VERSIONS.MPLS_COMMERCIAL_OVERLAY,
  lastReviewedDate: '2026-02-11',

  rules: [
    // MC1: Zoning Confirmation (Hard Block if not acknowledged)
    {
      id: 'mc-rule-zoning',
      description: 'Require zoning compliance confirmation for Minneapolis commercial properties.',
      type: 'add_warning',
      warningMessage: 'This property is located in Minneapolis. You must confirm that the tenant\'s intended use complies with Minneapolis zoning requirements before finalizing the lease.',
      conditions: [
        { field: 'propertyProfile.zoningConfirmed', operator: 'not_equals', value: true },
      ],
    },

    // MC2: Signage Compliance
    {
      id: 'mc-rule-signage',
      description: 'Add Minneapolis signage compliance language when signage is allowed.',
      type: 'add_clause',
      additionalClauseId: 'comm-signage-mpls',
      conditions: [
        { field: 'commercial.useAndBuildout.signageAllowed', operator: 'equals', value: true },
      ],
    },

    // MC3: Sidewalk/Snow for street-facing retail
    {
      id: 'mc-rule-sidewalk-snow',
      description: 'Add sidewalk/snow removal responsibility clause for street-facing retail.',
      type: 'add_clause',
      additionalClauseId: 'comm-sidewalk-snow-mpls',
      conditions: [
        { field: 'propertyProfile.commercialSpaceTypes', operator: 'contains', value: 'retail' },
      ],
    },

    // MC4: Enhanced Environmental Compliance
    {
      id: 'mc-rule-environmental',
      description: 'Replace standard environmental clause with enhanced Minneapolis version.',
      type: 'replace_clause',
      targetClauseId: 'comm-environmental',
      replacementClauseId: 'comm-environmental-mpls',
    },
  ],

  requiredDisclosures: [],
  requiredAddenda: [],
};
