import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Renters Insurance Clauses — Required and recommended insurance options.
 * sortOrder: 700–749
 */
export const residentialInsuranceClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // RENTERS INSURANCE REQUIRED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-insurance-required',
    leaseClass: 'residential',
    category: 'renter_insurance',
    title: 'Renters Insurance — Required',
    description:
      'Requires the tenant to obtain and maintain a renters insurance policy for the duration of the lease, with specified minimum coverage and landlord named as interested party.',
    htmlContent: `<h3>Renters Insurance &mdash; Required</h3>
<p>Tenant shall obtain and maintain, at Tenant&rsquo;s sole expense, a renters insurance policy (&ldquo;Renters Insurance&rdquo;) for the duration of the Lease Term. The Renters Insurance policy shall meet the following minimum requirements:</p>
<ol>
  <li><strong>Minimum Personal Property Coverage:</strong> {{lease.insuranceMinCoverage}}</li>
  <li><strong>Personal Liability Coverage:</strong> A minimum of $100,000 per occurrence;</li>
  <li><strong>Additional Interested Party:</strong> The policy shall name Landlord, <strong>{{landlord.name}}</strong>, as an additional interested party (not additional insured) so that Landlord receives notice of cancellation or non-renewal; and</li>
  <li><strong>Policy Term:</strong> The policy shall be effective on or before the Commencement Date and shall remain in force throughout the entire Lease Term and any renewal or holdover period.</li>
</ol>
<p><strong>Proof of Insurance.</strong> Tenant shall provide Landlord with a copy of the declarations page or certificate of insurance prior to taking possession of the Premises. Tenant shall provide updated proof of insurance upon each renewal of the policy and within ten (10) days of Landlord&rsquo;s written request.</p>
<p><strong>Failure to Maintain Insurance.</strong> If Tenant fails to obtain or maintain the required Renters Insurance, Landlord may, at Landlord&rsquo;s option:</p>
<ol>
  <li>Provide Tenant with written notice of the deficiency and a reasonable cure period of not less than fourteen (14) days;</li>
  <li>If the deficiency is not cured, treat the failure as a material breach of this Lease; or</li>
  <li>Obtain a policy on Tenant&rsquo;s behalf and charge the premium to Tenant as additional rent.</li>
</ol>
<p><strong>Landlord&rsquo;s Insurance.</strong> Landlord maintains insurance on the building structure but does <strong>not</strong> insure Tenant&rsquo;s personal property, belongings, or liability. Tenant acknowledges that Landlord&rsquo;s insurance does not cover Tenant&rsquo;s losses and that Renters Insurance is the sole means of protecting Tenant&rsquo;s personal property and liability exposure.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.rentersInsuranceRequired',
        operator: 'equals',
        value: true,
      },
    ],
    placeholders: ['lease.insuranceMinCoverage', 'landlord.name'],
    sortOrder: 700,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RENTERS INSURANCE RECOMMENDED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-insurance-recommended',
    leaseClass: 'residential',
    category: 'renter_insurance',
    title: 'Renters Insurance — Recommended',
    description:
      "Recommends but does not require the tenant to obtain renters insurance. Includes a disclaimer that the landlord's insurance does not cover tenant property.",
    htmlContent: `<h3>Renters Insurance &mdash; Recommended</h3>
<p>Landlord <strong>strongly recommends</strong> that Tenant obtain a renters insurance policy to protect Tenant&rsquo;s personal property and to provide personal liability coverage during the Lease Term.</p>
<p><strong>Landlord&rsquo;s Insurance Disclaimer.</strong> Tenant acknowledges and agrees that:</p>
<ol>
  <li>Landlord maintains insurance on the building structure but does <strong>not</strong> insure Tenant&rsquo;s personal property, belongings, furniture, electronics, clothing, or any other items of personal property;</li>
  <li>Landlord&rsquo;s insurance does <strong>not</strong> cover Tenant&rsquo;s liability for injury to persons or damage to the property of others;</li>
  <li>Landlord shall <strong>not</strong> be liable for any loss of or damage to Tenant&rsquo;s personal property caused by fire, theft, water damage, plumbing failure, vandalism, acts of God, or any other cause, except to the extent caused by Landlord&rsquo;s willful misconduct or gross negligence; and</li>
  <li>Tenant assumes all risk of loss for Tenant&rsquo;s personal property located on the Premises.</li>
</ol>
<p>A renters insurance policy typically provides coverage for personal property loss, temporary living expenses if the unit becomes uninhabitable, and personal liability protection. Tenants are encouraged to consult with an insurance agent regarding appropriate coverage levels.</p>
<p>By signing this Lease, Tenant acknowledges that Tenant has been informed of the importance of obtaining renters insurance and has chosen not to make it a requirement of this Lease.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.rentersInsuranceRequired',
        operator: 'equals',
        value: false,
      },
    ],
    placeholders: [],
    sortOrder: 700,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
