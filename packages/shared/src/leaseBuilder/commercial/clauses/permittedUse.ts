import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Permitted Use Clauses — Permitted use, zoning compliance, and exclusive use rights.
 * sortOrder: 350–399
 */
export const commercialPermittedUseClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PERMITTED USE & ZONING COMPLIANCE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-use-permitted',
    leaseClass: 'commercial',
    category: 'use_and_exclusivity',
    title: 'Permitted Use & Zoning Compliance',
    description:
      'Restricts the use of the premises to the specified permitted use, requires compliance with all applicable zoning and land use regulations, and prohibits any use that would increase insurance rates or constitute a nuisance.',
    htmlContent: `<h3>Permitted Use &amp; Zoning Compliance</h3>
<p>Tenant shall use and occupy the Premises solely for the following purpose: <strong>{{lease.permittedUse}}</strong> (the &ldquo;Permitted Use&rdquo;), and for no other purpose without the prior written consent of Landlord, which consent may be withheld in Landlord&rsquo;s reasonable discretion.</p>
<p><strong>Compliance with Laws.</strong> Tenant shall, at Tenant&rsquo;s sole cost and expense, comply with all applicable federal, state, and local laws, ordinances, codes, rules, regulations, and requirements (collectively, &ldquo;Applicable Laws&rdquo;) relating to the Premises and Tenant&rsquo;s use and occupancy thereof, including without limitation all zoning and land use regulations, building codes, health and safety regulations, and fire codes. Tenant shall obtain and maintain, at Tenant&rsquo;s sole cost and expense, all licenses, permits, and approvals required for the Permitted Use.</p>
<p><strong>Zoning Confirmation.</strong> Tenant acknowledges that Tenant has independently confirmed that the Permitted Use is allowed under current zoning regulations applicable to the Premises. Landlord makes no representation or warranty regarding the suitability of the Premises for the Permitted Use or that the Permitted Use complies with applicable zoning regulations.</p>
<p><strong>Prohibited Uses.</strong> Tenant shall not use or permit the Premises to be used for any purpose that:</p>
<ol>
  <li>Is unlawful, immoral, or contrary to any Applicable Law;</li>
  <li>Would cause or result in an increase in the premium for any insurance policy carried by Landlord with respect to the Building, unless Tenant agrees to pay such increase;</li>
  <li>Would cause the cancellation or material modification of any such insurance policy;</li>
  <li>Would constitute a public or private nuisance, or annoy, disturb, or endanger other tenants or occupants of the Building;</li>
  <li>Would cause structural damage to the Building or any portion thereof;</li>
  <li>Would overload the floors, walls, or electrical systems of the Premises beyond their designed capacity; or</li>
  <li>Would cause odors, noise, vibrations, or emissions that are detectable outside the Premises;</li>
  <li>Would involve the use of the Premises, or any part thereof, as living quarters, sleeping accommodations, or residential use of any kind; or</li>
  <li>Would constitute waste, including allowing the Premises to fall into a state of disrepair, destruction, or degradation beyond ordinary wear and tear.</li>
</ol>
<p><strong>Continuous Operation.</strong> Tenant shall continuously operate its business in the Premises during the Term in a first-class manner consistent with the Permitted Use. Tenant shall not vacate or abandon the Premises during the Term without Landlord&rsquo;s prior written consent.</p>`,
    isRequired: true,
    placeholders: [
      'lease.permittedUse',
    ],
    sortOrder: 350,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EXCLUSIVE USE RIGHTS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-use-exclusive',
    leaseClass: 'commercial',
    category: 'use_and_exclusivity',
    title: 'Exclusive Use Rights',
    description:
      'Grants the tenant the exclusive right to operate a specified type of business within the building or project, preventing the landlord from leasing to competing businesses.',
    htmlContent: `<h3>Exclusive Use Rights</h3>
<p>During the Term of this Lease (including any Renewal Term), Landlord grants to Tenant the exclusive right to operate the following business within the Building: <strong>{{lease.exclusiveUseDescription}}</strong> (the &ldquo;Exclusive Use&rdquo;).</p>
<p>Landlord covenants and agrees that, during the Term, Landlord shall not:</p>
<ol>
  <li>Lease, license, or otherwise permit any other tenant or occupant of the Building to operate a business that is the same as or substantially similar to the Exclusive Use;</li>
  <li>Operate or permit the operation of any business in the Common Areas that is the same as or substantially similar to the Exclusive Use; or</li>
  <li>Amend or modify any existing lease to permit a use that would violate Tenant&rsquo;s Exclusive Use rights.</li>
</ol>
<p><strong>Exceptions.</strong> The Exclusive Use rights shall not apply to: (a) tenants or occupants of the Building whose leases were fully executed prior to the Effective Date of this Lease; (b) uses that are merely incidental or ancillary to a tenant&rsquo;s primary use and do not constitute a primary business activity; or (c) temporary or promotional activities lasting no more than seven (7) consecutive days.</p>
<p><strong>Remedies for Violation.</strong> If Landlord violates the Exclusive Use provision, Tenant shall provide Landlord with written notice of such violation, and Landlord shall have thirty (30) days to cure the violation. If Landlord fails to cure the violation within such thirty (30) day period, Tenant shall have the right, in addition to any other remedies available at law or in equity, to:</p>
<ol>
  <li>Reduce Tenant&rsquo;s Base Rent by twenty-five percent (25%) for the duration of such violation; or</li>
  <li>Terminate this Lease upon sixty (60) days&rsquo; prior written notice to Landlord, provided the violation remains uncured at the end of such sixty (60) day notice period.</li>
</ol>
<p><strong>Waiver of Exclusive Use.</strong> The Exclusive Use right is personal to Tenant and may not be assigned or transferred without Landlord&rsquo;s prior written consent. The Exclusive Use right shall automatically terminate upon any assignment of this Lease or subletting of more than fifty percent (50%) of the Premises unless Landlord agrees otherwise in writing.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.useAndBuildout.exclusiveUse', operator: 'equals', value: true },
    ],
    placeholders: [
      'lease.exclusiveUseDescription',
    ],
    sortOrder: 360,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
