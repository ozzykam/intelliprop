import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Smoking Clauses — Smoking/vaping policies.
 * sortOrder: 650–699
 */
export const residentialSmokingClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // NO SMOKING / NO VAPING
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-smoking-prohibited',
    leaseClass: 'residential',
    category: 'smoking',
    title: 'No Smoking / No Vaping',
    description:
      'Prohibits all smoking and vaping on the premises, including inside the unit, on balconies, patios, and in all common areas.',
    htmlContent: `<h3>Smoking &amp; Vaping Policy &mdash; Prohibited</h3>
<p><strong>Smoking and vaping are strictly prohibited</strong> anywhere on the Premises, including but not limited to:</p>
<ol>
  <li>The interior of the dwelling unit;</li>
  <li>Balconies, decks, patios, porches, and attached garages;</li>
  <li>All common areas, hallways, stairwells, laundry rooms, and lobbies;</li>
  <li>The building exterior within twenty-five (25) feet of any entrance, window, or ventilation intake; and</li>
  <li>All parking areas and grounds associated with the Premises.</li>
</ol>
<p>For purposes of this Lease, &ldquo;smoking&rdquo; includes the inhaling, exhaling, burning, or carrying of any lighted or heated cigar, cigarette, pipe, hookah, or any other lighted or heated tobacco or plant product. &ldquo;Vaping&rdquo; includes the use of any electronic smoking device, electronic cigarette, e-cigarette, vape pen, or similar device that produces an aerosol or vapor.</p>
<p>The use or burning of marijuana, whether for medical or recreational purposes, is also prohibited on the Premises to the extent permitted by law.</p>
<p><strong>Violation.</strong> A violation of this no-smoking and no-vaping policy constitutes a material breach of this Lease. Tenant shall be liable for all costs associated with remediation of smoke or vapor damage, including but not limited to cleaning, painting, deodorizing, and replacing affected materials. Such costs shall be charged to Tenant as additional rent or deducted from the Security Deposit.</p>
<p>Tenant is responsible for ensuring that all guests, visitors, and household members comply with this policy.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.smokingPolicy',
        operator: 'equals',
        value: 'no_smoking',
      },
    ],
    placeholders: [],
    sortOrder: 650,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SMOKING IN DESIGNATED AREAS ONLY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-smoking-designated',
    leaseClass: 'residential',
    category: 'smoking',
    title: 'Smoking — Designated Areas Only',
    description:
      'Permits smoking only in specified designated areas outside the unit. Smoking inside the unit and non-designated areas is prohibited.',
    htmlContent: `<h3>Smoking &amp; Vaping Policy &mdash; Designated Areas Only</h3>
<p>Smoking and vaping are <strong>prohibited inside the dwelling unit</strong> and in all common areas, hallways, stairwells, laundry rooms, lobbies, and enclosed spaces.</p>
<p>Smoking and vaping are <strong>permitted only in the following designated area(s):</strong></p>
<p><strong>{{lease.smokingDesignatedAreas}}</strong></p>
<p>Tenant and Tenant&rsquo;s guests shall use only the designated area(s) listed above for smoking or vaping. Cigarette butts, ashes, and other smoking-related waste must be disposed of properly in designated receptacles. Littering of smoking materials is prohibited.</p>
<p>For purposes of this Lease, &ldquo;smoking&rdquo; includes the inhaling, exhaling, burning, or carrying of any lighted or heated cigar, cigarette, pipe, hookah, or any other lighted or heated tobacco or plant product. &ldquo;Vaping&rdquo; includes the use of any electronic smoking device, electronic cigarette, e-cigarette, vape pen, or similar device that produces an aerosol or vapor.</p>
<p><strong>Violation.</strong> Smoking or vaping outside the designated area(s) constitutes a material breach of this Lease. Tenant shall be liable for all costs associated with remediation of smoke or vapor damage, including but not limited to cleaning, painting, deodorizing, and replacing affected materials. Landlord reserves the right to modify designated smoking areas upon thirty (30) days&rsquo; written notice to Tenant.</p>
<p>Tenant is responsible for ensuring that all guests, visitors, and household members comply with this policy.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.smokingPolicy',
        operator: 'equals',
        value: 'designated_areas',
      },
    ],
    placeholders: ['lease.smokingDesignatedAreas'],
    sortOrder: 650,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SMOKING ALLOWED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-smoking-allowed',
    leaseClass: 'residential',
    category: 'smoking',
    title: 'Smoking — Allowed',
    description:
      'Permits smoking on the premises. Tenant remains responsible for smoke-related damage and odor remediation.',
    htmlContent: `<h3>Smoking &amp; Vaping Policy &mdash; Allowed</h3>
<p>Smoking and vaping are <strong>permitted</strong> within the Premises, subject to the following conditions:</p>
<ol>
  <li>Tenant shall take reasonable measures to ventilate the Premises and prevent the accumulation of smoke residue on walls, ceilings, fixtures, and surfaces.</li>
  <li>Tenant shall not permit smoke or vapor to unreasonably infiltrate other units or common areas. If Landlord receives complaints from neighboring tenants regarding smoke infiltration, Tenant shall take corrective action within a reasonable time.</li>
  <li>Tenant shall be fully responsible for all costs to remediate smoke or vapor damage at the end of the tenancy, including but not limited to cleaning, painting, deodorizing, carpet cleaning or replacement, and replacement of smoke-damaged window coverings or fixtures. Such costs may be deducted from the Security Deposit.</li>
  <li>Tenant shall properly dispose of all smoking materials and shall not dispose of cigarette butts, ashes, or other smoking-related waste in a manner that creates a fire hazard.</li>
</ol>
<p>Tenant shall comply with all applicable local ordinances and Minnesota state laws regarding smoking in multi-unit residential buildings. Nothing in this clause permits the violation of any applicable smoke-free ordinance.</p>
<p>Tenant is responsible for ensuring that all guests, visitors, and household members comply with the conditions set forth above.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.smokingPolicy',
        operator: 'equals',
        value: 'allowed',
      },
    ],
    placeholders: [],
    sortOrder: 650,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
