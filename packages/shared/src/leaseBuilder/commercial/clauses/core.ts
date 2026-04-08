import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Core Clauses — Required structural clauses for every Minnesota commercial lease.
 * sortOrder: 100–199
 */
export const commercialCoreClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PARTIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-core-parties',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Parties',
    description:
      'Identifies the landlord entity, tenant entity, their respective states of formation, and principal addresses. Establishes the legal relationship between the parties to the lease.',
    htmlContent: `<h3>1. Parties</h3>
<p>This Commercial Lease Agreement (&ldquo;Lease&rdquo;) is entered into as of the date last signed below (the &ldquo;Effective Date&rdquo;) by and between:</p>
<p><strong>Landlord:</strong> {{landlord.name}}, a {{landlord.stateOfFormation}} {{landlord.entityType}}, with its principal office at {{landlord.address}} (&ldquo;Landlord&rdquo;).</p>
<p><strong>Tenant:</strong> {{tenant.name}}, a {{tenant.stateOfFormation}} {{tenant.entityType}}, with its principal office at {{tenant.address}} (&ldquo;Tenant&rdquo;).</p>
<p>Landlord and Tenant are sometimes referred to herein individually as a &ldquo;Party&rdquo; and collectively as the &ldquo;Parties.&rdquo;</p>
<p>Each Party represents and warrants that it is duly organized, validly existing, and in good standing under the laws of its state of formation and has the authority to enter into and perform its obligations under this Lease.</p>`,
    isRequired: true,
    placeholders: [
      'landlord.name',
      'landlord.stateOfFormation',
      'landlord.entityType',
      'landlord.address',
      'tenant.name',
      'tenant.stateOfFormation',
      'tenant.entityType',
      'tenant.address',
    ],
    sortOrder: 100,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PREMISES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-core-premises',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Premises',
    description:
      'Describes the leased premises including the street address, suite or unit number, and approximate rentable square footage. Defines what physical space the tenant is entitled to occupy.',
    htmlContent: `<h3>2. Premises</h3>
<p>Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the following described premises (the &ldquo;Premises&rdquo;):</p>
<p><strong>Street Address:</strong> {{property.address}}</p>
<p><strong>Suite/Unit Number:</strong> {{unit.number}}</p>
<p><strong>Approximate Rentable Square Footage:</strong> {{premises.sqft}} square feet</p>
<p>The Premises are located within the building commonly known as {{property.buildingName}} (the &ldquo;Building&rdquo;). The Premises are depicted on the floor plan attached hereto as <strong>Exhibit A</strong> and incorporated herein by reference.</p>
<p>Tenant&rsquo;s lease of the Premises includes the non-exclusive right to use, in common with other tenants and occupants of the Building, all common areas of the Building including lobbies, corridors, elevators, stairways, restrooms, parking areas, loading docks, and other areas designated by Landlord for common use (collectively, the &ldquo;Common Areas&rdquo;), subject to reasonable rules and regulations established by Landlord from time to time.</p>
<p>The total rentable area of the Building is approximately {{building.totalSqft}} square feet. Tenant&rsquo;s Pro Rata Share, as used in this Lease, shall be {{lease.camProRataShare}}%, calculated by dividing the rentable square footage of the Premises by the total rentable square footage of the Building.</p>`,
    isRequired: true,
    placeholders: [
      'property.address',
      'unit.number',
      'premises.sqft',
      'property.buildingName',
      'building.totalSqft',
      'lease.camProRataShare',
    ],
    sortOrder: 105,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LEASE TERM
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-core-term',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Lease Term',
    description:
      'Establishes the commencement and expiration dates of the lease term. Specifies the initial term, the rent commencement date, and the conditions under which the term begins.',
    htmlContent: `<h3>3. Lease Term</h3>
<p>The term of this Lease (the &ldquo;Term&rdquo;) shall commence on <strong>{{lease.startDate}}</strong> (the &ldquo;Commencement Date&rdquo;) and shall expire on <strong>{{lease.endDate}}</strong> (the &ldquo;Expiration Date&rdquo;), unless sooner terminated in accordance with the provisions of this Lease.</p>
<p>The &ldquo;Rent Commencement Date&rdquo; shall be {{lease.rentCommencementDate}}. If the Rent Commencement Date differs from the Commencement Date, Tenant shall have access to the Premises from the Commencement Date for the purpose of performing any approved tenant improvements, installing fixtures, and preparing the Premises for occupancy, subject to all terms and conditions of this Lease except the obligation to pay Base Rent.</p>
<p>If Landlord is unable to deliver possession of the Premises on the Commencement Date due to the holdover of a prior tenant or for any other reason, Landlord shall not be liable for any damages to Tenant, and this Lease shall not be void or voidable. In such event, the Commencement Date and Expiration Date shall be extended by the number of days of delay, and rent shall be abated for the period of delay.</p>
<p>Within thirty (30) days after the Commencement Date, Landlord and Tenant shall execute a Commencement Date Memorandum confirming the actual Commencement Date, Rent Commencement Date, and Expiration Date.</p>`,
    isRequired: true,
    placeholders: [
      'lease.startDate',
      'lease.endDate',
      'lease.rentCommencementDate',
    ],
    sortOrder: 110,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RENEWAL OPTIONS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-core-renewal',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Renewal Options',
    description:
      'Grants the tenant one or more options to renew the lease for additional terms, subject to notice requirements and the absence of any uncured default.',
    htmlContent: `<h3>4. Renewal Option(s)</h3>
<p>Provided that (a) this Lease is in full force and effect, (b) Tenant is not in default under any provision of this Lease at the time of exercise or at the commencement of the renewal term, and (c) Tenant has not assigned this Lease or sublet more than fifty percent (50%) of the Premises, Tenant shall have <strong>{{lease.renewalOptions}}</strong> option(s) to renew this Lease (each, a &ldquo;Renewal Option&rdquo;) for an additional term of <strong>{{lease.renewalTermLength}}</strong> each (each, a &ldquo;Renewal Term&rdquo;), upon the same terms and conditions as set forth in this Lease, except that:</p>
<ol>
  <li>There shall be no further renewal options beyond those expressly granted herein;</li>
  <li>Base Rent during each Renewal Term shall be adjusted in accordance with the rent escalation provisions of this Lease, continuing from the Base Rent payable in the last year of the immediately preceding term; and</li>
  <li>Any tenant improvement allowance or rent abatement provisions shall not apply to the Renewal Term.</li>
</ol>
<p>To exercise a Renewal Option, Tenant shall deliver written notice to Landlord no later than <strong>{{lease.renewalNoticePeriodDays}}</strong> days prior to the expiration of the then-current Term or Renewal Term. Time is of the essence with respect to such notice. If Tenant fails to timely deliver such notice, the Renewal Option and all subsequent Renewal Options shall lapse and be of no further force or effect.</p>
<p>The Renewal Option(s) are personal to Tenant and may not be exercised by any assignee or subtenant unless expressly agreed to by Landlord in writing.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.leaseStructure.renewalOptions', operator: 'gt', value: 0 },
    ],
    placeholders: [
      'lease.renewalOptions',
      'lease.renewalTermLength',
      'lease.renewalNoticePeriodDays',
    ],
    sortOrder: 115,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GOVERNING LAW / ENTIRE AGREEMENT / SEVERABILITY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-core-governing-law',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Governing Law, Entire Agreement & Severability',
    description:
      'Specifies that Minnesota law governs the lease, that the written lease constitutes the entire agreement between the parties, and includes severability, waiver, and notice provisions.',
    htmlContent: `<h3>Governing Law, Entire Agreement &amp; Severability</h3>
<p><strong>Governing Law.</strong> This Lease shall be governed by and construed in accordance with the laws of the State of Minnesota, without regard to its conflict-of-laws principles. The Parties consent to the exclusive jurisdiction of the state and federal courts located in the State of Minnesota, and specifically in the county in which the Premises are located, for any action or proceeding arising out of or related to this Lease.</p>
<p><strong>Entire Agreement.</strong> This Lease, together with all exhibits, addenda, riders, and attachments referenced herein, constitutes the entire agreement between Landlord and Tenant with respect to the Premises and supersedes all prior negotiations, representations, warranties, commitments, offers, and agreements, whether written or oral. No amendment or modification of this Lease shall be effective unless set forth in a written instrument signed by both Landlord and Tenant.</p>
<p><strong>Severability.</strong> If any provision of this Lease, or the application thereof to any person or circumstance, is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, it shall be severed from this Lease. The invalidity, illegality, or unenforceability of any provision shall not affect the validity or enforceability of the remaining provisions of this Lease, which shall continue in full force and effect.</p>
<p><strong>Waiver.</strong> The failure of either Party to enforce any provision of this Lease, or to exercise any right or remedy, shall not constitute a waiver of such Party&rsquo;s right to enforce such provision or exercise such right or remedy in the future. No waiver shall be effective unless made in writing and signed by the waiving Party. A waiver of any default shall not constitute a waiver of any subsequent default, whether of the same or a different nature.</p>
<p><strong>Notices.</strong> All notices, demands, consents, approvals, and other communications required or permitted under this Lease shall be in writing and shall be deemed delivered: (a) upon personal delivery; (b) one (1) business day after deposit with a nationally recognized overnight courier service, prepaid; or (c) three (3) business days after being sent by certified or registered United States mail, return receipt requested, postage prepaid, addressed to the respective Party at the address set forth in this Lease, or to such other address as a Party may designate by written notice to the other Party.</p>
<p><strong>Binding Effect.</strong> This Lease shall be binding upon and inure to the benefit of the Parties and their respective successors, assigns, heirs, and legal representatives, subject to the assignment and subletting provisions of this Lease.</p>
<p><strong>Counterparts.</strong> This Lease may be executed in one or more counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed original signatures for all purposes.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 190,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIGNATURE BLOCK
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-core-signatures',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Signature Block',
    description:
      'The signature block where authorized representatives of both landlord and tenant entities sign and date the lease, with printed names and titles.',
    htmlContent: `<h3>Signatures</h3>
<p>IN WITNESS WHEREOF, the Parties have executed this Lease as of the date last written below, each by a duly authorized representative.</p>
<br/>
<p style="text-align: left; margin-bottom: 0; margin-top: 15;"><strong>LANDLORD</strong></p>
<p style="text-align: left; margin-top: 0; text-transform: uppercase;">{{landlord.name}}</p>
<table style="margin-top: 0; margin-bottom: 0; width: 60%">
  <tr>
    <td style="white-space: nowrap; vertical-align: top; padding: 0 4pt 0 0; width: 1%;">By:</td>
    <td style="vertical-align: top; padding: 0; width: 15%;">
      <div style="border-bottom: 1px solid #000; min-height: 16pt; margin-bottom: 3pt;">&nbsp;</div>
      <div>{{landlord.signerName}}</div>
      <div>{{landlord.signerTitle}}</div>
    </td>
    <td style="width: 2%; padding: 0;"></td>
    <td style="white-space: nowrap; vertical-align: top; padding: 0 4pt 0 0; width: 1%;">Date:</td>
    <td style="vertical-align: top; padding: 0; width: 10%;">
      <div style="border-bottom: 1px solid #000; min-height: 16pt; margin-bottom: 3pt; width: 100%;">&nbsp;</div>
      <div>&nbsp;</div>
      <div>&nbsp;</div>
    </td>
  </tr>
</table>

<br/>

<p style="text-align: left; margin-bottom: 0; margin-top: 15;"><strong>TENANT</strong></p>
<p style="text-align: left; margin-top: 0; text-transform: uppercase;">{{tenant.name}}</p>
<table style="margin-top: 0; margin-bottom: 0; width: 60%">
  <tr>
    <td style="white-space: nowrap; vertical-align: top; padding: 0 4pt 0 0; width: 1%;">By:</td>
    <td style="vertical-align: top; padding: 0; width: 15%;">
      <div style="border-bottom: 1px solid #000; min-height: 16pt; margin-bottom: 3pt;">&nbsp;</div>
      <div>{{tenant.signerName}}</div>
      <div>{{tenant.signerTitle}}</div>
    </td>
    <td style="width: 2%; padding: 0;"></td>
    <td style="white-space: nowrap; vertical-align: top; padding: 0 4pt 0 0; width: 1%;">Date:</td>
    <td style="vertical-align: top; padding: 0; width: 10%;">
      <div style="border-bottom: 1px solid #000; min-height: 16pt; margin-bottom: 3pt; width: 100%;">&nbsp;</div>
      <div>&nbsp;</div>
      <div>&nbsp;</div>
    </td>
  </tr>
</table>`,
    isRequired: true,
    placeholders: [
      'landlord.name',
      'landlord.stateOfFormation',
      'landlord.entityType',
      'landlord.signerName',
      'landlord.signerTitle',
      'tenant.name',
      'tenant.stateOfFormation',
      'tenant.entityType',
      'tenant.signerName',
      'tenant.signerTitle',
    ],
    sortOrder: 195,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
