import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Parking Clauses — Parking included or not included.
 * sortOrder: 750–799
 */
export const residentialParkingClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PARKING INCLUDED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-parking-included',
    leaseClass: 'residential',
    category: 'parking',
    title: 'Parking — Included',
    description:
      'Provides designated parking space(s) to the tenant as part of the lease, with rules for use and vehicle requirements.',
    htmlContent: `<h3>Parking &mdash; Included</h3>
<p>Landlord shall provide Tenant with <strong>{{lease.parkingSpaces}}</strong> designated parking space(s) at the Premises at no additional charge (or at a monthly fee of <strong>{{lease.parkingFee}}</strong>, if applicable), located at:</p>
<p><strong>Parking Location / Space Number(s):</strong> {{lease.parkingLocation}}</p>
<p><strong>Rules and Conditions:</strong></p>
<ol>
  <li>Tenant shall park only in the assigned space(s). Parking in spaces assigned to other tenants, in fire lanes, or in areas marked &ldquo;No Parking&rdquo; is prohibited.</li>
  <li>All vehicles parked on the Premises must be currently registered, insured, and in operable condition. Inoperable, unregistered, or uninsured vehicles are not permitted and may be towed at Tenant&rsquo;s expense after reasonable written notice.</li>
  <li>Tenant shall not perform vehicle repairs, maintenance (other than minor emergency repairs), oil changes, or detailing in the parking area.</li>
  <li>Recreational vehicles, boats, trailers, campers, and commercial vehicles over one ton are not permitted without Landlord&rsquo;s prior written consent.</li>
  <li>Tenant shall not store personal property, materials, or debris in the parking area.</li>
  <li>Tenant shall comply with all posted parking rules, speed limits, and traffic flow directions.</li>
</ol>
<p><strong>Guest Parking.</strong> {{lease.guestParkingDetails}}</p>
<p>Landlord shall not be liable for any damage to, theft of, or loss from vehicles parked on the Premises, except to the extent caused by Landlord&rsquo;s willful misconduct or gross negligence. Tenant parks at Tenant&rsquo;s own risk.</p>
<p>Landlord reserves the right to reassign parking spaces upon thirty (30) days&rsquo; written notice to Tenant if necessary for maintenance, construction, or operational reasons.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.parkingIncluded',
        operator: 'equals',
        value: true,
      },
    ],
    placeholders: [
      'lease.parkingSpaces',
      'lease.parkingFee',
      'lease.parkingLocation',
      'lease.guestParkingDetails',
    ],
    sortOrder: 750,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PARKING NOT INCLUDED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-parking-not-included',
    leaseClass: 'residential',
    category: 'parking',
    title: 'Parking — Not Included',
    description:
      'States that no parking is provided by the landlord. Tenant is responsible for securing their own off-street parking.',
    htmlContent: `<h3>Parking &mdash; Not Included</h3>
<p><strong>No parking spaces are provided</strong> by Landlord as part of this Lease. Tenant is responsible for securing their own parking arrangements at Tenant&rsquo;s sole expense.</p>
<p>Tenant shall comply with all applicable municipal parking regulations, including posted street parking restrictions, snow emergency rules, and permit requirements. Landlord shall not be responsible for any parking tickets, towing charges, or other penalties incurred by Tenant.</p>
<p>Tenant shall not park on any portion of the Premises, including but not limited to the yard, lawn, driveway (if not designated for Tenant use), or common areas, without Landlord&rsquo;s prior written consent.</p>
<p>If Landlord offers parking spaces for rent in the future, Tenant may be given the opportunity to lease a space at the then-current market rate, subject to availability.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.parkingIncluded',
        operator: 'equals',
        value: false,
      },
    ],
    placeholders: [],
    sortOrder: 750,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
