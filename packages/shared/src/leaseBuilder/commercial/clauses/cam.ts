import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * CAM / Additional Rent Clauses — Common area maintenance, operating expenses, and reconciliation.
 * sortOrder: 250–299
 */
export const commercialCamClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // ADDITIONAL RENT (CAM / NNN)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-cam-additional-rent',
    leaseClass: 'commercial',
    category: 'cam',
    title: 'Additional Rent — CAM / Operating Expenses',
    description:
      'Obligates the tenant to pay its pro rata share of common area maintenance charges, property taxes, building insurance, management fees, and utilities as additional rent.',
    htmlContent: `<h3>Additional Rent &mdash; Operating Expenses</h3>
<p>In addition to Base Rent, commencing on the Rent Commencement Date, Tenant shall pay to Landlord as additional rent (&ldquo;Additional Rent&rdquo;) Tenant&rsquo;s Pro Rata Share of the Operating Expenses (as defined below) incurred by Landlord in connection with the ownership, operation, maintenance, repair, and management of the Building and Common Areas.</p>
<p>Tenant&rsquo;s Pro Rata Share is <strong>{{lease.camProRataShare}}%</strong>, as calculated in Section 2 of this Lease.</p>
<p><strong>Operating Expenses</strong> shall mean all costs and expenses incurred by Landlord in connection with the ownership, operation, maintenance, repair, and management of the Building and Common Areas, including without limitation the following:</p>
<ol>
  <li><strong>Property Taxes.</strong> All real property taxes, assessments (general and special), governmental charges, and any tax levied in lieu thereof, imposed upon or assessed against the Building, the land upon which it is situated, and any improvements thereto (collectively, &ldquo;Property Taxes&rdquo;). Property Taxes shall include any reasonable costs of contesting the amount or validity of any Property Tax.</li>
  <li><strong>Building Insurance.</strong> Premiums for all insurance carried by Landlord with respect to the Building, including but not limited to fire and extended coverage insurance, commercial general liability insurance, rental loss insurance, boiler and machinery insurance, and any other insurance required by Landlord&rsquo;s lender or reasonably deemed necessary by Landlord.</li>
  <li><strong>Management Fee.</strong> A property management fee equal to <strong>{{lease.camManagementFeePercent}}%</strong> of gross rental receipts from the Building, or the actual management fee paid to a third-party property manager, whichever is applicable.</li>
  <li><strong>Common Area Utilities.</strong> All costs of utilities for the Common Areas and Building systems, including electricity, gas, water, sewer, trash removal, and recycling services for Common Areas, lobbies, corridors, restrooms, mechanical rooms, and other shared spaces.</li>
  <li><strong>Maintenance and Repairs.</strong> All costs of maintaining, repairing, and replacing Common Areas and Building systems, including janitorial services, landscaping, snow and ice removal, parking lot maintenance, elevator maintenance, HVAC system maintenance for Common Areas, pest control, and security services.</li>
  <li><strong>Other Operating Costs.</strong> All other costs reasonably incurred in connection with the operation of the Building, including supplies, equipment, licenses, permits, and compliance with applicable laws and regulations.</li>
</ol>
<p><strong>Exclusions from Operating Expenses.</strong> Operating Expenses shall not include: (a) capital expenditures, except to the extent amortized over their useful life in accordance with generally accepted accounting principles; (b) costs of tenant improvements for any tenant; (c) leasing commissions, advertising costs, or other costs of leasing space; (d) depreciation or amortization of the Building; (e) interest on or principal payments of mortgage indebtedness; (f) costs reimbursed by insurance proceeds or condemnation awards; (g) costs attributable to Landlord&rsquo;s negligence or willful misconduct; or (h) costs of correcting defects in the original construction of the Building.</p>
<p><strong>Monthly Estimates.</strong> Prior to the commencement of each calendar year (or partial calendar year), Landlord shall provide Tenant with a reasonable estimate of Tenant&rsquo;s Pro Rata Share of Operating Expenses for such year. Tenant shall pay one-twelfth (1/12) of such estimated annual amount as monthly Additional Rent, due and payable on the first day of each calendar month concurrently with Base Rent. Landlord may adjust the monthly estimated amount no more than once during any calendar year if actual Operating Expenses materially differ from the original estimate.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.camEnabled', operator: 'equals', value: true },
    ],
    placeholders: [
      'lease.camProRataShare',
      'lease.camManagementFeePercent',
    ],
    sortOrder: 250,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ANNUAL RECONCILIATION & AUDIT RIGHTS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-cam-reconciliation',
    leaseClass: 'commercial',
    category: 'cam',
    title: 'Annual Reconciliation & Audit Rights',
    description:
      'Requires Landlord to provide an annual statement of actual Operating Expenses, with tenant reconciliation payment or credit, and grants tenant the right to audit Landlord records.',
    htmlContent: `<h3>Annual Reconciliation &amp; Audit Rights</h3>
<p><strong>Annual Statement.</strong> Within one hundred twenty (120) days after the end of each calendar year (or within such longer period as may be reasonably required), Landlord shall furnish Tenant with a written statement (the &ldquo;Annual Statement&rdquo;) setting forth in reasonable detail the actual Operating Expenses incurred during such calendar year and Tenant&rsquo;s Pro Rata Share thereof.</p>
<p><strong>Reconciliation Payment.</strong> If Tenant&rsquo;s Pro Rata Share of actual Operating Expenses for any calendar year exceeds the total estimated monthly payments made by Tenant for such year, Tenant shall pay the deficiency to Landlord within <strong>{{lease.camReconciliationDays}}</strong> days after receipt of the Annual Statement. If the total estimated monthly payments made by Tenant exceed Tenant&rsquo;s Pro Rata Share of actual Operating Expenses, Landlord shall, at Landlord&rsquo;s election, either (a) credit such overpayment against future Additional Rent obligations, or (b) refund such overpayment to Tenant within thirty (30) days. If the overpayment occurs in the final year of the Term, Landlord shall refund the overpayment to Tenant within thirty (30) days.</p>
<p><strong>Tenant&rsquo;s Audit Rights.</strong> Tenant or Tenant&rsquo;s authorized representative (who shall not be compensated on a contingency fee basis) shall have the right, upon not less than thirty (30) days&rsquo; prior written notice to Landlord, to examine and audit Landlord&rsquo;s books and records relating to Operating Expenses for any calendar year, provided that:</p>
<ol>
  <li>Such audit is commenced within twelve (12) months after Tenant&rsquo;s receipt of the Annual Statement for the year in question;</li>
  <li>Such audit is conducted during normal business hours at Landlord&rsquo;s office or at the office of Landlord&rsquo;s property manager;</li>
  <li>Tenant shall not unreasonably interfere with Landlord&rsquo;s business operations during such audit; and</li>
  <li>The results of such audit shall be kept confidential by Tenant and shall not be disclosed to any other tenant of the Building.</li>
</ol>
<p>If such audit reveals that Landlord overstated Operating Expenses by more than five percent (5%) for any calendar year, Landlord shall reimburse Tenant for the reasonable out-of-pocket costs of such audit in addition to the overpayment, together with interest at the Default Interest Rate from the date of overpayment. If the audit reveals an overstatement of five percent (5%) or less, Tenant shall bear the cost of the audit.</p>
<p><strong>Survival.</strong> The obligations of the Parties under this section shall survive the expiration or earlier termination of this Lease for a period of two (2) years.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.financial.camEnabled', operator: 'equals', value: true },
    ],
    placeholders: [
      'lease.camReconciliationDays',
    ],
    sortOrder: 260,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
