/**
 * Parking Addendum Template
 *
 * Addendum to the Minnesota Residential Lease Agreement governing parking
 * on the premises. Covers assigned spaces, parking fees, guest parking,
 * rules, and towing policy.
 *
 * Placeholders:
 *   {{landlord.name}}         — Full legal name of the landlord
 *   {{tenant.names}}          — Full legal name(s) of the tenant(s)
 *   {{property.address}}      — Street address of the rental property
 *   {{unit.number}}           — Unit or apartment number
 *   {{parking.spaces}}        — Description of assigned parking space(s) (e.g., "Space #14, covered garage")
 *   {{parking.fee}}           — Monthly parking fee in dollars (e.g., "75.00"), or "Included in Rent"
 *   {{parking.guestParking}}  — Guest parking policy description
 *   {{lease.startDate}}       — Lease commencement date
 *   {{templateVersion}}       — Template version string
 *   {{generatedDate}}         — Date the document was generated
 */

export const PARKING_ADDENDUM_TEMPLATE: string = `
<div class="page-break"></div>

<div class="addendum-header">PARKING ADDENDUM</div>
<div class="addendum-subtitle">Addendum to Minnesota Residential Lease Agreement</div>

<p>This Parking Addendum (&ldquo;Addendum&rdquo;) is made and entered into as part of the Residential Lease
Agreement (&ldquo;Lease&rdquo;) dated <strong>{{lease.startDate}}</strong> by and between:</p>

<p><strong>Landlord:</strong> {{landlord.name}}</p>
<p><strong>Tenant(s):</strong> {{tenant.names}}</p>
<p><strong>Property:</strong> {{property.address}}, Unit {{unit.number}}</p>

<p>This Addendum is incorporated into and made a part of the Lease. In the event of any conflict between this
Addendum and the Lease, the terms of this Addendum shall control with respect to parking matters.</p>

<h3>1. Assigned Parking Space(s)</h3>
<p>Landlord hereby assigns the following parking space(s) to Tenant for the duration of the Lease:</p>
<p><strong>Assigned Space(s):</strong> {{parking.spaces}}</p>
<p>Tenant&rsquo;s right to the assigned parking space(s) is limited to the specific space(s) identified above.
Tenant shall not park in any space assigned to another tenant, in any unassigned reserved space, or in any area
designated as a fire lane, handicapped space (unless Tenant holds a valid permit), loading zone, or no-parking
zone.</p>

<h3>2. Parking Fee</h3>
<p><strong>Monthly Parking Fee:</strong> {{parking.fee}}</p>
<p>If a separate parking fee applies, the fee is due on the same date and in the same manner as the monthly rent.
Failure to pay the parking fee shall be treated as a failure to pay rent and may result in late fees and
enforcement action as described in the Lease. Landlord may adjust the parking fee upon renewal of the Lease
or, for month-to-month tenancies, with at least thirty (30) days&rsquo; written notice.</p>

<h3>3. Guest Parking</h3>
<p><strong>Guest Parking Policy:</strong> {{parking.guestParking}}</p>
<p>Tenant shall inform all guests and visitors of the guest parking policy prior to their arrival. Guests who
violate the parking policy may be subject to towing at the vehicle owner&rsquo;s expense.</p>

<h3>4. Vehicle Requirements</h3>
<p>All vehicles parked on the Premises must meet the following requirements:</p>
<ol>
  <li><strong>Registration &amp; Insurance.</strong> All vehicles must be currently registered with valid license
  plates and must be covered by liability insurance as required by Minnesota law.</li>
  <li><strong>Operable Condition.</strong> All vehicles must be in operable condition. Inoperable vehicles, defined
  as vehicles that cannot be started and safely driven under their own power, may not be stored on the Premises
  for more than seventy-two (72) hours.</li>
  <li><strong>Vehicle Types.</strong> Only standard passenger vehicles (cars, SUVs, pickup trucks, minivans, and
  motorcycles) are permitted unless Landlord provides prior written approval for other vehicle types. Commercial
  vehicles, recreational vehicles (RVs), campers, trailers, boats, and oversized vehicles are not permitted
  without Landlord&rsquo;s prior written consent.</li>
  <li><strong>Vehicle Registration with Landlord.</strong> Tenant shall register all vehicles parked on the Premises
  with Landlord, including the make, model, color, year, and license plate number. Tenant shall promptly
  update this information if any vehicle information changes.</li>
</ol>

<h3>5. Parking Rules</h3>
<p>Tenant agrees to abide by the following parking rules:</p>
<ol>
  <li><strong>Speed Limit.</strong> The speed limit on the Premises is 10 miles per hour at all times.</li>
  <li><strong>No Double Parking.</strong> Vehicles shall not be double-parked or parked in a manner that blocks
  other vehicles or impedes traffic flow.</li>
  <li><strong>No Vehicle Repair.</strong> Tenant shall not perform vehicle repairs, maintenance, or oil changes
  on the Premises, except for minor emergency repairs (such as changing a flat tire) that are completed within
  a few hours.</li>
  <li><strong>No Storage.</strong> Parking spaces shall be used for parking operable vehicles only. Tenant shall
  not use parking spaces for storage of personal property, furniture, equipment, or materials.</li>
  <li><strong>Cleanliness.</strong> Tenant shall keep the assigned parking space clean and free of debris, oil
  stains, and automotive fluids. Tenant shall be responsible for the cost of cleaning or repairing any damage
  caused by Tenant&rsquo;s vehicle.</li>
  <li><strong>Snow Removal.</strong> Tenant shall cooperate with snow removal operations by moving vehicles when
  requested by Landlord. If Tenant fails to move a vehicle after reasonable notice, Landlord may have the
  vehicle towed at Tenant&rsquo;s expense to facilitate snow removal.</li>
  <li><strong>Noise.</strong> Tenant shall not idle engines, honk horns, or play loud music in the parking area,
  particularly between the hours of 10:00 p.m. and 7:00 a.m.</li>
  <li><strong>Electric Vehicle Charging.</strong> Tenant shall not use exterior electrical outlets for charging
  electric vehicles unless Landlord has designated specific outlets or charging stations for that purpose.
  Use of unauthorized electrical outlets for vehicle charging is prohibited.</li>
</ol>

<h3>6. Towing Policy</h3>
<p>Landlord reserves the right to tow any vehicle from the Premises at the vehicle owner&rsquo;s expense
under the following circumstances:</p>
<ol>
  <li>The vehicle is parked in a fire lane, handicapped space (without a valid permit), loading zone, or
  no-parking zone.</li>
  <li>The vehicle is blocking another vehicle, a driveway, a sidewalk, or an emergency access route.</li>
  <li>The vehicle is unregistered, inoperable, or abandoned (not moved for more than seventy-two hours and
  appearing to be abandoned).</li>
  <li>The vehicle is parked in a space assigned to another tenant.</li>
  <li>The vehicle is an unauthorized type (e.g., commercial vehicle, RV) parked without Landlord&rsquo;s
  written consent.</li>
  <li>Towing is necessary for snow removal, paving, maintenance, or emergency repairs, and Tenant has failed
  to move the vehicle after receiving reasonable notice.</li>
</ol>
<p>Landlord shall comply with all applicable Minnesota towing statutes, including Minnesota Statutes &sect; 168B.035
and &sect; 168B.04, which govern notice requirements and procedures for towing vehicles from private property.
Appropriate towing signs shall be posted on the Premises in accordance with state law.</p>

<h3>7. Liability &amp; Insurance</h3>
<p>Landlord is not responsible for theft of, damage to, or vandalism of any vehicle or its contents while
parked on the Premises, except to the extent caused by Landlord&rsquo;s negligence. Tenant assumes all risk
of loss for vehicles and their contents. Tenant is encouraged to maintain comprehensive and collision
coverage on all vehicles.</p>

<p>Tenant shall be liable for any damage to the Premises, building structures, other vehicles, or persons
caused by Tenant&rsquo;s vehicle or the vehicles of Tenant&rsquo;s guests.</p>

<h3>8. Termination of Parking Privilege</h3>
<p>Landlord may revoke Tenant&rsquo;s parking privileges for repeated or material violations of this Addendum
upon fourteen (14) days&rsquo; written notice. Revocation of parking privileges does not terminate the Lease
but does terminate Tenant&rsquo;s right to park on the Premises. If a separate parking fee was being charged,
the fee will cease upon revocation. Tenant shall have no claim for refund of previously paid parking fees.</p>

<h3>9. Signatures</h3>
<div class="signature-block">
  <p>By signing below, the parties agree to the terms and conditions of this Parking Addendum.</p>

  <p><strong>LANDLORD:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>
`;
