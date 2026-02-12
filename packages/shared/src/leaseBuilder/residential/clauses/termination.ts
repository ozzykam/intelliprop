import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Termination & Default Clauses — Default events, lease termination,
 * abandonment, and early termination.
 * sortOrder: 900–999
 */
export const residentialTerminationClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // DEFAULT & REMEDIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-termination-default',
    leaseClass: 'residential',
    category: 'termination',
    title: 'Default & Remedies',
    description:
      'Defines the events that constitute a default by either party and the remedies available, including cure periods and eviction procedures under Minnesota law.',
    htmlContent: `<h3>Default &amp; Remedies</h3>
<p><strong>Tenant Default.</strong> The following shall constitute events of default by Tenant (&ldquo;Tenant Default&rdquo;):</p>
<ol>
  <li>Failure to pay Monthly Rent or any other amount due under this Lease within the grace period provided;</li>
  <li>Violation of any term, condition, rule, or covenant of this Lease;</li>
  <li>Providing false or misleading information on the rental application;</li>
  <li>Abandonment of the Premises;</li>
  <li>Unauthorized subletting, assignment, or transfer of possession;</li>
  <li>Conduct that constitutes a nuisance or interferes with other tenants&rsquo; peaceful enjoyment;</li>
  <li>Engaging in illegal activity on or near the Premises; or</li>
  <li>Failure to maintain required renters insurance (if applicable).</li>
</ol>
<p><strong>Notice and Cure.</strong> In the event of a Tenant Default, Landlord shall provide Tenant with written notice specifying the nature of the default. For non-payment of rent, Landlord shall provide at least <strong>fourteen (14) days&rsquo;</strong> written notice in accordance with Minnesota Statutes &sect; 504B.321. For other lease violations, Landlord shall provide reasonable written notice and an opportunity to cure, except where the violation involves illegal activity or creates an immediate threat to health or safety.</p>
<p><strong>Landlord&rsquo;s Remedies.</strong> If Tenant fails to cure the default within the applicable notice period, Landlord may pursue one or more of the following remedies:</p>
<ol>
  <li>Terminate this Lease and recover possession of the Premises through eviction proceedings under Minnesota Statutes &sect; 504B.285 et seq.;</li>
  <li>Recover all unpaid rent, late fees, and other charges due under this Lease;</li>
  <li>Recover damages for repair of the Premises beyond normal wear and tear;</li>
  <li>Recover reasonable attorney&rsquo;s fees and court costs as permitted by Minnesota law; and</li>
  <li>Pursue any other remedy available at law or in equity.</li>
</ol>
<p><strong>Landlord Default.</strong> If Landlord fails to comply with Landlord&rsquo;s obligations under this Lease or Minnesota law, Tenant may pursue remedies available under Minnesota Statutes &sect;&sect; 504B.381 through 504B.471, including but not limited to rent escrow, repair and deduct, and termination of the Lease for material noncompliance affecting health or safety.</p>
<p><strong>Mitigation.</strong> Both parties have a duty to mitigate damages. If Tenant vacates the Premises prior to the expiration of the Lease Term, Landlord shall make reasonable efforts to re-let the Premises in accordance with Minnesota Statutes &sect; 504B.178, subd. 3.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 900,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FIXED-TERM EXPIRATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-termination-fixed-end',
    leaseClass: 'residential',
    category: 'termination',
    title: 'Fixed-Term Lease Expiration',
    description:
      'Describes what happens when a fixed-term lease expires, including Tenant\'s obligation to vacate and the move-out inspection process.',
    htmlContent: `<h3>Lease Expiration &mdash; Fixed Term</h3>
<p>This Lease shall expire on <strong>{{lease.endDate}}</strong> at 11:59 p.m. without the necessity of notice from either party. Tenant shall vacate and surrender the Premises on or before the expiration date.</p>
<p><strong>Move-Out Obligations.</strong> Upon expiration or termination of this Lease, Tenant shall:</p>
<ol>
  <li>Remove all personal property and belongings from the Premises;</li>
  <li>Return all keys, access fobs, garage remotes, and other access devices to Landlord;</li>
  <li>Leave the Premises in a clean, broom-swept condition, free of trash and debris;</li>
  <li>Remove all nails, hooks, and adhesive mounts from walls, and fill any holes with appropriate materials;</li>
  <li>Clean all appliances, including the interior of the refrigerator, oven, and dishwasher;</li>
  <li>Remove all items from storage areas, if applicable; and</li>
  <li>Provide Landlord with a forwarding address for return of the Security Deposit.</li>
</ol>
<p><strong>Move-Out Inspection.</strong> Landlord and Tenant may conduct a joint move-out inspection of the Premises prior to or on the date Tenant vacates. The inspection shall document the condition of the Premises for purposes of determining Security Deposit deductions. Tenant shall be given reasonable opportunity to be present at the inspection.</p>
<p>Any personal property left on the Premises after the expiration date shall be deemed abandoned, and Landlord may dispose of it in accordance with Minnesota Statutes &sect; 504B.271.</p>`,
    isRequired: false,
    conditions: [
      { field: 'leaseType', operator: 'equals', value: 'fixed_term' },
    ],
    placeholders: ['lease.endDate'],
    sortOrder: 910,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MONTH-TO-MONTH TERMINATION NOTICE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-termination-mtm-notice',
    leaseClass: 'residential',
    category: 'termination',
    title: 'Month-to-Month Termination Notice',
    description:
      'Specifies the notice period required for either party to terminate a month-to-month tenancy, consistent with Minnesota Statutes section 504B.135.',
    htmlContent: `<h3>Termination of Month-to-Month Tenancy</h3>
<p>Either Landlord or Tenant may terminate this month-to-month tenancy by providing the other party with written notice of termination at least <strong>{{lease.noticeDays}}</strong> days prior to the end of a monthly rental period, in accordance with Minnesota Statutes &sect; 504B.135.</p>
<p><strong>Notice Requirements:</strong></p>
<ol>
  <li>Notice shall be in writing and shall specify the date on which the tenancy will terminate;</li>
  <li>The termination date must fall on the last day of a monthly rental period;</li>
  <li>Notice shall be delivered by personal service, first-class United States mail, or other method permitted by Minnesota law; and</li>
  <li>If notice is delivered by mail, the notice period is extended as required by applicable law.</li>
</ol>
<p><strong>Move-Out Obligations.</strong> Upon termination of the tenancy, Tenant shall vacate and surrender the Premises in the same condition as at the commencement of the tenancy, ordinary wear and tear excepted. Tenant shall:</p>
<ol>
  <li>Remove all personal property and belongings from the Premises;</li>
  <li>Return all keys, access fobs, garage remotes, and other access devices to Landlord;</li>
  <li>Leave the Premises in a clean, broom-swept condition, free of trash and debris;</li>
  <li>Clean all appliances provided by Landlord; and</li>
  <li>Provide Landlord with a forwarding address for return of the Security Deposit.</li>
</ol>
<p>Any personal property left on the Premises after the termination date shall be deemed abandoned, and Landlord may dispose of it in accordance with Minnesota Statutes &sect; 504B.271.</p>`,
    isRequired: false,
    conditions: [
      { field: 'leaseType', operator: 'equals', value: 'month_to_month' },
    ],
    placeholders: ['lease.noticeDays'],
    sortOrder: 910,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ABANDONMENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-termination-abandonment',
    leaseClass: 'residential',
    category: 'termination',
    title: 'Abandonment',
    description:
      'Defines what constitutes abandonment of the premises and the landlord\'s rights to retake possession and handle abandoned property under Minnesota law.',
    htmlContent: `<h3>Abandonment</h3>
<p>The Premises shall be deemed abandoned if Tenant:</p>
<ol>
  <li>Is absent from the Premises for a period of at least fifteen (15) consecutive days without prior written notice to Landlord and rent is unpaid and past due; or</li>
  <li>Removes a substantial portion of personal property from the Premises under circumstances indicating an intent not to return and rent is unpaid and past due; or</li>
  <li>Provides express written or verbal notice to Landlord of Tenant&rsquo;s intent to vacate and has in fact vacated.</li>
</ol>
<p><strong>Landlord&rsquo;s Rights Upon Abandonment.</strong> Upon a reasonable determination that the Premises have been abandoned, Landlord may:</p>
<ol>
  <li>Enter the Premises and retake possession;</li>
  <li>Secure the Premises, including changing locks;</li>
  <li>Remove and store or dispose of any personal property remaining on the Premises in accordance with Minnesota Statutes &sect; 504B.271;</li>
  <li>Make reasonable efforts to re-let the Premises to mitigate damages; and</li>
  <li>Hold Tenant liable for all unpaid rent, damages, and re-letting costs through the expiration of the Lease Term, less any rent received from re-letting.</li>
</ol>
<p><strong>Abandoned Property.</strong> Landlord shall handle any personal property left on the Premises in accordance with Minnesota Statutes &sect; 504B.271. If the property has an apparent value, Landlord shall store it for a reasonable period and provide notice to Tenant at Tenant&rsquo;s last known address. If Tenant does not claim the property within the time required by law, Landlord may dispose of or sell the property and apply the proceeds toward amounts owed by Tenant.</p>
<p>Abandonment by Tenant shall not relieve Tenant of liability for the remaining rent due under the Lease Term, subject to Landlord&rsquo;s duty to mitigate damages under Minnesota law.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 920,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EARLY TERMINATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-termination-early',
    leaseClass: 'residential',
    category: 'termination',
    title: 'Early Termination',
    description:
      'Establishes the conditions under which the tenant may terminate the lease early, including any early termination fee and the process for requesting early termination.',
    htmlContent: `<h3>Early Termination</h3>
<p>Tenant may request early termination of this Lease prior to the expiration of the Lease Term by providing Landlord with written notice at least <strong>sixty (60) days</strong> prior to the requested termination date. Early termination is subject to the following terms:</p>
<ol>
  <li><strong>Early Termination Fee:</strong> Tenant shall pay an early termination fee equal to <strong>{{lease.earlyTerminationFee}}</strong> to compensate Landlord for the costs associated with early vacancy, including marketing, showing, and preparing the Premises for a new tenant. The early termination fee shall be due on or before the early termination date.</li>
  <li><strong>Rent Obligation:</strong> Tenant shall remain responsible for all rent and other charges due under this Lease through the earlier of: (a) the early termination date, or (b) the date a new tenant takes possession and begins paying rent.</li>
  <li><strong>Condition of Premises:</strong> Tenant shall comply with all move-out obligations under this Lease, including returning the Premises in the condition required by the Lease, normal wear and tear excepted.</li>
  <li><strong>Landlord Approval:</strong> Early termination is subject to Landlord&rsquo;s acceptance. Landlord shall respond to an early termination request within fourteen (14) days of receipt.</li>
</ol>
<p><strong>Statutory Early Termination Rights.</strong> Nothing in this clause limits or waives Tenant&rsquo;s statutory early termination rights under Minnesota law, including but not limited to:</p>
<ol>
  <li>Early termination due to domestic violence, sexual assault, or stalking under Minnesota Statutes &sect; 504B.206;</li>
  <li>Early termination for active military service under the Servicemembers Civil Relief Act (50 U.S.C. &sect; 3955); and</li>
  <li>Early termination due to Landlord&rsquo;s material noncompliance with health and safety obligations affecting habitability under Minnesota Statutes &sect; 504B.161.</li>
</ol>
<p>In the event of any conflict between this clause and Tenant&rsquo;s rights under applicable state or federal law, the law shall prevail.</p>`,
    isRequired: true,
    placeholders: ['lease.earlyTerminationFee'],
    sortOrder: 930,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
