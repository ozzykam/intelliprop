/**
 * Lease Package HTML Builder
 *
 * Builds a print-ready HTML document from lease package documents.
 * Users print to PDF via the browser's native print dialog (Ctrl+P / Cmd+P).
 */

import type { LeasePackageDocument } from '@shared/types/leaseBuilder';

/**
 * Combines multiple lease package documents into a single print-ready HTML page.
 */
export function buildPrintableHtml(documents: LeasePackageDocument[]): string {
  const sortedDocs = [...documents].sort((a, b) => a.pageOrder - b.pageOrder);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title></title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
      /* Suppress browser-generated headers and footers (URL, date, title) */
      @top-left { content: none; }
      @top-center { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9pt; font-family: 'Times New Roman', Times, serif; color: #666; }
      @bottom-right { content: none; }
    }
    @media screen {
      body { max-width: 672px; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 4pt; text-transform: uppercase; }
    h2 { font-size: 14pt; text-align: center; margin-top: 4pt; margin-bottom: 20pt; }
    h3 { font-size: 12pt; margin-top: 18pt; margin-bottom: 6pt; text-transform: uppercase; }
    p { text-align: justify; margin: 6pt 0; }
    ol, ul { margin: 6pt 0 6pt 24pt; }
    li { margin-bottom: 4pt; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    td, th { padding: 4pt 8pt; vertical-align: top; }
    .signature-line { display: inline-block; width: 250px; border-bottom: 1px solid #000; margin-left: 8px; }
    .date-line { display: inline-block; width: 150px; border-bottom: 1px solid #000; margin-left: 8px; }
    .page-break { page-break-before: always; }
    .document-section:not(:first-child) { page-break-before: always; }
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1a1a2e;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    }
    .print-bar button {
      background: #fff;
      color: #1a1a2e;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    .print-bar button:hover { opacity: 0.9; }
    .print-spacer { height: 56px; }
    @media print {
      .print-bar, .print-spacer { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Lease Package Preview</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="print-spacer"></div>
  ${sortedDocs.map((doc, idx) => `
    <div class="document-section"${idx > 0 ? ' style="page-break-before: always;"' : ''}>
      ${doc.htmlContent}
    </div>
  `).join('\n')}

<script>
(function () {
  // Chrome + letter + 0.75-inch margins
  // Usable height = (11 - 2 × 0.75) × 96 = 912 CSS px per page
  // Usable width  = (8.5 - 2 × 0.75) × 96 = 672 CSS px
  var PAGE_H = 912;
  var BODY_W = 672;

  window.addEventListener('load', function () {
    // Pin body to exact print width — forces layout reflow so text wraps
    // at the same column breaks as the physical printed page.
    document.body.style.width = BODY_W + 'px';
    document.body.style.margin = '0 auto';
    document.body.style.boxSizing = 'border-box';

    var toc = document.getElementById('lease-toc');
    if (!toc) return;

    // Anchor measurements to the first .document-section (the core lease).
    var section = document.querySelector('.document-section') || document.body;
    var sectionTop = section.getBoundingClientRect().top + window.scrollY;

    // Each ToC cell carries data-section-id matching the id injected on the
    // corresponding <h3> by the assembler (e.g. "toc-comm-core-term").
    // getElementById is immune to all text-normalisation edge cases.
    var cells = toc.querySelectorAll('[data-section-id]');
    for (var j = 0; j < cells.length; j++) {
      var cell = cells[j];
      var id = cell.getAttribute('data-section-id');
      var heading = id ? document.getElementById(id) : null;
      if (!heading) continue;
      var relTop = heading.getBoundingClientRect().top + window.scrollY - sectionTop;
      cell.textContent = String(Math.floor(relTop / PAGE_H) + 1);
    }
  });
}());
</script>
</body>
</html>`;
}
