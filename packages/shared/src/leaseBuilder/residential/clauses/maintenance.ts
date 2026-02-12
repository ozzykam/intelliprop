import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Maintenance & Entry Clauses — Landlord entry, landlord obligations,
 * tenant responsibilities, and maintenance request procedures.
 * sortOrder: 800–899
 */
export const residentialMaintenanceClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // LANDLORD ENTRY WITH NOTICE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-maintenance-entry',
    leaseClass: 'residential',
    category: 'maintenance',
    title: 'Landlord Entry & Access',
    description:
      "Establishes the landlord's right to enter the premises with reasonable advance notice, and specifies the emergency exception where no notice is required.",
    htmlContent: `<h3>Landlord Entry &amp; Access</h3>
<p>Landlord or Landlord&rsquo;s agents may enter the Premises upon providing Tenant with at least <strong>{{lease.noticeHours}} hours&rsquo;</strong> advance written notice for the following purposes:</p>
<ol>
  <li>To inspect the Premises;</li>
  <li>To make necessary or agreed-upon repairs, improvements, or alterations;</li>
  <li>To supply necessary or agreed-upon services;</li>
  <li>To show the Premises to prospective tenants (during the last sixty (60) days of the Lease Term or after notice of termination has been given), prospective buyers, mortgagees, or insurance agents;</li>
  <li>To conduct a pre-move-out inspection; and</li>
  <li>For any other lawful purpose permitted by Minnesota Statutes &sect; 504B.211.</li>
</ol>
<p>Notice shall specify the date, approximate time, and purpose of entry. Entry shall occur at reasonable times, generally between 8:00 a.m. and 8:00 p.m., unless Tenant consents to a different time.</p>
<p><strong>Emergency Exception.</strong> In the event of an emergency, including but not limited to fire, flood, gas leak, burst pipe, structural failure, or any condition that poses an immediate risk to life, health, safety, or property, Landlord may enter the Premises <strong>without prior notice</strong> at any time. Landlord shall make reasonable efforts to notify Tenant as soon as practicable after an emergency entry.</p>
<p><strong>Tenant Cooperation.</strong> Tenant shall not unreasonably withhold consent to Landlord&rsquo;s entry for lawful purposes. Tenant shall not change or add locks to the Premises without Landlord&rsquo;s prior written consent and shall provide Landlord with a copy of any new key.</p>
<p>Landlord shall not abuse the right of entry or use it to harass Tenant. If Tenant believes that Landlord is entering the Premises in an unreasonable manner, Tenant may seek remedies under Minnesota Statutes &sect; 504B.375.</p>`,
    isRequired: true,
    placeholders: ['lease.noticeHours'],
    sortOrder: 800,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LANDLORD MAINTENANCE OBLIGATIONS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-maintenance-landlord',
    leaseClass: 'residential',
    category: 'maintenance',
    title: 'Landlord Maintenance Obligations',
    description:
      "Describes the landlord's duty to maintain the premises in habitable condition, including structural, mechanical, and safety systems, as required by Minnesota law.",
    htmlContent: `<h3>Landlord Maintenance Obligations</h3>
<p>Landlord shall maintain the Premises in compliance with applicable building codes, housing codes, and Minnesota Statutes &sect; 504B.161 (Covenants of Landlord and Tenant), including but not limited to the following obligations:</p>
<ol>
  <li><strong>Structural Integrity:</strong> Maintain the roof, foundation, exterior walls, floors, ceilings, and structural components in good repair and weather-tight condition;</li>
  <li><strong>Plumbing &amp; Water:</strong> Maintain plumbing systems in good working order, provide running hot and cold water, and maintain sewage disposal systems;</li>
  <li><strong>Heating:</strong> Provide and maintain a heating system capable of maintaining a minimum temperature of 68&deg;F (20&deg;C) in habitable rooms during the heating season;</li>
  <li><strong>Electrical Systems:</strong> Maintain electrical systems, wiring, outlets, and lighting in safe and working condition;</li>
  <li><strong>Appliances:</strong> Maintain in working condition all appliances provided by Landlord, including (as applicable) refrigerator, stove/oven, dishwasher, garbage disposal, washer, and dryer;</li>
  <li><strong>Common Areas:</strong> Keep all common areas clean, safe, and in good repair;</li>
  <li><strong>Safety Devices:</strong> Install and maintain smoke detectors and carbon monoxide detectors as required by Minnesota Statutes &sect; 299F.362 and applicable local codes;</li>
  <li><strong>Pest Control:</strong> Address infestations of insects, rodents, or other pests, except where the infestation is caused by Tenant&rsquo;s conduct; and</li>
  <li><strong>Locks &amp; Security:</strong> Provide functioning locks on all exterior doors and ground-level windows.</li>
</ol>
<p>Landlord shall make repairs within a reasonable time after receiving written notice from Tenant. In the event of an emergency affecting health or safety, Landlord shall respond promptly. If Landlord fails to make necessary repairs within a reasonable time, Tenant may pursue remedies available under Minnesota Statutes &sect; 504B.381 through &sect; 504B.471, including rent escrow.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 810,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TENANT MAINTENANCE RESPONSIBILITIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-maintenance-tenant',
    leaseClass: 'residential',
    category: 'maintenance',
    title: 'Tenant Maintenance Responsibilities',
    description:
      'Specifies the maintenance tasks the tenant is responsible for, including general care, cleanliness, and any additional responsibilities selected by the landlord.',
    htmlContent: `<h3>Tenant Maintenance Responsibilities</h3>
<p>Tenant shall keep the Premises clean, sanitary, and in good condition throughout the Lease Term, and shall comply with all obligations imposed on tenants by Minnesota Statutes &sect; 504B.161, including but not limited to:</p>
<ol>
  <li>Keeping the Premises reasonably clean and free of trash, garbage, and unsanitary conditions;</li>
  <li>Disposing of garbage and waste in a clean and sanitary manner using designated receptacles;</li>
  <li>Using all electrical, plumbing, heating, ventilating, air conditioning, and other facilities and appliances in a reasonable manner;</li>
  <li>Not deliberately or negligently destroying, defacing, damaging, or removing any part of the Premises or its fixtures;</li>
  <li>Promptly notifying Landlord in writing of any condition that requires repair, poses a health or safety risk, or constitutes a code violation; and</li>
  <li>Not disturbing other tenants&rsquo; peaceful enjoyment of their premises.</li>
</ol>
<p><strong>Additional Tenant Responsibilities.</strong> In addition to the general obligations above, Tenant shall be responsible for the following specific maintenance tasks:</p>
<p><strong>{{lease.tenantMaintenanceTasks}}</strong></p>
<p>Tenant shall perform these responsibilities at Tenant&rsquo;s sole expense. Failure to perform assigned maintenance tasks within a reasonable time may result in Landlord performing the work and charging Tenant for the cost as additional rent.</p>
<p>Tenant shall not make any alterations, improvements, or modifications to the Premises without Landlord&rsquo;s prior written consent. This includes but is not limited to painting, wallpapering, installing shelving, making holes in walls, and altering fixtures or built-in appliances.</p>`,
    isRequired: true,
    placeholders: ['lease.tenantMaintenanceTasks'],
    sortOrder: 820,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MAINTENANCE REQUEST PROCEDURE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-maintenance-requests',
    leaseClass: 'residential',
    category: 'maintenance',
    title: 'Maintenance Request Procedure',
    description:
      'Explains how the tenant should submit maintenance requests and how emergency maintenance issues should be reported.',
    htmlContent: `<h3>Maintenance Requests</h3>
<p>Tenant shall submit all non-emergency maintenance requests to Landlord using the following method:</p>
<p><strong>Request Method:</strong> {{lease.maintenanceRequestMethod}}</p>
<p><strong>Maintenance Contact Information:</strong> {{lease.maintenanceContactInfo}}</p>
<p>When submitting a maintenance request, Tenant shall include:</p>
<ol>
  <li>A description of the issue or needed repair;</li>
  <li>The location of the issue within the Premises;</li>
  <li>The date the issue was first noticed; and</li>
  <li>Tenant&rsquo;s preferred availability for access to the Premises for repairs.</li>
</ol>
<p>Landlord shall acknowledge receipt of the maintenance request within a reasonable time and shall complete repairs within a reasonable period depending on the nature and urgency of the issue.</p>
<p><strong>Emergency Maintenance.</strong> For emergencies that pose an immediate risk to health, safety, or property (including but not limited to fire, gas leak, flooding, sewer backup, loss of heat in winter, or electrical hazard), Tenant shall immediately contact:</p>
<p><strong>Emergency Contact:</strong> {{lease.emergencyContact}}</p>
<p>If Tenant is unable to reach Landlord or the emergency contact in the event of a genuine emergency, Tenant may take reasonable steps to mitigate the damage (such as shutting off a water valve) and may contact appropriate emergency services (911, utility company, etc.).</p>
<p>Tenant shall not attempt to make repairs that require professional skill or that could affect the structural, mechanical, electrical, or plumbing systems of the Premises without Landlord&rsquo;s prior written authorization.</p>`,
    isRequired: true,
    placeholders: [
      'lease.maintenanceRequestMethod',
      'lease.maintenanceContactInfo',
      'lease.emergencyContact',
    ],
    sortOrder: 830,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
