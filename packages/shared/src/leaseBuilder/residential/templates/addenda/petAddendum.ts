/**
 * Pet Addendum Template
 *
 * Addendum to the Minnesota Residential Lease Agreement governing the keeping
 * of pets on the premises. Covers pet type, breed, weight limits, pet rent,
 * pet deposit, behavior expectations, damage liability, removal for violations,
 * and service/assistance animal acknowledgment.
 *
 * Placeholders:
 *   {{landlord.name}}       — Full legal name of the landlord
 *   {{tenant.names}}        — Full legal name(s) of the tenant(s)
 *   {{property.address}}    — Street address of the rental property
 *   {{unit.number}}         — Unit or apartment number
 *   {{pet.maxPets}}         — Maximum number of pets allowed
 *   {{pet.allowedTypes}}    — Comma-separated list of allowed pet types (e.g., "dogs, cats")
 *   {{pet.weightLimit}}     — Maximum weight per pet in pounds
 *   {{pet.petRent}}         — Monthly pet rent amount in dollars
 *   {{pet.petDeposit}}      — One-time pet deposit amount in dollars
 *   {{pet.restrictedBreeds}} — Comma-separated list of restricted breeds, or "None"
 *   {{lease.startDate}}     — Lease commencement date
 *   {{templateVersion}}     — Template version string
 *   {{generatedDate}}       — Date the document was generated
 */

export const PET_ADDENDUM_TEMPLATE: string = `
<div class="page-break"></div>

<div class="addendum-header">PET ADDENDUM</div>
<div class="addendum-subtitle">Addendum to Minnesota Residential Lease Agreement</div>

<p>This Pet Addendum (&ldquo;Addendum&rdquo;) is made and entered into as part of the Residential Lease Agreement
(&ldquo;Lease&rdquo;) dated <strong>{{lease.startDate}}</strong> by and between:</p>

<p><strong>Landlord:</strong> {{landlord.name}}</p>
<p><strong>Tenant(s):</strong> {{tenant.names}}</p>
<p><strong>Property:</strong> {{property.address}}, Unit {{unit.number}}</p>

<p>This Addendum is incorporated into and made a part of the Lease. In the event of any conflict between this
Addendum and the Lease, the terms of this Addendum shall control with respect to pet-related matters.</p>

<h3>1. Pet Policy</h3>
<p>Landlord agrees to permit Tenant to keep domesticated pets on the Premises subject to all of the terms and
conditions set forth in this Addendum. Tenant acknowledges that this permission is conditional and may be
revoked for violations as described herein.</p>

<h3>2. Authorized Pets</h3>
<p><strong>Maximum Number of Pets:</strong> {{pet.maxPets}}</p>
<p><strong>Allowed Pet Types:</strong> {{pet.allowedTypes}}</p>
<p><strong>Maximum Weight Per Pet:</strong> {{pet.weightLimit}} pounds</p>
<p><strong>Restricted Breeds:</strong> {{pet.restrictedBreeds}}</p>

<p>Tenant must register each pet with Landlord prior to bringing the pet onto the Premises. Registration shall
include the pet&rsquo;s name, type, breed, color, approximate weight, and age. Tenant shall provide current
vaccination records and proof of licensing as required by applicable local ordinances. Tenant shall promptly
notify Landlord of any change in pet status, including acquisition of a new pet, loss of a pet, or a
significant change in a pet&rsquo;s health or behavior.</p>

<h3>3. Pet Rent &amp; Pet Deposit</h3>
<p><strong>Monthly Pet Rent:</strong> {{pet.petRent}} per month, due on the same date and in the same manner as
regular monthly rent.</p>
<p><strong>Pet Deposit:</strong> {{pet.petDeposit}}, due at the time of execution of this Addendum. The pet
deposit is a separate deposit from the security deposit required under the Lease. The pet deposit shall be held
and returned in accordance with Minnesota Statutes &sect; 504B.178, subject to deductions for pet-related
damages beyond normal wear and tear.</p>

<p>Pet rent is non-refundable and compensates Landlord for the additional wear, maintenance, and risk associated
with pets on the Premises. Pet rent does not limit Tenant&rsquo;s liability for damages caused by any pet.</p>

<h3>4. Pet Behavior &amp; Tenant Responsibilities</h3>
<p>Tenant agrees to the following obligations regarding all pets kept on the Premises:</p>
<ol>
  <li><strong>Supervision.</strong> Pets shall be under Tenant&rsquo;s control at all times. Dogs must be leashed
  in all common areas, hallways, stairwells, and outdoor shared spaces.</li>
  <li><strong>Noise.</strong> Tenant shall ensure that pets do not create unreasonable noise disturbances,
  including but not limited to excessive barking, howling, or whining, particularly during quiet hours
  (10:00 p.m. to 7:00 a.m.).</li>
  <li><strong>Waste Removal.</strong> Tenant shall immediately clean up and properly dispose of all pet waste,
  both inside and outside the Premises and in all common areas. Tenant shall not dispose of pet waste in
  toilets or common-area trash receptacles unless designated for such use.</li>
  <li><strong>Sanitation.</strong> Tenant shall maintain the Premises in a clean and sanitary condition at all
  times. Litter boxes, cages, aquariums, and other pet enclosures must be cleaned regularly to prevent
  odors, pest infestations, and unsanitary conditions.</li>
  <li><strong>Property Protection.</strong> Tenant shall not permit pets to damage any portion of the Premises
  or common areas, including but not limited to carpets, flooring, doors, trim, walls, window coverings,
  landscaping, or exterior surfaces.</li>
  <li><strong>Vaccinations &amp; Licensing.</strong> Tenant shall keep all pets current on vaccinations required
  by law and shall comply with all applicable state, county, and municipal licensing requirements. Tenant shall
  provide Landlord with updated vaccination and licensing records upon request.</li>
  <li><strong>No Breeding.</strong> Tenant shall not breed any pet on the Premises or allow any pet to produce
  offspring on the Premises without prior written consent of Landlord.</li>
  <li><strong>Outdoor Restrictions.</strong> Pets shall not be tied up, chained, or left unattended on balconies,
  patios, porches, or in common areas. Pets shall not be allowed to roam freely in any outdoor area unless
  the area is fully fenced and designated for off-leash use.</li>
</ol>

<h3>5. Damage Liability</h3>
<p>Tenant shall be fully liable for any and all damage to the Premises, common areas, or property of other
residents caused by Tenant&rsquo;s pet(s), including but not limited to:</p>
<ul>
  <li>Stains, odors, scratches, and chewing damage to flooring, walls, doors, trim, and fixtures</li>
  <li>Flea, tick, or other pest infestations attributed to Tenant&rsquo;s pet(s)</li>
  <li>Damage to landscaping, irrigation systems, and exterior surfaces</li>
  <li>Injuries to persons or other animals caused by Tenant&rsquo;s pet(s)</li>
</ul>
<p>Tenant agrees to pay for all such damages promptly upon demand. Landlord may deduct the cost of pet-related
damages from the pet deposit and/or the security deposit. If the cost of damages exceeds the total deposits
held, Tenant shall be liable for the excess amount.</p>

<p>Tenant agrees to maintain renter&rsquo;s insurance or personal liability insurance that covers pet-related
incidents, including bites and property damage. Tenant shall provide proof of such coverage upon request.</p>

<h3>6. Violations &amp; Removal</h3>
<p>A violation of any term of this Addendum shall constitute a breach of the Lease. Upon discovery of a
violation, Landlord shall provide Tenant with written notice specifying the nature of the violation.
Tenant shall have the following cure periods:</p>
<ul>
  <li><strong>Noise or behavioral violations:</strong> Tenant shall have seventy-two (72) hours from receipt
  of written notice to cure the violation.</li>
  <li><strong>Unauthorized pet or exceeding pet limits:</strong> Tenant shall have seven (7) days from receipt
  of written notice to remove the unauthorized pet from the Premises.</li>
  <li><strong>Damage or sanitation violations:</strong> Tenant shall have seven (7) days from receipt of
  written notice to remedy the condition and pay for any required repairs or cleaning.</li>
</ul>

<p>If Tenant fails to cure a violation within the applicable cure period, or if Tenant incurs three (3) or
more pet-related violations during the Lease term, Landlord may require permanent removal of the pet from the
Premises within fourteen (14) days of written notice. Failure to remove the pet as required shall constitute a
material breach of the Lease, and Landlord may pursue all remedies available under Minnesota law, including but
not limited to termination of the Lease.</p>

<p>In the event a pet poses an immediate threat to the health or safety of any person, Landlord may require
immediate removal of the pet and may contact animal control or law enforcement as necessary.</p>

<h3>7. Service &amp; Assistance Animal Acknowledgment</h3>
<p>Landlord and Tenant acknowledge that this Addendum does not apply to service animals as defined under the
Americans with Disabilities Act (ADA) or assistance animals (including emotional support animals) as
recognized under the Fair Housing Act (FHA) and Minnesota Human Rights Act (Minnesota Statutes Chapter 363A).
Landlord shall not charge pet rent, pet deposits, or impose breed or weight restrictions on verified service
or assistance animals.</p>

<p>If Tenant requires a service or assistance animal, Tenant should contact Landlord to request a reasonable
accommodation. Landlord may request reliable documentation of Tenant&rsquo;s disability-related need for the
animal from a qualified healthcare provider, consistent with applicable federal and state law.</p>

<h3>8. Indemnification</h3>
<p>Tenant shall indemnify, defend, and hold harmless Landlord and Landlord&rsquo;s agents, employees, and
contractors from and against any and all claims, demands, actions, damages, losses, costs, liabilities, and
expenses (including reasonable attorney&rsquo;s fees) arising out of or related to Tenant&rsquo;s pet(s),
including but not limited to personal injuries, property damage, and nuisance complaints.</p>

<h3>9. Signatures</h3>
<div class="signature-block">
  <p>By signing below, the parties agree to the terms and conditions of this Pet Addendum.</p>

  <p><strong>LANDLORD:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>
`;
