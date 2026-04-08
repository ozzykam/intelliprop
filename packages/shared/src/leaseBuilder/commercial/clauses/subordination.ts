import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Subordination & Sale Clauses — SNDA and sale/transfer of the property.
 * sortOrder: 170–179
 */
export const commercialSubordinationClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // SUBORDINATION, NON-DISTURBANCE & ATTORNMENT (SNDA)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-subordination-snda',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Subordination, Non-Disturbance & Attornment',
    description:
      'Subordinates the lease to all present and future mortgages and deeds of trust on the Premises, and requires the tenant to attorn to any successor lender or purchaser. Provides for non-disturbance protection when the tenant is not in default.',
    htmlContent: `<h3>Subordination, Non-Disturbance &amp; Attornment</h3>
<p><strong>Subordination.</strong> This Lease and all rights of Tenant hereunder are and shall be subject and subordinate to the lien of any mortgage, deed of trust, or other security instrument (each, a &ldquo;Mortgage&rdquo;) now or hereafter placed upon the Premises or the Building, and to any and all advances made or to be made thereunder, and to the interest thereon, and to all renewals, replacements, modifications, consolidations, and extensions thereof. This subordination shall be automatic and self-operative without the execution of any further instrument; provided, however, that Tenant shall, upon request, promptly execute and deliver any additional documents confirming such subordination that Landlord or any mortgagee may reasonably request.</p>
<p><strong>Non-Disturbance.</strong> Notwithstanding the foregoing subordination, and provided that Tenant is not in default under this Lease beyond any applicable notice and cure period, Tenant&rsquo;s possession of the Premises and Tenant&rsquo;s rights under this Lease shall not be disturbed by any mortgagee or its successor in the event of a foreclosure of any Mortgage or delivery of a deed in lieu of foreclosure, so long as Tenant continues to perform all of its obligations under this Lease. Tenant&rsquo;s non-disturbance rights are conditioned upon Landlord&rsquo;s obtaining a commercially reasonable non-disturbance agreement from any mortgagee holding a Mortgage encumbering the Premises as of the Effective Date of this Lease.</p>
<p><strong>Attornment.</strong> In the event of any foreclosure of a Mortgage, or the delivery of a deed in lieu of foreclosure, Tenant shall, at the election of the purchaser at such foreclosure sale or the grantee of such deed in lieu of foreclosure (each, a &ldquo;Successor Landlord&rdquo;), attorn to and recognize such Successor Landlord as the landlord under this Lease for the balance of the Term, subject to all terms and conditions of this Lease. Tenant shall execute such instruments as the Successor Landlord may reasonably request to evidence such attornment. Notwithstanding such attornment, no Successor Landlord shall be: (a) liable for any act or omission of any prior Landlord; (b) subject to any offset, defense, or counterclaim that Tenant may have against any prior Landlord; (c) bound by any Rent paid more than one (1) month in advance; or (d) bound by any amendment or modification of this Lease made without the written consent of the Successor Landlord (if required by the Mortgage).</p>
<p><strong>Estoppel Certificates.</strong> Tenant shall, within ten (10) business days after written request by Landlord or any mortgagee, execute, acknowledge, and deliver to Landlord or such mortgagee a written estoppel certificate certifying: (a) that this Lease is unmodified and in full force and effect (or, if modified, stating the nature of such modifications); (b) the date through which Rent has been paid; (c) whether or not, to Tenant&rsquo;s knowledge, there are then-existing defaults by either Party under this Lease (and if so, specifying the nature thereof); and (d) such other matters as may be reasonably requested. Tenant&rsquo;s failure to timely deliver such estoppel certificate shall be deemed an admission that the Lease is in full force and effect, with no modifications, and that there are no defaults by Landlord.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 170,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SALE BY LESSOR / TRANSFER OF PROPERTY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-sale-by-lessor',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Sale by Lessor / Transfer of Property',
    description:
      'Addresses the effect of a sale or transfer of the property by the landlord, releases the selling landlord from future obligations, and requires the tenant to attorn to the purchaser.',
    htmlContent: `<h3>Sale by Lessor; Transfer of Property</h3>
<p><strong>Release of Selling Landlord.</strong> In the event of a sale, assignment, or other transfer by Landlord of all or any portion of the Building or the Premises, or of Landlord&rsquo;s interest in this Lease, the transferring Landlord shall be automatically released from all obligations and liabilities under this Lease arising or accruing after the effective date of such transfer, provided that: (a) the transferee has assumed in writing all obligations of Landlord under this Lease arising after the date of transfer; and (b) Landlord has delivered to Tenant written notice of the transfer and the identity and address of the transferee. Upon such release, Tenant agrees to look solely to the transferee for performance of Landlord&rsquo;s obligations arising after the effective date of such transfer.</p>
<p><strong>Tenant&rsquo;s Acknowledgment.</strong> This Lease shall not be affected by any such sale or transfer, and Tenant agrees to attorn to any such purchaser or transferee and to recognize such purchaser or transferee as the landlord under this Lease, provided that such purchaser or transferee assumes all obligations of Landlord hereunder arising after the date of such transfer.</p>
<p><strong>Security Deposit Transfer.</strong> In the event of a sale or transfer of the Premises, Landlord shall transfer the Security Deposit (or any remaining balance thereof) to the transferee, and upon such transfer Landlord shall be released from all liability to Tenant with respect to the Security Deposit, and Tenant shall look solely to the transferee for the return of the Security Deposit as provided in this Lease.</p>
<p><strong>Access for Sale or Leasing.</strong> Tenant agrees to permit Landlord, at any time within sixty (60) days prior to the expiration of the Term (or any Renewal Term), to place upon or in the windows of the Premises any usual or ordinary &ldquo;For Lease&rdquo; or similar sign, and to allow prospective tenants and their agents to enter and inspect the Premises at reasonable business hours during such period upon reasonable advance notice to Tenant. Landlord may also, at any time during the Term upon reasonable advance notice, conduct prospective purchasers of the Building through the Premises during normal business hours.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 175,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },
];
