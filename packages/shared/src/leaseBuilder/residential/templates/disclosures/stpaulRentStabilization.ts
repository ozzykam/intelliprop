export const ST_PAUL_RENT_STABILIZATION_TEMPLATE = `
<div class="page-break"></div>
<h1>CITY OF SAINT PAUL RENT STABILIZATION DISCLOSURE</h1>
<p><em>Required under Saint Paul Legislative Code Chapter 193A</em></p>

<h3>Rent Stabilization Ordinance — Summary of Tenant Rights</h3>

<p>The City of Saint Paul has adopted a Rent Stabilization Ordinance that limits the amount by which a landlord may increase rent for residential tenants. This disclosure summarizes your rights under the ordinance.</p>

<h3>Rent Increase Cap</h3>

<p>Under the Rent Stabilization Ordinance, your landlord may not increase your rent by more than <strong>3% in any 12-month period</strong>, unless an exemption applies or the landlord has obtained an exception from the City.</p>

<h3>Notice Requirements</h3>

<p>Before increasing your rent, the landlord must:</p>

<ol>
  <li>Provide written notice of the rent increase at least <strong>90 days</strong> before the effective date of the increase;</li>
  <li>Include in the notice the current rent amount, the new rent amount, the percentage of increase, and the effective date;</li>
  <li>File a copy of the rent increase notice with the City of Saint Paul, if required by ordinance.</li>
</ol>

<h3>Exemptions</h3>

<p>The following properties may be exempt from the 3% rent increase cap:</p>

<ul>
  <li>Newly constructed buildings (within 20 years of certificate of occupancy);</li>
  <li>Affordable housing properties subject to an existing regulatory agreement limiting rents;</li>
  <li>Properties for which the landlord has obtained an individual exception based on demonstrated financial hardship.</li>
</ul>

<p><strong>Note:</strong> Even if an exemption applies, the landlord must still comply with notice requirements and just cause eviction protections.</p>

<h3>Just Cause Eviction Protection</h3>

<p>In addition to rent stabilization, Saint Paul provides just cause eviction protections. Your landlord may not terminate your tenancy or refuse to renew your lease except for specified just cause reasons, including:</p>

<ul>
  <li>Non-payment of rent after proper notice;</li>
  <li>Material lease violation after notice and opportunity to cure;</li>
  <li>Illegal activity on the premises;</li>
  <li>Owner occupancy (with proper notice and documentation);</li>
  <li>Removal of the unit from the rental market;</li>
  <li>Substantial rehabilitation requiring vacancy.</li>
</ul>

<h3>Prohibited Practices</h3>

<p>Your landlord may NOT:</p>
<ul>
  <li>Increase rent by more than the allowed amount without an approved exception;</li>
  <li>Include automatic rent escalation provisions that exceed the allowed cap;</li>
  <li>Retaliate against you for exercising your rights under this ordinance;</li>
  <li>Terminate or refuse to renew your lease for filing a complaint about an illegal rent increase.</li>
</ul>

<h3>Rent Increase History for This Unit</h3>

<table>
  <tr>
    <th>Period</th>
    <th>Monthly Rent</th>
    <th>Increase Amount</th>
    <th>Increase %</th>
  </tr>
  <tr>
    <td>Prior Lease Term:</td>
    <td>{{residential.rent.priorRentAmount}}</td>
    <td colspan="2"><em>(baseline)</em></td>
  </tr>
  <tr>
    <td>Current Lease Term:</td>
    <td>{{residential.rent.monthlyRent}}</td>
    <td>{{computed.rentIncreaseAmount}}</td>
    <td>{{computed.rentIncreasePercent}}%</td>
  </tr>
</table>

<h3>How to File a Complaint</h3>

<p>If you believe your landlord has violated the Rent Stabilization Ordinance, you may:</p>
<ul>
  <li>Contact the City of Saint Paul Department of Safety and Inspections;</li>
  <li>Call the Saint Paul Tenant Hotline;</li>
  <li>File a complaint with the City's Rent Stabilization office.</li>
</ul>

<h3>Acknowledgment</h3>

<p>By signing below, you acknowledge that you have received and read this disclosure of your rights under the City of Saint Paul Rent Stabilization Ordinance.</p>

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
