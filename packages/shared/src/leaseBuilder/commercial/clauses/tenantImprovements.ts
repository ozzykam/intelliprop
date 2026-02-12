import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Tenant Improvement Clauses — As-is acceptance, TI allowance, and work letter references.
 * sortOrder: 400–449
 */
export const commercialTiClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PREMISES ACCEPTED AS-IS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-ti-as-is',
    leaseClass: 'commercial',
    category: 'tenant_improvements',
    title: 'Premises Accepted As-Is',
    description:
      'Tenant accepts the premises in their current condition without any obligation on Landlord to perform improvements, alterations, or repairs prior to or after delivery of possession.',
    htmlContent: `<h3>Condition of Premises &mdash; Accepted As-Is</h3>
<p>Tenant acknowledges that Tenant has had the opportunity to inspect the Premises and is familiar with the physical condition thereof. Tenant accepts the Premises in their present &ldquo;AS-IS, WHERE-IS&rdquo; condition, with all faults and without any representations or warranties by Landlord, express or implied, regarding the condition, suitability, or fitness of the Premises for the Permitted Use or for any other purpose.</p>
<p>Landlord shall have no obligation to perform any improvements, alterations, decorations, or repairs to the Premises to prepare the Premises for Tenant&rsquo;s occupancy, except as may be expressly set forth in this Lease.</p>
<p>Tenant acknowledges and agrees that:</p>
<ol>
  <li>Landlord has made no representations or warranties regarding the condition of the Premises, the Building, or any systems serving the Premises, including but not limited to HVAC, plumbing, electrical, structural, or roofing systems;</li>
  <li>Tenant has not relied upon any statement, representation, or warranty by Landlord or Landlord&rsquo;s agents regarding the Premises;</li>
  <li>Tenant assumes all responsibility for the condition of the Premises and for making any alterations, improvements, or repairs necessary for Tenant&rsquo;s Permitted Use, subject to Landlord&rsquo;s prior written approval as required by this Lease; and</li>
  <li>Any improvements or alterations made by Tenant to the Premises shall be performed in accordance with the alteration provisions of this Lease.</li>
</ol>
<p>Notwithstanding the foregoing, Landlord represents that, as of the Commencement Date: (a) the Building&rsquo;s structural elements and roof are in good working condition; (b) the Building&rsquo;s mechanical, electrical, and plumbing systems serving the Premises are in good working order; and (c) the Premises comply with all applicable building codes and regulations in effect as of the date of original construction or most recent renovation.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.useAndBuildout.premisesCondition', operator: 'equals', value: 'as_is' },
    ],
    placeholders: [],
    sortOrder: 400,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TENANT IMPROVEMENT ALLOWANCE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-ti-allowance',
    leaseClass: 'commercial',
    category: 'tenant_improvements',
    title: 'Tenant Improvement Allowance',
    description:
      'Provides a dollar-per-square-foot or lump sum allowance from Landlord toward the cost of tenant improvements, with defined scope, disbursement procedures, and conditions.',
    htmlContent: `<h3>Tenant Improvement Allowance</h3>
<p>Landlord shall provide Tenant with a tenant improvement allowance in the amount of <strong>{{lease.tiAllowance}}</strong> (the &ldquo;TI Allowance&rdquo;) to be applied toward the cost of designing, permitting, and constructing improvements to the Premises in accordance with plans and specifications approved by Landlord (the &ldquo;Tenant Improvements&rdquo;).</p>
<p><strong>Scope of Allowance.</strong> The TI Allowance may be applied toward the following costs:</p>
<ol>
  <li>{{lease.tiAllowanceScopeDescription}}</li>
  <li>Architectural and engineering design fees directly related to the Tenant Improvements;</li>
  <li>Building permit and inspection fees; and</li>
  <li>Construction management fees, if applicable, not to exceed five percent (5%) of hard construction costs.</li>
</ol>
<p><strong>Plans and Approval.</strong> Prior to commencing any Tenant Improvements, Tenant shall submit to Landlord for approval detailed plans and specifications (the &ldquo;Plans&rdquo;) prepared by a licensed architect or engineer. Landlord shall approve or disapprove the Plans, or request modifications, within fifteen (15) business days after receipt thereof. Landlord&rsquo;s approval shall not be unreasonably withheld, conditioned, or delayed, provided the Plans comply with all Applicable Laws and do not adversely affect the structural integrity, mechanical systems, or exterior appearance of the Building.</p>
<p><strong>Disbursement.</strong> The TI Allowance shall be disbursed by Landlord to Tenant (or, at Landlord&rsquo;s election, directly to Tenant&rsquo;s contractors) upon completion of the Tenant Improvements and satisfaction of all of the following conditions:</p>
<ol>
  <li>Tenant has provided Landlord with paid invoices, lien waivers from all contractors and subcontractors, and evidence of final inspection approval from the applicable governmental authority;</li>
  <li>The Tenant Improvements have been completed in substantial conformance with the approved Plans;</li>
  <li>No default by Tenant exists under this Lease; and</li>
  <li>Tenant has provided Landlord with a certificate of occupancy or equivalent approval, if required.</li>
</ol>
<p><strong>Unused Allowance.</strong> {{lease.tiUnusedPolicyDescription}} The TI Allowance must be fully utilized within twelve (12) months after the Commencement Date. Any portion of the TI Allowance not utilized within such period shall be forfeited by Tenant and retained by Landlord.</p>
<p><strong>Excess Costs.</strong> Any costs of the Tenant Improvements in excess of the TI Allowance shall be the sole responsibility of Tenant and shall be paid by Tenant directly to its contractors.</p>
<p><strong>Ownership.</strong> All Tenant Improvements constructed using the TI Allowance shall become the property of Landlord upon installation and shall remain in the Premises upon the expiration or earlier termination of this Lease, unless Landlord elects to require Tenant to remove specific improvements as provided elsewhere in this Lease.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.useAndBuildout.tiType', operator: 'equals', value: 'landlord_allowance' },
    ],
    placeholders: [
      'lease.tiAllowance',
      'lease.tiAllowanceScopeDescription',
      'lease.tiUnusedPolicyDescription',
    ],
    sortOrder: 410,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORK LETTER REFERENCE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-ti-work-letter-ref',
    leaseClass: 'commercial',
    category: 'tenant_improvements',
    title: 'Work Letter Reference',
    description:
      'References the work letter attached as an exhibit to the lease, which details the scope of landlord and tenant improvement obligations, construction procedures, and completion requirements.',
    htmlContent: `<h3>Work Letter</h3>
<p>The construction, design, and installation of Tenant Improvements to the Premises shall be governed by the Work Letter Agreement attached hereto as <strong>Exhibit C</strong> and incorporated herein by reference (the &ldquo;Work Letter&rdquo;).</p>
<p>The Work Letter sets forth, among other things:</p>
<ol>
  <li>The scope of work to be performed by Landlord and Tenant, respectively;</li>
  <li>The design and approval process for plans and specifications;</li>
  <li>The construction schedule, milestones, and completion deadlines;</li>
  <li>Responsibility for obtaining all required permits, licenses, and governmental approvals;</li>
  <li>Insurance, indemnification, and lien waiver requirements during construction;</li>
  <li>Procedures for change orders and cost overruns;</li>
  <li>Conditions for substantial completion and delivery of the Premises; and</li>
  <li>Remedies for delays, defects, or non-performance.</li>
</ol>
<p>In the event of any conflict between the terms of this Lease and the terms of the Work Letter, the terms of the Work Letter shall control with respect to the construction and completion of the Tenant Improvements, and the terms of this Lease shall control with respect to all other matters.</p>
<p>Tenant shall discharge or bond over any mechanic&rsquo;s lien filed against the Premises or the Building as a result of Tenant&rsquo;s Improvements within <strong>{{lease.workLetterLienDischargeDays}}</strong> days after Tenant receives notice of such lien. If Tenant fails to discharge or bond over such lien within such period, Landlord may do so at Tenant&rsquo;s expense, and Tenant shall reimburse Landlord for all costs incurred, including reasonable attorney&rsquo;s fees, within ten (10) business days after demand.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.useAndBuildout.tiType', operator: 'equals', value: 'work_letter' },
    ],
    placeholders: [
      'lease.workLetterLienDischargeDays',
    ],
    sortOrder: 420,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
