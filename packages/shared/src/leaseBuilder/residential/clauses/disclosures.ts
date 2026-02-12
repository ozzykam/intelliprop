import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Required Disclosures — Lead paint, bed bugs, domestic violence notice.
 * sortOrder: 1000–1099
 */
export const residentialDisclosureClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // LEAD-BASED PAINT DISCLOSURE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-disclosure-lead-paint',
    leaseClass: 'residential',
    category: 'disclosure',
    title: 'Lead-Based Paint Disclosure',
    description:
      'Required EPA lead-based paint disclosure for properties built before 1978. Informs the tenant of known lead-based paint hazards and provides the federally required pamphlet.',
    htmlContent: `<h3>Lead-Based Paint Disclosure</h3>
<p><strong>IMPORTANT DISCLOSURE &mdash; PLEASE READ CAREFULLY</strong></p>
<p>This disclosure is required by federal law (42 U.S.C. &sect; 4852d) and the Residential Lead-Based Paint Hazard Reduction Act of 1992 (Title X, Section 1018) for housing built before 1978.</p>
<p><strong>Property Address:</strong> {{property.address}}, Unit {{unit.number}}</p>
<p><strong>Year Built:</strong> {{property.yearBuilt}}</p>
<p><strong>Landlord&rsquo;s Disclosure (check one):</strong></p>
<ol type="a">
  <li>_____ Landlord has knowledge of lead-based paint and/or lead-based paint hazards in the housing. Explain: ________________________________________</li>
  <li>_____ Landlord has no knowledge of lead-based paint and/or lead-based paint hazards in the housing.</li>
</ol>
<p><strong>Records and Reports (check one):</strong></p>
<ol type="a">
  <li>_____ Landlord has provided Tenant with all available records and reports pertaining to lead-based paint and/or lead-based paint hazards in the housing. List documents: ________________________________________</li>
  <li>_____ Landlord has no reports or records pertaining to lead-based paint and/or lead-based paint hazards in the housing.</li>
</ol>
<p><strong>Tenant&rsquo;s Acknowledgment:</strong></p>
<ol>
  <li>Tenant has received the pamphlet &ldquo;Protect Your Family From Lead in Your Home&rdquo; published by the U.S. Environmental Protection Agency (EPA).</li>
  <li>Tenant has received the Landlord&rsquo;s disclosure above regarding known lead-based paint and/or lead-based paint hazards.</li>
  <li>Tenant has received all available records and reports, if any, regarding lead-based paint and/or lead-based paint hazards in the housing.</li>
  <li>Tenant has had a ten (10) day opportunity (or a mutually agreed-upon period) to conduct a risk assessment or inspection for the presence of lead-based paint and/or lead-based paint hazards.</li>
</ol>
<p><strong>Agent&rsquo;s Acknowledgment (if applicable):</strong> Agent has informed Landlord of Landlord&rsquo;s obligations under 42 U.S.C. &sect; 4852d and is aware of Agent&rsquo;s responsibility to ensure compliance.</p>
<p><strong>Certification of Accuracy.</strong> The following parties have reviewed the information above and certify, to the best of their knowledge, that the information provided is true and accurate.</p>
<p>Landlord Signature: ___________________________________ Date: _______________</p>
<p>Tenant Signature: ___________________________________ Date: _______________</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'propertyProfile.yearBuilt',
        operator: 'lt',
        value: 1978,
      },
    ],
    placeholders: [
      'property.address',
      'unit.number',
      'property.yearBuilt',
    ],
    sortOrder: 1000,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BED BUG DISCLOSURE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-disclosure-bed-bugs',
    leaseClass: 'residential',
    category: 'disclosure',
    title: 'Bed Bug Disclosure',
    description:
      'Required Minnesota disclosure regarding bed bug history and prevention, as mandated by Minnesota Statutes section 504B.161.',
    htmlContent: `<h3>Bed Bug Disclosure</h3>
<p><strong>IMPORTANT DISCLOSURE &mdash; PLEASE READ CAREFULLY</strong></p>
<p>This disclosure is provided in accordance with Minnesota Statutes &sect; 504B.161 regarding bed bug infestations in rental housing.</p>
<p><strong>Landlord&rsquo;s Disclosure:</strong></p>
<p>To the best of Landlord&rsquo;s knowledge, the following is the bed bug history of the Premises and the building in which the Premises are located:</p>
<ol type="a">
  <li>_____ There is no known bed bug infestation history in the Premises or the building within the last twelve (12) months.</li>
  <li>_____ The Premises and/or building had a bed bug infestation within the last twelve (12) months that has been treated. Date of last treatment: _______________. Treatment was performed by: _______________.</li>
  <li>_____ There is a current bed bug infestation that is being treated. Estimated remediation timeline: _______________.</li>
</ol>
<p><strong>Tenant&rsquo;s Obligations:</strong></p>
<ol>
  <li>Tenant shall promptly notify Landlord in writing upon discovering or suspecting a bed bug infestation in the Premises.</li>
  <li>Tenant shall cooperate with Landlord&rsquo;s pest control efforts, including but not limited to preparing the Premises for treatment as directed by the pest control provider, laundering bedding and clothing, and allowing access for inspection and treatment.</li>
  <li>Tenant shall not introduce used furniture, mattresses, or bedding into the Premises without taking reasonable precautions to inspect for bed bugs.</li>
  <li>Tenant shall not treat a bed bug infestation independently using over-the-counter pesticides or home remedies without Landlord&rsquo;s knowledge and consent.</li>
</ol>
<p><strong>Landlord&rsquo;s Obligations:</strong></p>
<ol>
  <li>Landlord shall respond promptly to reports of bed bug infestations and arrange for professional inspection and treatment within a reasonable time.</li>
  <li>Landlord shall bear the cost of bed bug treatment, except where the infestation is attributable to Tenant&rsquo;s actions or negligence.</li>
  <li>Landlord shall provide Tenant with information about bed bug prevention and identification upon request.</li>
</ol>
<p><strong>Tenant&rsquo;s Acknowledgment.</strong> By signing below, Tenant acknowledges receipt of this disclosure and understands Tenant&rsquo;s obligation to promptly report any suspected bed bug activity.</p>
<p>Tenant Signature: ___________________________________ Date: _______________</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 1010,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DOMESTIC VIOLENCE EARLY TERMINATION NOTICE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-disclosure-dv-notice',
    leaseClass: 'residential',
    category: 'disclosure',
    title: 'Domestic Violence Early Termination Rights',
    description:
      'Required Minnesota disclosure informing tenants of their right to early lease termination due to domestic violence, sexual assault, or stalking under Minnesota Statutes section 504B.206.',
    htmlContent: `<h3>Tenant Rights Under Minnesota Domestic Violence Statutes</h3>
<p><strong>IMPORTANT NOTICE OF TENANT RIGHTS</strong></p>
<p>In accordance with Minnesota Statutes &sect; 504B.206, Tenant is hereby informed of the following rights:</p>
<p><strong>Right to Early Termination.</strong> A tenant who is a victim of domestic violence, sexual assault, or stalking (as defined by Minnesota law) may terminate a residential lease without penalty or liability for future rent by providing written notice to Landlord. The following conditions apply:</p>
<ol>
  <li><strong>Written Notice:</strong> Tenant shall provide Landlord with written notice of the intent to terminate the lease, accompanied by one of the following forms of documentation:
    <ol type="a">
      <li>A valid Order for Protection issued under Minnesota Statutes Chapter 518B;</li>
      <li>A no-contact order currently in effect;</li>
      <li>A court record relating to the domestic violence, sexual assault, or stalking; or</li>
      <li>A written verification from a qualified third party (as defined in Minnesota Statutes &sect; 504B.206, subd. 1(g)) confirming that the tenant or a member of the tenant&rsquo;s household has been a victim of domestic violence, sexual assault, or stalking.</li>
    </ol>
  </li>
  <li><strong>Effective Date:</strong> The lease terminates on the date specified in the notice or on the date that is one full month after the date of the notice, whichever is later. Tenant shall vacate the Premises by the termination date.</li>
  <li><strong>Rent Obligation:</strong> Tenant is responsible for rent through the effective termination date. Tenant is not liable for any rent or other charges accruing after the termination date.</li>
  <li><strong>Security Deposit:</strong> The Security Deposit shall be returned to Tenant in accordance with Minnesota Statutes &sect; 504B.178, less any lawful deductions.</li>
  <li><strong>Confidentiality:</strong> Landlord shall keep confidential any information provided by Tenant in connection with an early termination under this provision, except as required by law or court order.</li>
</ol>
<p><strong>No Retaliation.</strong> Landlord shall not retaliate against Tenant for exercising rights under Minnesota Statutes &sect; 504B.206. Retaliation is prohibited under Minnesota Statutes &sect; 504B.441.</p>
<p><strong>Lock Change.</strong> A tenant who is a victim of domestic violence may request that Landlord change the locks on the Premises. Landlord shall comply with a lock change request within a reasonable time.</p>
<p><strong>Resources.</strong> Tenants who are experiencing domestic violence, sexual assault, or stalking may contact:</p>
<ol>
  <li>Day One Crisis Hotline: 1-866-223-1111</li>
  <li>National Domestic Violence Hotline: 1-800-799-7233</li>
  <li>Local law enforcement: 911</li>
</ol>
<p><strong>Tenant&rsquo;s Acknowledgment.</strong> By signing this Lease, Tenant acknowledges receipt of this notice and awareness of Tenant&rsquo;s rights under Minnesota Statutes &sect; 504B.206.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 1020,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
