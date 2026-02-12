/**
 * Utilities Addendum Template (Shared Utility Disclosure)
 *
 * Addendum to the Minnesota Residential Lease Agreement detailing shared
 * utilities between units, the allocation method for each utility, estimated
 * costs, and billing cycle information.
 *
 * Placeholders:
 *   {{landlord.name}}                — Full legal name of the landlord
 *   {{tenant.names}}                 — Full legal name(s) of the tenant(s)
 *   {{property.address}}             — Street address of the rental property
 *   {{unit.number}}                  — Unit or apartment number
 *   {{utilities.sharedList}}         — HTML list/table of shared utilities
 *   {{utilities.allocationDetails}}  — HTML description of allocation method and estimated costs per utility
 *   {{lease.startDate}}              — Lease commencement date
 *   {{templateVersion}}              — Template version string
 *   {{generatedDate}}                — Date the document was generated
 */

export const UTILITIES_ADDENDUM_TEMPLATE: string = `
<div class="page-break"></div>

<div class="addendum-header">UTILITIES ADDENDUM</div>
<div class="addendum-subtitle">Shared Utility Disclosure &amp; Allocation Agreement</div>

<p>This Utilities Addendum (&ldquo;Addendum&rdquo;) is made and entered into as part of the Residential Lease
Agreement (&ldquo;Lease&rdquo;) dated <strong>{{lease.startDate}}</strong> by and between:</p>

<p><strong>Landlord:</strong> {{landlord.name}}</p>
<p><strong>Tenant(s):</strong> {{tenant.names}}</p>
<p><strong>Property:</strong> {{property.address}}, Unit {{unit.number}}</p>

<p>This Addendum is incorporated into and made a part of the Lease. In the event of any conflict between this
Addendum and the Lease, the terms of this Addendum shall control with respect to utility allocation and billing
matters.</p>

<h3>1. Purpose &amp; Statutory Basis</h3>
<p>This Addendum is provided in accordance with Minnesota Statutes &sect; 504B.215, which requires landlords to
disclose when utility services are shared among multiple dwelling units and to describe the method used to
allocate shared utility costs. Landlord is required to provide this disclosure before the Lease is signed or
within a reasonable time after the shared arrangement becomes known.</p>

<h3>2. Shared Utilities</h3>
<p>The following utilities serving the Premises are shared with one or more other dwelling units or common areas
within the building or property:</p>

{{utilities.sharedList}}

<h3>3. Allocation Method &amp; Estimated Costs</h3>
<p>Landlord allocates shared utility costs using the methods described below. Estimated monthly costs are provided
for informational purposes and are based on historical usage data. Actual costs may vary based on consumption,
rate changes by the utility provider, weather conditions, and occupancy levels.</p>

{{utilities.allocationDetails}}

<h3>4. Allocation Methods Defined</h3>
<p>For purposes of this Addendum, the following allocation methods are defined:</p>
<ol>
  <li><strong>RUBS &mdash; Ratio Utility Billing System (by Square Footage):</strong> Shared utility costs are
  divided among units based on the proportionate square footage of each unit relative to the total square
  footage of all units sharing the utility.</li>
  <li><strong>RUBS &mdash; Ratio Utility Billing System (by Occupant Count):</strong> Shared utility costs are
  divided among units based on the number of authorized occupants in each unit relative to the total number
  of authorized occupants across all units sharing the utility.</li>
  <li><strong>RUBS &mdash; Ratio Utility Billing System (Equal Split):</strong> Shared utility costs are divided
  equally among all units sharing the utility, regardless of unit size or occupancy.</li>
  <li><strong>Submetered:</strong> A submeter measures actual consumption for the unit, and Tenant is billed
  based on the submeter reading. The utility provider&rsquo;s rate schedule is applied to the submetered usage.</li>
  <li><strong>Fixed Monthly Amount:</strong> A predetermined fixed dollar amount is charged to Tenant each month
  for the utility, regardless of actual consumption. This amount is specified in the allocation details above.</li>
  <li><strong>Included in Rent:</strong> The cost of the utility is included in the monthly rent amount and no
  separate billing applies. Landlord may impose reasonable use limits to prevent waste.</li>
</ol>

<h3>5. Billing Cycle &amp; Payment</h3>
<p>Shared utility charges, where billed separately from rent, shall be invoiced to Tenant on a monthly basis.
Invoices shall be delivered to Tenant within thirty (30) days of Landlord&rsquo;s receipt of the utility bill
from the provider. Payment is due within fourteen (14) days of the date of the invoice or on the next rent
due date, whichever is later.</p>

<p>Upon written request by Tenant, Landlord shall provide a copy of the applicable utility bill from the
provider and a detailed calculation showing how Tenant&rsquo;s share was determined.</p>

<h3>6. Changes to Allocation</h3>
<p>Landlord shall not change the allocation method or materially change the estimated costs during the Lease
term without providing Tenant at least thirty (30) days&rsquo; advance written notice. Any change in allocation
method shall be based on a reasonable and transparent calculation.</p>

<h3>7. Tenant Responsibilities</h3>
<p>Tenant agrees to the following:</p>
<ol>
  <li><strong>Conservation.</strong> Tenant shall use utilities in a reasonable manner and shall not engage in
  wasteful or excessive consumption.</li>
  <li><strong>Reporting.</strong> Tenant shall promptly report to Landlord any utility malfunction, leak,
  plumbing issue, or other condition that may result in abnormal utility consumption.</li>
  <li><strong>Access.</strong> Tenant shall allow Landlord or the utility provider reasonable access to the
  Premises for the purpose of reading meters, installing submeters, or performing maintenance on utility
  systems, upon reasonable prior notice as required by Minnesota law.</li>
  <li><strong>Occupancy Changes.</strong> Tenant shall promptly notify Landlord in writing of any change in the
  number of occupants in the unit, as this may affect allocation calculations based on occupant count.</li>
</ol>

<h3>8. Dispute Resolution</h3>
<p>If Tenant believes the utility billing is inaccurate or unreasonable, Tenant shall notify Landlord in writing
within thirty (30) days of receiving the disputed invoice. Landlord shall review the calculation and respond
in writing within fourteen (14) days. Tenant shall continue to pay the undisputed portion of utility charges
while any dispute is pending.</p>

<h3>9. Landlord&rsquo;s Representations</h3>
<p>Landlord represents and warrants that:</p>
<ol>
  <li>The information regarding shared utilities provided in this Addendum is accurate and complete to the
  best of Landlord&rsquo;s knowledge.</li>
  <li>The allocation methods used are reasonable and not designed to generate profit for Landlord beyond the
  actual cost of the utilities.</li>
  <li>Landlord shall not charge Tenant for any administrative fee or markup on shared utility costs unless
  separately disclosed and agreed to in writing.</li>
</ol>

<h3>10. Signatures</h3>
<div class="signature-block">
  <p>By signing below, the parties acknowledge and agree to the utility sharing and allocation terms set forth
  in this Addendum. Tenant acknowledges receipt of this disclosure prior to or at the time of signing the Lease.</p>

  <p><strong>LANDLORD:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>
`;
