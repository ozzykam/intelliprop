export const CAM_RECONCILIATION_ADDENDUM_TEMPLATE = `
<div class="page-break"></div>
<h1>EXHIBIT: CAM RECONCILIATION AND ADDITIONAL RENT</h1>
<p><em>Addendum to Commercial Lease Agreement dated {{leaseDate}}</em></p>

<p>This Common Area Maintenance ("CAM") Reconciliation Addendum is incorporated into the Commercial Lease Agreement between {{landlord.name}} ("Landlord") and {{tenant.name}} ("Tenant") for the premises located at {{property.address}}, Suite/Unit {{unit.number}}.</p>

<h3>1. TENANT'S PRO RATA SHARE</h3>

<p>Tenant's pro rata share of CAM and other additional rent charges shall be <strong>{{commercial.financial.camProRataShare}}%</strong>, calculated as the ratio of the Premises' rentable square footage ({{propertyProfile.premisesSqft}} sq. ft.) to the total rentable square footage of the building.</p>

<h3>2. CAM CHARGE COMPONENTS</h3>

<p>The following operating expenses are included in Tenant's CAM obligations:</p>

<table>
  <tr>
    <th>Component</th>
    <th>Included</th>
  </tr>
  <tr>
    <td>Real Property Taxes and Assessments</td>
    <td>{{commercial.financial.camIncludesPropertyTax}}</td>
  </tr>
  <tr>
    <td>Building Insurance (Property, Liability, Umbrella)</td>
    <td>{{commercial.financial.camIncludesInsurance}}</td>
  </tr>
  <tr>
    <td>Property Management Fee</td>
    <td>{{commercial.financial.camIncludesManagement}}</td>
  </tr>
  <tr>
    <td>Common Area Utilities</td>
    <td>{{commercial.financial.camIncludesUtilities}}</td>
  </tr>
</table>

<h3>3. INCLUDED OPERATING EXPENSES</h3>

<p>CAM charges may include, but are not limited to, the following categories of expenses incurred by Landlord in operating, maintaining, and repairing the building and common areas:</p>

<ol type="a">
  <li>Common area cleaning, maintenance, and repair;</li>
  <li>Landscaping and snow removal;</li>
  <li>Common area lighting and utilities;</li>
  <li>Parking lot maintenance, repair, and striping;</li>
  <li>Building security services;</li>
  <li>Elevator and escalator maintenance;</li>
  <li>Fire protection and life safety systems maintenance;</li>
  <li>Trash removal and recycling;</li>
  <li>Property management fees (if included above), not to exceed {{commercial.financial.camManagementFeePercent}}% of gross revenues;</li>
  <li>Real property taxes and special assessments (if included above);</li>
  <li>Building insurance premiums (if included above);</li>
  <li>Common area HVAC maintenance and repair;</li>
  <li>Reasonable reserves for capital repairs and replacements, amortized over the useful life of the improvement.</li>
</ol>

<h3>4. EXCLUDED EXPENSES</h3>

<p>The following expenses are excluded from CAM charges and shall not be passed through to Tenant:</p>

<ol type="a">
  <li>Costs of correcting defects in original construction;</li>
  <li>Costs of capital improvements not benefiting all tenants, except those required by law or that reduce operating expenses;</li>
  <li>Depreciation of the building;</li>
  <li>Mortgage principal or interest payments;</li>
  <li>Landlord's income taxes;</li>
  <li>Leasing commissions, advertising, and tenant inducement costs;</li>
  <li>Costs of services or improvements provided to specific tenants and not available to Tenant;</li>
  <li>Costs arising from Landlord's breach of any lease or law;</li>
  <li>Costs of repairs covered by insurance proceeds or warranty;</li>
  <li>Fines or penalties incurred by Landlord.</li>
</ol>

<h3>5. ESTIMATED PAYMENTS</h3>

<p>Landlord shall provide Tenant with a reasonable estimate of CAM charges for each calendar year. Tenant shall pay one-twelfth (1/12) of the estimated annual CAM charges as additional rent on the first day of each month, together with base rent.</p>

<p>Landlord may adjust the monthly estimated CAM payment once per calendar year based on updated estimates, with thirty (30) days' prior written notice to Tenant.</p>

<h3>6. ANNUAL RECONCILIATION</h3>

<ol type="a">
  <li><strong>Statement:</strong> Within one hundred twenty (120) days after the end of each calendar year, Landlord shall provide Tenant with a written statement showing: (i) actual CAM charges for the year; (ii) Tenant's pro rata share; (iii) estimated payments received from Tenant; and (iv) the amount of any overpayment or underpayment.</li>
  <li><strong>Underpayment:</strong> If Tenant's estimated payments were less than Tenant's actual pro rata share, Tenant shall pay the deficiency within <strong>{{commercial.financial.camReconciliationDays}} days</strong> after receipt of the reconciliation statement.</li>
  <li><strong>Overpayment:</strong> If Tenant's estimated payments exceeded Tenant's actual pro rata share, Landlord shall credit the overpayment against Tenant's next monthly CAM payment(s), or refund the overpayment within thirty (30) days if the Lease has expired.</li>
  <li><strong>Proration:</strong> For partial calendar years at the beginning or end of the Lease term, Tenant's obligations shall be prorated on a daily basis.</li>
</ol>

<h3>7. AUDIT RIGHTS</h3>

{{#if commercial.financial.camAuditRights}}
<p>Tenant shall have the right, at Tenant's sole cost and expense, to audit Landlord's books and records relating to CAM charges, subject to the following conditions:</p>

<ol type="a">
  <li>Tenant must provide Landlord with at least thirty (30) days' written notice of intent to audit;</li>
  <li>The audit must be conducted during normal business hours at Landlord's office or such other location where records are maintained;</li>
  <li>The audit must be completed within ninety (90) days of Landlord making records available;</li>
  <li>Tenant may audit only the immediately preceding calendar year's records;</li>
  <li>The audit must be conducted by a certified public accountant engaged on a non-contingency fee basis;</li>
  <li>If the audit reveals that Tenant was overcharged by more than five percent (5%), Landlord shall reimburse Tenant for the reasonable cost of the audit in addition to refunding the overcharge;</li>
  <li>Results of the audit shall be kept confidential by Tenant.</li>
</ol>
{{/if}}

{{#unless commercial.financial.camAuditRights}}
<p>Landlord shall maintain books and records supporting all CAM charges for a period of at least three (3) years. Tenant may request reasonable documentation supporting any CAM charge, and Landlord shall provide such documentation within thirty (30) days of the written request.</p>
{{/unless}}

<h3>8. CAP ON CONTROLLABLE EXPENSES</h3>

<p>Controllable operating expenses (expenses within Landlord's reasonable control, excluding taxes, insurance, utilities, and snow removal) shall not increase by more than five percent (5%) per year on a cumulative, compounding basis over the base year. The base year shall be the first full calendar year of the Lease term.</p>

<div class="no-break">
<h3>Signatures</h3>

<p>IN WITNESS WHEREOF, the parties have executed this Addendum as of the date last written below, each by a duly authorized representative.</p>

<table>
  <tr>
    <td width="50%" style="padding-right: 24pt; vertical-align: top;">
      <p><strong>LANDLORD:</strong></p>
      <p>{{landlord.name}}<br/>a Minnesota limited liability company</p>
      <p>By: ___________________________________</p>
      <p>Printed Name: {{landlord.signerName}}</p>
      <p>Title: {{landlord.signerTitle}}</p>
      <p>Date: ___________________________________</p>
    </td>
    <td width="50%" style="padding-left: 24pt; vertical-align: top;">
      <p><strong>TENANT:</strong></p>
      <p>{{tenant.name}}</p>
      <p>By: ___________________________________</p>
      <p>Printed Name: {{tenant.signerName}}</p>
      <p>Title: {{tenant.signerTitle}}</p>
      <p>Date: ___________________________________</p>
    </td>
  </tr>
</table>
</div>
`;
