import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Security Deposit Clauses — Security deposit for commercial leases.
 * sortOrder: 300–349
 */
export const commercialDepositClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // SECURITY DEPOSIT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-deposit-security',
    leaseClass: 'commercial',
    category: 'deposit',
    title: 'Security Deposit',
    description:
      'Requires the tenant to provide a security deposit to secure the faithful performance of all tenant obligations under the lease, including conditions for application, replenishment, and return.',
    htmlContent: `<h3>Security Deposit</h3>
<p>Upon execution of this Lease, Tenant shall deposit with Landlord the sum of <strong>{{lease.securityDeposit}}</strong> as a security deposit (the &ldquo;Security Deposit&rdquo;) to secure the faithful performance by Tenant of all terms, covenants, and conditions of this Lease.</p>
<p><strong>Application of Deposit.</strong> If Tenant defaults in the performance of any provision of this Lease, Landlord may, but shall not be obligated to, use, apply, or retain all or any portion of the Security Deposit for the payment of:</p>
<ol>
  <li>Any Rent or other sums due and unpaid by Tenant;</li>
  <li>Any expense incurred by Landlord in curing any default by Tenant;</li>
  <li>Any damages sustained by Landlord as a result of Tenant&rsquo;s default, including but not limited to costs of reletting the Premises;</li>
  <li>Any cost of repairing damage to the Premises or the Building caused by Tenant, its employees, agents, contractors, or invitees, beyond normal wear and tear; and</li>
  <li>Any other amounts that Landlord may be entitled to recover from Tenant under this Lease or under applicable law.</li>
</ol>
<p><strong>Replenishment.</strong> If Landlord applies any portion of the Security Deposit as permitted above, Tenant shall, within ten (10) business days after written notice from Landlord, deposit with Landlord an amount sufficient to restore the Security Deposit to its original amount. Tenant&rsquo;s failure to restore the Security Deposit shall constitute a material default under this Lease.</p>
<p><strong>Return of Deposit.</strong> Provided Tenant is not in default under this Lease and has fully performed all of its obligations hereunder, Landlord shall return the Security Deposit (or the balance remaining after any permitted deductions) to Tenant within <strong>{{lease.depositReturnDays}}</strong> days after the later of: (a) the expiration or earlier termination of this Lease, and (b) the date Tenant has vacated and surrendered the Premises in the condition required by this Lease. Landlord shall provide Tenant with an itemized written statement of any deductions from the Security Deposit.</p>
<p><strong>No Interest.</strong> Landlord shall not be required to hold the Security Deposit in a separate account or to pay interest thereon, unless otherwise required by applicable Minnesota law.</p>
<p><strong>Transfer of Deposit.</strong> In the event of a sale or transfer of Landlord&rsquo;s interest in the Building, Landlord may transfer the Security Deposit to the transferee, and upon such transfer, Landlord shall be released from all liability for the return of the Security Deposit. Tenant shall look solely to the transferee for the return of the Security Deposit.</p>
<p><strong>Not Advance Rent.</strong> The Security Deposit shall not be considered an advance payment of Rent or a measure of Landlord&rsquo;s damages in the event of Tenant&rsquo;s default. Tenant shall not apply the Security Deposit to any Rent or other sums due under this Lease without Landlord&rsquo;s prior written consent.</p>`,
    isRequired: true,
    placeholders: [
      'lease.securityDeposit',
      'lease.depositReturnDays',
    ],
    sortOrder: 300,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
