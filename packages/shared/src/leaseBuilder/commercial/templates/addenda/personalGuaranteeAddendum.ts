export const PERSONAL_GUARANTEE_ADDENDUM_TEMPLATE = `
<div class="page-break"></div>
<h1>PERSONAL GUARANTEE OF COMMERCIAL LEASE</h1>
<p><em>Addendum to Commercial Lease Agreement dated {{leaseDate}}</em></p>

<h3>GUARANTEE AGREEMENT</h3>

<p>This Personal Guarantee ("Guarantee") is made by the undersigned individual(s) ("Guarantor") in favor of {{landlord.name}} ("Landlord") in connection with the Commercial Lease Agreement (the "Lease") between Landlord and {{tenant.name}} ("Tenant") for the premises located at {{property.address}}, Suite/Unit {{unit.number}} (the "Premises").</p>

<h3>RECITALS</h3>

<p>WHEREAS, Landlord is unwilling to enter into the Lease unless one or more individuals personally guarantee the performance of Tenant's obligations under the Lease;</p>

<p>WHEREAS, Guarantor has a direct or indirect financial interest in Tenant and will benefit from the execution of the Lease;</p>

<p>NOW, THEREFORE, in consideration of Landlord entering into the Lease with Tenant, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Guarantor agrees as follows:</p>

<h3>1. GUARANTEE TYPE</h3>

<p>This Guarantee is a <strong>{{commercial.risk.personalGuaranteeType}}</strong> guarantee, as further described below:</p>

<p><strong>Continuing Guarantee:</strong> If this is a Continuing Guarantee, Guarantor unconditionally and irrevocably guarantees the full and prompt payment and performance of all of Tenant's obligations under the Lease for the entire Lease term and any renewals, extensions, or holdover periods, without limitation.</p>

<p><strong>Limited Guarantee:</strong> If this is a Limited Guarantee, Guarantor's liability shall be limited to a maximum aggregate amount of <strong>{{commercial.risk.personalGuaranteeCap}}</strong>. Once the total payments made by Guarantor under this Guarantee equal the cap amount, Guarantor's obligations hereunder shall be fully satisfied and discharged.</p>

<p><strong>Good Guy Guarantee:</strong> If this is a Good Guy Guarantee, Guarantor guarantees the full and prompt payment and performance of all of Tenant's obligations under the Lease until the later of: (a) the date Tenant vacates the Premises and surrenders possession in broom-clean condition, with all keys returned and all personal property removed; and (b) the date all rent and other charges accruing through the vacate date have been paid in full. Upon satisfaction of these conditions, Guarantor's obligations under this Guarantee shall terminate, and Guarantor shall have no further liability for rent or other obligations accruing after the vacate date.</p>

<h3>2. SCOPE OF GUARANTEE</h3>

<p>Guarantor guarantees the following obligations of Tenant (subject to the type and cap limitations above):</p>

<ol type="a">
  <li>Payment of base rent, additional rent, CAM charges, and all other sums due under the Lease;</li>
  <li>Payment of all costs, expenses, and damages arising from Tenant's default, including but not limited to late fees, default interest, attorney's fees, and costs of collection;</li>
  <li>Performance of all non-monetary obligations of Tenant under the Lease, including maintenance, repair, insurance, and surrender obligations;</li>
  <li>Payment of all costs and expenses incurred by Landlord in enforcing this Guarantee, including reasonable attorney's fees.</li>
</ol>

<h3>3. GUARANTOR'S WAIVERS</h3>

<p>Guarantor hereby waives:</p>

<ol type="a">
  <li><strong>Notice:</strong> Notice of acceptance of this Guarantee, notice of default by Tenant, notice of any amendment or modification of the Lease, and any other notices to which Guarantor might otherwise be entitled;</li>
  <li><strong>Demand:</strong> Any requirement that Landlord first proceed against Tenant, exhaust remedies against Tenant, or pursue any security before enforcing this Guarantee;</li>
  <li><strong>Defenses:</strong> Any defense arising from the bankruptcy, insolvency, dissolution, or reorganization of Tenant, or from the invalidity or unenforceability of the Lease;</li>
  <li><strong>Subrogation:</strong> Any right of subrogation against Tenant until all of Landlord's claims under the Lease have been fully satisfied;</li>
  <li><strong>Statute of Limitations:</strong> Any applicable statute of limitations, to the fullest extent permitted by law.</li>
</ol>

<h3>4. LANDLORD'S RIGHTS</h3>

<p>Landlord may, without notice to or consent of Guarantor, and without affecting Guarantor's obligations hereunder:</p>

<ol type="a">
  <li>Amend, modify, or supplement the Lease (provided that a material increase in Tenant's obligations requires Guarantor's consent);</li>
  <li>Grant extensions of time or other indulgences to Tenant;</li>
  <li>Release, substitute, or add security for the Lease;</li>
  <li>Assign the Lease or this Guarantee;</li>
  <li>Deal with Tenant in any manner Landlord deems appropriate without diminishing Guarantor's obligations.</li>
</ol>

<h3>5. INDEPENDENT OBLIGATIONS</h3>

<p>Guarantor's obligations under this Guarantee are independent of Tenant's obligations under the Lease. Landlord may enforce this Guarantee directly against Guarantor without first proceeding against Tenant. A separate action may be brought against Guarantor whether or not Tenant is joined as a party or a separate action is brought against Tenant.</p>

<h3>6. REINSTATEMENT</h3>

<p>If any payment by Tenant or Guarantor is rescinded, avoided, or must be returned for any reason (including bankruptcy preference), Guarantor's obligations hereunder shall be reinstated as though the payment had not been made.</p>

<h3>7. GOVERNING LAW</h3>

<p>This Guarantee shall be governed by and construed in accordance with the laws of the State of Minnesota. Guarantor consents to jurisdiction and venue in the courts of the State of Minnesota.</p>

<h3>8. BINDING EFFECT</h3>

<p>This Guarantee shall be binding upon Guarantor and Guarantor's heirs, executors, administrators, successors, and assigns, and shall inure to the benefit of Landlord and Landlord's successors and assigns.</p>

<h3>GUARANTOR EXECUTION</h3>

<p>The undersigned Guarantor acknowledges having read and understood this Guarantee and agrees to be bound by its terms.</p>

<div class="no-break">
{{lease.guarantorSignatureBlocks}}

<br/>

<p><strong>ACCEPTED BY LANDLORD:</strong></p>
<table>
  <tr>
    <td width="50%" style="padding-right: 24pt; vertical-align: top;">
      <p>{{landlord.name}}<br/>a Minnesota limited liability company</p>
      <p>By: {{#if landlord.signatureLine}}{{landlord.signatureLine}}{{/if}}{{#unless landlord.signatureLine}}___________________________________{{/unless}}</p>
      <p>&nbsp;&nbsp;&nbsp;&nbsp;{{landlord.signerName}}</p>
      <p>&nbsp;&nbsp;&nbsp;&nbsp;{{landlord.signerTitle}}</p>
      <p>Date: {{#if landlord.signatureDate}}{{landlord.signatureDate}}{{/if}}{{#unless landlord.signatureDate}}___________________________________{{/unless}}</p>
    </td>
    <td width="50%"></td>
  </tr>
</table>
</div>
`;
