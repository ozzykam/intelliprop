/**
 * Minnesota Residential Core Lease Template
 *
 * Full HTML wrapper for the residential lease document. This template provides the
 * structural HTML, CSS for print-ready formatting, and the insertion point for
 * clause content blocks assembled by the lease builder engine.
 *
 * Placeholders:
 *   {{clauseContent}}     — Assembled HTML from all applicable clause definitions
 *   {{templateVersion}}   — Semantic version of the template set used
 *   {{generatedDate}}     — ISO date string when the document was generated
 */

export const MN_RESIDENTIAL_CORE_TEMPLATE: string = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Minnesota Residential Lease Agreement</title>
  <style>
    /* ── Base Typography & Layout ────────────────────────────────────────── */
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      margin: 1in;
      color: #000;
      background: #fff;
    }

    h1 {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 4pt;
      margin-top: 0;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }

    h2 {
      text-align: center;
      font-size: 12pt;
      font-weight: normal;
      margin-bottom: 24pt;
      margin-top: 0;
      font-style: italic;
    }

    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 6pt;
      text-transform: uppercase;
    }

    h4 {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 4pt;
    }

    p {
      margin: 6pt 0;
      text-align: justify;
    }

    ol, ul {
      margin: 6pt 0 6pt 24pt;
    }

    li {
      margin-bottom: 4pt;
    }

    strong {
      font-weight: bold;
    }

    /* ── Table Styles ────────────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }

    td, th {
      padding: 4pt 8pt;
      text-align: left;
      vertical-align: top;
    }

    th {
      font-weight: bold;
      border-bottom: 1px solid #000;
    }

    /* ── Signature Block ─────────────────────────────────────────────────── */
    .signature-block {
      margin-top: 48pt;
      page-break-inside: avoid;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      width: 300px;
      display: inline-block;
      margin-top: 24pt;
    }

    .date-line {
      border-bottom: 1px solid #000;
      width: 150px;
      display: inline-block;
    }

    /* ── Checkbox ─────────────────────────────────────────────────────────── */
    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 6px;
      vertical-align: middle;
    }

    .checkbox.checked::after {
      content: '\\2713';
      font-size: 10pt;
    }

    /* ── Print & Page Control ────────────────────────────────────────────── */
    .page-break {
      page-break-before: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* ── Disclaimer Footer ───────────────────────────────────────────────── */
    .disclaimer {
      font-size: 9pt;
      color: #666;
      margin-top: 36pt;
      border-top: 1px solid #ccc;
      padding-top: 12pt;
    }

    .disclaimer p {
      text-align: left;
    }

    /* ── Addendum / Disclosure Headers ───────────────────────────────────── */
    .addendum-header {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
      text-transform: uppercase;
    }

    .addendum-subtitle {
      text-align: center;
      font-size: 11pt;
      font-weight: normal;
      margin-bottom: 18pt;
      font-style: italic;
    }

    /* ── Print Media Overrides ───────────────────────────────────────────── */
    @media print {
      body {
        margin: 0;
      }

      .disclaimer {
        color: #666;
      }
    }
  </style>
</head>
<body>

  <h1>MINNESOTA RESIDENTIAL LEASE AGREEMENT</h1>
  <h2>State of Minnesota</h2>

  <!-- ═══════════════════════════════════════════════════════════════════════
       CLAUSE CONTENT — Assembled by the lease builder engine
       ═══════════════════════════════════════════════════════════════════════ -->
  {{clauseContent}}

  <!-- ═══════════════════════════════════════════════════════════════════════
       DISCLAIMER FOOTER
       ═══════════════════════════════════════════════════════════════════════ -->
  <div class="disclaimer">
    <p><strong>DISCLAIMER:</strong> This lease agreement was generated using a template reviewed by legal counsel.
    It is not a substitute for independent legal advice. Laws may change, and local ordinances may impose additional
    requirements. This document reflects the best-known rules as of the template version date. Landlords and tenants
    are encouraged to consult with an attorney for their specific circumstances.</p>
    <p>Template Version: {{templateVersion}} | Generated: {{generatedDate}}</p>
  </div>

</body>
</html>`;
