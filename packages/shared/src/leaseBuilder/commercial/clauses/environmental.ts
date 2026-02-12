import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Environmental Clauses — Environmental compliance and hazardous materials indemnity.
 * sortOrder: 850–899
 */
export const commercialEnvironmentalClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // ENVIRONMENTAL COMPLIANCE & HAZMAT INDEMNITY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-environmental',
    leaseClass: 'commercial',
    category: 'environmental',
    title: 'Environmental Compliance & Hazardous Materials Indemnity',
    description:
      'Addresses environmental compliance obligations, restrictions on hazardous materials, remediation responsibilities, and mutual indemnification for environmental contamination. This clause cannot be removed from the lease.',
    htmlContent: `<h3>Environmental Compliance &amp; Hazardous Materials</h3>
<p><strong>Definitions.</strong> As used in this Lease, &ldquo;Hazardous Materials&rdquo; means any substance, material, or waste that is regulated, classified, or defined as hazardous, toxic, radioactive, dangerous, or as a pollutant or contaminant under any federal, state, or local environmental law, regulation, or ordinance (collectively, &ldquo;Environmental Laws&rdquo;), including but not limited to: (a) petroleum and petroleum products, including crude oil and any fractions thereof; (b) asbestos and asbestos-containing materials; (c) polychlorinated biphenyls (PCBs); (d) lead-based paint; (e) radon gas; (f) mold and other biological contaminants at concentrations that pose health risks; and (g) any substance listed under the Comprehensive Environmental Response, Compensation, and Liability Act (CERCLA), the Resource Conservation and Recovery Act (RCRA), the Minnesota Environmental Response and Liability Act (MERLA), or the Minnesota Pollution Control Agency regulations.</p>
<p><strong>Tenant&rsquo;s Obligations.</strong> Tenant shall comply with all Environmental Laws applicable to Tenant&rsquo;s use and occupancy of the Premises. Without limiting the foregoing, Tenant shall not:</p>
<ol>
  <li>Cause or permit the generation, manufacture, production, storage, treatment, disposal, release, or threatened release of any Hazardous Materials in, on, under, or about the Premises, the Building, or the Common Areas;</li>
  <li>Bring or permit to be brought any Hazardous Materials onto the Premises, except for commercially reasonable quantities of standard office and cleaning supplies that are used, stored, and disposed of in accordance with all Environmental Laws and manufacturers&rsquo; instructions; or</li>
  <li>Permit any environmental lien or encumbrance to attach to the Premises or the Building as a result of Tenant&rsquo;s activities.</li>
</ol>
<p><strong>Permitted Hazardous Materials.</strong> Notwithstanding the foregoing, Tenant may use and store on the Premises limited quantities of Hazardous Materials that are customarily used in connection with the Permitted Use (e.g., office supplies, cleaning products, printer toner), provided that: (a) such use and storage comply with all Environmental Laws; (b) Tenant maintains current Material Safety Data Sheets (MSDS) for all such materials; and (c) Tenant provides Landlord with a list of all such materials upon request.</p>
<p><strong>Reporting and Notification.</strong> Tenant shall immediately notify Landlord of:</p>
<ol>
  <li>Any release, spill, or discharge of Hazardous Materials in, on, under, or about the Premises or the Building;</li>
  <li>Any notice of violation, investigation, enforcement action, or proceeding by any governmental authority relating to Hazardous Materials affecting the Premises;</li>
  <li>Any environmental condition that could give rise to liability under Environmental Laws; and</li>
  <li>Any claim or demand by any third party relating to environmental contamination of the Premises.</li>
</ol>
<p><strong>Remediation.</strong> If any Hazardous Materials contamination is caused by Tenant or Tenant&rsquo;s employees, agents, contractors, customers, or invitees, Tenant shall, at Tenant&rsquo;s sole cost and expense, promptly investigate, remediate, and restore the Premises and any affected property to a condition that satisfies all applicable Environmental Laws and applicable cleanup standards established by the Minnesota Pollution Control Agency. All remediation activities shall be conducted under the supervision of a qualified environmental consultant approved by Landlord and in compliance with all Environmental Laws.</p>
<p><strong>Landlord&rsquo;s Representation.</strong> Landlord represents that, to Landlord&rsquo;s actual knowledge as of the Effective Date, and except as disclosed in any environmental reports previously provided to Tenant: (a) no Hazardous Materials have been released, stored, or disposed of on the Premises or the Building in violation of Environmental Laws; and (b) Landlord has not received any notice of violation from any governmental authority regarding Hazardous Materials affecting the Premises.</p>
<p><strong>Environmental Indemnification.</strong></p>
<ol>
  <li><strong>Tenant&rsquo;s Indemnification.</strong> Tenant shall indemnify, defend, and hold harmless the Landlord Indemnified Parties from and against any and all Claims, losses, damages, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees, expert witness fees, and remediation costs) arising from or related to: (a) the presence, use, storage, generation, release, or disposal of any Hazardous Materials by Tenant or Tenant&rsquo;s employees, agents, contractors, customers, or invitees; (b) any violation of Environmental Laws by Tenant; or (c) any breach of Tenant&rsquo;s obligations under this Section.</li>
  <li><strong>Landlord&rsquo;s Indemnification.</strong> Landlord shall indemnify, defend, and hold harmless Tenant from and against any and all Claims, losses, damages, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising from or related to the presence of Hazardous Materials on the Premises or the Building that existed prior to the Commencement Date or that were introduced by Landlord or Landlord&rsquo;s agents after the Commencement Date.</li>
</ol>
<p><strong>Survival.</strong> The obligations, indemnities, and representations set forth in this Section shall survive the expiration or earlier termination of this Lease without limitation.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 850,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
