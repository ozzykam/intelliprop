import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Default & Remedies Clauses — Events of default, cure periods, and landlord remedies.
 * sortOrder: 750–799
 */
export const commercialDefaultClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // DEFAULT & REMEDIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-default-remedies',
    leaseClass: 'commercial',
    category: 'termination',
    title: 'Default & Remedies',
    description:
      'Defines the events that constitute a default by Tenant, the applicable cure periods for monetary and non-monetary defaults, and Landlord remedies including termination, rent acceleration, re-entry, attorney fees, and default interest.',
    htmlContent: `<h3>Default &amp; Remedies</h3>
<p><strong>Events of Default.</strong> The occurrence of any one or more of the following events shall constitute an &ldquo;Event of Default&rdquo; by Tenant under this Lease:</p>
<ol>
  <li><strong>Monetary Default.</strong> Tenant fails to pay any installment of Rent or any other sum due under this Lease within <strong>{{lease.monetaryDefaultCureDays}}</strong> days after written notice from Landlord that such payment is past due (the &ldquo;Monetary Cure Period&rdquo;);</li>
  <li><strong>Non-Monetary Default.</strong> Tenant fails to perform or observe any other term, covenant, or condition of this Lease, and such failure continues for <strong>{{lease.nonMonetaryDefaultCureDays}}</strong> days after written notice from Landlord specifying the nature of the default (the &ldquo;Non-Monetary Cure Period&rdquo;); provided, however, that if the nature of such default is such that it cannot reasonably be cured within the Non-Monetary Cure Period, Tenant shall not be deemed in default if Tenant commences cure within the Non-Monetary Cure Period and thereafter diligently prosecutes such cure to completion, but in no event shall the extended cure period exceed ninety (90) days;</li>
  <li><strong>Bankruptcy.</strong> Tenant files a voluntary petition in bankruptcy or is adjudicated bankrupt or insolvent, or makes a general assignment for the benefit of creditors, or a receiver or trustee is appointed for substantially all of Tenant&rsquo;s assets, or any petition in bankruptcy is filed against Tenant and not dismissed within sixty (60) days after filing;</li>
  <li><strong>Abandonment.</strong> Tenant abandons or vacates the Premises for a period exceeding thirty (30) consecutive days without Landlord&rsquo;s prior written consent;</li>
  <li><strong>Insurance Failure.</strong> Tenant fails to maintain any insurance required under this Lease within ten (10) days after written notice from Landlord;</li>
  <li><strong>Repeated Defaults.</strong> Tenant defaults in the payment of Rent three (3) or more times during any twelve (12) month period, regardless of whether each default is cured within the applicable Monetary Cure Period; or</li>
  <li><strong>Guarantee Default.</strong> Any Guarantor of this Lease dies, becomes insolvent, or revokes or attempts to revoke the Guarantee, or the Guarantee becomes unenforceable for any reason.</li>
</ol>
<p><strong>Landlord&rsquo;s Remedies.</strong> Upon the occurrence of an Event of Default, Landlord shall have the following rights and remedies, which shall be cumulative and in addition to any other rights and remedies available to Landlord at law or in equity:</p>
<ol>
  <li><strong>Termination.</strong> Landlord may terminate this Lease by delivering written notice of termination to Tenant, and upon such termination, Tenant shall immediately surrender the Premises to Landlord. If Tenant fails to surrender the Premises, Landlord may re-enter and take possession of the Premises in accordance with applicable Minnesota law, including Minnesota Statutes Chapter 504B.</li>
  <li><strong>Rent Acceleration.</strong> Landlord may accelerate all Rent and other sums that would have become due and payable during the remainder of the Term (discounted to present value at a rate of six percent (6%) per annum), and such accelerated amount shall be immediately due and payable by Tenant as liquidated damages.</li>
  <li><strong>Re-Entry and Reletting.</strong> Landlord may re-enter the Premises and relet the Premises or any part thereof for the account of Tenant, for such term, at such rental, and upon such other conditions as Landlord deems appropriate. If the proceeds of such reletting, after deduction of all costs and expenses of reletting (including but not limited to brokerage commissions, tenant improvement costs, advertising costs, and attorneys&rsquo; fees), are insufficient to satisfy Tenant&rsquo;s Rent obligations under this Lease, Tenant shall pay such deficiency to Landlord on demand. Landlord shall have no obligation to mitigate damages by reletting the Premises; however, if Landlord elects to relet, Landlord shall use commercially reasonable efforts to do so.</li>
  <li><strong>Attorneys&rsquo; Fees.</strong> In the event of any litigation or proceeding between the Parties arising out of or in connection with this Lease, including but not limited to any action to enforce the terms of this Lease or to recover possession of the Premises, the prevailing Party shall be entitled to recover from the non-prevailing Party all reasonable attorneys&rsquo; fees, court costs, expert witness fees, and other litigation expenses incurred in connection with such action.</li>
  <li><strong>Default Interest.</strong> All past-due amounts shall bear interest at the Default Interest Rate of <strong>{{lease.defaultInterestRate}}%</strong> per annum from the date due until paid, or the maximum rate permitted by Minnesota law, whichever is less.</li>
  <li><strong>Security Deposit Application.</strong> Landlord may apply the Security Deposit or any portion thereof toward satisfaction of Tenant&rsquo;s obligations as provided in the Security Deposit section of this Lease.</li>
  <li><strong>Self-Help.</strong> Landlord may cure any default on Tenant&rsquo;s behalf, and Tenant shall reimburse Landlord for all costs incurred, plus a ten percent (10%) administrative fee, within ten (10) business days after demand.</li>
</ol>
<p><strong>Landlord&rsquo;s Default.</strong> Landlord shall be in default under this Lease if Landlord fails to perform any obligation required of Landlord under this Lease within thirty (30) days after written notice from Tenant specifying the nature of the default; provided, however, that if the nature of Landlord&rsquo;s default is such that it cannot reasonably be cured within thirty (30) days, Landlord shall not be deemed in default if Landlord commences cure within such thirty (30) day period and thereafter diligently prosecutes such cure to completion. In the event of Landlord&rsquo;s default, Tenant&rsquo;s sole remedies shall be to seek injunctive relief, specific performance, or actual damages; in no event shall Tenant have the right to terminate this Lease or withhold or offset Rent as a result of Landlord&rsquo;s default, except as expressly permitted by Minnesota law.</p>
<p><strong>Waiver of Jury Trial.</strong> TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, EACH PARTY HEREBY WAIVES ITS RIGHT TO A TRIAL BY JURY IN ANY ACTION OR PROCEEDING ARISING OUT OF OR RELATED TO THIS LEASE.</p>`,
    isRequired: true,
    placeholders: [
      'lease.monetaryDefaultCureDays',
      'lease.nonMonetaryDefaultCureDays',
      'lease.defaultInterestRate',
    ],
    sortOrder: 750,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
