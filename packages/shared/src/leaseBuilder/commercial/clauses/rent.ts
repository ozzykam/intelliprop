import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Rent Clauses — Base rent, escalation variants, and late fees for Minnesota commercial leases.
 * sortOrder: 200–249
 */
export const commercialRentClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // FREE RENT / RENT CONCESSION PERIOD
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-free-period',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Free Rent Period',
    description:
      'Grants a rent-free concession for the first N months of the term; all other obligations remain in effect during the free rent period.',
    htmlContent: `<h3>Free Rent Period</h3>
<p>Notwithstanding the Rent Commencement Date and Base Rent provisions of this Lease, as an inducement to Tenant to enter into this Lease, Landlord hereby agrees to abate Tenant&rsquo;s obligation to pay Base Rent for the first <strong>{{lease.freeRentMonths}}</strong> full calendar month(s) immediately following the Commencement Date (the &ldquo;Free Rent Period&rdquo;). During the Free Rent Period, Tenant shall not be required to pay Base Rent; however, all other terms and conditions of this Lease shall be in full force and effect, including without limitation Tenant&rsquo;s obligations to pay additional rent, CAM charges, utilities, insurance, and all other monetary obligations under this Lease.</p>
<p>The Free Rent Period shall commence on the Commencement Date and shall expire at the end of the last day of the {{lease.freeRentMonths}}<sup>th</sup> full calendar month of the Term. Base Rent shall first become due and payable on the first day of the calendar month immediately following the expiration of the Free Rent Period (the &ldquo;Rent Commencement Date&rdquo;), and shall continue to be due and payable on the first day of each calendar month thereafter throughout the Term.</p>
<p>The free rent concession set forth in this Section is conditioned upon Tenant&rsquo;s faithful performance of all obligations under this Lease. If Tenant is in default of any monetary obligation under this Lease at any time during the Free Rent Period or within sixty (60) days following the Free Rent Period, and such default is not cured within the applicable cure period, the free rent concession shall be deemed revoked, and Landlord may recover from Tenant the full amount of Base Rent that would otherwise have been payable during the Free Rent Period.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.freeRentMonths', operator: 'gt', value: 0 },
    ],
    placeholders: [
      'lease.freeRentMonths',
    ],
    sortOrder: 198,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BASE RENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-base',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Base Rent',
    description:
      'Establishes the monthly base rent amount, due date, payment method, and the obligation to pay rent without demand, offset, deduction, or counterclaim.',
    htmlContent: `<h3>Base Rent</h3>
<p>Commencing on the Rent Commencement Date and continuing throughout the Term of this Lease (including any Renewal Term), Tenant shall pay to Landlord base rent in the amount of <strong>{{lease.baseRentMonthly}}</strong> per month (&ldquo;Base Rent&rdquo;).</p>
<p>Base Rent shall be due and payable in advance on the <strong>first (1st)</strong> day of each calendar month during the Term, without prior notice, demand, offset, deduction, or counterclaim of any kind. If the Rent Commencement Date falls on a day other than the first day of a calendar month, Base Rent for such partial month shall be prorated on a per diem basis (based on the actual number of days in such month), and such prorated amount shall be due and payable on the Rent Commencement Date.</p>
<p>All Base Rent and other sums payable by Tenant under this Lease (collectively, &ldquo;Rent&rdquo;) shall be paid in lawful United States currency by {{#if lease.paymentMethods}}{{lease.paymentMethods}}{{/if}}{{#unless lease.paymentMethods}}check, ACH transfer, wire transfer, or such other method as Landlord may designate in writing{{/unless}} from time to time. All checks, money orders, and negotiable instruments shall be made payable to <strong>{{lease.payableTo}}</strong>. Rent shall be paid to Landlord at the address set forth in this Lease, or to such other person or at such other address as Landlord may designate by written notice to Tenant.</p>
<p>Tenant acknowledges and agrees that Tenant&rsquo;s obligation to pay Rent under this Lease is an independent covenant, and Tenant shall not withhold, offset, or reduce any Rent payment for any reason except as expressly permitted by applicable Minnesota law.</p>`,
    isRequired: true,
    placeholders: [
      'lease.baseRentMonthly',
    ],
    sortOrder: 200,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ESCALATION — FIXED DOLLAR AMOUNT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-escalation-fixed-amount',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Rent Escalation — Fixed Dollar Amount',
    description:
      'Provides for annual increases in Base Rent by a fixed dollar amount on each anniversary of the Rent Commencement Date.',
    htmlContent: `<h3>Rent Escalation &mdash; Fixed Dollar Amount Increase</h3>
<p>Commencing on the first anniversary of the Rent Commencement Date, and on each subsequent anniversary thereof during the Term (including any Renewal Term), the monthly Base Rent shall increase by a fixed amount of <strong>{{lease.escalationAmount}}</strong> per month over the Base Rent payable in the immediately preceding Lease Year.</p>
<p>For purposes of this Lease, a &ldquo;Lease Year&rdquo; shall mean each twelve (12) month period commencing on the Rent Commencement Date or any anniversary thereof.</p>
<p>By way of illustration and not limitation, if the initial monthly Base Rent is {{lease.baseRentMonthly}} and the annual increase is {{lease.escalationAmount}} per month, the monthly Base Rent during Lease Year 2 shall be the sum of the initial monthly Base Rent plus {{lease.escalationAmount}}.</p>
<p>Landlord shall provide Tenant with written notice of each adjusted Base Rent amount at least thirty (30) days prior to the effective date of such adjustment, provided that Landlord&rsquo;s failure to provide such notice shall not relieve Tenant of the obligation to pay the adjusted Base Rent.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.escalationType', operator: 'equals', value: 'fixed_amount' },
    ],
    placeholders: [
      'lease.escalationAmount',
      'lease.baseRentMonthly',
    ],
    sortOrder: 210,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ESCALATION — FIXED PERCENTAGE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-escalation-fixed-pct',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Rent Escalation — Fixed Percentage',
    description:
      'Provides for annual increases in Base Rent by a fixed percentage applied to the prior year Base Rent on each anniversary of the Rent Commencement Date.',
    htmlContent: `<h3>Rent Escalation &mdash; Fixed Percentage Increase</h3>
<p>Commencing on the first anniversary of the Rent Commencement Date, and on each subsequent anniversary thereof during the Term (including any Renewal Term), the monthly Base Rent shall increase by <strong>{{lease.escalationPercentage}}%</strong> over the monthly Base Rent payable in the immediately preceding Lease Year.</p>
<p>For purposes of this Lease, a &ldquo;Lease Year&rdquo; shall mean each twelve (12) month period commencing on the Rent Commencement Date or any anniversary thereof.</p>
<p>The adjusted Base Rent for each Lease Year shall be calculated by multiplying the monthly Base Rent for the immediately preceding Lease Year by one plus the escalation percentage (i.e., prior monthly Base Rent &times; 1.{{lease.escalationPercentagePadded}}). The resulting amount shall be rounded to the nearest cent.</p>
<p>Landlord shall provide Tenant with written notice of each adjusted Base Rent amount at least thirty (30) days prior to the effective date of such adjustment, provided that Landlord&rsquo;s failure to provide such notice shall not relieve Tenant of the obligation to pay the adjusted Base Rent.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.escalationType', operator: 'equals', value: 'fixed_percentage' },
    ],
    placeholders: [
      'lease.escalationPercentage',
      'lease.escalationPercentagePadded',
    ],
    sortOrder: 210,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ESCALATION — CPI ADJUSTMENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-escalation-cpi',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Rent Escalation — CPI Adjustment',
    description:
      'Provides for annual increases in Base Rent based on changes in the Consumer Price Index (CPI), with a floor and cap to protect both parties.',
    htmlContent: `<h3>Rent Escalation &mdash; CPI Adjustment</h3>
<p>Commencing on the first anniversary of the Rent Commencement Date, and on each subsequent anniversary thereof during the Term (including any Renewal Term), the monthly Base Rent shall be adjusted based on changes in the Consumer Price Index for All Urban Consumers (CPI-U), U.S. City Average, All Items (1982-84 = 100), as published by the United States Bureau of Labor Statistics (the &ldquo;Index&rdquo;).</p>
<p>The adjustment shall be calculated as follows:</p>
<ol>
  <li>The &ldquo;Base Index&rdquo; shall be the Index published for the month in which the Rent Commencement Date falls (or, for subsequent adjustments, the month in which the most recent adjustment took effect).</li>
  <li>The &ldquo;Comparison Index&rdquo; shall be the Index published for the same month of the immediately preceding calendar year.</li>
  <li>The adjusted monthly Base Rent shall equal the then-current monthly Base Rent multiplied by a fraction, the numerator of which is the Comparison Index and the denominator of which is the Base Index.</li>
</ol>
<p>Notwithstanding the foregoing:</p>
<ol>
  <li>In no event shall the annual CPI adjustment result in an increase of less than <strong>{{lease.cpiFloorPercent}}%</strong> (the &ldquo;Floor&rdquo;) or more than <strong>{{lease.cpiCapPercent}}%</strong> (the &ldquo;Cap&rdquo;) of the monthly Base Rent for the immediately preceding Lease Year.</li>
  <li>In no event shall the adjusted monthly Base Rent be less than the monthly Base Rent payable for the immediately preceding Lease Year.</li>
</ol>
<p>If the Index is discontinued or revised, Landlord shall substitute an index that is reasonably comparable. If the Parties cannot agree on a substitute index within thirty (30) days, the matter shall be submitted to binding arbitration in accordance with Minnesota law.</p>
<p>Landlord shall provide Tenant with written notice of each CPI-adjusted Base Rent amount at least thirty (30) days prior to the effective date of such adjustment. Pending determination of the adjusted Base Rent, Tenant shall continue to pay Base Rent at the prior rate, and upon determination, Tenant shall pay any deficiency within thirty (30) days.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.escalationType', operator: 'equals', value: 'cpi' },
    ],
    placeholders: [
      'lease.cpiFloorPercent',
      'lease.cpiCapPercent',
    ],
    sortOrder: 210,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ESCALATION — STEP SCHEDULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-escalation-step',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Rent Escalation — Step Schedule',
    description:
      'Provides for predetermined Base Rent amounts for each Lease Year as set forth in a step schedule attached as an exhibit to the lease.',
    htmlContent: `<h3>Rent Escalation &mdash; Step Schedule</h3>
<p>The monthly Base Rent payable during each Lease Year of the Term shall be as set forth in the Rent Schedule attached hereto as <strong>Exhibit B</strong> and incorporated herein by reference (the &ldquo;Rent Schedule&rdquo;).</p>
<p>The Rent Schedule sets forth the specific monthly Base Rent amount applicable to each Lease Year, commencing with Lease Year 1 and continuing through the final Lease Year of the initial Term. If Tenant exercises any Renewal Option(s) pursuant to this Lease, the Base Rent during each Renewal Term shall be determined in accordance with the Rent Schedule, or, if the Rent Schedule does not address the Renewal Term, the monthly Base Rent shall be the greater of: (a) the monthly Base Rent payable in the final Lease Year of the immediately preceding term, increased by three percent (3%); or (b) the then-prevailing fair market rent for comparable commercial space in the same submarket, as reasonably determined by Landlord.</p>
<p>Tenant acknowledges that it has reviewed the Rent Schedule and agrees to pay the Base Rent amounts specified therein. Each adjusted Base Rent amount shall take effect on the first day of the applicable Lease Year without further notice or action by Landlord.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.escalationType', operator: 'equals', value: 'step_schedule' },
    ],
    placeholders: [],
    sortOrder: 210,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LATE FEE & DEFAULT INTEREST
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-late-fee',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Late Fee & Default Interest',
    description:
      'Establishes a late fee for rent payments not received within the grace period and a default interest rate on all overdue amounts.',
    htmlContent: `<h3>Late Fee &amp; Default Interest</h3>
<p><strong>Late Fee.</strong> Tenant acknowledges that the late payment of any Rent will cause Landlord to incur administrative costs and other damages, the exact amount of which would be extremely difficult to ascertain. Therefore, if any installment of Rent is not received by Landlord within <strong>five (5)</strong> calendar days after the date such payment is due (the &ldquo;Grace Period&rdquo;), Tenant shall pay to Landlord a late charge in the amount of {{#if lease.lateFeeIsFlat}}<strong>{{lease.lateFeeAmount}}</strong>{{/if}}{{#unless lease.lateFeeIsFlat}}<strong>{{lease.lateFeePercentage}}% of the Base Rent then due</strong>{{/unless}} (the &ldquo;Late Fee&rdquo;) as liquidated damages for Landlord&rsquo;s additional administrative costs. The Parties agree that this Late Fee represents a fair and reasonable estimate of the costs that Landlord will incur by reason of such late payment.</p>
<p><strong>Default Interest.</strong> In addition to any Late Fee, all amounts of Rent or other sums payable by Tenant under this Lease that are not paid within ten (10) calendar days after the date due shall bear interest from the date due until paid at the rate of <strong>{{lease.defaultInterestRate}}%</strong> per annum (the &ldquo;Default Interest Rate&rdquo;), or the maximum rate permitted by Minnesota law, whichever is less.</p>
<p><strong>Returned Payment Fee.</strong> If any check or electronic payment tendered by Tenant is returned for insufficient funds or for any other reason, Tenant shall pay to Landlord, in addition to the Late Fee and Default Interest described above, a returned payment fee of <strong>{{lease.returnedPaymentFee}}</strong>. After two (2) or more returned payments during any twelve (12) month period, Landlord may require Tenant to make all future Rent payments by cashier&rsquo;s check, certified check, or wire transfer.</p>
<p>The remedies set forth in this section are in addition to, and not in lieu of, any other rights and remedies available to Landlord under this Lease or applicable law.</p>`,
    isRequired: true,
    placeholders: [
      'lease.lateFeeIsFlat',
      'lease.lateFeeAmount',
      'lease.lateFeePercentage',
      'lease.defaultInterestRate',
      'lease.returnedPaymentFee',
    ],
    sortOrder: 220,
    version: '1.1.0',
    lastReviewedDate: '2026-04-22',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CONVENIENCE FEES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-rent-convenience-fee',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Convenience Fees',
    description:
      'Discloses per-method convenience fees charged by payment processors; states that such fees constitute additional rent.',
    htmlContent: `<h3>Convenience Fees</h3>
<p>Certain payment methods available under this Lease may be subject to a convenience fee charged by the applicable payment processor or platform. Such fees are in addition to, and not a reduction of, any Rent or other amounts due under this Lease and shall constitute additional rent. The following convenience fees currently apply:</p>
<p>{{lease.convenienceFeeDescription}}</p>
<p>Landlord reserves the right to modify or discontinue any payment method and its associated convenience fee upon thirty (30) days&rsquo; written notice to Tenant. Convenience fees are imposed by third-party processors and are subject to the terms and conditions of such processors.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.convenienceFees', operator: 'truthy', value: null },
    ],
    placeholders: [
      'lease.convenienceFeeDescription',
    ],
    sortOrder: 225,
    version: '1.0.0',
    lastReviewedDate: '2026-04-22',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // APPLICATION OF PAYMENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-application-of-payment',
    leaseClass: 'commercial',
    category: 'rent',
    title: 'Application of Payment',
    description:
      'Grants Landlord the right to apply any payment received from Tenant to the oldest outstanding obligation first (fees and interest before principal rent), regardless of any contrary designation by Tenant.',
    htmlContent: `<h3>Application of Payment</h3>
<p>Landlord shall have the right, in Landlord&rsquo;s sole discretion, to apply any payment received from Tenant to any outstanding obligation of Tenant under this Lease, regardless of any contrary designation, instruction, or direction made by Tenant at the time of payment or at any other time. Without limiting the generality of the foregoing, Landlord may apply payments first to the oldest outstanding obligations of Tenant (whether for unpaid Rent, late fees, returned payment fees, default interest, costs of collection, or any other amounts due under this Lease) before applying any portion of such payment to the current month&rsquo;s Base Rent or other current obligations.</p>
<p>No payment by Tenant of a lesser amount than the full amount then due and owing shall be deemed to be other than on account of the oldest outstanding obligation. No endorsement or statement on any check or in any letter accompanying a payment shall be deemed an accord and satisfaction or shall otherwise limit or impair Landlord&rsquo;s right to collect the full amount of Tenant&rsquo;s outstanding obligations under this Lease, and Landlord may accept such payment without prejudice to Landlord&rsquo;s right to recover the balance due or to pursue any other remedy provided in this Lease or at law.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 226,
    version: '1.0.0',
    lastReviewedDate: '2026-04-22',
  },
];
