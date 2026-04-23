import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Miscellaneous Provisions — Boilerplate clauses required by MN commercial lease practice.
 * Covers: nature of relationship, tax allocation, right of re-entry,
 * lessor's lien, and right of lessor to pay tenant's obligations.
 * sortOrder: 155, 160, 165, 180, 315
 */
export const commercialMiscProvisionsClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // NATURE OF RELATIONSHIP
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-nature-of-relationship',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Nature of Relationship',
    description:
      'Clarifies that the relationship between the parties is solely that of landlord and tenant, and that nothing in the lease creates a partnership, joint venture, agency, or fiduciary relationship.',
    htmlContent: `<h3>Nature of Relationship</h3>
<p>The sole relationship created between Landlord and Tenant by this Lease is that of landlord and tenant. Nothing contained in this Lease shall be deemed or construed, by the Parties or by any third party, to create any other relationship between the Parties, including without limitation a partnership, joint venture, agency, employment relationship, or any other association. Neither Party shall have any right, power, or authority to bind or obligate the other Party in any manner. All financial obligations of Tenant under this Lease are obligations of Tenant alone, and Landlord shall not be responsible for any debts, liabilities, or obligations of Tenant to any third party.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 155,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TAX ALLOCATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-taxes',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Taxes',
    description:
      'Allocates responsibility for real property taxes (landlord) and personal property taxes (tenant) on the leased premises. Applies to both gross and NNN lease structures.',
    htmlContent: `<h3>Taxes</h3>
<p><strong>Real Property Taxes.</strong> Real estate and personal property taxes, special assessments, and any other governmental charges or levies assessed against the Premises or the Building (collectively, &ldquo;Real Property Taxes&rdquo;) shall be the responsibility of Landlord, subject to any allocation of Operating Expenses as provided elsewhere in this Lease (including, if applicable, the CAM and Operating Expenses provisions). Landlord shall pay all Real Property Taxes before they become delinquent.</p>
<p><strong>Tenant&rsquo;s Personal Property Taxes.</strong> Tenant shall be solely responsible for and shall pay, before delinquency, all taxes, assessments, and other governmental charges levied or assessed against: (a) Tenant&rsquo;s personal property, trade fixtures, equipment, inventory, and other property located on or about the Premises; (b) any leasehold improvements installed by or at the expense of Tenant; and (c) Tenant&rsquo;s business operations at the Premises, including any business or occupational taxes or license fees. If any such taxes are assessed against Landlord or Landlord&rsquo;s property rather than Tenant, and Landlord pays the same, Tenant shall reimburse Landlord for the amount attributable to Tenant&rsquo;s property or improvements within thirty (30) days after Landlord&rsquo;s written demand therefor.</p>
<p><strong>Tax Contests.</strong> Landlord reserves the right, at its own expense, to contest or seek a reduction in any Real Property Tax assessment. Tenant shall cooperate with Landlord in connection with any such contest as reasonably requested.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 160,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NO REPRESENTATIONS BY LANDLORD
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-no-representations',
    leaseClass: 'commercial',
    category: 'core',
    title: 'No Representations by Landlord',
    description:
      'Disclaims any landlord representations not in the written lease; requires all amendments to be in writing to be enforceable.',
    htmlContent: `<h3>No Representations by Landlord</h3>
<p>Landlord has made no representations, warranties, covenants, or agreements to or with Tenant concerning the Premises, the Building, or any other matter pertaining to this Lease that are not expressly set forth in this Lease or in the exhibits, addenda, and attachments that form a part hereof. This Lease constitutes the entire understanding between the Parties with respect to its subject matter, and all prior and contemporaneous negotiations, representations, warranties, understandings, and agreements, whether oral or written, are merged herein and superseded by this Lease.</p>
<p>No amendment, modification, alteration, or supplement to this Lease shall be valid or binding upon either Party unless in writing and executed by both Landlord and Tenant. No course of dealing or course of performance shall amend or modify any provision of this Lease. No employee, agent, broker, or other representative of Landlord has any authority to make any representation or agreement on behalf of Landlord, and any representation purportedly made by such person that is not contained in this Lease shall be of no force or effect.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 162,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ESTOPPEL CERTIFICATE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-estoppel-certificate',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Estoppel Certificate',
    description:
      'Requires Tenant to deliver a certified estoppel certificate within 10 business days of request; failure to deliver is deemed consent to the certificate contents.',
    htmlContent: `<h3>Estoppel Certificate</h3>
<p>Within ten (10) business days after written request by Landlord, Tenant shall execute and deliver to Landlord, or to any party designated by Landlord, a written estoppel certificate certifying: (a) the Commencement Date and Expiration Date of this Lease; (b) the current monthly Base Rent and any additional rent payable; (c) the amount of any security deposit held by Landlord; (d) whether this Lease is in full force and effect and has not been amended, modified, or supplemented (and if it has been, identifying the amendments); (e) that Landlord is not in default under this Lease, or, if Landlord is claimed to be in default, specifying the nature of such claimed default; (f) that Tenant is not in default under this Lease, or, if Tenant is claimed to be in default, specifying the nature of such claimed default; and (g) such other factual matters relating to this Lease as may be reasonably requested by Landlord or any lender, purchaser, or other party with a legitimate interest in the Premises.</p>
<p>If Tenant fails to deliver a signed estoppel certificate within such ten (10) business day period, Tenant shall be deemed to have certified all matters set forth in the certificate as submitted by Landlord, and any party may conclusively rely upon such deemed certification. Tenant acknowledges that any lender holding a mortgage or deed of trust on the Building, and any prospective purchaser of the Building, will rely upon estoppel certificates delivered pursuant to this Section.</p>
<p>Landlord shall have a corresponding obligation to deliver an estoppel certificate to Tenant within ten (10) business days after Tenant&rsquo;s written request, certifying such matters as Tenant may reasonably request relating to Landlord&rsquo;s obligations under this Lease.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 163,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RIGHT OF RE-ENTRY / LANDLORD ACCESS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-right-of-entry',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Right of Re-Entry; Landlord Access',
    description:
      'Grants the landlord the right to enter the premises at reasonable hours for inspections, repairs, exhibiting the space to prospective tenants or buyers, and posting legally required notices.',
    htmlContent: `<h3>Right of Re-Entry; Landlord Access</h3>
<p>Landlord shall have the right, by itself, its agents, employees, or contractors, to enter the Premises at any reasonable time upon reasonable advance notice (except in the case of emergency, in which case no advance notice is required) for any of the following purposes:</p>
<ol>
  <li>To inspect the condition of the Premises and Tenant&rsquo;s compliance with the terms of this Lease;</li>
  <li>To exhibit the Premises to prospective tenants, purchasers, mortgagees, or their respective agents;</li>
  <li>To make such repairs, alterations, improvements, or additions to the Premises or the Building as Landlord deems necessary or desirable for the safety, preservation, or maintenance of the Building;</li>
  <li>To post such notices as Landlord may deem necessary to protect Landlord against mechanics&rsquo; liens, materialmen&rsquo;s liens, or other claims, or to protect Landlord&rsquo;s interest in the Premises or the Building;</li>
  <li>To perform any obligation of Tenant that Tenant has failed to perform as permitted under this Lease; or</li>
  <li>For any other reasonable purpose that does not materially and unreasonably interfere with Tenant&rsquo;s business operations.</li>
</ol>
<p>Except in the case of emergency, Landlord shall provide Tenant with at least twenty-four (24) hours&rsquo; advance written or oral notice prior to entry. Landlord shall use commercially reasonable efforts to perform all non-emergency entry during normal business hours and in a manner that minimizes disruption to Tenant&rsquo;s business. Any entry by Landlord pursuant to this Section shall not constitute an eviction of Tenant, a termination of this Lease, or a waiver of any of Landlord&rsquo;s rights under this Lease. Tenant shall not change locks or install additional security systems that would impair Landlord&rsquo;s right of entry without Landlord&rsquo;s prior written consent and delivery to Landlord of keys or access codes for any new locking mechanisms.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 165,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TENANT'S RIGHT OF ACCESS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-tenant-access',
    leaseClass: 'commercial',
    category: 'core',
    title: "Tenant's Right of Access",
    description:
      "Guarantees Tenant 24/7 access to the Premises throughout the Term, subject to Building common-area hours; prohibits Landlord from interfering with access except in emergencies, Force Majeure events, or during lawful maintenance.",
    htmlContent: `<h3>Tenant&rsquo;s Right of Access</h3>
<p>Subject to the terms and conditions of this Lease, Tenant and Tenant&rsquo;s employees, agents, contractors, customers, and invitees shall have access to the Premises twenty-four (24) hours per day, seven (7) days per week, throughout the Term of this Lease (including any Renewal Term). Access to the Building&rsquo;s common areas (including lobbies, elevators, corridors, and parking facilities) shall be subject to Landlord&rsquo;s reasonable Building access hours and security protocols, which Landlord may establish or modify from time to time upon reasonable written notice to Tenant.</p>
<p>Landlord shall not interfere with, restrict, or impair Tenant&rsquo;s right of access to or use and enjoyment of the Premises except: (a) during an emergency that poses an immediate threat to health, safety, or property; (b) during a Force Majeure Event, to the extent access is physically or legally prevented thereby; or (c) as required for lawful maintenance, repair, or improvement of the Building or Premises, subject to the advance notice and coordination requirements of this Lease. Any temporary restriction on access required for maintenance or repair shall be of minimum duration and shall be scheduled, where reasonably practicable, outside of Tenant&rsquo;s normal business hours. Landlord shall coordinate with Tenant in good faith to minimize any disruption to Tenant&rsquo;s business operations.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 166,
    version: '1.0.0',
    lastReviewedDate: '2026-04-22',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RIGHT OF LESSOR TO PAY OBLIGATIONS OF LESSEE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-pay-obligations',
    leaseClass: 'commercial',
    category: 'core',
    title: "Right of Lessor to Pay Tenant's Obligations",
    description:
      "Grants the landlord the right, after notice, to pay any obligation of the tenant that the tenant has failed to pay, and to recover such amounts as additional rent.",
    htmlContent: `<h3>Right of Lessor to Pay Tenant&rsquo;s Obligations</h3>
<p>If Tenant shall fail or refuse to pay any sum required to be paid by Tenant under the provisions of this Lease, or shall fail or refuse to perform any obligation required of Tenant under this Lease, then Landlord, after giving Tenant ten (10) days&rsquo; prior written notice (or such shorter notice as may be required in the case of an emergency or to prevent damage to the Premises or the Building), shall have the right (but not the obligation) to pay any such sum or to perform any such obligation on Tenant&rsquo;s behalf.</p>
<p>All amounts paid by Landlord pursuant to this Section, together with interest at the Default Interest Rate (as defined in this Lease) from the date of payment by Landlord until repayment by Tenant, shall be deemed additional Rent and shall be due and payable by Tenant to Landlord upon written demand. The payment by Landlord of any sum or the performance by Landlord of any obligation on Tenant&rsquo;s behalf shall be prima facie evidence that such payment or performance was necessary and appropriate, but shall not constitute a waiver of Tenant&rsquo;s obligations or of any default by Tenant under this Lease, nor shall it limit or impair any other right or remedy of Landlord.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 180,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PARTNERSHIP / LLC TENANT LIABILITY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-partnership-tenant',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Partnership and LLC Tenant Liability',
    description:
      'If Tenant is an LLC or partnership, each member/partner is jointly and severally liable for all lease obligations notwithstanding limited-liability protections.',
    htmlContent: `<h3>Partnership and LLC Tenant Liability</h3>
<p>If Tenant is a partnership, limited partnership, limited liability company, limited liability partnership, or any other entity in which the individual liability of the members, partners, or equity holders is limited by the entity&rsquo;s organizational documents or by applicable law, then, notwithstanding such limitation of liability and as an inducement to Landlord to enter into this Lease, each individual member, partner, or equity holder of Tenant (each, a &ldquo;Member&rdquo;) shall be jointly and severally liable with Tenant and with each other Member for all obligations, covenants, and agreements of Tenant under this Lease, including without limitation the obligation to pay all Rent and other monetary charges and to perform all other duties of Tenant hereunder.</p>
<p>Landlord may proceed against any Member individually without first pursuing any remedy against Tenant or any other Member. This provision supplements, and does not limit, any personal guarantee delivered by any individual pursuant to a separate guarantee addendum to this Lease. No change in the membership, management, or ownership of Tenant shall release any Member from liability accrued or accruing under this Lease prior to the date of such change, unless Landlord has provided prior written consent to such release.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 175,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LIGHT AND AIR
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-light-air',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Light and Air',
    description:
      'Tenant has no easement of light, air, or view; Landlord may erect adjacent structures without compensation to Tenant.',
    htmlContent: `<h3>Light and Air</h3>
<p>This Lease does not grant Tenant any easement or right of access to light, air, or view over or across any land or property adjoining the Building or the Premises. Landlord reserves the right, without any obligation to Tenant and without any reduction in Rent or other compensation to Tenant, to construct or permit the construction of additional stories or structures on the Building or on any adjacent land owned or controlled by Landlord, and to grant easements or other rights with respect to such adjacent land, provided that such construction does not materially impair Tenant&rsquo;s physical access to or use of the Premises for the Permitted Use.</p>
<p>Tenant acknowledges that any diminution or interference with light, air, or view resulting from construction by Landlord or any third party shall not constitute a constructive eviction, a breach of the covenant of quiet enjoyment, or a basis for any abatement or reduction of Rent.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 178,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LANDLORD LIABILITY LIMITATION / SALE OF BUILDING
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-landlord-liability-limit',
    leaseClass: 'commercial',
    category: 'core',
    title: "Sale of Building; Landlord's Liability Limitation",
    description:
      "After any sale of the Building, departing Landlord's obligations end upon transfer; personal liability is limited to Landlord's equity interest in the Building.",
    htmlContent: `<h3>Sale of Building; Landlord&rsquo;s Liability Limitation</h3>
<p>If Landlord sells, transfers, or otherwise conveys its interest in the Building or the Premises, Landlord shall be released from all obligations and liabilities under this Lease that arise after the date of such sale or transfer, provided that: (a) Landlord has transferred or credited to the purchaser or transferee any security deposit then held by Landlord and attributable to Tenant under this Lease; and (b) such purchaser or transferee has assumed all of Landlord&rsquo;s obligations under this Lease accruing from and after the date of such transfer. Upon such transfer and assumption, Tenant shall look solely to such purchaser or transferee for the performance of Landlord&rsquo;s obligations under this Lease from and after the date of transfer.</p>
<p>Notwithstanding anything to the contrary in this Lease, the liability of any person or entity constituting Landlord under this Lease (including any current or future member, partner, shareholder, officer, director, trustee, or beneficiary of Landlord) shall be limited to the equity interest of Landlord in the Building and related property. No other assets of Landlord or any person or entity constituting Landlord shall be subject to levy, execution, or other enforcement procedure for the satisfaction of any judgment, decree, or order obtained by Tenant against Landlord, or for the performance of any of Landlord&rsquo;s obligations under this Lease.</p>
<p>Tenant shall not seek any judgment for money damages against any person or entity constituting Landlord beyond such person&rsquo;s or entity&rsquo;s interest in the Building. This limitation of liability shall apply to all claims of every kind and nature, whether based on contract, tort, statute, or otherwise.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 182,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BUILDING SERVICES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-services',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Building Services',
    description:
      'Allocates sprinkler modification costs to Tenant; limits Landlord liability for electrical interruptions except gross negligence/willful misconduct; requires advance notice for planned service interruptions.',
    htmlContent: `<h3>Building Services</h3>
<p><strong>Sprinkler System.</strong> The Premises are or may be equipped with a fire sprinkler system. If Tenant&rsquo;s alterations, improvements, trade fixtures, or manner of occupancy require any modification, relocation, addition, or upgrade to the sprinkler system or any other fire protection system serving the Premises or the Building, Tenant shall be responsible for all costs of such modification, relocation, addition, or upgrade, including without limitation design, permitting, labor, materials, and inspection fees. Any such work shall be performed by a licensed contractor approved by Landlord and in compliance with all applicable codes and the requirements of the Building&rsquo;s insurance carriers.</p>
<p><strong>Electrical Service Interruptions.</strong> Landlord shall not be liable to Tenant for any interruption in electrical service or other utility service serving the Premises, except to the extent that such interruption results directly from Landlord&rsquo;s gross negligence or willful misconduct. Tenant shall be responsible for obtaining and maintaining any equipment necessary to protect Tenant&rsquo;s personal property, data, and business operations from the effects of power surges, outages, or interruptions.</p>
<p><strong>Planned Service Interruptions.</strong> Landlord shall have the right to temporarily interrupt utility services to the Premises for the purpose of making necessary repairs, replacements, or improvements to the Building&rsquo;s mechanical, electrical, plumbing, or other systems. Landlord shall provide Tenant with at least forty-eight (48) hours&rsquo; advance written notice of any planned service interruption (except in the case of emergency), and shall use commercially reasonable efforts to schedule such interruptions outside of Tenant&rsquo;s normal business hours and to minimize their duration.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 185,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ADJACENT EXCAVATION / SHORING
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-adjacent-excavation',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Adjacent Excavation; Shoring',
    description:
      'Tenant grants license for adjacent excavation or construction; waives any claim for resulting interference or inconvenience.',
    htmlContent: `<h3>Adjacent Excavation; Shoring</h3>
<p>If an excavation or construction is made or authorized by Landlord or any third party upon land adjacent to or contiguous with the Building or the Premises, Tenant shall afford to the person causing or authorized to cause such excavation or construction license to enter upon the Premises for the purpose of doing such work as may be necessary to preserve the walls or foundations of the Building from injury or damage, and to support the same by proper foundations, without any claim against Landlord for damages or indemnity on account of inconvenience, disturbance to Tenant&rsquo;s business, or any other matter or thing whatsoever.</p>
<p>Landlord shall use commercially reasonable efforts to minimize any interference with Tenant&rsquo;s use and enjoyment of the Premises resulting from any such excavation or construction, including requiring the party performing such work to proceed with reasonable diligence. No such excavation, construction, or resulting disturbance shall constitute a constructive eviction, entitle Tenant to any abatement of Rent, or give rise to any claim for damages against Landlord.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 192,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSOR'S LIEN
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-misc-lessor-lien',
    leaseClass: 'commercial',
    category: 'core',
    title: "Lessor's Lien",
    description:
      "Acknowledges the landlord's statutory and contractual lien rights on tenant's property located on the premises as additional security for unpaid rent and other obligations, to the extent permitted by Minnesota law.",
    htmlContent: `<h3>Lessor&rsquo;s Lien</h3>
<p>As additional security for Tenant&rsquo;s obligations under this Lease, Tenant acknowledges and agrees that, to the extent permitted by applicable Minnesota law (including without limitation Minnesota Statutes Chapter 514), Landlord shall have a lien upon all of Tenant&rsquo;s personal property, trade fixtures, equipment, and other property located on or about the Premises to secure the payment of all Rent and other sums due and payable under this Lease and the performance of all obligations of Tenant hereunder.</p>
<p>No property of Tenant that is subject to Landlord&rsquo;s lien shall be removed from the Premises by Tenant other than in the ordinary course of Tenant&rsquo;s business while Tenant is in default in the payment of Rent or in the performance of any other material obligation under this Lease. Landlord shall have the right to enforce such lien in the manner provided by applicable Minnesota law.</p>
<p>Tenant represents and warrants that, as of the Effective Date, all personal property and trade fixtures brought onto the Premises by Tenant are free and clear of any security interests, liens, or encumbrances except as disclosed to Landlord in writing prior to execution of this Lease.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 315,
    version: '1.0.0',
    lastReviewedDate: '2026-04-07',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ATTORNEY REPRESENTATION DISCLOSURE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-attorney-disclosure',
    leaseClass: 'commercial',
    category: 'core',
    title: 'Attorney Representation Disclosure',
    description:
      'Discloses that each party has had the opportunity to consult independent legal counsel; confirms the lease was negotiated at arm\'s length and shall not be construed against either drafter.',
    htmlContent: `<h3>Attorney Representation; Construction of Lease</h3>
<p>Each Party acknowledges that: (a) it has had the opportunity to consult with independent legal counsel of its choice prior to executing this Lease; (b) it has either obtained such counsel or has knowingly and voluntarily elected to proceed without the advice of independent legal counsel; and (c) it has read and understood the terms and conditions of this Lease and is entering into this Lease freely and voluntarily, without duress, coercion, or undue influence.</p>
<p>This Lease has been negotiated at arm&rsquo;s length between parties of equal bargaining power, each represented by (or having had the opportunity to be represented by) counsel of its choice. Accordingly, the rule of construction that ambiguities in a document shall be construed against the drafter shall not apply to this Lease, and no provision of this Lease shall be construed more strictly against one Party than the other by reason of the fact that such Party or its counsel drafted such provision. The Parties intend that this Lease shall be interpreted in a manner that gives effect to the mutual intent of the Parties as expressed herein.</p>`,
    isRequired: true,
    placeholders: [],
    sortOrder: 1850,
    version: '1.0.0',
    lastReviewedDate: '2026-04-22',
  },
];
