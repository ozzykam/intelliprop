export const RENT_STEP_SCHEDULE_ADDENDUM_TEMPLATE = `
<div class="page-break"></div>
<h1>EXHIBIT: RENT STEP SCHEDULE</h1>
<p><em>Addendum to Commercial Lease Agreement dated {{leaseDate}}</em></p>

<p>This Rent Step Schedule is incorporated into the Commercial Lease Agreement between {{landlord.name}} ("Landlord") and {{tenant.name}} ("Tenant") for the premises located at {{property.address}}, Suite/Unit {{unit.number}}.</p>

<h3>1. BASE RENT SCHEDULE</h3>

<p>Notwithstanding any other provision of the Lease, the monthly base rent for the Premises shall be as follows:</p>

<table>
  <tr>
    <th>Lease Year</th>
    <th>Period</th>
    <th>Monthly Base Rent</th>
    <th>Annual Base Rent</th>
  </tr>
  {{rentStepRows}}
</table>

<p><em>"Lease Year" means each consecutive twelve (12) month period commencing on the Commencement Date (or the first day of the month following the Commencement Date, if the Commencement Date is not the first day of a month) and each anniversary thereof.</em></p>

<h3>2. PAYMENT TERMS</h3>

<ol type="a">
  <li>Base rent as shown above shall be due and payable in advance on the first day of each calendar month during the applicable Lease Year.</li>
  <li>If the Commencement Date falls on a day other than the first day of a calendar month, rent for the first partial month shall be prorated on a per diem basis using the monthly rent applicable to Lease Year 1.</li>
  <li>If the Lease term expires or terminates on a day other than the last day of a calendar month, rent for the final partial month shall be prorated on a per diem basis using the monthly rent applicable to the then-current Lease Year.</li>
</ol>

<h3>3. RENEWAL TERM RENT</h3>

<p>If Tenant exercises any renewal option under the Lease, the base rent during the renewal term shall be determined as follows:</p>

<ul>
  <li>If the Lease specifies a renewal rent calculation method (e.g., fair market value, CPI adjustment, or fixed increase), that method shall apply.</li>
  <li>If no renewal rent calculation method is specified, the parties shall negotiate the renewal rent in good faith. If the parties cannot agree within sixty (60) days prior to the commencement of the renewal term, either party may terminate the renewal by written notice.</li>
</ul>

<h3>4. ADDITIONAL RENT</h3>

<p>The rent amounts shown in this schedule reflect base rent only. Tenant remains responsible for all additional rent charges as specified in the Lease, including but not limited to CAM charges, real property taxes, insurance, and any other amounts designated as additional rent under the Lease.</p>

<h3>5. LATE PAYMENT</h3>

<p>Late fees and default interest, as specified in the Lease, apply to all base rent amounts set forth in this schedule.</p>

<div class="no-break">
<h3>Signatures</h3>

<p>IN WITNESS WHEREOF, the parties have executed this Addendum as of the date last written below, each by a duly authorized representative.</p>

<table>
  <tr>
    <td width="50%" style="padding-right: 24pt; vertical-align: top;">
      <p><strong>LANDLORD:</strong></p>
      <p>{{landlord.name}}<br/>a Minnesota limited liability company</p>
      <p>By: {{#if landlord.signatureLine}}{{landlord.signatureLine}}{{/if}}{{#unless landlord.signatureLine}}___________________________________{{/unless}}</p>
      <p>&nbsp;&nbsp;&nbsp;&nbsp;{{landlord.signerName}}</p>
      <p>&nbsp;&nbsp;&nbsp;&nbsp;{{landlord.signerTitle}}</p>
      <p>Date: {{#if landlord.signatureDate}}{{landlord.signatureDate}}{{/if}}{{#unless landlord.signatureDate}}___________________________________{{/unless}}</p>
    </td>
    <td width="50%" style="padding-left: 24pt; vertical-align: top;">
      <p><strong>TENANT:</strong></p>
      <p>{{tenant.name}}</p>
      <p>By: ___________________________________</p>
      <p>&nbsp;&nbsp;&nbsp;&nbsp;{{tenant.signerName}}</p>
      <p>&nbsp;&nbsp;&nbsp;&nbsp;{{tenant.signerTitle}}</p>
      <p>Date: ___________________________________</p>
    </td>
  </tr>
</table>
</div>
`;
