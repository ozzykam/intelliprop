import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Utility Clauses — Utility responsibilities for Minnesota commercial leases.
 * sortOrder: 500–549
 */
export const commercialUtilityClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY RESPONSIBILITIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-utilities',
    leaseClass: 'commercial',
    category: 'utilities',
    title: 'Utility Responsibilities',
    description:
      'Defines which party is responsible for obtaining and paying for utility services to the premises, including electricity, gas, water, sewer, trash, telecommunications, and other services.',
    htmlContent: `<h3>Utilities</h3>
<p><strong>Utility Responsibility.</strong> The responsibility for obtaining and paying for utility services to the Premises shall be allocated between Landlord and Tenant as follows: <strong>{{lease.utilityResponsibilityDescription}}</strong>.</p>
<p><strong>Tenant-Paid Utilities.</strong> For all utilities designated as Tenant&rsquo;s responsibility, Tenant shall:</p>
<ol>
  <li>Contract directly with the applicable utility providers in Tenant&rsquo;s name and at Tenant&rsquo;s sole cost and expense;</li>
  <li>Pay all charges, deposits, connection fees, and other costs associated with establishing and maintaining utility service;</li>
  <li>Maintain utility service in good standing throughout the Term; and</li>
  <li>Ensure that all utility accounts are current and paid in full upon the expiration or earlier termination of this Lease.</li>
</ol>
<p><strong>Landlord-Paid Utilities.</strong> For all utilities designated as Landlord&rsquo;s responsibility, Landlord shall provide such utility services to the Premises during normal business hours (Monday through Friday, 8:00 a.m. to 6:00 p.m., excluding holidays) in quantities and at levels consistent with comparable commercial buildings in the market area. Tenant&rsquo;s share of Landlord-paid utility costs may be included in Operating Expenses as provided elsewhere in this Lease.</p>
<p><strong>Shared Utilities.</strong> If any utility services to the Premises are not separately metered, the cost of such shared utility services shall be allocated between Landlord and Tenant as follows: {{lease.sharedUtilityAllocation}}.</p>
<p><strong>After-Hours Usage.</strong> If Tenant requires utility services (including HVAC) outside of normal business hours, Tenant shall provide Landlord with reasonable advance notice, and Tenant shall pay the actual cost of providing such after-hours services at Landlord&rsquo;s then-current rates.</p>
<p><strong>Excessive Consumption.</strong> If Tenant&rsquo;s use of any utility materially exceeds the usage levels of a typical tenant for comparable premises, Landlord may, at Landlord&rsquo;s election: (a) require Tenant to install a separate meter for such utility at Tenant&rsquo;s sole cost and expense; or (b) charge Tenant for the estimated excess usage based on a reasonable methodology determined by Landlord.</p>
<p><strong>Interruption of Service.</strong> Landlord shall not be liable for any interruption, failure, or inadequacy of any utility service, except to the extent caused by Landlord&rsquo;s gross negligence or willful misconduct. No such interruption shall constitute a constructive eviction, give rise to any claim for damages, or entitle Tenant to any abatement or reduction of Rent, except as follows: if any utility service for which Landlord is responsible is interrupted for more than five (5) consecutive business days due to causes within Landlord&rsquo;s reasonable control, and such interruption renders the Premises materially unsuitable for Tenant&rsquo;s Permitted Use, then Tenant&rsquo;s Base Rent shall abate proportionally from the sixth (6th) business day of such interruption until utility service is restored.</p>
<p><strong>Sustainability.</strong> Tenant shall cooperate with Landlord in any reasonable energy conservation, recycling, or sustainability programs implemented by Landlord for the Building.</p>`,
    isRequired: true,
    placeholders: [
      'lease.utilityResponsibilityDescription',
      'lease.sharedUtilityAllocation',
    ],
    sortOrder: 500,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
