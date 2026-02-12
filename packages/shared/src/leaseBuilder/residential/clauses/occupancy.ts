import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Occupancy Clauses — Named occupants, guests, subletting, and assignment.
 * sortOrder: 500–599
 */
export const residentialOccupancyClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // NAMED OCCUPANTS & MAX OCCUPANCY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-occupancy-named',
    leaseClass: 'residential',
    category: 'occupancy',
    title: 'Named Occupants & Maximum Occupancy',
    description:
      'Identifies all persons authorized to reside in the unit and sets the maximum number of occupants.',
    htmlContent: `<h3>Occupancy</h3>
<p>The Premises shall be occupied exclusively as a private residence by the following named individuals (&ldquo;Authorized Occupants&rdquo;):</p>
<p><strong>{{lease.namedOccupants}}</strong></p>
<p>The maximum number of persons permitted to reside in the Premises is <strong>{{lease.maxOccupants}}</strong>, in compliance with applicable local occupancy standards, building codes, and Minnesota housing regulations.</p>
<p>No person other than the Authorized Occupants listed above shall reside in the Premises without the prior written consent of Landlord. &ldquo;Reside&rdquo; means to stay overnight at the Premises on a regular or habitual basis.</p>
<p>Tenant shall promptly notify Landlord in writing of any change in occupancy, including the birth or adoption of a child. Adding an adult occupant requires Landlord&rsquo;s prior written approval, and Landlord may require a background and credit check of any proposed new occupant at Tenant&rsquo;s expense.</p>
<p>Tenant shall not use or permit the Premises to be used for any purpose other than as a private residence. No commercial, industrial, or business activities shall be conducted on the Premises unless expressly permitted in writing by Landlord.</p>`,
    isRequired: true,
    placeholders: ['lease.namedOccupants', 'lease.maxOccupants'],
    sortOrder: 500,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GUEST RULES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-occupancy-guests',
    leaseClass: 'residential',
    category: 'occupancy',
    title: 'Guest Policy',
    description:
      'Sets limits on the length and frequency of guest stays and prohibits unauthorized occupants.',
    htmlContent: `<h3>Guest Policy</h3>
<p>Tenant may have guests visit the Premises, subject to the following limitations:</p>
<ol>
  <li>No single guest may stay at the Premises for more than <strong>{{lease.guestMaxConsecutiveDays}}</strong> consecutive days without Landlord&rsquo;s prior written consent.</li>
  <li>Total guest stays shall not exceed <strong>{{lease.guestMaxDaysPerYear}}</strong> days in any twelve-month period per guest.</li>
  <li>Guests must comply with all terms and conditions of this Lease, including rules regarding noise, parking, common area use, and conduct.</li>
</ol>
<p>Any guest who exceeds the limits set forth above shall be deemed an unauthorized occupant. The presence of an unauthorized occupant constitutes a material breach of this Lease and may result in eviction proceedings.</p>
<p>Tenant shall be responsible for the conduct of all guests and shall be liable for any damage to the Premises or common areas caused by Tenant&rsquo;s guests. Landlord reserves the right to deny entry to any guest whose conduct has previously violated the terms of this Lease or who poses a threat to the safety or peaceful enjoyment of other tenants.</p>`,
    isRequired: true,
    placeholders: [
      'lease.guestMaxConsecutiveDays',
      'lease.guestMaxDaysPerYear',
    ],
    sortOrder: 510,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SUBLETTING — ALLOWED WITH CONSENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-occupancy-subletting-allowed',
    leaseClass: 'residential',
    category: 'occupancy',
    title: 'Subletting — Allowed with Consent',
    description:
      'Permits subletting with the landlord\'s prior written consent. Outlines the approval process and tenant\'s continuing obligations.',
    htmlContent: `<h3>Subletting</h3>
<p>Tenant may sublet the Premises or any portion thereof only with Landlord&rsquo;s prior written consent, which shall not be unreasonably withheld. Tenant shall provide Landlord with at least <strong>thirty (30) days&rsquo;</strong> written notice of a proposed sublet, together with the following information:</p>
<ol>
  <li>The name, current address, and contact information of the proposed subtenant;</li>
  <li>The proposed term and monthly rent of the sublease;</li>
  <li>Written authorization for Landlord to conduct a background and credit check of the proposed subtenant; and</li>
  <li>A copy of the proposed sublease agreement.</li>
</ol>
<p>Landlord shall respond to a subletting request within fourteen (14) days of receipt of all required information. Landlord may impose reasonable conditions on any approved sublease.</p>
<p>Even if subletting is approved, Tenant shall remain fully responsible for all obligations under this Lease, including the payment of rent and compliance with all Lease terms. The sublease shall not extend beyond the term of this Lease. Any sublease entered into without Landlord&rsquo;s written consent shall be void and shall constitute a material breach of this Lease.</p>
<p>Landlord&rsquo;s consent to one sublease shall not be deemed consent to any subsequent sublease or assignment.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.occupancy.sublettingAllowed',
        operator: 'equals',
        value: true,
      },
    ],
    placeholders: [],
    sortOrder: 520,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SUBLETTING — PROHIBITED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-occupancy-subletting-prohibited',
    leaseClass: 'residential',
    category: 'occupancy',
    title: 'Subletting — Prohibited',
    description:
      'Prohibits the tenant from subletting any portion of the premises without exception.',
    htmlContent: `<h3>Subletting</h3>
<p>Tenant shall <strong>not</strong> sublet the Premises or any portion thereof, nor permit any person other than the Authorized Occupants to reside in or occupy the Premises, without the prior written consent of Landlord.</p>
<p>Any sublease, subletting arrangement, or occupancy by an unauthorized person entered into without Landlord&rsquo;s express written consent shall be void and of no force or effect. Such unauthorized subletting shall constitute a material breach of this Lease and shall entitle Landlord to pursue all remedies available under this Lease and Minnesota law, including but not limited to termination of the Lease and eviction proceedings.</p>
<p>Listing the Premises or any portion thereof on any short-term rental platform (including but not limited to Airbnb, VRBO, or similar services) is expressly prohibited and shall constitute a material breach of this Lease.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.occupancy.sublettingAllowed',
        operator: 'equals',
        value: false,
      },
    ],
    placeholders: [],
    sortOrder: 520,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ASSIGNMENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-occupancy-assignment',
    leaseClass: 'residential',
    category: 'occupancy',
    title: 'Assignment',
    description:
      'Permits the tenant to assign the lease to another party with the landlord\'s prior written approval.',
    htmlContent: `<h3>Assignment</h3>
<p>Tenant may assign this Lease to another party only with Landlord&rsquo;s prior written consent, which shall not be unreasonably withheld. A request to assign this Lease shall be made in writing and shall include:</p>
<ol>
  <li>The name, current address, and contact information of the proposed assignee;</li>
  <li>Written authorization for Landlord to conduct a background and credit check of the proposed assignee;</li>
  <li>Proof of the proposed assignee&rsquo;s financial ability to meet the obligations of this Lease; and</li>
  <li>The proposed effective date of the assignment.</li>
</ol>
<p>Landlord shall respond to an assignment request within fourteen (14) days of receipt of all required information. Landlord may require the proposed assignee to meet the same qualification criteria applied to the original Tenant.</p>
<p>Upon an approved assignment, the assignee shall assume all rights and obligations of Tenant under this Lease from the effective date of the assignment. Unless Landlord provides a written release, the original Tenant shall remain jointly and severally liable for all obligations under this Lease for the remainder of the Lease Term.</p>
<p>Any assignment made without Landlord&rsquo;s prior written consent shall be void and shall constitute a material breach of this Lease.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.occupancy.assignmentAllowed',
        operator: 'equals',
        value: true,
      },
    ],
    placeholders: [],
    sortOrder: 530,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
