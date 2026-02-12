import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Insurance Clauses — Tenant insurance requirements for Minnesota commercial leases.
 * sortOrder: 550–599
 */
export const commercialInsuranceClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // INSURANCE REQUIREMENTS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-insurance-requirements',
    leaseClass: 'commercial',
    category: 'insurance_commercial',
    title: 'Insurance Requirements',
    description:
      'Requires the tenant to maintain commercial general liability, property, business interruption, and workers compensation insurance, and to name the landlord as an additional insured.',
    htmlContent: `<h3>Insurance Requirements</h3>
<p>Tenant shall, at Tenant&rsquo;s sole cost and expense, obtain and maintain throughout the Term of this Lease (including any Renewal Term) the following insurance coverages, written by insurance companies authorized to do business in the State of Minnesota with an A.M. Best rating of A- VII or better:</p>
<p><strong>(a) Commercial General Liability Insurance.</strong> Commercial general liability insurance on an occurrence basis, including contractual liability, personal injury and advertising injury liability, products and completed operations liability, and fire legal liability, with the following minimum limits:</p>
<ol>
  <li>Each Occurrence: <strong>{{lease.insuranceGLAmount}}</strong>;</li>
  <li>General Aggregate: not less than two (2) times the per occurrence limit;</li>
  <li>Products/Completed Operations Aggregate: not less than the per occurrence limit;</li>
  <li>Personal and Advertising Injury: not less than the per occurrence limit; and</li>
  <li>Fire Legal Liability: not less than $500,000 per occurrence.</li>
</ol>
<p><strong>(b) Property Insurance.</strong> {{lease.insurancePropertyDescription}} Tenant shall maintain &ldquo;all risk&rdquo; or &ldquo;special form&rdquo; property insurance covering all of Tenant&rsquo;s personal property, trade fixtures, inventory, equipment, and leasehold improvements located in or about the Premises, in an amount not less than the full replacement cost thereof. Such policy shall include coverage for fire, vandalism, malicious mischief, sprinkler leakage, and water damage.</p>
<p><strong>(c) Business Interruption Insurance.</strong> {{lease.insuranceBusinessInterruptionDescription}} Business income and extra expense insurance in an amount sufficient to cover Tenant&rsquo;s Rent obligations under this Lease and Tenant&rsquo;s ongoing business expenses for a period of not less than twelve (12) months.</p>
<p><strong>(d) Workers&rsquo; Compensation and Employer&rsquo;s Liability.</strong> {{lease.insuranceWorkersCompDescription}} Workers&rsquo; compensation insurance as required by Minnesota law, and employer&rsquo;s liability insurance with limits of not less than $500,000 per accident, $500,000 per employee for disease, and $500,000 disease policy aggregate.</p>
<p><strong>(e) Additional Insured.</strong> {{lease.insuranceAdditionalInsuredDescription}} Landlord, Landlord&rsquo;s property manager, and Landlord&rsquo;s mortgagee (if any) shall be named as additional insureds on Tenant&rsquo;s commercial general liability insurance policy. Tenant&rsquo;s insurance shall be primary and non-contributory with respect to any insurance carried by Landlord.</p>
<p><strong>Certificates of Insurance.</strong> Prior to the Commencement Date and no less than thirty (30) days prior to the expiration of each policy, Tenant shall deliver to Landlord certificates of insurance evidencing all required coverages, together with endorsements naming Landlord as an additional insured. Each certificate shall provide that the insurer shall give Landlord not less than thirty (30) days&rsquo; prior written notice of cancellation, non-renewal, or material modification of coverage.</p>
<p><strong>Waiver of Subrogation.</strong> Landlord and Tenant each hereby waive any right of subrogation that either Party&rsquo;s insurance carrier may have against the other Party, and each Party shall cause its insurance policies to include a waiver of subrogation endorsement. This waiver shall apply regardless of the cause of the loss, including the negligence of either Party.</p>
<p><strong>Landlord&rsquo;s Insurance.</strong> Landlord shall maintain: (a) property insurance covering the Building (excluding Tenant&rsquo;s property and improvements) in an amount not less than the full replacement cost; (b) commercial general liability insurance with limits of not less than $2,000,000 per occurrence; and (c) such other insurance as Landlord deems necessary or as required by Landlord&rsquo;s lender.</p>
<p><strong>Failure to Maintain.</strong> If Tenant fails to obtain or maintain any insurance required under this Section, Landlord may, but shall not be obligated to, obtain such insurance on Tenant&rsquo;s behalf, and Tenant shall reimburse Landlord for all premiums paid, plus a ten percent (10%) administrative fee, within ten (10) business days after demand.</p>`,
    isRequired: true,
    placeholders: [
      'lease.insuranceGLAmount',
      'lease.insurancePropertyDescription',
      'lease.insuranceBusinessInterruptionDescription',
      'lease.insuranceWorkersCompDescription',
      'lease.insuranceAdditionalInsuredDescription',
    ],
    sortOrder: 550,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
