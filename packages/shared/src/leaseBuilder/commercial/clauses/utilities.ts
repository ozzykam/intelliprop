import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Utility Clauses — Utility responsibilities for Minnesota commercial leases.
 * sortOrder: 500–549
 */
export const commercialUtilityClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY RESPONSIBILITIES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-utilities',
    leaseClass: 'commercial',
    category: 'utilities',
    title: 'Utility Responsibilities',
    description:
      'Defines which party is responsible for obtaining and paying for utility services to the premises, including electricity, gas, water, sewer, trash, telecommunications, and other services.',
    htmlContent: `<h3>Utilities</h3>
<p><strong>Utility Responsibility.</strong> The responsibility for obtaining and paying for utility services to the Premises shall be allocated between Landlord and Tenant as follows: <strong>{{lease.utilityResponsibilityDescription}}</strong>.</p>
<p><strong>Tenant-Paid Utilities.</strong> For all utilities designated as Tenant&rsquo;s responsibility, Tenant shall:</p>
<ol>
  <li>Contract directly with the applicable utility providers in Tenant&rsquo;s name and at Tenant&rsquo;s sole cost and expense;</li>
  <li>Pay all charges, deposits, connection fees, and other costs associated with establishing and maintaining utility service;</li>
  <li>Maintain utility service in good standing throughout the Term; and</li>
  <li>Ensure that all utility accounts are current and paid in full upon the expiration or earlier termination of this Lease.</li>
</ol>
<p><strong>Landlord-Paid Utilities.</strong> For all utilities designated as Landlord&rsquo;s responsibility, Landlord shall provide such utility services to the Premises during normal business hours (Monday through Friday, 8:00 a.m. to 6:00 p.m., excluding holidays) in quantities and at levels consistent with comparable commercial buildings in the market area. Tenant&rsquo;s share of Landlord-paid utility costs may be included in Operating Expenses as provided elsewhere in this Lease.</p>
<p><strong>Shared Utilities.</strong> If any utility services to the Premises are not separately metered, the cost of such shared utility services shall be allocated between Landlord and Tenant as follows: {{lease.sharedUtilityAllocation}}.</p>
<p><strong>After-Hours Usage.</strong> If Tenant requires utility services (including HVAC) outside of normal business hours, Tenant shall provide Landlord with reasonable advance notice, and Tenant shall pay the actual cost of providing such after-hours services at Landlord&rsquo;s then-current rates.</p>
<p><strong>Excessive Consumption.</strong> If Tenant&rsquo;s use of any utility materially exceeds the usage levels of a typical tenant for comparable premises, Landlord may, at Landlord&rsquo;s election: (a) require Tenant to install a separate meter for such utility at Tenant&rsquo;s sole cost and expense; or (b) charge Tenant for the estimated excess usage based on a reasonable methodology determined by Landlord.</p>
<p><strong>Interruption of Service.</strong> Landlord shall not be liable for any interruption, failure, or inadequacy of any utility service, except to the extent caused by Landlord&rsquo;s gross negligence or willful misconduct. No such interruption shall constitute a constructive eviction, give rise to any claim for damages, or entitle Tenant to any abatement or reduction of Rent, except as follows: if any utility service for which Landlord is responsible is interrupted for more than five (5) consecutive business days due to causes within Landlord&rsquo;s reasonable control, and such interruption renders the Premises materially unsuitable for Tenant&rsquo;s Permitted Use, then Tenant&rsquo;s Base Rent shall abate proportionally from the sixth (6th) business day of such interruption until utility service is restored.</p>
<p><strong>Sustainability.</strong> Tenant shall cooperate with Landlord in any reasonable energy conservation, recycling, or sustainability programs implemented by Landlord for the Building.</p>`,
    isRequired: true,
    placeholders: [
      'lease.utilityResponsibilityDescription',
      'lease.sharedUtilityAllocation',
    ],
    sortOrder: 500,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY INTERRUPTION ABATEMENT — NARROW SCOPE
  // Abatement only when interruption is caused by Landlord's gross negligence
  // or willful misconduct. Acts of God, utility provider failures, and all
  // other causes outside Landlord's control do NOT qualify.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-utility-interruption-abatement-narrow',
    leaseClass: 'commercial',
    category: 'utilities',
    title: 'Utility Interruption — Rent Abatement (Narrow)',
    description:
      'Rent abates only if the utility interruption was directly caused by Landlord\'s gross negligence or willful misconduct. All other causes — acts of God, utility provider failures, force majeure — are excluded.',
    htmlContent: `<h3>Utility Interruption &mdash; Rent Abatement</h3>
<p>Notwithstanding any other provision of this Lease, in the event that any utility service (including without limitation electricity, gas, water, sewer, heating, ventilation, or air conditioning) serving the Premises is interrupted, discontinued, or rendered inadequate for Tenant&rsquo;s Permitted Use for more than <strong>{{lease.utilityInterruptionAbatementDays}}</strong> consecutive calendar days (the &ldquo;Abatement Threshold&rdquo;), and such interruption:</p>
<ol>
  <li>was not caused by the negligence, willful act, or omission of Tenant, its agents, employees, contractors, or invitees;</li>
  <li>is not the result of Tenant&rsquo;s failure to pay utility charges for which Tenant is responsible;</li>
  <li>renders all or a material portion of the Premises untenantable for the conduct of Tenant&rsquo;s Permitted Use; <strong>and</strong></li>
  <li>was directly and proximately caused by Landlord&rsquo;s gross negligence or willful misconduct in the operation or maintenance of the Building&rsquo;s utility systems or infrastructure &mdash;</li>
</ol>
<p>then all Base Rent and additional rent payable under this Lease shall fully abate beginning on the first day after the Abatement Threshold has been exceeded and continuing until such utility service is substantially restored to the Premises. For the avoidance of doubt, rent abatement shall <strong>not</strong> be triggered by any interruption caused by acts of God, natural disasters, storms, governmental action or regulation, utility provider outages or failures, Force Majeure Events (as defined in this Lease), or any other cause beyond Landlord&rsquo;s reasonable control, even if such interruption renders the Premises untenantable.</p>
<p>Tenant shall provide Landlord with prompt written notice of any utility interruption that Tenant believes may trigger the abatement provisions of this Section. Landlord shall use commercially reasonable efforts to restore such utility service as promptly as practicable following receipt of notice.</p>
<p>The rent abatement rights provided in this Section shall constitute Tenant&rsquo;s sole and exclusive remedy for utility interruptions, and shall not be construed as a constructive eviction, termination, or other breach by Landlord unless the utility interruption continues for more than ninety (90) consecutive days and was caused by Landlord&rsquo;s gross negligence or willful misconduct, in which case either Party may terminate this Lease upon written notice to the other Party.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.operations.utilityInterruptionAbatementDays', operator: 'gt', value: 0 },
      { field: 'commercial.operations.utilityAbatementScope', operator: 'equals', value: 'narrow' },
    ],
    placeholders: ['lease.utilityInterruptionAbatementDays'],
    sortOrder: 505,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY INTERRUPTION ABATEMENT — MODERATE SCOPE
  // Abatement when interruption is within Landlord's reasonable control
  // (maintenance failures, contractor damage, Landlord negligence).
  // Acts of God, third-party utility provider outages, and force majeure
  // events are explicitly excluded.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-utility-interruption-abatement-moderate',
    leaseClass: 'commercial',
    category: 'utilities',
    title: 'Utility Interruption — Rent Abatement (Moderate)',
    description:
      'Rent abates when the interruption is within Landlord\'s reasonable control (e.g., maintenance failure, Landlord negligence). Explicitly excludes acts of God, utility provider outages, government action, and other force majeure events.',
    htmlContent: `<h3>Utility Interruption &mdash; Rent Abatement</h3>
<p>Notwithstanding any other provision of this Lease, in the event that any utility service (including without limitation electricity, gas, water, sewer, heating, ventilation, or air conditioning) serving the Premises is interrupted, discontinued, or rendered inadequate for Tenant&rsquo;s Permitted Use for more than <strong>{{lease.utilityInterruptionAbatementDays}}</strong> consecutive calendar days (the &ldquo;Abatement Threshold&rdquo;), and such interruption:</p>
<ol>
  <li>was not caused by the negligence, willful act, or omission of Tenant, its agents, employees, contractors, or invitees;</li>
  <li>is not the result of Tenant&rsquo;s failure to pay utility charges for which Tenant is responsible;</li>
  <li>renders all or a material portion of the Premises untenantable for the conduct of Tenant&rsquo;s Permitted Use; <strong>and</strong></li>
  <li>was caused by a condition within Landlord&rsquo;s reasonable control to prevent or cure, including without limitation Landlord&rsquo;s failure to maintain Building systems, Landlord&rsquo;s negligence, or the acts or omissions of a contractor retained by Landlord &mdash;</li>
</ol>
<p>then all Base Rent and additional rent payable under this Lease shall fully abate beginning on the first day after the Abatement Threshold has been exceeded and continuing until such utility service is substantially restored to the Premises. For the avoidance of doubt, rent abatement shall <strong>not</strong> be triggered by any interruption caused by acts of God, natural disasters, storms or other weather events, governmental action or regulation, utility provider outages or failures originating outside the Building, Force Majeure Events (as defined in this Lease), or any other cause beyond Landlord&rsquo;s reasonable control, even if such interruption renders the Premises untenantable.</p>
<p>Tenant shall provide Landlord with prompt written notice of any utility interruption that Tenant believes may trigger the abatement provisions of this Section. Landlord shall use commercially reasonable efforts to restore such utility service as promptly as practicable following receipt of notice.</p>
<p>The rent abatement rights provided in this Section shall constitute Tenant&rsquo;s sole and exclusive remedy for utility interruptions, and shall not be construed as a constructive eviction, termination, or other breach by Landlord unless the utility interruption continues for more than ninety (90) consecutive days due to a cause within Landlord&rsquo;s reasonable control, in which case either Party may terminate this Lease upon written notice to the other Party.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.operations.utilityInterruptionAbatementDays', operator: 'gt', value: 0 },
      { field: 'commercial.operations.utilityAbatementScope', operator: 'equals', value: 'moderate' },
    ],
    placeholders: ['lease.utilityInterruptionAbatementDays'],
    sortOrder: 505,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY INTERRUPTION ABATEMENT — BROAD SCOPE
  // Abatement for any qualifying interruption not caused by Tenant,
  // regardless of whether the cause is within Landlord's control.
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'comm-utility-interruption-abatement-broad',
    leaseClass: 'commercial',
    category: 'utilities',
    title: 'Utility Interruption — Rent Abatement (Broad)',
    description:
      'Rent abates for any qualifying utility interruption not caused by Tenant, including acts of God and utility provider failures — no exclusion for causes outside Landlord\'s control.',
    htmlContent: `<h3>Utility Interruption &mdash; Rent Abatement</h3>
<p>Notwithstanding any other provision of this Lease, in the event that any utility service (including without limitation electricity, gas, water, sewer, heating, ventilation, or air conditioning) serving the Premises is interrupted, discontinued, or rendered inadequate for Tenant&rsquo;s Permitted Use for more than <strong>{{lease.utilityInterruptionAbatementDays}}</strong> consecutive calendar days (the &ldquo;Abatement Threshold&rdquo;), and such interruption:</p>
<ol>
  <li>was not caused by the negligence, willful act, or omission of Tenant, its agents, employees, contractors, or invitees;</li>
  <li>is not the result of Tenant&rsquo;s failure to pay utility charges for which Tenant is responsible; <strong>and</strong></li>
  <li>renders all or a material portion of the Premises untenantable for the conduct of Tenant&rsquo;s Permitted Use &mdash;</li>
</ol>
<p>then all Base Rent and additional rent payable under this Lease shall fully abate beginning on the first day after the Abatement Threshold has been exceeded and continuing until such utility service is substantially restored to the Premises. Rent abatement under this Section applies regardless of whether the cause of the interruption is within Landlord&rsquo;s control, including without limitation interruptions caused by acts of God, natural disasters, utility provider outages, or governmental action, except where such interruption is caused by Tenant as set forth above.</p>
<p>Tenant shall provide Landlord with prompt written notice of any utility interruption that Tenant believes may trigger the abatement provisions of this Section. Landlord shall use commercially reasonable efforts to restore such utility service as promptly as practicable following receipt of notice.</p>
<p>The rent abatement rights provided in this Section shall constitute Tenant&rsquo;s sole and exclusive remedy for utility interruptions, and shall not be construed as a constructive eviction, termination, or other breach by Landlord unless the utility interruption continues for more than ninety (90) consecutive days, in which case either Party may terminate this Lease upon written notice to the other Party.</p>`,
    isRequired: false,
    conditions: [
      { field: 'commercial.operations.utilityInterruptionAbatementDays', operator: 'gt', value: 0 },
      { field: 'commercial.operations.utilityAbatementScope', operator: 'equals', value: 'broad' },
    ],
    placeholders: ['lease.utilityInterruptionAbatementDays'],
    sortOrder: 505,
    version: '1.0.0',
    lastReviewedDate: '2026-04-21',
  },
];
