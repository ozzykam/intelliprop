/**
 * Move-In / Move-Out Condition Checklist Template
 *
 * A property condition checklist used at move-in and move-out to document
 * the condition of each room and area. Used for security deposit accounting
 * in accordance with Minnesota Statutes section 504B.178.
 *
 * Placeholders:
 *   {{landlord.name}}     — Full legal name of the landlord
 *   {{tenant.names}}      — Full legal name(s) of the tenant(s)
 *   {{property.address}}  — Street address of the rental property
 *   {{unit.number}}       — Unit or apartment number
 *   {{lease.startDate}}   — Lease commencement date
 *   {{templateVersion}}   — Template version string
 *   {{generatedDate}}     — Date the document was generated
 */

export const MOVE_IN_CHECKLIST_TEMPLATE: string = `
<div class="page-break"></div>

<div class="addendum-header">MOVE-IN / MOVE-OUT CONDITION CHECKLIST</div>
<div class="addendum-subtitle">Minnesota Residential Lease &mdash; Property Condition Report</div>

<p><strong>Landlord:</strong> {{landlord.name}}</p>
<p><strong>Tenant(s):</strong> {{tenant.names}}</p>
<p><strong>Property:</strong> {{property.address}}, Unit {{unit.number}}</p>
<p><strong>Lease Commencement Date:</strong> {{lease.startDate}}</p>

<h3>Purpose</h3>
<p>This checklist documents the condition of the Premises at the time of move-in and move-out. Both Landlord and
Tenant should conduct a thorough walk-through inspection together, noting the condition of each area and item
listed below. This checklist serves as the basis for security deposit deductions under Minnesota Statutes
&sect; 504B.178. Both parties should retain a signed copy for their records.</p>

<h3>Condition Rating Scale</h3>
<p>Use the following ratings to describe the condition of each item:</p>
<ul>
  <li><strong>E</strong> = Excellent (new or like-new condition)</li>
  <li><strong>G</strong> = Good (minor wear, fully functional)</li>
  <li><strong>F</strong> = Fair (moderate wear, functional but showing age)</li>
  <li><strong>P</strong> = Poor (significant wear, damage, or malfunction)</li>
  <li><strong>N/A</strong> = Not Applicable</li>
</ul>

<h3>Living Room / Main Area</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Walls &amp; Paint</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Ceiling</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Flooring / Carpet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Windows &amp; Screens</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Window Coverings / Blinds</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Doors &amp; Locks</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Light Fixtures</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Electrical Outlets &amp; Switches</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Baseboards &amp; Trim</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Smoke / CO Detectors</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Closets</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Kitchen</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Walls &amp; Paint</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Ceiling</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Flooring</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Countertops</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Cabinets &amp; Drawers</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Sink &amp; Faucet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Garbage Disposal</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Stove / Oven</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Range Hood / Exhaust Fan</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Refrigerator / Freezer</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Dishwasher</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Microwave</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Light Fixtures</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Electrical Outlets &amp; Switches</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Windows &amp; Screens</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Bathroom(s)</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Walls &amp; Paint</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Ceiling</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Flooring</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Bathtub / Shower</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Shower Door / Curtain Rod</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Toilet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Sink &amp; Faucet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Vanity / Cabinet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Mirror / Medicine Cabinet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Towel Bars / Hooks</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Exhaust Fan</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Light Fixtures</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Caulking &amp; Grout</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Electrical Outlets (GFCI)</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Bedroom(s)</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Walls &amp; Paint</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Ceiling</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Flooring / Carpet</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Windows &amp; Screens</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Window Coverings / Blinds</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Doors &amp; Locks</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Closets &amp; Closet Doors</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Light Fixtures</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Electrical Outlets &amp; Switches</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Baseboards &amp; Trim</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Smoke / CO Detectors</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Laundry Area (if applicable)</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Washer</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Dryer</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Hookups / Connections</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Flooring</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Dryer Vent</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Exterior / Garage / Storage (if applicable)</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Front Door &amp; Lock</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Back / Side Doors</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Porch / Deck / Patio</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Garage Door &amp; Opener</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Garage Interior</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Storage Area</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Driveway / Parking Area</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Landscaping / Yard</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Mailbox</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Exterior Lighting</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>General / Building Systems</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Move-In</th>
    <th style="width:25%">Move-In Notes</th>
    <th style="width:10%">Move-Out</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Heating System</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Air Conditioning</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Water Heater</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Thermostat</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Electrical Panel</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Sump Pump</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Doorbell / Intercom</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Keys &amp; Access Devices</h3>
<table>
  <tr>
    <th style="width:30%">Item</th>
    <th style="width:10%">Quantity</th>
    <th style="width:25%">Provided at Move-In</th>
    <th style="width:10%">Returned</th>
    <th style="width:25%">Move-Out Notes</th>
  </tr>
  <tr><td>Front Door Key</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Back / Side Door Key</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Mailbox Key</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Garage Door Opener / Key</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Storage Area Key</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Gate Key / Fob / Code</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Laundry Room Key / Card</td><td></td><td></td><td></td><td></td></tr>
  <tr><td>Other: ______________</td><td></td><td></td><td></td><td></td></tr>
</table>

<h3>Additional Notes</h3>
<table>
  <tr>
    <th style="width:50%">Move-In Comments</th>
    <th style="width:50%">Move-Out Comments</th>
  </tr>
  <tr>
    <td style="height:100px; vertical-align:top;"></td>
    <td style="height:100px; vertical-align:top;"></td>
  </tr>
</table>

<h3>Move-In Inspection</h3>
<div class="signature-block no-break">
  <p>We, the undersigned, have inspected the Premises on the date indicated below and agree that the condition
  ratings and notes above accurately reflect the condition of the Premises at the time of move-in.</p>

  <p><strong>Move-In Date:</strong> ___________________________________</p>

  <p><strong>LANDLORD / AGENT:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>

<h3>Move-Out Inspection</h3>
<div class="signature-block no-break">
  <p>We, the undersigned, have inspected the Premises on the date indicated below and agree that the condition
  ratings and notes above accurately reflect the condition of the Premises at the time of move-out.</p>

  <p><strong>Move-Out Date:</strong> ___________________________________</p>

  <p><strong>LANDLORD / AGENT:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>
`;
