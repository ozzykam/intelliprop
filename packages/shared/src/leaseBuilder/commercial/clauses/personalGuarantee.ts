import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Personal Guarantee Clauses — Personal guarantee references for Minnesota commercial leases.
 * sortOrder: 700–749
 */
export const commercialPersonalGuaranteeClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PERSONAL GUARANTEE REFERENCE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-guarantee-ref',
    leaseClass: 'commercial',
    category: 'personal_guarantee',
    title: 'Personal Guarantee',
    description:
      'References the personal guarantee agreement attached as an exhibit to the lease, requiring one or more individuals to personally guarantee the tenant entity obligations under the lease.',
    htmlContent: `<h3>Personal Guarantee</h3>
<p>As a material inducement to Landlord to enter into this Lease, and as a condition precedent to Landlord&rsquo;s obligations hereunder, the following individual(s) (each, a &ldquo;Guarantor&rdquo;) shall execute and deliver to Landlord a Personal Guarantee of Lease in the form attached hereto as <strong>Exhibit D</strong> and incorporated herein by reference (the &ldquo;Guarantee&rdquo;):</p>
<p><strong>Guarantor(s):</strong> {{lease.guarantorNames}}</p>
<p>Pursuant to the Guarantee, each Guarantor shall unconditionally and irrevocably guarantee the full and punctual performance by Tenant of all of Tenant&rsquo;s obligations under this Lease, including but not limited to the payment of all Rent, Additional Rent, and other sums due hereunder, and the performance of all other covenants and conditions to be performed by Tenant.</p>
<p><strong>Type of Guarantee:</strong> {{lease.guaranteeTypeDescription}}</p>
<p>The Guarantee shall be governed by and construed in accordance with the laws of the State of Minnesota. The Guarantor(s) hereby consent to the jurisdiction of the courts of the State of Minnesota for any action arising out of or in connection with the Guarantee.</p>
<p>The obligations of each Guarantor under the Guarantee shall:</p>
<ol>
  <li>Be joint and several with the obligations of Tenant and with the obligations of any other Guarantor;</li>
  <li>Not be released, discharged, or otherwise affected by: (a) any modification, amendment, or extension of this Lease (unless such modification materially increases the Guarantor&rsquo;s obligations, in which case the Guarantor&rsquo;s written consent shall be required); (b) any subletting or assignment of this Lease; (c) any bankruptcy, insolvency, reorganization, or dissolution of Tenant; (d) any release or discharge of Tenant in any proceeding; or (e) any other circumstance that might otherwise constitute a legal or equitable discharge of a surety or guarantor;</li>
  <li>Continue in full force and effect notwithstanding any renewal or extension of the Term; and</li>
  <li>Remain in effect until all obligations of Tenant under this Lease have been fully performed and satisfied, unless the Guarantee expressly provides for earlier termination or a limitation on liability.</li>
</ol>
<p>Tenant acknowledges and agrees that Landlord&rsquo;s receipt of the fully executed Guarantee is a condition precedent to the effectiveness of this Lease and to Tenant&rsquo;s right to take possession of the Premises.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.risk.personalGuaranteeRequired', operator: 'equals', value: true },
    ],
    placeholders: [
      'lease.guarantorNames',
      'lease.guaranteeTypeDescription',
    ],
    sortOrder: 700,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
