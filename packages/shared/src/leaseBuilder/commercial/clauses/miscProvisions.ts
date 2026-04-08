import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Miscellaneous Provisions — Boilerplate clauses required by MN commercial lease practice.
 * Covers: nature of relationship, tax allocation, right of re-entry,
 * lessor's lien, and right of lessor to pay tenant's obligations.
 * sortOrder: 155, 160, 165, 180, 315
 */
export const commercialMiscProvisionsClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // NATURE OF RELATIONSHIP
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-nature-of-relationship',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Nature of Relationship',
    description:
      'Clarifies that the relationship between the parties is solely that of landlord and tenant, and that nothing in the lease creates a partnership, joint venture, agency, or fiduciary relationship.',
    htmlContent: `<h3>Nature of Relationship</h3>
<p>The sole relationship created between Landlord and Tenant by this Lease is that of landlord and tenant. Nothing contained in this Lease shall be deemed or construed, by the Parties or by any third party, to create any other relationship between the Parties, including without limitation a partnership, joint venture, agency, employment relationship, or any other association. Neither Party shall have any right, power, or authority to bind or obligate the other Party in any manner. All financial obligations of Tenant under this Lease are obligations of Tenant alone, and Landlord shall not be responsible for any debts, liabilities, or obligations of Tenant to any third party.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 155,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TAX ALLOCATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-taxes',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Taxes',
    description:
      'Allocates responsibility for real property taxes (landlord) and personal property taxes (tenant) on the leased premises. Applies to both gross and NNN lease structures.',
    htmlContent: `<h3>Taxes</h3>
<p><strong>Real Property Taxes.</strong> Real estate and personal property taxes, special assessments, and any other governmental charges or levies assessed against the Premises or the Building (collectively, &ldquo;Real Property Taxes&rdquo;) shall be the responsibility of Landlord, subject to any allocation of Operating Expenses as provided elsewhere in this Lease (including, if applicable, the CAM and Operating Expenses provisions). Landlord shall pay all Real Property Taxes before they become delinquent.</p>
<p><strong>Tenant&rsquo;s Personal Property Taxes.</strong> Tenant shall be solely responsible for and shall pay, before delinquency, all taxes, assessments, and other governmental charges levied or assessed against: (a) Tenant&rsquo;s personal property, trade fixtures, equipment, inventory, and other property located on or about the Premises; (b) any leasehold improvements installed by or at the expense of Tenant; and (c) Tenant&rsquo;s business operations at the Premises, including any business or occupational taxes or license fees. If any such taxes are assessed against Landlord or Landlord&rsquo;s property rather than Tenant, and Landlord pays the same, Tenant shall reimburse Landlord for the amount attributable to Tenant&rsquo;s property or improvements within thirty (30) days after Landlord&rsquo;s written demand therefor.</p>
<p><strong>Tax Contests.</strong> Landlord reserves the right, at its own expense, to contest or seek a reduction in any Real Property Tax assessment. Tenant shall cooperate with Landlord in connection with any such contest as reasonably requested.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 160,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RIGHT OF RE-ENTRY / LANDLORD ACCESS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-right-of-entry',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Right of Re-Entry; Landlord Access',
    description:
      'Grants the landlord the right to enter the premises at reasonable hours for inspections, repairs, exhibiting the space to prospective tenants or buyers, and posting legally required notices.',
    htmlContent: `<h3>Right of Re-Entry; Landlord Access</h3>
<p>Landlord shall have the right, by itself, its agents, employees, or contractors, to enter the Premises at any reasonable time upon reasonable advance notice (except in the case of emergency, in which case no advance notice is required) for any of the following purposes:</p>
<ol>
  <li>To inspect the condition of the Premises and Tenant&rsquo;s compliance with the terms of this Lease;</li>
  <li>To exhibit the Premises to prospective tenants, purchasers, mortgagees, or their respective agents;</li>
  <li>To make such repairs, alterations, improvements, or additions to the Premises or the Building as Landlord deems necessary or desirable for the safety, preservation, or maintenance of the Building;</li>
  <li>To post such notices as Landlord may deem necessary to protect Landlord against mechanics&rsquo; liens, materialmen&rsquo;s liens, or other claims, or to protect Landlord&rsquo;s interest in the Premises or the Building;</li>
  <li>To perform any obligation of Tenant that Tenant has failed to perform as permitted under this Lease; or</li>
  <li>For any other reasonable purpose that does not materially and unreasonably interfere with Tenant&rsquo;s business operations.</li>
</ol>
<p>Except in the case of emergency, Landlord shall provide Tenant with at least twenty-four (24) hours&rsquo; advance written or oral notice prior to entry. Landlord shall use commercially reasonable efforts to perform all non-emergency entry during normal business hours and in a manner that minimizes disruption to Tenant&rsquo;s business. Any entry by Landlord pursuant to this Section shall not constitute an eviction of Tenant, a termination of this Lease, or a waiver of any of Landlord&rsquo;s rights under this Lease. Tenant shall not change locks or install additional security systems that would impair Landlord&rsquo;s right of entry without Landlord&rsquo;s prior written consent and delivery to Landlord of keys or access codes for any new locking mechanisms.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 165,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RIGHT OF LESSOR TO PAY OBLIGATIONS OF LESSEE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-pay-obligations',
    leaseClass: 'commercial',
    category: 'core',
    title: "Right of Lessor to Pay Tenant's Obligations",
    description:
      "Grants the landlord the right, after notice, to pay any obligation of the tenant that the tenant has failed to pay, and to recover such amounts as additional rent.",
    htmlContent: `<h3>Right of Lessor to Pay Tenant&rsquo;s Obligations</h3>
<p>If Tenant shall fail or refuse to pay any sum required to be paid by Tenant under the provisions of this Lease, or shall fail or refuse to perform any obligation required of Tenant under this Lease, then Landlord, after giving Tenant ten (10) days&rsquo; prior written notice (or such shorter notice as may be required in the case of an emergency or to prevent damage to the Premises or the Building), shall have the right (but not the obligation) to pay any such sum or to perform any such obligation on Tenant&rsquo;s behalf.</p>
<p>All amounts paid by Landlord pursuant to this Section, together with interest at the Default Interest Rate (as defined in this Lease) from the date of payment by Landlord until repayment by Tenant, shall be deemed additional Rent and shall be due and payable by Tenant to Landlord upon written demand. The payment by Landlord of any sum or the performance by Landlord of any obligation on Tenant&rsquo;s behalf shall be prima facie evidence that such payment or performance was necessary and appropriate, but shall not constitute a waiver of Tenant&rsquo;s obligations or of any default by Tenant under this Lease, nor shall it limit or impair any other right or remedy of Landlord.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 180,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSOR'S LIEN
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-lessor-lien',
    leaseClass: 'commercial',
    category: 'core',
    title: "Lessor's Lien",
    description:
      "Acknowledges the landlord's statutory and contractual lien rights on tenant's property located on the premises as additional security for unpaid rent and other obligations, to the extent permitted by Minnesota law.",
    htmlContent: `<h3>Lessor&rsquo;s Lien</h3>
<p>As additional security for Tenant&rsquo;s obligations under this Lease, Tenant acknowledges and agrees that, to the extent permitted by applicable Minnesota law (including without limitation Minnesota Statutes Chapter 514), Landlord shall have a lien upon all of Tenant&rsquo;s personal property, trade fixtures, equipment, and other property located on or about the Premises to secure the payment of all Rent and other sums due and payable under this Lease and the performance of all obligations of Tenant hereunder.</p>
<p>No property of Tenant that is subject to Landlord&rsquo;s lien shall be removed from the Premises by Tenant other than in the ordinary course of Tenant&rsquo;s business while Tenant is in default in the payment of Rent or in the performance of any other material obligation under this Lease. Landlord shall have the right to enforce such lien in the manner provided by applicable Minnesota law.</p>
<p>Tenant represents and warrants that, as of the Effective Date, all personal property and trade fixtures brought onto the Premises by Tenant are free and clear of any security interests, liens, or encumbrances except as disclosed to Landlord in writing prior to execution of this Lease.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 315,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },
];
