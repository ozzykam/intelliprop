import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Rent & Payment Clauses — Monthly rent, late fees, payment methods, proration, holdover.
 * sortOrder: 200–299
 */
export const residentialRentClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // BASE RENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-base',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Monthly Rent',
    description:
      'Specifies the monthly rent amount, the day of the month it is due, and the grace period before a late fee applies.',
    htmlContent: `<h3>Rent</h3>
<p>Tenant agrees to pay Landlord monthly rent in the amount of <strong>{{lease.monthlyRent}}</strong> (&ldquo;Monthly Rent&rdquo;), due and payable on or before the <strong>{{lease.dueDay}}</strong> day of each calendar month during the Lease Term.</p>
<p>Rent for the first month of the Lease Term shall be due on or before the Commencement Date. All subsequent rent payments shall be due on or before the {{lease.dueDay}} day of each month without demand, deduction, or set-off, except as expressly permitted by Minnesota law.</p>
<p>A grace period of <strong>{{lease.gracePeriodDays}}</strong> days from the due date shall apply before any late fee is assessed. If the {{lease.dueDay}} day of the month falls on a weekend or legal holiday, rent shall be due on the next business day.</p>`,
    isRequired: true,
    placeholders: [
      'lease.monthlyRent',
      'lease.dueDay',
      'lease.gracePeriodDays',
    ],
    sortOrder: 200,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FLAT LATE FEE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-late-fee-flat',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Late Fee — Flat Amount',
    description:
      'Charges a fixed-dollar late fee when rent is not received by the end of the grace period.',
    htmlContent: `<h3>Late Fee</h3>
<p>If Monthly Rent is not received by Landlord on or before the expiration of the grace period described above, Tenant shall pay a late fee of <strong>{{lease.lateFeeAmount}}</strong> (&ldquo;Late Fee&rdquo;). The Late Fee is intended to compensate Landlord for the administrative costs associated with processing late payments and is not a penalty.</p>
<p>The Late Fee shall be due immediately upon expiration of the grace period and shall be considered additional rent under this Lease. Landlord&rsquo;s acceptance of rent without the Late Fee shall not constitute a waiver of Landlord&rsquo;s right to collect the Late Fee or any future Late Fees.</p>
<p>This Late Fee provision is in compliance with Minnesota Statutes &sect; 504B.177 and shall not exceed the maximum amount permitted under Minnesota law.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.rent.lateFeeType',
        operator: 'equals',
        value: 'flat',
      },
    ],
    placeholders: ['lease.lateFeeAmount'],
    sortOrder: 210,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PERCENTAGE LATE FEE (capped at 8%)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-late-fee-pct',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Late Fee — Percentage',
    description:
      'Charges a percentage-based late fee when rent is not received by the end fof the grace period. Capped at 8% of unpaid rent per Minnesota Statutes section 504B.177.',
    htmlContent: `<h3>Late Fee</h3>
<p>If Monthly Rent is not received by Landlord on or before the expiration of the grace period described above, Tenant shall pay a late fee equal to <strong>{{lease.lateFeePercent}}%</strong> of the unpaid Monthly Rent (&ldquo;Late Fee&rdquo;), not to exceed <strong>eight percent (8%)</strong> of the overdue rent amount pursuant to Minnesota Statutes &sect; 504B.177.</p>
<p>The Late Fee shall be due immediately upon expiration of the grace period and shall be considered additional rent under this Lease. The Late Fee is intended to compensate Landlord for the administrative costs associated with processing late payments and is not a penalty.</p>
<p>Landlord&rsquo;s acceptance of rent without the Late Fee shall not constitute a waiver of Landlord&rsquo;s right to collect the Late Fee or any future Late Fees. In no event shall the Late Fee exceed the maximum amount permitted under Minnesota law.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.rent.lateFeeType',
        operator: 'equals',
        value: 'percentage',
      },
    ],
    placeholders: ['lease.lateFeePercent'],
    sortOrder: 210,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RETURNED PAYMENT FEE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-returned-payment',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Returned Payment Fee',
    description:
      'Charges a fee for any payment returned due to insufficient funds, a closed account, or a stop-payment order.',
    htmlContent: `<h3>Returned Payment Fee</h3>
<p>If any payment made by Tenant to Landlord is returned by the financial institution for any reason, including but not limited to insufficient funds, a closed account, or a stop-payment order, Tenant shall pay a returned payment fee of <strong>{{lease.returnedPaymentFee}}</strong> in addition to the original amount due.</p>
<p>The returned payment fee is intended to cover the administrative and bank charges incurred by Landlord. If Tenant has two (2) or more returned payments during any twelve-month period, Landlord may require that all future rent payments be made by certified check, cashier&rsquo;s check, or money order.</p>
<p>The returned payment fee shall be considered additional rent under this Lease and shall be due within five (5) days of Landlord&rsquo;s written notice to Tenant of the returned payment.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.rent.returnedPaymentFee',
        operator: 'exists',
        value: true,
      },
    ],
    placeholders: ['lease.returnedPaymentFee'],
    sortOrder: 220,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ACCEPTED PAYMENT METHODS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-payment-methods',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Accepted Payment Methods',
    description:
      'Lists the methods by which Tenant may pay rent and specifies where payments should be delivered.',
    htmlContent: `<h3>Payment Methods</h3>
<p>Rent and all other amounts due under this Lease shall be payable by the following accepted methods:</p>
<p><strong>{{lease.paymentMethods}}</strong></p>
<p>All payments shall be made payable to <strong>{{landlord.name}}</strong> and delivered to the following address or account, unless Landlord provides written notice of a change:</p>
<p><strong>Payment Address / Instructions:</strong> {{lease.paymentInstructions}}</p>
<p>Tenant shall not pay rent in cash unless specifically listed as an accepted payment method above. Landlord shall provide a written receipt for any cash payment received.</p>
<p>Landlord reserves the right to modify accepted payment methods upon thirty (30) days&rsquo; written notice to Tenant, provided that at least one non-electronic payment method remains available.</p>`,
    isRequired: true,
    placeholders: [
      'lease.paymentMethods',
      'landlord.name',
      'lease.paymentInstructions',
    ],
    sortOrder: 230,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PRORATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-proration',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Rent Proration',
    description:
      'Prorates rent on a daily basis for any partial month at the beginning or end of the lease term.',
    htmlContent: `<h3>Rent Proration</h3>
<p>If the Lease Term begins or ends on a day other than the first or last day of a calendar month, Monthly Rent for that partial month shall be prorated on a daily basis. The daily rate shall be calculated by dividing the Monthly Rent by the number of days in the applicable calendar month.</p>
<p><strong>Prorated Amount:</strong> {{lease.proratedAmount}}</p>
<p><strong>Proration Period:</strong> {{lease.prorationStartDate}} through {{lease.prorationEndDate}}</p>
<p>The prorated rent for any partial first month shall be due on or before the Commencement Date, together with the first full month&rsquo;s rent (if applicable) and the security deposit.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.rent.prorationMethod',
        operator: 'equals',
        value: 'daily',
      },
    ],
    placeholders: [
      'lease.proratedAmount',
      'lease.prorationStartDate',
      'lease.prorationEndDate',
    ],
    sortOrder: 240,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // HOLDOVER — MONTH-TO-MONTH
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-holdover-mtm',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Holdover — Converts to Month-to-Month',
    description:
      'If the tenant remains after the lease expires, the tenancy converts to a month-to-month arrangement at the same rent, terminable with proper notice.',
    htmlContent: `<h3>Holdover Tenancy</h3>
<p>If Tenant remains in possession of the Premises after the expiration of the Lease Term without executing a new lease or renewal agreement, and Landlord accepts rent from Tenant, the tenancy shall automatically convert to a <strong>month-to-month tenancy</strong> under the same terms and conditions as this Lease, including the same Monthly Rent amount then in effect.</p>
<p>Either party may terminate the month-to-month holdover tenancy by providing written notice to the other party in accordance with Minnesota Statutes &sect; 504B.135. Such notice shall be given at least one full rental period (one month) before the intended termination date, or as otherwise required by applicable law.</p>
<p>Landlord&rsquo;s acceptance of rent during a holdover period shall not constitute a waiver of any right to terminate the tenancy or to pursue any other remedy available under this Lease or Minnesota law.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.rent.holdoverTerms',
        operator: 'equals',
        value: 'month_to_month',
      },
    ],
    placeholders: [],
    sortOrder: 250,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // HOLDOVER — DOUBLE RENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-rent-holdover-double',
    leaseClass: 'residential',
    category: 'rent',
    title: 'Holdover — Double Rent',
    description:
      'If the tenant holds over after the lease expires, rent increases to double the monthly rate as permitted by Minnesota law.',
    htmlContent: `<h3>Holdover Tenancy</h3>
<p>If Tenant remains in possession of the Premises after the expiration of the Lease Term without Landlord&rsquo;s prior written consent, Tenant shall be deemed a holdover tenant and shall pay holdover rent equal to <strong>two hundred percent (200%)</strong> of the Monthly Rent then in effect, prorated on a daily basis for each day Tenant remains in possession.</p>
<p>The acceptance of holdover rent by Landlord shall not constitute consent to a continued tenancy, a renewal of this Lease, or a waiver of Landlord&rsquo;s right to recover possession of the Premises. Landlord retains the right to pursue eviction proceedings and any other remedies available under Minnesota law, including but not limited to recovery of damages caused by Tenant&rsquo;s failure to vacate.</p>
<p>Tenant shall also be liable for any costs, losses, or damages suffered by Landlord as a result of the holdover, including lost rental income from a prospective new tenant. All other terms and conditions of this Lease shall continue to apply during the holdover period.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.rent.holdoverTerms',
        operator: 'equals',
        value: 'double_rent',
      },
    ],
    placeholders: [],
    sortOrder: 250,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
