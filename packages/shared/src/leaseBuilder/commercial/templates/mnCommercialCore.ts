export const MN_COMMERCIAL_CORE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    /* =============================================
       PAGE SETUP — compact margins
       ============================================= */
    @page {
      size: letter;
      margin: 0.75in;
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #666;
      }
    }

    /* =============================================
       BASE TYPOGRAPHY — compact sizing
       ============================================= */
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }

    h1 {
      font-size: 16pt;
      text-align: center;
      margin-top: 24pt;
      margin-bottom: 4pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }

    h2 {
      font-size: 13pt;
      text-align: center;
      margin-top: 4pt;
      margin-bottom: 24pt;
      font-weight: normal;
      font-style: italic;
    }

    h3 {
      font-size: 11pt;
      margin-top: 18pt;
      margin-bottom: 6pt;
      text-transform: uppercase;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      text-align: justify;
      margin: 4pt 0;
      widows: 3;
      orphans: 3;
    }

    /* =============================================
       LISTS
       ============================================= */
    ol, ul {
      margin: 4pt 0 4pt 24pt;
    }

    li {
      margin-bottom: 3pt;
      widows: 3;
      orphans: 3;
    }

    /* Keep content glued to its heading */
    h3 + p,
    h3 + ol,
    h3 + ul,
    h3 + table,
    h3 + div {
      page-break-before: avoid;
      break-before: avoid;
    }

    /* =============================================
       TABLES
       ============================================= */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
    }

    td, th {
      padding: 3pt 6pt;
      vertical-align: top;
      text-align: left;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .parties-table td {
      width: 50%;
      padding: 0.25em 0.75em;
    }

    .parties-table p {
      text-align: left;
    }

    /* =============================================
       HEADER / TITLE BLOCK
       ============================================= */
    .header-info {
      text-align: center;
      margin-bottom: 18pt;
    }

    .header-info p {
      text-align: center;
    }

    /* =============================================
       SIGNATURE BLOCKS
       ============================================= */
    .signature-block {
      margin-top: 36pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .signature-block p {
      text-align: left;
    }

    .signature-field {
      margin: 14pt 0;
      text-align: left;
      white-space: nowrap;
    }

    .signature-line {
      display: inline-block;
      width: 250px;
      border-bottom: 1px solid #000;
      margin-left: 8px;
      vertical-align: bottom;
    }

    .date-line {
      display: inline-block;
      width: 150px;
      border-bottom: 1px solid #000;
      margin-left: 8px;
      vertical-align: bottom;
    }

    /* =============================================
       PAGE FLOW CONTROLS
       ============================================= */
    .page-break {
      page-break-before: always;
      break-before: always;
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* =============================================
       MISC
       ============================================= */
    .exhibit-ref {
      font-style: italic;
      color: #333;
    }

    /* KEY TERMS SUMMARY */
    .key-terms-summary {
      border: 1.5pt solid #000;
      margin: 0 0 18pt 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .key-terms-summary caption {
      font-size: 10pt; font-weight: bold; text-transform: uppercase;
      letter-spacing: 0.5pt; text-align: center;
      padding: 4pt 6pt; background: #1a1a1a; color: #fff; caption-side: top;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .key-terms-summary td {
      padding: 3pt 8pt; font-size: 10pt; vertical-align: top;
      border-bottom: 0.5pt solid #ccc;
    }
    .key-terms-summary td:first-child { width: 38%; font-weight: bold; white-space: nowrap; }
    .key-terms-summary tr:last-child td { border-bottom: none; }

    /* TABLE OF CONTENTS */
    .toc-section { margin: 18pt 0 12pt 0; page-break-inside: avoid; break-inside: avoid; }
    .toc-section h3 { margin-bottom: 4pt; }
    .toc-list { list-style: none; margin: 0; padding: 0; }
    .toc-list li { font-size: 10pt; padding: 1.5pt 0; margin-bottom: 0; }

    /* =============================================
       PRINT OVERRIDES
       ============================================= */
    @media print {
      a {
        color: #000;
        text-decoration: none;
      }

      .page-break {
        page-break-before: always;
        break-before: always;
      }

      .no-break {
        page-break-inside: avoid;
        break-inside: avoid;
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

{{keyTermsSummary}}

<h3 id="toc-parties">PARTIES</h3>

{{partiesBlock}}

<h3 id="toc-premises">PREMISES</h3>

<p>Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, approximately {{premises.sqft}} sq.&nbsp;ft. of {{propertyProfile.commercialSpaceTypes}} space located at {{property.address}}, Suite {{unit.number}} (the &ldquo;Premises&rdquo;), together with the right to use, in common with other tenants and their invitees, the common areas of the building including lobbies, corridors, restrooms, elevators, stairways, and parking areas, subject to the rules and regulations established by Landlord from time to time.</p>

{{tableOfContents}}

<!-- BEGIN CLAUSE CONTENT -->
{{clauseContent}}
<!-- END CLAUSE CONTENT -->

<h3 id="toc-notices">NOTICES</h3>

<p>All notices required or permitted under this Lease shall be in writing and shall be deemed delivered when: (a) personally delivered; (b) sent by certified mail, return receipt requested, to the address of the respective party set forth above or such other address as may be designated in writing; or (c) sent by nationally recognized overnight courier to such address. Notice shall be deemed received on the date of personal delivery, three (3) business days after mailing, or one (1) business day after deposit with an overnight courier.</p>

<div class="no-break">
  <h3 id="toc-execution">EXECUTION</h3>

  <p style="text-align: left;">IN WITNESS WHEREOF, the parties have executed this Commercial Lease Agreement as of the date first written above.</p>

  <div class="signature-block">
    <table>
      <tr>
        <td width="50%">
          <p><strong>LANDLORD:</strong></p>
          <p>{{landlord.name}}</p>
          <br/>
          <p class="signature-field">Signature: <span class="signature-line"></span></p>
          <p class="signature-field">Printed Name: {{landlord.signerName}}</p>
          <p class="signature-field">Title: {{landlord.signerTitle}}</p>
          <p class="signature-field">Date: <span class="date-line"></span></p>
        </td>
        <td width="50%">
          <p><strong>TENANT:</strong></p>
          <p>{{tenant.name}}</p>
          <br/>
          <p class="signature-field">Signature: <span class="signature-line"></span></p>
          <p class="signature-field">Printed Name: {{tenant.signerName}}</p>
          <p class="signature-field">Title: {{tenant.signerTitle}}</p>
          <p class="signature-field">Date: <span class="date-line"></span></p>
        </td>
      </tr>
    </table>
  </div>
</div>

</body>
</html>
`;
