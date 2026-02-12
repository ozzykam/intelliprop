import type { ClauseDefinition } from '../../../types/leaseBuilder';

export const commercialSignageClauses: ClauseDefinition[] = [
  {
    id: 'comm-signage',
    leaseClass: 'commercial',
    category: 'signage',
    title: 'Signage',
    description: 'Tenant signage rights subject to landlord approval and local ordinances.',
    isRequired: false,
    conditions: [
      { field: 'commercial.useAndBuildout.signageAllowed', operator: 'equals', value: true },
    ],
    placeholders: [],
    sortOrder: 1000,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
    htmlContent: `
<h3>19. SIGNAGE</h3>

<p>Tenant may install signage on or about the Premises, subject to the following conditions:</p>

<ol type="a">
  <li>All signage must receive prior written approval from Landlord, which shall not be unreasonably withheld, conditioned, or delayed.</li>
  <li>All signage must comply with applicable local ordinances, zoning regulations, building codes, and any applicable property association rules.</li>
  <li>Tenant shall obtain all required permits and approvals from governmental authorities at Tenant's sole cost and expense prior to installation.</li>
  <li>Tenant shall be responsible for the installation, maintenance, repair, and removal of all signage, and shall maintain signage in good condition and repair at all times.</li>
  <li>Upon expiration or termination of this Lease, Tenant shall remove all signage and restore the affected areas to their original condition, reasonable wear and tear excepted.</li>
  <li>If Tenant fails to remove signage within fifteen (15) days following lease expiration or termination, Landlord may remove such signage at Tenant's expense.</li>
</ol>
`,
  },
];
