/**
 * Smoking Addendum Template
 *
 * Addendum to the Minnesota Residential Lease Agreement governing smoking and
 * vaping on the premises. Covers the definition of smoking, prohibition or
 * designated-area policy, enforcement, and violation consequences.
 *
 * Placeholders:
 *   {{landlord.name}}            — Full legal name of the landlord
 *   {{tenant.names}}             — Full legal name(s) of the tenant(s)
 *   {{property.address}}         — Street address of the rental property
 *   {{unit.number}}              — Unit or apartment number
 *   {{smoking.policy}}           — "No Smoking" or "Designated Areas Only"
 *   {{smoking.designatedAreas}}  — Description of designated areas, or "N/A"
 *   {{lease.startDate}}          — Lease commencement date
 *   {{templateVersion}}          — Template version string
 *   {{generatedDate}}            — Date the document was generated
 */

export const SMOKING_ADDENDUM_TEMPLATE: string = `
<div class="page-break"></div>

<div class="addendum-header">SMOKING AND VAPING ADDENDUM</div>
<div class="addendum-subtitle">Addendum to Minnesota Residential Lease Agreement</div>

<p>This Smoking and Vaping Addendum (&ldquo;Addendum&rdquo;) is made and entered into as part of the Residential
Lease Agreement (&ldquo;Lease&rdquo;) dated <strong>{{lease.startDate}}</strong> by and between:</p>

<p><strong>Landlord:</strong> {{landlord.name}}</p>
<p><strong>Tenant(s):</strong> {{tenant.names}}</p>
<p><strong>Property:</strong> {{property.address}}, Unit {{unit.number}}</p>

<p>This Addendum is incorporated into and made a part of the Lease. In the event of any conflict between this
Addendum and the Lease, the terms of this Addendum shall control with respect to smoking and vaping matters.</p>

<h3>1. Purpose</h3>
<p>The purpose of this Addendum is to establish a policy regarding the use of tobacco products, electronic
cigarettes, and other smoking or vaping devices on the Premises and in common areas. This policy is intended to
protect the health and safety of all residents, reduce the risk of fire, minimize maintenance costs associated
with smoke damage, and ensure compliance with applicable Minnesota law, including the Minnesota Clean Indoor
Air Act (Minnesota Statutes &sect; 144.411&ndash;144.417).</p>

<h3>2. Definition of Smoking</h3>
<p>For purposes of this Addendum, &ldquo;smoking&rdquo; means the inhaling, exhaling, burning, carrying, or
possessing of any lighted or heated tobacco product or plant product, including but not limited to:</p>
<ol>
  <li>Cigarettes, cigars, cigarillos, pipes, and hookah</li>
  <li>Electronic cigarettes, e-cigarettes, vaporizers, vape pens, and all similar electronic nicotine delivery
  systems (ENDS), regardless of whether the substance vaporized contains nicotine</li>
  <li>Cannabis, marijuana, or any controlled substance that is smoked, vaped, or aerosolized (regardless of
  legal status under state law)</li>
  <li>Any other product that produces smoke, vapor, mist, or aerosol when inhaled</li>
</ol>

<h3>3. Smoking Policy</h3>
<p><strong>Policy Type:</strong> {{smoking.policy}}</p>

<p><strong>Designated Areas (if applicable):</strong> {{smoking.designatedAreas}}</p>

<h4>A. If Policy is &ldquo;No Smoking&rdquo;:</h4>
<p>Smoking is strictly prohibited in all areas of the Premises, including but not limited to:</p>
<ul>
  <li>All interior spaces of the dwelling unit, including bedrooms, bathrooms, kitchens, living areas, and closets</li>
  <li>All private outdoor areas associated with the unit, including balconies, patios, decks, porches, and garages</li>
  <li>All common areas, including hallways, stairwells, lobbies, elevators, laundry rooms, fitness rooms,
  community rooms, and parking structures</li>
  <li>All outdoor common areas within twenty-five (25) feet of any building entrance, window, or ventilation
  intake</li>
  <li>All vehicles parked on the Premises</li>
</ul>

<h4>B. If Policy is &ldquo;Designated Areas Only&rdquo;:</h4>
<p>Smoking is prohibited in all areas of the Premises except in the specifically designated smoking areas
identified above. When using designated smoking areas, Tenant shall:</p>
<ul>
  <li>Properly extinguish and dispose of all smoking materials in designated receptacles</li>
  <li>Not leave burning or smoldering materials unattended</li>
  <li>Not block any entrance, exit, or pathway while smoking</li>
  <li>Keep designated areas clean and free of debris</li>
</ul>

<h3>4. Tenant Responsibilities</h3>
<p>Tenant agrees to the following:</p>
<ol>
  <li><strong>Personal Compliance.</strong> Tenant, all household members, and all guests and invitees of Tenant
  shall comply with this smoking policy at all times.</li>
  <li><strong>Guest Notification.</strong> Tenant shall inform all guests and visitors of the smoking policy
  prior to or upon their arrival and shall ensure their compliance.</li>
  <li><strong>Odor &amp; Residue.</strong> Tenant shall not permit smoke, vapor, or odor from smoking to
  infiltrate other units, common areas, or any area where smoking is prohibited.</li>
  <li><strong>Fire Safety.</strong> Tenant shall not discard smoking materials in any manner that creates a fire
  hazard. All smoking materials must be fully extinguished and disposed of in non-combustible receptacles.</li>
  <li><strong>Reporting.</strong> Tenant shall promptly report any violations of the smoking policy observed on
  the Premises to Landlord in writing.</li>
</ol>

<h3>5. Landlord&rsquo;s Obligations</h3>
<p>Landlord shall take reasonable steps to enforce this smoking policy, including but not limited to:</p>
<ol>
  <li>Posting appropriate &ldquo;No Smoking&rdquo; signage in common areas</li>
  <li>Incorporating this Addendum into the lease of every tenant in the building</li>
  <li>Responding to complaints and taking enforcement action as described below</li>
</ol>
<p>Landlord does not guarantee that other residents or their guests will comply with this policy at all times.
Landlord&rsquo;s obligation is limited to taking reasonable steps to enforce the policy.</p>

<h3>6. Violations &amp; Enforcement</h3>
<p>A violation of this Addendum shall constitute a breach of the Lease. Landlord shall enforce this policy as
follows:</p>
<ol>
  <li><strong>First Violation:</strong> Written warning delivered to Tenant specifying the nature of the violation
  and reiterating the smoking policy.</li>
  <li><strong>Second Violation:</strong> Written notice of violation with a fine of $100.00, due within fourteen
  (14) days of the date of the notice.</li>
  <li><strong>Third and Subsequent Violations:</strong> Written notice of violation with a fine of $250.00, due
  within fourteen (14) days. Landlord may also require Tenant to professionally clean, deodorize, and restore
  any affected areas at Tenant&rsquo;s expense.</li>
  <li><strong>Chronic or Severe Violations:</strong> If Tenant incurs three (3) or more violations within any
  twelve (12) month period, or if a single violation causes significant damage or poses a safety hazard,
  Landlord may pursue termination of the Lease in accordance with Minnesota Statutes &sect; 504B.285.</li>
</ol>

<h3>7. Damage Liability</h3>
<p>Tenant shall be liable for all costs incurred by Landlord to repair, clean, or restore any portion of the
Premises or building that is damaged by Tenant&rsquo;s or Tenant&rsquo;s guests&rsquo; smoking in violation of
this Addendum, including but not limited to:</p>
<ul>
  <li>Painting and repainting of walls, ceilings, and trim</li>
  <li>Replacement of carpeting, flooring, or window coverings</li>
  <li>Professional cleaning and deodorizing, including ozone treatment</li>
  <li>Replacement of HVAC filters and cleaning of ductwork</li>
  <li>Fire damage repair and restoration</li>
</ul>
<p>Such costs may be deducted from Tenant&rsquo;s security deposit, and Tenant shall be liable for any amount
exceeding the deposit.</p>

<h3>8. Acknowledgment</h3>
<p>Tenant acknowledges and agrees that:</p>
<ol>
  <li>Tenant has read and understands this Smoking and Vaping Addendum.</li>
  <li>Tenant has had the opportunity to ask questions and seek clarification regarding this policy.</li>
  <li>Tenant voluntarily agrees to abide by this policy as a material term of the Lease.</li>
  <li>Landlord&rsquo;s adoption of this smoking policy does not guarantee a smoke-free environment but represents
  a good-faith effort to reduce the effects of smoking on the Premises.</li>
</ol>

<h3>9. Signatures</h3>
<div class="signature-block">
  <p>By signing below, the parties agree to the terms and conditions of this Smoking and Vaping Addendum.</p>

  <p><strong>LANDLORD:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>
`;
