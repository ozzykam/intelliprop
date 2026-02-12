export const WORK_LETTER_ADDENDUM_TEMPLATE = `
<div class="page-break"></div>
<h1>EXHIBIT: WORK LETTER AGREEMENT</h1>
<p><em>Addendum to Commercial Lease Agreement dated {{leaseDate}}</em></p>

<p>This Work Letter Agreement ("Work Letter") is entered into between {{landlord.name}} ("Landlord") and {{tenant.name}} ("Tenant") as part of the Commercial Lease Agreement for the premises located at {{property.address}}, Suite/Unit {{unit.number}} (the "Premises").</p>

<h3>1. SCOPE OF WORK</h3>

<p>Landlord and Tenant agree that the following tenant improvement work (the "Work") shall be performed to the Premises prior to or following the Commencement Date:</p>

<p>{{commercial.useAndBuildout.workLetterDescription}}</p>

<h3>2. CONSTRUCTION MANAGEMENT</h3>

<p>The Work shall be managed and overseen by: <strong>{{commercial.useAndBuildout.tiConstructionManagedBy}}</strong>.</p>

<p><strong>If Landlord-Managed:</strong> Landlord shall engage qualified, licensed contractors to perform the Work. Landlord shall provide Tenant with a preliminary construction schedule within fifteen (15) days of lease execution. Landlord shall use commercially reasonable efforts to complete the Work by the Substantial Completion Date (defined below). Tenant shall have the right to review and approve the contractor selection, such approval not to be unreasonably withheld.</p>

<p><strong>If Tenant-Managed:</strong> Tenant shall engage qualified, licensed contractors approved by Landlord (such approval not to be unreasonably withheld) to perform the Work. All contractors must carry insurance in amounts and types required by Landlord. Tenant shall provide Landlord with copies of all contractor licenses, insurance certificates, and lien waivers. Landlord shall have the right to inspect the Work at any reasonable time.</p>

<h3>3. PLANS AND SPECIFICATIONS</h3>

<ol type="a">
  <li>Tenant shall submit detailed plans and specifications for the Work to Landlord for approval within thirty (30) days of lease execution.</li>
  <li>Landlord shall approve or provide written comments on the plans within fifteen (15) days of receipt.</li>
  <li>If Landlord requires modifications, Tenant shall revise and resubmit within ten (10) days.</li>
  <li>No Work shall commence until Landlord has provided final written approval of the plans and specifications.</li>
  <li>Any changes to approved plans must receive Landlord's prior written consent.</li>
</ol>

<h3>4. PERMITS AND APPROVALS</h3>

<p>All permits and governmental approvals required for the Work shall be obtained by: <strong>{{commercial.useAndBuildout.workLetterPermitResponsibility}}</strong>, at the cost of the party responsible for construction management. The responsible party shall provide copies of all permits to the other party prior to commencement of Work.</p>

<h3>5. TENANT IMPROVEMENT ALLOWANCE</h3>

<p>Landlord shall provide a tenant improvement allowance in the amount of <strong>{{commercial.useAndBuildout.tiAllowance}}</strong> (the "TI Allowance") toward the cost of the Work.</p>

<ol type="a">
  <li><strong>Scope:</strong> The TI Allowance may be applied toward {{commercial.useAndBuildout.tiAllowanceScope}}.</li>
  <li><strong>Disbursement:</strong> The TI Allowance shall be disbursed upon completion of the Work, receipt of final lien waivers from all contractors and subcontractors, and Tenant's submission of paid invoices documenting the costs incurred.</li>
  <li><strong>Excess Costs:</strong> Any costs in excess of the TI Allowance shall be the sole responsibility of Tenant.</li>
  <li><strong>Unused Allowance:</strong> Any unused portion of the TI Allowance shall be {{commercial.useAndBuildout.tiUnusedPolicy}}.</li>
</ol>

<h3>6. COMPLETION DEADLINE</h3>

<p>The Work shall be substantially completed within <strong>{{commercial.useAndBuildout.workLetterDeadlineDays}} days</strong> following the later of: (a) Landlord's delivery of the Premises to Tenant, or (b) final approval of the plans and specifications.</p>

<p>"Substantial Completion" means the Work has been completed in accordance with the approved plans and specifications, subject only to minor punch list items that do not materially interfere with Tenant's use and occupancy of the Premises.</p>

<h3>7. DELAYS</h3>

<ol type="a">
  <li><strong>Landlord Delays:</strong> If completion is delayed due to Landlord's failure to timely approve plans, provide access, or perform Landlord's obligations, the Commencement Date shall be extended day-for-day.</li>
  <li><strong>Tenant Delays:</strong> If completion is delayed due to Tenant's change orders, failure to timely submit plans, or interference with construction, the Commencement Date shall not be extended, and Tenant's rent obligations shall commence as if the Work had been completed on time.</li>
  <li><strong>Force Majeure:</strong> Neither party shall be liable for delays caused by fire, flood, labor disputes, material shortages, acts of God, or governmental restrictions, provided the delayed party uses commercially reasonable efforts to mitigate the delay.</li>
</ol>

<h3>8. MECHANIC'S LIENS</h3>

<p>Tenant shall keep the Premises and the building free and clear of all mechanic's liens and materialmen's liens arising from the Work. If any lien is filed, Tenant shall discharge or bond over such lien within <strong>{{commercial.useAndBuildout.workLetterLienDischargeDays}} days</strong> of receiving notice thereof. Failure to discharge or bond over a lien within the required period shall constitute an event of default under the Lease.</p>

<h3>9. OWNERSHIP OF IMPROVEMENTS</h3>

<p>All improvements made to the Premises pursuant to this Work Letter shall become the property of {{commercial.useAndBuildout.improvementOwnership}} upon installation, except for Tenant's trade fixtures, equipment, and personal property, which shall remain the property of Tenant and shall be removed by Tenant at Lease expiration.</p>

<h3>10. PUNCH LIST AND ACCEPTANCE</h3>

<ol type="a">
  <li>Upon Substantial Completion, Landlord and Tenant shall jointly inspect the Premises and prepare a written punch list of incomplete or defective items.</li>
  <li>The responsible party shall complete all punch list items within thirty (30) days of the inspection.</li>
  <li>Tenant's occupancy of the Premises following Substantial Completion shall constitute acceptance of the Work, subject to punch list items and latent defects.</li>
</ol>

<h3>SIGNATURES</h3>

<table>
  <tr>
    <td width="50%">
      <p>Landlord Signature: <span class="signature-line"></span></p>
      <p>Date: <span class="date-line"></span></p>
    </td>
    <td width="50%">
      <p>Tenant Signature: <span class="signature-line"></span></p>
      <p>Date: <span class="date-line"></span></p>
    </td>
  </tr>
</table>
`;
