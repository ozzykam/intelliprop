export const RENTAL_LICENSE_DISCLOSURE_TEMPLATE = `
<div class="page-break"></div>
<h1>RENTAL LICENSE DISCLOSURE</h1>
<p><em>City of Minneapolis — Required under Minneapolis Code of Ordinances Chapter 244</em></p>

<h3>Rental License Status</h3>

<p>The City of Minneapolis requires that all residential rental properties be licensed. The landlord discloses the following regarding the rental license status of the property located at {{property.address}}, Unit {{unit.number}}:</p>

<p>(Check one):</p>
<ul>
  <li>☐ The landlord holds a current, valid rental license for this property issued by the City of Minneapolis.</li>
  <li>☐ The landlord's rental license application for this property is currently pending with the City of Minneapolis.</li>
  <li>☐ The landlord does not currently hold a rental license for this property. The landlord acknowledges that operating a rental property without a valid license is a violation of Minneapolis ordinance.</li>
</ul>

<h3>Tenant Rights Regarding Rental Licensing</h3>

<p>As a tenant in the City of Minneapolis, you have the following rights related to rental licensing:</p>

<ol>
  <li>You have the right to verify your landlord's rental license status through the City of Minneapolis Regulatory Services.</li>
  <li>You may report an unlicensed rental property to Minneapolis 311 (call 311 or (612) 673-3000).</li>
  <li>An unlicensed rental property may be subject to housing inspections and enforcement actions by the City.</li>
  <li>Your lease remains valid and enforceable regardless of the landlord's licensing status — you cannot be evicted because the property is unlicensed.</li>
  <li>You may have the right to rent escrow (paying rent to the court) if the property has significant code violations or is operating without a required license.</li>
</ol>

<h3>Landlord Obligations</h3>

<p>The landlord acknowledges the following obligations under Minneapolis licensing requirements:</p>

<ol type="a">
  <li>Maintain a valid rental license at all times while the property is occupied by tenants;</li>
  <li>Comply with all housing maintenance code requirements and pass required inspections;</li>
  <li>Post or make available the rental license number and contact information for the property owner or manager;</li>
  <li>Cooperate with City inspectors and correct code violations within required timeframes;</li>
  <li>Maintain the property in compliance with all applicable building, fire, and housing codes.</li>
</ol>

<h3>Acknowledgment</h3>

<p>By signing below, both parties acknowledge the rental license status disclosed above.</p>

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
