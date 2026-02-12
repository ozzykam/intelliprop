/**
 * St. Paul Commercial Overlay
 *
 * Minimal overlay. Focuses on rent stabilization exclusion clarification,
 * zoning, liquor/restaurant use, and outdoor patio compliance.
 */

import type { CityOverlay } from '../../../types/leaseBuilder';
import { TEMPLATE_VERSIONS } from '../../constants';

export const stPaulCommercialOverlay: CityOverlay = {
  id: 'overlay-stp-commercial',
  leaseClass: 'commercial',
  cityName: 'St. Paul',
  version: TEMPLATE_VERSIONS.STP_COMMERCIAL_OVERLAY,
  lastReviewedDate: '2026-02-11',

  rules: [
    // SPC1: Rent Stabilization Exclusion — explicit clarification
    {
      id: 'spc-rule-rent-stabilization-exclusion',
      description: 'Add explicit clause stating St. Paul rent stabilization does not apply to commercial property.',
      type: 'add_clause',
      additionalClauseId: 'comm-stp-rent-stabilization-exclusion',
    },

    // SPC2: Zoning Confirmation (Hard Block if not acknowledged)
    {
      id: 'spc-rule-zoning',
      description: 'Require zoning compliance confirmation for St. Paul commercial properties.',
      type: 'add_warning',
      warningMessage: 'This property is located in St. Paul. You must confirm that the tenant\'s intended use complies with St. Paul zoning requirements before finalizing the lease.',
      conditions: [
        { field: 'propertyProfile.zoningConfirmed', operator: 'not_equals', value: true },
      ],
    },

    // SPC3: Liquor License / Restaurant Use
    {
      id: 'spc-rule-liquor-restaurant',
      description: 'Add city licensing compliance clause for restaurant/bar tenants requiring liquor license.',
      type: 'add_clause',
      additionalClauseId: 'comm-stp-liquor-compliance',
      conditions: [
        { field: 'propertyProfile.liquorLicenseRequired', operator: 'equals', value: true },
      ],
    },

    // SPC4: Outdoor Patio Use
    {
      id: 'spc-rule-outdoor-patio',
      description: 'Add city permit compliance clause for outdoor patio use.',
      type: 'add_clause',
      additionalClauseId: 'comm-stp-outdoor-patio',
      conditions: [
        { field: 'propertyProfile.outdoorPatioUse', operator: 'equals', value: true },
      ],
    },
  ],

  requiredDisclosures: [],
  requiredAddenda: [],
};
