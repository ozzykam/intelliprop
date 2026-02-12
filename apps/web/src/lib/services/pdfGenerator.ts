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
  <title>Lease Package</title>
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
</body>
</html>`;
}
