import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Maintenance Clauses — Landlord and tenant maintenance responsibilities.
 * sortOrder: 450–499
 */
export const commercialMaintenanceClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // MAINTENANCE RESPONSIBILITIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-maintenance-split',
    leaseClass: 'commercial',
    category: 'maintenance',
    title: 'Maintenance Responsibilities',
    description:
      'Defines the allocation of maintenance, repair, and replacement responsibilities between Landlord and Tenant for various building components and systems.',
    htmlContent: `<h3>Maintenance, Repairs &amp; Replacements</h3>
<p><strong>Landlord&rsquo;s Maintenance Obligations.</strong> Landlord shall, at Landlord&rsquo;s sole cost and expense (except to the extent included in Operating Expenses as provided elsewhere in this Lease), maintain, repair, and replace as necessary the following components of the Building and Premises:</p>
<ol>
  <li>{{landlord.maintenanceItems}}</li>
</ol>
<p>Landlord shall perform all maintenance and repairs in a good and workmanlike manner, in compliance with all Applicable Laws, and in a manner that minimizes unreasonable interference with Tenant&rsquo;s business operations. Except in the case of emergencies, Landlord shall provide Tenant with reasonable advance notice before entering the Premises to perform maintenance or repairs.</p>
<p><strong>Tenant&rsquo;s Maintenance Obligations.</strong> Tenant shall, at Tenant&rsquo;s sole cost and expense, maintain, repair, and replace as necessary the following components of the Premises:</p>
<ol>
  <li>{{tenant.maintenanceItems}}</li>
</ol>
<p>Tenant shall maintain the Premises and all Tenant-maintained components in good condition and repair, ordinary wear and tear excepted. All maintenance, repairs, and replacements performed by Tenant shall be:</p>
<ol>
  <li>Performed in a good and workmanlike manner using materials of equal or better quality than those originally installed;</li>
  <li>Performed in compliance with all Applicable Laws and the terms of this Lease;</li>
  <li>Performed by contractors reasonably approved by Landlord (such approval not to be unreasonably withheld); and</li>
  <li>Completed promptly after the need for such maintenance, repair, or replacement becomes apparent.</li>
</ol>
<p><strong>HVAC Maintenance.</strong> If HVAC systems are designated as a Tenant maintenance responsibility, Tenant shall, at a minimum, maintain a preventive maintenance contract with a licensed HVAC contractor approved by Landlord, providing for inspection and servicing of all HVAC equipment serving the Premises no less frequently than quarterly. Tenant shall provide Landlord with a copy of such maintenance contract and all service reports upon request.</p>
<p><strong>Landlord&rsquo;s Right to Perform.</strong> If Tenant fails to perform any maintenance, repair, or replacement required under this Section within fifteen (15) days after written notice from Landlord (or such shorter period as may be necessary in the event of an emergency or a condition that poses a threat to health, safety, or property), Landlord may, but shall not be obligated to, perform such maintenance, repair, or replacement on Tenant&rsquo;s behalf, and Tenant shall reimburse Landlord for all costs incurred, plus a ten percent (10%) administrative fee, within ten (10) business days after receipt of an invoice therefor.</p>
<p><strong>Damage Caused by Tenant.</strong> Notwithstanding any other provision of this Lease, Tenant shall be responsible for the cost of repairing any damage to the Premises, the Building, or the Common Areas caused by the acts or omissions of Tenant, its employees, agents, contractors, customers, or invitees, regardless of whether the damaged component is otherwise designated as a Landlord maintenance responsibility.</p>
<p><strong>Surrender Condition.</strong> Upon the expiration or earlier termination of this Lease, Tenant shall surrender the Premises to Landlord in good condition and repair, ordinary wear and tear and casualty damage (to the extent covered by insurance) excepted, broom clean, free of all personal property, trade fixtures (unless Landlord elects to retain same), and debris.</p>`,
    isRequired: true,
    placeholders: [
      'landlord.maintenanceItems',
      'tenant.maintenanceItems',
    ],
    sortOrder: 450,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FLOOR LOAD
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-floor-load',
    leaseClass: 'commercial',
    category: 'maintenance',
    title: 'Floor Load',
    description:
      'Prohibits Tenant from overloading floors beyond rated capacity; requires weight distribution to avoid concentrated loads; makes Tenant solely responsible for structural damage caused by overloading. Applies to warehouse and industrial space types.',
    htmlContent: `<h3>Floor Load</h3>
<p>Tenant shall not place or permit to be placed on any floor of the Premises any load, weight, or pressure that exceeds the rated floor load capacity for such floor as specified in the Building&rsquo;s structural drawings or as otherwise posted or communicated to Tenant by Landlord. Tenant shall distribute any heavy equipment, inventory, racking systems, or other materials in a manner that avoids concentrated loads and complies with the floor load limits applicable to the relevant area of the Premises.</p>
<p>Tenant shall comply with any posted floor load limits and shall not install any racking, shelving, equipment, or storage systems without first confirming with Landlord that the proposed loads are within the structural capacity of the affected floor areas. Landlord may require Tenant to provide written calculations prepared by a licensed structural engineer confirming that any proposed installation complies with applicable floor load limits prior to commencing such installation.</p>
<p>Any structural damage to the Premises or the Building caused by Tenant&rsquo;s overloading of floors or concentrated loading, regardless of whether Tenant was aware of the floor load limits, shall be Tenant&rsquo;s sole responsibility. Tenant shall promptly notify Landlord if Tenant becomes aware of any floor deflection, cracking, or other sign of potential overloading. The cost of all repairs to structural elements of the Premises or the Building necessitated by Tenant&rsquo;s overloading shall be paid by Tenant within thirty (30) days after receipt of Landlord&rsquo;s invoice therefor.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'propertyProfile.commercialSpaceTypes',
        operator: 'contains_any',
        value: ['warehouse', 'industrial'],
      },
    ],
    placeholders: [],
    sortOrder: 455,
    version: '1.0.0',
    lastReviewedDate: '2026-04-22',
  },
];
