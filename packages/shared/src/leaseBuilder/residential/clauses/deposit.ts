import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Deposit Clauses — Security deposit, pet deposit, key/fob deposit,
 * non-refundable fees, and move-in checklist.
 * sortOrder: 300–399
 */
export const residentialDepositClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // SECURITY DEPOSIT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-deposit-security',
    leaseClass: 'residential',
    category: 'deposit',
    title: 'Security Deposit',
    description:
      "Sets the security deposit amount and explains Minnesota's 21-day return requirement, interest obligations, and the itemized deduction process.",
    htmlContent: `<h3>Security Deposit</h3>
<p>Upon execution of this Lease, Tenant shall pay to Landlord a security deposit in the amount of <strong>{{lease.securityDeposit}}</strong> (&ldquo;Security Deposit&rdquo;). The Security Deposit shall be held by Landlord as security for the faithful performance by Tenant of all terms, covenants, and conditions of this Lease.</p>
<p><strong>Permitted Deductions.</strong> Landlord may deduct from the Security Deposit amounts reasonably necessary to remedy Tenant defaults, including but not limited to:</p>
<ol>
  <li>Unpaid rent or other charges due under this Lease;</li>
  <li>Repair of damages to the Premises beyond normal wear and tear caused by Tenant, Tenant&rsquo;s guests, or Tenant&rsquo;s pets;</li>
  <li>Cleaning costs to restore the Premises to the condition at move-in, less normal wear and tear;</li>
  <li>Unpaid utility charges that are Tenant&rsquo;s responsibility under this Lease; and</li>
  <li>Other amounts permitted by Minnesota Statutes &sect; 504B.178.</li>
</ol>
<p><strong>Return of Deposit.</strong> In accordance with Minnesota Statutes &sect; 504B.178, Landlord shall return the Security Deposit, less any lawful deductions, within <strong>twenty-one (21) days</strong> after the termination of the tenancy and Tenant&rsquo;s surrender of the Premises. If Landlord withholds any portion of the Security Deposit, Landlord shall provide Tenant with a written statement itemizing the nature and amount of each deduction, along with the balance of the deposit, if any, within the same twenty-one (21) day period.</p>
<p><strong>Interest.</strong> Landlord shall pay interest on the Security Deposit at a rate required by Minnesota law, if applicable. Any interest accrued on the Security Deposit shall be paid to Tenant at the end of each lease year or upon return of the Security Deposit, as required by law.</p>
<p><strong>Deposit Location.</strong> The Security Deposit shall be held in a financial institution authorized to do business in the State of Minnesota. Landlord shall notify Tenant in writing of the name and address of the financial institution where the Security Deposit is held and the account number, if required by law.</p>
<p><strong>Transfer of Deposit.</strong> In the event of a sale or transfer of the Premises, Landlord may transfer the Security Deposit to the new owner, and Landlord shall thereupon be released from all liability for the return of the Security Deposit, provided the new owner assumes such obligation in writing.</p>
<p>The Security Deposit shall not be used by Tenant as payment for the last month&rsquo;s rent unless Landlord consents in writing.</p>`,
    isRequired: true,
    placeholders: ['lease.securityDeposit'],
    sortOrder: 300,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PET DEPOSIT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-deposit-pet',
    leaseClass: 'residential',
    category: 'deposit',
    title: 'Pet Deposit',
    description:
      'Requires an additional refundable deposit for approved pets. This deposit covers pet-related damages beyond normal wear and tear.',
    htmlContent: `<h3>Pet Deposit</h3>
<p>In addition to the Security Deposit, Tenant shall pay a refundable pet deposit in the amount of <strong>{{lease.petDeposit}}</strong> (&ldquo;Pet Deposit&rdquo;) upon execution of this Lease or upon approval of a pet, whichever occurs first.</p>
<p>The Pet Deposit shall be held by Landlord as security for any damages to the Premises caused by Tenant&rsquo;s approved pet(s), including but not limited to:</p>
<ol>
  <li>Damage to flooring, walls, doors, screens, or fixtures;</li>
  <li>Stains, odors, or contamination requiring professional cleaning or remediation;</li>
  <li>Damage to landscaping, common areas, or exterior features; and</li>
  <li>Pest treatment necessitated by Tenant&rsquo;s pet(s).</li>
</ol>
<p>The Pet Deposit shall be returned to Tenant within twenty-one (21) days after termination of the tenancy and surrender of the Premises, less any deductions for pet-related damages, in accordance with Minnesota Statutes &sect; 504B.178. Landlord shall provide an itemized statement of any deductions from the Pet Deposit.</p>
<p>This Pet Deposit does not apply to service animals or assistance animals as defined under federal and Minnesota law. No deposit shall be required for such animals.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.deposit.petDeposit',
        operator: 'exists',
        value: true,
      },
    ],
    placeholders: ['lease.petDeposit'],
    sortOrder: 310,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // KEY / FOB DEPOSIT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-deposit-keyfob',
    leaseClass: 'residential',
    category: 'deposit',
    title: 'Key / Fob Deposit',
    description:
      'Requires a refundable deposit for keys, access fobs, garage remotes, or other access devices issued to the tenant.',
    htmlContent: `<h3>Key / Access Device Deposit</h3>
<p>Tenant shall pay a refundable deposit of <strong>{{lease.keyFobDeposit}}</strong> (&ldquo;Key/Fob Deposit&rdquo;) for keys, access fobs, garage door remotes, and/or other access devices provided to Tenant at the commencement of the tenancy.</p>
<p>The Key/Fob Deposit shall be returned to Tenant upon return of all access devices in working condition at the end of the tenancy. If any access device is not returned, is lost, or is damaged beyond normal wear and tear, Landlord may deduct the replacement cost from the Key/Fob Deposit.</p>
<p>The following access devices are issued to Tenant:</p>
<p><strong>{{lease.accessDevicesList}}</strong></p>
<p>Tenant shall not duplicate any keys or access devices without Landlord&rsquo;s prior written consent. If Tenant is locked out, Tenant shall contact Landlord or the designated property manager for access; any locksmith fees incurred by Landlord due to Tenant&rsquo;s lockout shall be Tenant&rsquo;s responsibility.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.deposit.keyFobDeposit',
        operator: 'exists',
        value: true,
      },
    ],
    placeholders: ['lease.keyFobDeposit', 'lease.accessDevicesList'],
    sortOrder: 320,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NON-REFUNDABLE FEES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-deposit-nonrefundable',
    leaseClass: 'residential',
    category: 'deposit',
    title: 'Non-Refundable Fees',
    description:
      'Discloses any non-refundable fees charged at move-in. Minnesota law requires that non-refundable fees be clearly identified as such.',
    htmlContent: `<h3>Non-Refundable Fees</h3>
<p>In addition to the Security Deposit, Tenant shall pay the following non-refundable fee(s) upon execution of this Lease:</p>
<p><strong>{{lease.nonrefundableFeesList}}</strong></p>
<p><strong>Disclosure:</strong> The fee(s) listed above are <strong>NON-REFUNDABLE</strong> and will not be returned to Tenant at the end of the tenancy. These fee(s) are separate from and in addition to the Security Deposit and are not subject to the deposit return and itemization requirements of Minnesota Statutes &sect; 504B.178.</p>
<p>In accordance with Minnesota law, Landlord has clearly identified each fee above as non-refundable. No non-refundable fee shall be deducted from the Security Deposit; all non-refundable fees are collected independently and are earned by Landlord upon receipt.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.deposit.nonrefundableFees',
        operator: 'exists',
        value: true,
      },
    ],
    placeholders: ['lease.nonrefundableFeesList'],
    sortOrder: 330,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MOVE-IN CONDITION CHECKLIST
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-deposit-movein-checklist',
    leaseClass: 'residential',
    category: 'deposit',
    title: 'Move-In Condition Checklist',
    description:
      'Requires both parties to complete a move-in condition checklist documenting the state of the premises, which protects both landlord and tenant during deposit return.',
    htmlContent: `<h3>Move-In Condition Checklist</h3>
<p>Within the first <strong>seven (7) days</strong> after Tenant takes possession of the Premises, Landlord and Tenant shall jointly inspect the Premises and complete a written Move-In Condition Checklist (&ldquo;Checklist&rdquo;) documenting the condition of the Premises, including but not limited to walls, floors, fixtures, appliances, plumbing, doors, windows, and any furnishings provided.</p>
<p>Both Landlord and Tenant shall sign and date the Checklist. Each party shall retain a copy for their records. The Checklist shall serve as the baseline condition of the Premises for purposes of determining damages beyond normal wear and tear at the end of the tenancy.</p>
<p>If Tenant fails to participate in the move-in inspection or to return the signed Checklist within the seven (7) day period, Landlord&rsquo;s assessment of the move-in condition shall be deemed accepted by Tenant.</p>
<p>Photographs or video recordings taken during the move-in inspection are encouraged and may be attached to the Checklist as supplementary documentation.</p>
<p>At the conclusion of the tenancy, the Checklist shall be referenced when assessing any deductions from the Security Deposit, in accordance with Minnesota Statutes &sect; 504B.178.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.deposit.useMoveinChecklist',
        operator: 'equals',
        value: true,
      },
    ],
    placeholders: [],
    sortOrder: 340,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
