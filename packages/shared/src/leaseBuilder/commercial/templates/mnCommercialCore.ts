export const MN_COMMERCIAL_CORE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
    }
    h1 {
      font-size: 18pt;
      text-align: center;
      margin-bottom: 4pt;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      text-align: center;
      margin-top: 4pt;
      margin-bottom: 20pt;
    }
    h3 {
      font-size: 12pt;
      margin-top: 18pt;
      margin-bottom: 6pt;
      text-transform: uppercase;
    }
    p {
      text-align: justify;
      margin: 6pt 0;
    }
    ol, ul {
      margin: 6pt 0 6pt 24pt;
    }
    li {
      margin-bottom: 4pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    td, th {
      padding: 4pt 8pt;
      vertical-align: top;
    }
    .signature-line {
      display: inline-block;
      width: 250px;
      border-bottom: 1px solid #000;
      margin-left: 8px;
    }
    .date-line {
      display: inline-block;
      width: 150px;
      border-bottom: 1px solid #000;
      margin-left: 8px;
    }
    .page-break {
      page-break-before: always;
    }
    .header-info {
      text-align: center;
      margin-bottom: 24pt;
    }
    .parties-table td {
      width: 50%;
      padding: 4pt 8pt;
    }
    .exhibit-ref {
      font-style: italic;
      color: #333;
    }
    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>

<h1>COMMERCIAL LEASE AGREEMENT</h1>
<h2>State of Minnesota</h2>

<div class="header-info">
  <p><strong>Lease Date:</strong> {{leaseDate}}</p>
  <p><strong>Lease Type:</strong> {{commercial.leaseStructure.leaseType}}</p>
</div>

<h3>PARTIES</h3>

<table class="parties-table">
  <tr>
    <td>
      <p><strong>LANDLORD:</strong></p>
      <p>{{landlord.name}}</p>
      <p>{{landlord.address}}</p>
      <p>{{landlord.phone}}</p>
      <p>{{landlord.email}}</p>
    </td>
    <td>
      <p><strong>TENANT:</strong></p>
      <p>{{tenant.name}}</p>
      <p>{{tenant.entityType}}</p>
      <p>{{tenant.address}}</p>
      <p>{{tenant.phone}}</p>
      <p>{{tenant.email}}</p>
    </td>
  </tr>
</table>

<h3>PREMISES</h3>

<p>Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the following described premises (the "Premises"):</p>

<table>
  <tr>
    <td width="30%"><strong>Property Address:</strong></td>
    <td>{{property.address}}</td>
  </tr>
  <tr>
    <td><strong>Suite/Unit:</strong></td>
    <td>{{unit.number}}</td>
  </tr>
  <tr>
    <td><strong>Rentable Square Feet:</strong></td>
    <td>{{propertyProfile.premisesSqft}} sq. ft.</td>
  </tr>
  <tr>
    <td><strong>Space Type:</strong></td>
    <td>{{propertyProfile.commercialSpaceType}}</td>
  </tr>
</table>

<p>together with the right to use, in common with other tenants of the building and their invitees, the common areas of the building including lobbies, corridors, restrooms, elevators, stairways, and parking areas, subject to the rules and regulations established by Landlord from time to time.</p>

<!-- BEGIN CLAUSE CONTENT -->
{{clauseContent}}
<!-- END CLAUSE CONTENT -->

<h3>GOVERNING LAW AND ENTIRE AGREEMENT</h3>

<p>This Lease shall be governed by and construed in accordance with the laws of the State of Minnesota. This Lease, together with all exhibits, addenda, and amendments attached hereto, constitutes the entire agreement between Landlord and Tenant with respect to the Premises. No prior or contemporaneous agreements or representations, whether oral or written, shall be binding upon either party unless incorporated herein. This Lease may not be amended or modified except by a written instrument signed by both parties.</p>

<h3>SEVERABILITY</h3>

<p>If any provision of this Lease is held to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be reformed to the minimum extent necessary to make it valid and enforceable while preserving the original intent of the parties.</p>

<h3>NOTICES</h3>

<p>All notices required or permitted under this Lease shall be in writing and shall be deemed delivered when: (a) personally delivered; (b) sent by certified mail, return receipt requested, to the address of the respective party set forth above or such other address as may be designated in writing; or (c) sent by nationally recognized overnight courier to such address. Notice shall be deemed received on the date of personal delivery, three (3) business days after mailing, or one (1) business day after deposit with an overnight courier.</p>

<h3>EXECUTION</h3>

<p>IN WITNESS WHEREOF, the parties have executed this Commercial Lease Agreement as of the date first written above.</p>

<table>
  <tr>
    <td width="50%">
      <p><strong>LANDLORD:</strong></p>
      <p>{{landlord.name}}</p>
      <br/>
      <p>Signature: <span class="signature-line"></span></p>
      <p>Printed Name: <span class="signature-line"></span></p>
      <p>Title: <span class="signature-line"></span></p>
      <p>Date: <span class="date-line"></span></p>
    </td>
    <td width="50%">
      <p><strong>TENANT:</strong></p>
      <p>{{tenant.name}}</p>
      <br/>
      <p>Signature: <span class="signature-line"></span></p>
      <p>Printed Name: <span class="signature-line"></span></p>
      <p>Title: <span class="signature-line"></span></p>
      <p>Date: <span class="date-line"></span></p>
    </td>
  </tr>
</table>

<br/>
<hr/>
<p style="font-size: 9pt; text-align: center; color: #666;">
  <strong>DISCLAIMER:</strong> This lease template is provided for informational purposes and is designed to comply with Minnesota state law and applicable local ordinances as of the template version date. It does not constitute legal advice. Landlords and tenants are encouraged to consult with a licensed Minnesota attorney before executing this agreement. Laws and regulations may change; verify current compliance requirements before use.
</p>
<p style="font-size: 8pt; text-align: center; color: #999;">
  Template Version: {{templateVersion}} | Generated: {{generatedDate}}
</p>

</body>
</html>
`;
