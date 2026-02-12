import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Utility Clauses — Utility responsibilities and shared utility disclosures.
 * sortOrder: 400–499
 */
export const residentialUtilityClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY RESPONSIBILITIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-utilities-responsibilities',
    leaseClass: 'residential',
    category: 'utilities',
    title: 'Utility Responsibilities',
    description:
      'Lists which utilities are paid by the landlord and which are the tenant\'s responsibility. Tenant must arrange for service in their name where required.',
    htmlContent: `<h3>Utilities &amp; Services</h3>
<p>The following utilities and services shall be the responsibility of the parties as indicated below:</p>
<p><strong>Landlord shall pay for:</strong> {{lease.landlordUtilities}}</p>
<p><strong>Tenant shall pay for:</strong> {{lease.tenantUtilities}}</p>
<p>Tenant shall arrange to have all Tenant-paid utilities transferred into Tenant&rsquo;s name on or before the Commencement Date. Tenant shall maintain all Tenant-paid utility services throughout the Lease Term and shall not allow any utility to be disconnected or terminated.</p>
<p>If Tenant fails to transfer utilities into Tenant&rsquo;s name or allows a utility to be disconnected, Landlord may, at Landlord&rsquo;s option, arrange for service and charge Tenant for the cost plus a reasonable administrative fee, which shall be considered additional rent under this Lease.</p>
<p>Tenant shall be responsible for all charges, deposits, and fees associated with Tenant-paid utilities. Landlord shall not be liable for any interruption in utility service caused by the utility provider, except where the interruption is caused by Landlord&rsquo;s negligence or failure to maintain the Premises.</p>
<p>Tenant shall not use any space heaters, portable heating devices, or high-draw appliances that may cause damage or present a fire hazard without Landlord&rsquo;s prior written consent.</p>`,
    isRequired: true,
    placeholders: ['lease.landlordUtilities', 'lease.tenantUtilities'],
    sortOrder: 400,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SHARED UTILITY ALLOCATION DISCLOSURE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-utilities-shared-disclosure',
    leaseClass: 'residential',
    category: 'utilities',
    title: 'Shared Utility Allocation Disclosure',
    description:
      'Discloses the method used to allocate shared utility costs among units, as required by Minnesota law when utilities are not individually metered.',
    htmlContent: `<h3>Shared Utility Disclosure</h3>
<p><strong>DISCLOSURE:</strong> In accordance with Minnesota Statutes &sect; 504B.215, Landlord discloses that one or more utilities serving the Premises are shared with other units or common areas and are not individually metered to the Premises.</p>
<p>The following shared utilities are allocated as described below:</p>
<p><strong>{{lease.sharedUtilityDetails}}</strong></p>
<p><strong>Allocation Method:</strong> {{lease.sharedUtilityAllocationMethod}}</p>
<p>Tenant&rsquo;s share of the shared utility costs is estimated to be <strong>{{lease.sharedUtilityEstimate}}</strong> per month. This estimate is based on historical usage and actual costs may vary. Landlord shall provide Tenant with an accounting of actual shared utility costs upon request.</p>
<p>Landlord shall not profit from the allocation of shared utility costs. Any amount charged to Tenant for shared utilities shall reflect Tenant&rsquo;s proportionate share of the actual cost incurred by Landlord.</p>
<p>If the allocation method changes during the Lease Term, Landlord shall provide Tenant with at least thirty (30) days&rsquo; written notice of the new allocation method before it takes effect.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'propertyProfile.hasSharedUtilities',
        operator: 'equals',
        value: true,
      },
    ],
    placeholders: [
      'lease.sharedUtilityDetails',
      'lease.sharedUtilityAllocationMethod',
      'lease.sharedUtilityEstimate',
    ],
    sortOrder: 410,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
