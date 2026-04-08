import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Core Clauses — Required structural clauses for every Minnesota residential lease.
 * sortOrder: 100–199
 */
export const residentialCoreClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PARTIES & PREMISES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-core-parties',
    leaseClass: 'residential',
    category: 'core',
    title: 'Parties & Premises',
    description:
      'Identifies the landlord, tenant(s), and the rental property address. This clause establishes who is bound by the lease and which premises are being rented.',
    htmlContent: `<h3>1. Parties &amp; Premises</h3>
<p>This Residential Lease Agreement (&ldquo;Lease&rdquo;) is entered into by and between:</p>
<p><strong>Landlord:</strong> {{landlord.name}}, with a mailing address of {{landlord.address}} (&ldquo;Landlord&rdquo;).</p>
<p><strong>Tenant(s):</strong> {{tenant.names}} (individually and collectively, &ldquo;Tenant&rdquo;).</p>
<p>Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the premises located at:</p>
<p><strong>Property Address:</strong> {{property.address}}</p>
<p><strong>Unit Number:</strong> {{unit.number}}</p>
<p><strong>Premises Description:</strong> {{premises.description}}</p>
<p>including any personal property, fixtures, and appurtenances therein and all common areas made available for Tenant&rsquo;s use (collectively, the &ldquo;Premises&rdquo;).</p>`,
    isRequired: true,
    placeholders: [
      'landlord.name',
      'landlord.address',
      'tenant.names',
      'property.address',
      'unit.number',
      'premises.description',
    ],
    sortOrder: 100,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FIXED-TERM LEASE DURATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-core-term-fixed',
    leaseClass: 'residential',
    category: 'core',
    title: 'Fixed-Term Lease Duration',
    description:
      'Sets the specific start and end dates for a fixed-term lease. The lease automatically expires at the end of the term unless renewed or converted.',
    htmlContent: `<h3>2. Lease Term</h3>
<p>This Lease is for a <strong>fixed term</strong> beginning on <strong>{{lease.startDate}}</strong> and ending on <strong>{{lease.endDate}}</strong> at 11:59 p.m. (&ldquo;Lease Term&rdquo;).</p>
<p>Unless renewed, extended, or converted to a month-to-month tenancy by mutual written agreement of the parties, this Lease shall terminate at the expiration of the Lease Term without the necessity of notice from either party.</p>
<p>Tenant shall vacate and surrender the Premises in the condition required by this Lease on or before the expiration date. Any holding over beyond the expiration of the Lease Term is governed by the Holdover provision of this Lease.</p>`,
    isRequired: true,
    conditions: [
      { field: 'leaseType', operator: 'equals', value: 'fixed_term' },
    ],
    placeholders: ['lease.startDate', 'lease.endDate'],
    sortOrder: 110,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MONTH-TO-MONTH TERM
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-core-term-mtm',
    leaseClass: 'residential',
    category: 'core',
    title: 'Month-to-Month Lease Term',
    description:
      'Establishes a month-to-month tenancy that continues until terminated by either party with proper written notice.',
    htmlContent: `<h3>2. Lease Term</h3>
<p>This Lease is a <strong>month-to-month tenancy</strong> beginning on <strong>{{lease.startDate}}</strong> (&ldquo;Commencement Date&rdquo;).</p>
<p>This tenancy shall continue on a month-to-month basis until terminated by either party upon delivery of written notice to the other party at least <strong>{{lease.noticeDays}}</strong> days prior to the end of a monthly rental period, in accordance with Minnesota Statutes &sect; 504B.135.</p>
<p>Notice of termination shall be delivered in writing by personal service, first-class mail, or other method permitted by Minnesota law. If notice is delivered by mail, the notice period is extended by the applicable mailing time under Minnesota law.</p>`,
    isRequired: true,
    conditions: [
      { field: 'leaseType', operator: 'equals', value: 'month_to_month' },
    ],
    placeholders: ['lease.startDate', 'lease.noticeDays'],
    sortOrder: 110,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GOVERNING LAW / ENTIRE AGREEMENT / SEVERABILITY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-core-governing-law',
    leaseClass: 'residential',
    category: 'core',
    title: 'Governing Law, Entire Agreement & Severability',
    description:
      'Specifies that Minnesota law governs the lease, that the written lease is the entire agreement between the parties, and that if any provision is found unenforceable, the remaining provisions survive.',
    htmlContent: `<h3>Governing Law, Entire Agreement &amp; Severability</h3>
<p><strong>Governing Law.</strong> This Lease shall be governed by and construed in accordance with the laws of the State of Minnesota, including but not limited to Minnesota Statutes Chapter 504B. Venue for any dispute arising under this Lease shall lie in the county where the Premises are located.</p>
<p><strong>Entire Agreement.</strong> This Lease, together with all addenda, disclosures, and attachments referenced herein, constitutes the entire agreement between Landlord and Tenant regarding the Premises. No oral agreements, representations, or promises not contained herein shall be binding upon either party. Any modifications to this Lease must be in writing and signed by both parties.</p>
<p><strong>Severability.</strong> If any provision of this Lease is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it enforceable, or if modification is not possible, it shall be severed from this Lease. The invalidity of any provision shall not affect the validity or enforceability of the remaining provisions, which shall continue in full force and effect.</p>
<p><strong>Waiver.</strong> The failure of either party to enforce any provision of this Lease shall not constitute a waiver of that party&rsquo;s right to enforce that provision or any other provision in the future. Any waiver must be in writing and signed by the waiving party.</p>
<p><strong>Notices.</strong> All notices required or permitted under this Lease shall be in writing and shall be deemed delivered when personally served, or three (3) business days after being sent by first-class United States mail, postage prepaid, addressed to the parties at the addresses set forth in this Lease, or to such other address as a party may designate in writing.</p>`,
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
    id: 'res-core-signatures',
    leaseClass: 'residential',
    category: 'core',
    title: 'Signature Block',
    description:
      'The signature block where all parties sign and date the lease. Includes acknowledgment that the parties have read and agree to all terms.',
    htmlContent: `<h3>Signatures</h3>
<p>By signing below, the parties acknowledge that they have read, understood, and agree to be bound by all terms and conditions of this Lease, including all addenda, disclosures, and attachments incorporated herein.</p>
<p><strong>LANDLORD:</strong></p>
<p>{{landlord.name}}<br/>
a Minnesota limited liability company</p>
<p>By: ___________________________________</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;{{landlord.representativeName}}</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;{{landlord.represetativeTitle}}</p>
<p>Date: ___________________________________</p>
<br/>
<p><strong>TENANT(S):</strong></p>
<p>Signature: ___________________________________</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;{{tenant.name1}}</p>
<p>Date: ___________________________________</p>
<br/>
<p>Signature: ___________________________________</p>
<p>Printed Name: {{tenant.name2}}</p>
<p>Date: ___________________________________</p>`,
    isRequired: true,
    placeholders: [
      'landlord.name',
      'landlord.representativeName',
      'landlord.represetativeTitle',
      'tenant.name1',
      'tenant.name2',
    ],
    sortOrder: 195,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
