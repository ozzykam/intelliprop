import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * ADA Compliance Clauses — Americans with Disabilities Act compliance responsibilities.
 * sortOrder: 900–949
 */
export const commercialAdaClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // ADA COMPLIANCE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-ada',
    leaseClass: 'commercial',
    category: 'ada',
    title: 'ADA Compliance',
    description:
      'Allocates responsibility for compliance with the Americans with Disabilities Act (ADA) and related accessibility requirements between Landlord and Tenant.',
    htmlContent: `<h3>ADA Compliance</h3>
<p><strong>General Obligation.</strong> The Parties acknowledge their respective obligations to comply with the Americans with Disabilities Act of 1990, as amended, and all regulations and guidelines promulgated thereunder (collectively, the &ldquo;ADA&rdquo;), as well as the Minnesota Human Rights Act (Minnesota Statutes Chapter 363A), the Minnesota Building Code, and all other applicable federal, state, and local accessibility laws, codes, and regulations (collectively, &ldquo;Accessibility Laws&rdquo;).</p>
<p><strong>Allocation of Responsibility.</strong> {{lease.adaResponsibilityDescription}}</p>
<p><strong>Landlord&rsquo;s ADA Obligations.</strong> Landlord shall be responsible for ensuring that the following areas comply with Accessibility Laws:</p>
<ol>
  <li>The Common Areas of the Building, including lobbies, corridors, elevators, stairways, restrooms, parking areas, and building entrances;</li>
  <li>The structural and base building elements of the Premises as they existed on the Commencement Date; and</li>
  <li>Any alterations, modifications, or improvements to the Common Areas or base building elements performed by or on behalf of Landlord after the Commencement Date.</li>
</ol>
<p><strong>Tenant&rsquo;s ADA Obligations.</strong> Tenant shall be responsible for ensuring that the following comply with Accessibility Laws:</p>
<ol>
  <li>Tenant&rsquo;s specific use of the Premises, including ensuring that Tenant&rsquo;s business operations, services, and facilities are accessible to persons with disabilities;</li>
  <li>All Tenant Improvements, alterations, modifications, and installations within the Premises performed by or on behalf of Tenant;</li>
  <li>All signage, fixtures, furnishings, and equipment installed by or on behalf of Tenant;</li>
  <li>Any modifications to the Premises required to accommodate the specific needs of Tenant&rsquo;s employees, customers, or invitees; and</li>
  <li>Compliance with all ADA requirements related to Tenant&rsquo;s status as a &ldquo;place of public accommodation&rdquo; under Title III of the ADA, if applicable.</li>
</ol>
<p><strong>Tenant Alterations.</strong> Prior to commencing any alterations, improvements, or modifications to the Premises, Tenant shall ensure that such work complies with all Accessibility Laws, including current ADA Standards for Accessible Design. Tenant shall submit evidence of ADA compliance with any plans submitted to Landlord for approval.</p>
<p><strong>Notice and Cooperation.</strong> Each Party shall promptly notify the other Party of:</p>
<ol>
  <li>Any claim, demand, or allegation of non-compliance with Accessibility Laws affecting the Premises, the Building, or the Common Areas;</li>
  <li>Any notice, order, or directive from any governmental authority requiring modifications for ADA compliance; and</li>
  <li>Any lawsuit, administrative proceeding, or investigation relating to accessibility at the Premises or the Building.</li>
</ol>
<p>The Parties shall cooperate in good faith to address any accessibility issues and to implement any modifications necessary for compliance with Accessibility Laws.</p>
<p><strong>Indemnification.</strong> Each Party shall indemnify, defend, and hold harmless the other Party from and against all Claims, losses, damages, costs, and expenses (including reasonable attorneys&rsquo; fees) arising from or related to the indemnifying Party&rsquo;s failure to comply with its ADA obligations under this Section.</p>
<p><strong>No Representation.</strong> Landlord makes no representation or warranty that the Premises or the Building currently comply with all Accessibility Laws. Tenant is encouraged to conduct its own inspection and assessment of ADA compliance prior to the Commencement Date.</p>`,
    isRequired: true,
    placeholders: [
      'lease.adaResponsibilityDescription',
    ],
    sortOrder: 900,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
