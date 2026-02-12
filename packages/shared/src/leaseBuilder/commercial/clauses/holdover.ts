import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Holdover Clauses — Holdover tenancy provisions for Minnesota commercial leases.
 * sortOrder: 800–849
 */
export const commercialHoldoverClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // HOLDOVER
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-holdover',
    leaseClass: 'commercial',
    category: 'termination',
    title: 'Holdover',
    description:
      'Establishes the terms applicable if Tenant remains in possession of the Premises after the expiration or termination of the Lease, including an increased holdover rent.',
    htmlContent: `<h3>Holdover</h3>
<p>If Tenant remains in possession of the Premises after the expiration or earlier termination of this Lease without Landlord&rsquo;s prior written consent, Tenant shall be deemed a holdover tenant, and the following terms shall apply:</p>
<p><strong>Holdover Rent.</strong> During any holdover period, Tenant shall pay holdover rent equal to <strong>{{lease.holdoverRentPercent}}%</strong> of the monthly Base Rent in effect during the last month of the Term (the &ldquo;Holdover Rent&rdquo;), plus all Additional Rent and other charges payable under this Lease. Holdover Rent shall be due and payable on the first day of each calendar month during the holdover period, prorated on a per diem basis for any partial month.</p>
<p><strong>Month-to-Month Tenancy.</strong> Any holdover tenancy shall be on a month-to-month basis, terminable by either Party upon thirty (30) days&rsquo; prior written notice to the other Party. Except as modified by this Section, the holdover tenancy shall be subject to all of the terms and conditions of this Lease.</p>
<p><strong>Landlord&rsquo;s Remedies.</strong> The acceptance of Holdover Rent by Landlord shall not constitute a consent to or waiver of Tenant&rsquo;s holdover, nor shall it constitute a renewal or extension of this Lease. Landlord shall retain all rights and remedies available at law or in equity, including the right to:</p>
<ol>
  <li>Commence eviction proceedings in accordance with Minnesota Statutes Chapter 504B;</li>
  <li>Recover possession of the Premises through any lawful means; and</li>
  <li>Recover all damages suffered by Landlord as a result of Tenant&rsquo;s holdover, including but not limited to lost rental income from prospective tenants, storage costs, and any penalties or damages owed by Landlord to a succeeding tenant whose occupancy is delayed by Tenant&rsquo;s holdover.</li>
</ol>
<p><strong>Tenant&rsquo;s Liability.</strong> In addition to the Holdover Rent, Tenant shall indemnify and hold harmless Landlord from and against all Claims, losses, damages, costs, and expenses (including reasonable attorneys&rsquo; fees) arising from or related to Tenant&rsquo;s failure to surrender the Premises in a timely manner, including any Claims made by any succeeding tenant whose occupancy is delayed as a result of Tenant&rsquo;s holdover.</p>
<p><strong>No Implied Renewal.</strong> Nothing contained in this Section shall be construed to give Tenant any right to hold over at any time, and Landlord&rsquo;s acceptance of Holdover Rent shall not establish or imply any new tenancy agreement between the Parties.</p>`,
    isRequired: true,
    placeholders: [
      'lease.holdoverRentPercent',
    ],
    sortOrder: 800,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
