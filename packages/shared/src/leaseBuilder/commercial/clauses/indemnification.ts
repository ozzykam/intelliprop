import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Indemnification Clauses — Tenant (and mutual) indemnification for Minnesota commercial leases.
 * sortOrder: 600–649
 */
export const commercialIndemnificationClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // INDEMNIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-indemnification',
    leaseClass: 'commercial',
    category: 'indemnification',
    title: 'Indemnification',
    description:
      'Establishes indemnification obligations between Landlord and Tenant, with mutual or tenant-only indemnification depending on the lease configuration.',
    htmlContent: `<h3>Indemnification</h3>
<p><strong>Tenant&rsquo;s Indemnification of Landlord.</strong> To the fullest extent permitted by law, Tenant shall indemnify, defend (with counsel reasonably acceptable to Landlord), and hold harmless Landlord, Landlord&rsquo;s members, managers, officers, directors, employees, agents, successors, and assigns (collectively, the &ldquo;Landlord Indemnified Parties&rdquo;) from and against any and all claims, actions, suits, proceedings, demands, losses, damages, liabilities, judgments, penalties, fines, costs, and expenses (including reasonable attorneys&rsquo; fees and court costs) (collectively, &ldquo;Claims&rdquo;) arising out of or related to:</p>
<ol>
  <li>The use or occupancy of the Premises by Tenant, its employees, agents, contractors, customers, licensees, or invitees;</li>
  <li>Any act, omission, negligence, or willful misconduct of Tenant, its employees, agents, contractors, customers, licensees, or invitees in or about the Premises, the Building, or the Common Areas;</li>
  <li>Any breach or default by Tenant in the performance of any obligation under this Lease;</li>
  <li>Any injury to or death of any person, or damage to or destruction of any property, occurring in or about the Premises, except to the extent caused by the gross negligence or willful misconduct of Landlord;</li>
  <li>Any work or alterations performed by or on behalf of Tenant in the Premises; and</li>
  <li>Any violation or alleged violation of any Applicable Law by Tenant or arising from Tenant&rsquo;s use of the Premises.</li>
</ol>
<p><strong>{{lease.indemnificationMutualSection}}</strong></p>
<p><strong>Limitation.</strong> Notwithstanding any other provision of this Lease, neither Party shall be liable to the other for any consequential, indirect, special, or punitive damages arising under or in connection with this Lease, except in connection with a Party&rsquo;s obligation to indemnify the other Party against third-party Claims as set forth above.</p>
<p><strong>Survival.</strong> The indemnification obligations set forth in this Section shall survive the expiration or earlier termination of this Lease with respect to any Claims arising from events occurring during the Term.</p>
<p><strong>Notice and Cooperation.</strong> An indemnified Party shall promptly notify the indemnifying Party in writing of any Claim for which indemnification is sought. The failure to provide prompt notice shall not relieve the indemnifying Party of its indemnification obligation except to the extent the indemnifying Party is materially prejudiced by such failure. The indemnified Party shall cooperate with the indemnifying Party in the defense of any Claim at the indemnifying Party&rsquo;s expense.</p>
<p><strong>No Waiver of Liability Limits.</strong> Nothing in this Section shall be construed to waive any limitation of liability or immunity that may be available to either Party under Minnesota law.</p>`,
    isRequired: true,
    placeholders: [
      'lease.indemnificationMutualSection',
    ],
    sortOrder: 600,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
