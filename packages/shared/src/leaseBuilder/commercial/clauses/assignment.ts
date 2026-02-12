import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Assignment & Subletting Clauses — Rules governing assignment and subletting of the lease.
 * sortOrder: 650–699
 */
export const commercialAssignmentClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // ASSIGNMENT & SUBLETTING
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-assignment-subletting',
    leaseClass: 'commercial',
    category: 'assignment',
    title: 'Assignment & Subletting',
    description:
      'Governs the conditions under which Tenant may assign the lease or sublet the premises, including consent standards, recapture rights, and profit sharing requirements.',
    htmlContent: `<h3>Assignment &amp; Subletting</h3>
<p><strong>Restriction.</strong> Tenant shall not assign, transfer, mortgage, pledge, hypothecate, or encumber this Lease or any interest herein, nor sublet the Premises or any part thereof, nor permit the use or occupancy of the Premises by any party other than Tenant (each, a &ldquo;Transfer&rdquo;), without the prior written consent of Landlord. Any Transfer made without Landlord&rsquo;s prior written consent shall be void and of no force or effect, and shall constitute a material default under this Lease.</p>
<p><strong>Consent Standard.</strong> Landlord&rsquo;s consent to any proposed Transfer shall be at Landlord&rsquo;s <strong>{{lease.assignmentConsentStandard}}</strong> discretion. {{lease.assignmentConsentStandardDescription}}</p>
<p><strong>Request for Consent.</strong> If Tenant desires to effect a Transfer, Tenant shall deliver to Landlord written notice (the &ldquo;Transfer Notice&rdquo;) at least sixty (60) days prior to the proposed effective date of the Transfer, together with the following information:</p>
<ol>
  <li>The name, address, and nature of business of the proposed assignee or subtenant (the &ldquo;Transferee&rdquo;);</li>
  <li>Reasonably satisfactory evidence of the Transferee&rsquo;s financial condition, including audited financial statements for the most recent three (3) fiscal years;</li>
  <li>A description of the Transferee&rsquo;s intended use of the Premises;</li>
  <li>The proposed terms and conditions of the Transfer, including a copy of the proposed assignment or sublease agreement;</li>
  <li>All consideration to be received by Tenant in connection with the Transfer; and</li>
  <li>Such other information as Landlord may reasonably request.</li>
</ol>
<p><strong>Landlord&rsquo;s Options.</strong> Within thirty (30) days after receipt of a complete Transfer Notice and all required information, Landlord shall, by written notice to Tenant, elect one of the following:</p>
<ol>
  <li>Consent to the proposed Transfer, subject to such reasonable conditions as Landlord may impose;</li>
  <li>Refuse to consent to the proposed Transfer (with reasons, if consent is subject to a reasonableness standard); or</li>
  <li>{{lease.recaptureRightsDescription}}</li>
</ol>
<p><strong>Profit Sharing.</strong> {{lease.sublettingProfitShareDescription}} If the rent or other consideration payable by the Transferee under any approved Transfer exceeds the Rent payable by Tenant under this Lease (after deducting Tenant&rsquo;s reasonable costs of effecting the Transfer, including brokerage commissions, legal fees, tenant improvement costs, and any free rent period), Tenant shall pay to Landlord <strong>{{lease.sublettingProfitSharePercent}}%</strong> of such excess as and when received by Tenant.</p>
<p><strong>Conditions of Consent.</strong> Any consent by Landlord to a Transfer shall be subject to the following conditions:</p>
<ol>
  <li>The Transferee shall assume in writing all obligations of Tenant under this Lease (in the case of an assignment) or agree to be bound by all applicable terms of this Lease (in the case of a sublease);</li>
  <li>Tenant shall remain primarily liable for the performance of all obligations under this Lease, including the payment of all Rent, notwithstanding any Transfer;</li>
  <li>The Transferee shall use the Premises only for the Permitted Use;</li>
  <li>Landlord&rsquo;s consent to one Transfer shall not constitute consent to any subsequent Transfer;</li>
  <li>No Transfer shall release or modify any guaranty of this Lease; and</li>
  <li>Tenant shall pay Landlord&rsquo;s reasonable out-of-pocket costs and attorneys&rsquo; fees incurred in connection with reviewing and processing the Transfer request, not to exceed $5,000.</li>
</ol>
<p><strong>Permitted Transfers.</strong> Notwithstanding the foregoing, Tenant may, without Landlord&rsquo;s consent but upon at least thirty (30) days&rsquo; prior written notice to Landlord, effect a Transfer to: (a) an affiliate or subsidiary of Tenant that controls, is controlled by, or is under common control with Tenant; or (b) any entity that acquires all or substantially all of Tenant&rsquo;s assets or equity interests, or any entity into which Tenant is merged or consolidated, provided that in each case the Transferee has a tangible net worth at least equal to Tenant&rsquo;s tangible net worth as of the date of this Lease and assumes all obligations of Tenant under this Lease (each, a &ldquo;Permitted Transfer&rdquo;).</p>`,
    isRequired: true,
    placeholders: [
      'lease.assignmentConsentStandard',
      'lease.assignmentConsentStandardDescription',
      'lease.recaptureRightsDescription',
      'lease.sublettingProfitShareDescription',
      'lease.sublettingProfitSharePercent',
    ],
    sortOrder: 650,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
