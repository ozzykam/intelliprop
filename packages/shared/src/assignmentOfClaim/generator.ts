import { AssignmentOfClaim, AOC_EXHIBIT_DEFINITIONS, ObligorEntityType, ObligorRole, OBLIGOR_ENTITY_TYPE_LABELS } from '../types/assignment';

function formatDate(iso: string): string {
  const parts = iso.split('-').map(Number);
  const year = parts[0] ?? 2000;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function descriptionToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(para => `<p style="margin:0 0 0.75em 0">${para.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function formatCents(cents: number): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${Number(dollars).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function generateAocDocument(data: AssignmentOfClaim): string {
  const effectiveDateFormatted = formatDate(data.effectiveDate);

  const considerationText =
    data.considerationCents === 0
      ? 'One Dollar ($1.00) and other good and valuable consideration'
      : `${formatCents(data.considerationCents)} and other good and valuable consideration`;

  const assigneeEntityDesc =
    data.assignee.entityType === 'company'
      ? `${data.assignee.name}, a company`
      : `${data.assignee.name}, an individual`;

  // ── Exhibit letter map ────────────────────────────────────────────────────
  // Exhibit A is always the Notice to Obligor.
  // Selected exhibits are assigned B, C, D... in the order of AOC_EXHIBIT_DEFINITIONS.
  const selectedExhibits = data.exhibits ?? [];
  const exhibitLetters = new Map<string, string>();
  const LETTERS = 'BCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let letterIdx = 0;
  for (const def of AOC_EXHIBIT_DEFINITIONS) {
    if (selectedExhibits.includes(def.key)) {
      exhibitLetters.set(def.key, LETTERS[letterIdx]!);
      letterIdx++;
    }
  }

  // ── Section 2: Description of Claim ──────────────────────────────────────
  let claimDescriptionSection = '';
  if (data.claimType === 'rent_debt') {
    claimDescriptionSection = `
      <p>The Claim consists of unpaid rent and/or tenant debt owed${data.tenantName ? ` by <strong>${data.tenantName}</strong>` : ''}${data.propertyAddress ? ` in connection with the property located at <strong>${data.propertyAddress}</strong>` : ''}, as more fully described below:</p>
      <blockquote>${descriptionToHtml(data.claimDescription)}</blockquote>
      ${data.claimValueCents !== undefined ? `<p>The estimated value of the Claim is <strong>${formatCents(data.claimValueCents)}</strong>.</p>` : ''}
      <p><strong>Security Deposit:</strong> The security deposit, if any, held by Assignor in connection with the above tenancy is NOT transferred by this Assignment. Assignor retains all obligations under Minn. Stat. § 504B.178 with respect to the security deposit.</p>
      <p><strong>Eviction Rights:</strong> This Assignment transfers the right to collect the monetary Claim only. The right to bring an unlawful detainer (eviction) action under Minn. Stat. § 504B.281 et seq. remains with Assignor as the named landlord under the lease and is NOT transferred by this Assignment. Any eviction proceeding must be brought by Assignor or require a lease amendment naming Assignee as landlord of record.</p>
    `;
  } else if (data.claimType === 'insurance_claim') {
    claimDescriptionSection = `
      <p>The Claim arises from an insurance claim${data.insurer ? ` with <strong>${data.insurer}</strong>` : ''}${data.insuranceClaimNumber ? `, Claim No. <strong>${data.insuranceClaimNumber}</strong>` : ''}, as more fully described below:</p>
      <blockquote>${descriptionToHtml(data.claimDescription)}</blockquote>
      ${data.claimValueCents !== undefined ? `<p>The estimated value of the Claim is <strong>${formatCents(data.claimValueCents)}</strong>.</p>` : ''}
    `;
  } else {
    claimDescriptionSection = `
      <p>The Claim is a general monetary claim described as follows:</p>
      <blockquote>${descriptionToHtml(data.claimDescription)}</blockquote>
      ${data.claimValueCents !== undefined ? `<p>The estimated value of the Claim is <strong>${formatCents(data.claimValueCents)}</strong>.</p>` : ''}
    `;
  }

  // ── Section 4: Representations & Warranties ──────────────────────────────
  const titleWarrantyClause = data.warrantsGoodTitle
    ? `<p>(c) <strong>Title.</strong> The Claim is free and clear of all liens, encumbrances, security interests, and prior assignments. Assignor has not previously assigned, transferred, pledged, or encumbered the Claim in any manner.</p>`
    : `<p>(c) <strong>Title — AS-IS, NO WARRANTY.</strong> <strong>AS-IS, NO WARRANTY OF TITLE. ASSIGNOR EXPRESSLY DISCLAIMS ANY WARRANTY OF TITLE, OWNERSHIP, OR VALIDITY OF THE CLAIM. THE CLAIM IS ASSIGNED "AS-IS" WITHOUT ANY REPRESENTATION OR WARRANTY, EXPRESS OR IMPLIED, AS TO THE EXISTENCE, VALIDITY, COLLECTABILITY, OR FREEDOM FROM PRIOR ASSIGNMENT OF THE CLAIM.</strong></p>`;

  const rentDebtRepsSection = data.claimType === 'rent_debt'
    ? `
      <p>(g) <strong>Security Deposit.</strong> Assignor represents that any security deposit held in connection with the tenancy identified in Section 2 is NOT being transferred to Assignee by this Assignment. Assignor shall retain all obligations under Minn. Stat. § 504B.178 with respect to such security deposit and shall not apply the security deposit against the assigned Claim without the written consent of Assignee.</p>
      <p>(h) <strong>Eviction Rights.</strong> Assignor represents that the right to pursue eviction (unlawful detainer) proceedings against the tenant named in Section 2 is not being transferred by this Assignment. Assignor acknowledges that eviction proceedings must be brought in Assignor's name as landlord of record under the applicable lease.</p>
    `
    : '';

  // ── Sections 13–14: Conditional ──────────────────────────────────────────
  const expirationSection = data.expirationDate
    ? `
      <h2>13. Expiration</h2>
      <p class="warning"><strong>Notice:</strong> The inclusion of an expiration date on an assignment of claim is atypical and may be construed by courts as limiting the irrevocable nature of this Assignment. The parties have nonetheless agreed to include this provision.</p>
      <p>This Assignment shall expire and terminate automatically on <strong>${formatDate(data.expirationDate)}</strong> if the Claim has not been collected or otherwise resolved prior to that date, unless the parties agree in writing to extend this Assignment before that date. Upon expiration, all rights to the Claim shall revert to Assignor.</p>
    `
    : '';

  const specialConditionsSection =
    data.specialConditions && data.specialConditions.trim()
      ? `
        <h2>14. Special Conditions</h2>
        <p>${data.specialConditions.replace(/\n/g, '<br/>')}</p>
      `
      : '';

  // ── Notarization block ────────────────────────────────────────────────────
  const notarizationBlock = data.requiresNotarization
    ? `
      <div class="notary-block" style="page-break-before: always;">
        <h2>Notarization</h2>
        <p>STATE OF MINNESOTA<br/>COUNTY OF ___________________</p>
        <p>On this _____ day of ______________, 20____, before me, a Notary Public in and for the State of Minnesota, personally appeared ______________________________,
        personally known to me (or proved to me on the basis of satisfactory evidence) to be the person whose name is subscribed to the within instrument and acknowledged to me that they executed the same in their authorized capacity, and that by their signature on the instrument, the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.</p>
        <div class="signature-line" style="margin-top: 1in; margin-bottom: 0.1in; width: 33%;"></div>
        <p style="margin-top: 0in;">Notary Public Signature</p>
        <div class="signature-line" style="margin-bottom: 0.1in; width: 33%;""></div>
        <p style="margin-top: 0in;">Printed Name</p>
        <div style="width: 3in; height: 1.5in; border: 1.5px solid #999; display: flex; align-items: center; justify-content: center; margin-top: 0.25in;">
          <span style="color: #ccc; font-style: italic; font-size: 10pt;">Stamp here</span>
        </div>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assignment of Claim</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
    }
    h1 {
      text-align: center;
      text-transform: uppercase;
      font-size: 16pt;
      margin-bottom: 0.25in;
      letter-spacing: 0.05em;
    }
    h2 {
      font-size: 12pt;
      margin-top: 1em;
      margin-bottom: 0.25em;
    }
    .center { text-align: center; }
    .parties { margin: 0.5in 0; }
    blockquote {
      margin: 0.5em 1em;
      padding: 0.5em 1em;
      border-left: 3px solid #ccc;
      font-style: italic;
    }
    ul { margin: 0.5em 0 0.5em 1.5em; }
    li { margin-bottom: 0.25em; }
    .warning {
      background: #fffbea;
      border: 1px solid #f5c518;
      padding: 0.5em 1em;
      margin: 0.5em 0;
    }
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.75in;
    }
    .signature-table td {
      width: 50%;
      vertical-align: top;
      padding: 0 0.25in 0 0;
    }
    .signature-table td:last-child {
      padding-left: 0.25in;
      padding-right: 0;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 0.5in;
      margin-bottom: 0.1in;
    }
    .notary-block { margin-top: 1em; }
    @media print {
      body { margin: 0; }
      .signature-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <h1>Assignment of Claim</h1>
  <p class="center"><strong>Date:</strong> ${effectiveDateFormatted}</p>

  <div class="parties">
    <p><strong>ASSIGNOR:</strong> ${data.llcName}, a Minnesota limited liability company${data.llcAddress ? `, with a principal place of business at ${data.llcAddress}` : ''} ("<strong>Assignor</strong>")</p>
    <p><strong>ASSIGNEE:</strong> ${assigneeEntityDesc}${data.assignee.address ? `, with address at ${data.assignee.address}` : ''} ("<strong>Assignee</strong>")</p>
  </div>

  <h2>1. Recitals</h2>
  <p>WHEREAS, Assignor is a Minnesota limited liability company and the holder of a certain claim (the "<strong>Claim</strong>") described herein;</p>
  <p>WHEREAS, Assignor desires to assign, transfer, and convey the Claim to Assignee, and Assignee desires to accept the assignment of the Claim, on the terms and conditions set forth in this Assignment of Claim (this "<strong>Assignment</strong>");</p>
  <p>NOW, THEREFORE, in consideration of ${considerationText}, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:</p>

  <h2>2. Description of Claim</h2>
  ${claimDescriptionSection}

  <h2>3. Assignment and Consideration</h2>
  <p>For and in consideration of ${considerationText}, the receipt and sufficiency of which are hereby acknowledged, Assignor hereby irrevocably, absolutely, and unconditionally assigns, transfers, sells, sets over, and conveys to Assignee all of Assignor's right, title, and interest in and to the Claim in its entirety, together with:</p>
  <ul>
    <li>all proceeds of the Claim;</li>
    <li>all rights to collect, enforce, litigate, settle, compromise, or otherwise dispose of the Claim;</li>
    <li>all causes of action, judgments, and remedies relating to the Claim; and</li>
    <li>all interest accrued and accruing on the Claim.</li>
  </ul>
  <p>This is a FULL assignment. Assignor retains no right, title, or interest in the Claim following the effective date of this Assignment. This Assignment is irrevocable except by written agreement of both parties.</p>

  <h2>4. Representations and Warranties</h2>
  <p>Assignor represents and warrants to Assignee as of the date of this Assignment:</p>
  <p>(a) <strong>Authority and LLC Authorization.</strong> Assignor has the legal right, power, and authority to execute and perform this Assignment. This Assignment has been authorized by the member(s) and/or manager(s) of Assignor as required under Assignor's operating agreement and Minn. Stat. § 322C (Minnesota Revised Uniform Limited Liability Company Act).${exhibitLetters.has('member_resolution') ? ` Evidence of such authorization is attached as Exhibit ${exhibitLetters.get('member_resolution')} (Member Resolution or Written Consent).` : ''}</p>
  <p>(b) <strong>Organization.</strong> Assignor is a limited liability company duly organized, validly existing, and in good standing under the laws of the State of Minnesota.</p>
  ${titleWarrantyClause}
  <p>(d) <strong>Anti-Assignment Compliance.</strong> To the best of Assignor's knowledge, the agreements or instruments giving rise to the Claim do not contain any provision prohibiting, restricting, or conditioning the assignment of the Claim. Assignor has not received written notice of any anti-assignment restriction applicable to the Claim.</p>
  <p>(e) <strong>Solvency.</strong> As of the date of this Assignment, Assignor (i) is not insolvent, (ii) is not rendered insolvent by this Assignment, (iii) has sufficient assets to pay its debts as they become due in the ordinary course of business, and (iv) is not making this Assignment with the intent to defraud any creditor. This representation is made to address the requirements of the Minnesota Uniform Voidable Transactions Act, Minn. Stat. § 513.41 et seq.</p>
  <p>(f) <strong>UCC Article 9.</strong> The parties acknowledge that, to the extent the Claim constitutes an "account," "payment intangible," or other asset subject to Article 9 of the Minnesota Uniform Commercial Code (Minn. Stat. § 336.9-101 et seq.), Assignee may be required to file a UCC-1 Financing Statement to perfect its interest against third-party creditors of Assignor. Assignee is solely responsible for determining whether such filing is necessary and for making any such filing at its own expense. Assignor agrees to cooperate with and execute any documents reasonably necessary for Assignee to perfect its interest.</p>
  ${rentDebtRepsSection}

  <h2>5. Notice to Obligor</h2>
  <p>(a) <strong>Obligation to Notify.</strong> Assignor shall deliver written notice of this Assignment to the obligor(s) on the Claim (the "<strong>Obligor</strong>") within five (5) business days of the execution of this Assignment. Under Minnesota law, until an Obligor receives actual written notice of an assignment, the Obligor may discharge its obligation by payment to or performance for the original creditor (Assignor), and such payment or performance constitutes a full discharge of the Obligor's obligation to the extent of such payment or performance. See Minn. Stat. § 336.9-406.</p>
  <p>(b) <strong>Contents of Notice.</strong> The notice to Obligor shall identify: (i) the Claim being assigned; (ii) the name and contact information of Assignee; (iii) instructions that all future payments or performance shall be made directly to Assignee; and (iv) the effective date of this Assignment. A form Notice to Obligor is attached as <strong>Exhibit A</strong>.</p>
  <p>(c) <strong>Proof of Notice.</strong> Assignor shall provide Assignee with written confirmation of delivery of the notice to Obligor promptly after such delivery.</p>

  <h2>6. Interest Accrual</h2>
  <p>All interest accrued on the Claim through the effective date of this Assignment, and all interest accruing on the Claim after the effective date, is included in this Assignment and shall belong solely to Assignee. The applicable interest rate shall be: (i) the contractual rate set forth in the underlying agreement giving rise to the Claim, if any; or (ii) if no contractual rate exists, the statutory pre-judgment interest rate applicable under Minn. Stat. § 549.09 as of the effective date of this Assignment. The start date for interest accrual purposes shall be the date on which the underlying obligation became due and unpaid.</p>

  <h2>7. Cooperation</h2>
  <p>Assignor shall, at Assignee's reasonable request and expense, execute and deliver such further instruments and documents, and take such further actions, as may be reasonably necessary to carry out the purposes of this Assignment and to vest in Assignee full title to the Claim.</p>

  <h2>8. Successors and Assigns</h2>
  <p>This Assignment shall be binding upon and inure to the benefit of the parties hereto and their respective heirs, legal representatives, successors, and assigns. Assignee may further assign the Claim without Assignor's consent unless otherwise prohibited by law.</p>

  <h2>9. Governing Law and Venue</h2>
  <p>This Assignment shall be governed by and construed in accordance with the laws of the State of Minnesota, without regard to its conflict of law principles. Any dispute arising out of or relating to this Assignment shall be resolved exclusively in the state or federal courts located in Hennepin County, Minnesota, and each party hereby irrevocably consents to the jurisdiction of such courts.</p>

  <h2>10. Waiver</h2>
  <p>No failure or delay by either party in exercising any right, power, or remedy under this Assignment shall operate as a waiver thereof. No single or partial exercise of any right, power, or remedy shall preclude any other or further exercise thereof or the exercise of any other right, power, or remedy.</p>

  <h2>11. Attorney Fees</h2>
  <p>In any action, suit, or proceeding arising out of or related to this Assignment, including any action to enforce this Assignment or to collect the Claim, the prevailing party shall be entitled to recover its reasonable attorney fees and costs from the non-prevailing party, in addition to any other relief to which the prevailing party may be entitled.</p>

  <h2>12. Electronic Signatures</h2>
  <p>The parties agree that electronic signatures shall be deemed valid and binding to the same extent as original signatures, pursuant to the Minnesota Uniform Electronic Transactions Act, Minn. Stat. § 325L.01 et seq.</p>

  ${expirationSection}

  ${specialConditionsSection}

  <h2>15. Exhibits</h2>
  <p>The following exhibits are attached hereto and incorporated by reference:</p>
  <ul>
    <li><strong>Exhibit A</strong> — Notice to Obligor (see companion Notice Letter)</li>
    ${Array.from(exhibitLetters.entries()).map(([key, letter]) => {
      const def = AOC_EXHIBIT_DEFINITIONS.find(d => d.key === key)!;
      return `<li><strong>Exhibit ${letter}</strong> — ${def.label}</li>`;
    }).join('\n    ')}
  </ul>

  <h2>16. Miscellaneous</h2>
  <p>This Assignment is a full and complete assignment of the entire Claim. No partial assignment is intended. Assignor retains no economic or beneficial interest in the Claim following the effective date. This Assignment constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements and understandings. This Assignment may not be amended except by a written instrument signed by both parties. If any provision of this Assignment is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>

  <div class="signature-block">
    <p><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Assignment of Claim as of the date first written above.</p>
    <table class="signature-table">
      <tr>
        <td>
          <p><strong>ASSIGNOR:</strong></p>
          <p>${data.llcName}</p>
          ${data.assignorSignatoryName
            ? `<p style="font-style:italic;margin-bottom:0;margin-top:0.5in">/s/ ${data.assignorSignatoryName}</p>
          <div class="signature-line" style="margin-top:0"></div>
          <p>Signature (Electronic)</p>
          <p style="margin-bottom:0;">${data.assignorSignatoryName}${data.assignorTitle ? `, ${data.assignorTitle}` : ''}</p>
          <div class="signature-line" style="margin-top:0"></div>
          <p>Printed Name &amp; Title</p>
          <p style="margin-bottom:0">${effectiveDateFormatted}</p>
          <div class="signature-line" style="margin-top:0"></div>
          <p>Date</p>`
            : `<div class="signature-line"></div>
          <p>Signature</p>
          <div class="signature-line"></div>
          <p>Printed Name &amp; Title</p>
          <div class="signature-line"></div>
          <p>Date</p>`}
        </td>
        <td>
          <p><strong>ASSIGNEE:</strong></p>
          <p>${data.assignee.name}</p>
          ${data.assigneeSignatoryName
            ? `<p style="font-style:italic;margin-bottom:0;margin-top:0.5in">/s/ ${data.assigneeSignatoryName}</p>
          <div class="signature-line" style="margin-top:0"></div>
          <p>Signature (Electronic)</p>
          <p style="margin-bottom:0;">${data.assigneeSignatoryName}${data.assigneeTitle ? `, ${data.assigneeTitle}` : ''}</p>
          <div class="signature-line" style="margin-top:0"></div>
          <p>Printed Name${data.assignee.entityType === 'company' ? ' &amp; Title' : ''}</p>
          <p style="margin-bottom:0">${effectiveDateFormatted}</p>
          <div class="signature-line" style="margin-top:0"></div>
          <p>Date</p>`
            : `<div class="signature-line"></div>
          <p>Signature</p>
          <div class="signature-line"></div>
          <p>Printed Name${data.assignee.entityType === 'company' ? ' &amp; Title' : ''}</p>
          <div class="signature-line"></div>
          <p>Date</p>`}
        </td>
      </tr>
    </table>
  </div>

  ${notarizationBlock}

</body>
</html>`;
}

export function generateNoticeToObligor(
  data: AssignmentOfClaim,
  targetObligor?: { name: string; address?: string; entityType?: ObligorEntityType; role?: ObligorRole }
): string {
  const effectiveDateFormatted = formatDate(data.effectiveDate);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Resolve which obligor record we're generating for
  const resolvedObligor = targetObligor ?? (() => {
    const primary = data.obligors?.find(o => o.isPrimary) ?? data.obligors?.[0];
    if (primary) return { name: primary.name, address: primary.address, entityType: primary.entityType, role: primary.role };
    return undefined;
  })();

  // Entity type (resolved early — used for both address block label and salutation logic)
  const entityType = resolvedObligor?.entityType;
  const isBusinessEntity = entityType && entityType !== 'individual' && entityType !== 'unknown';
  const entityTypeLabel = isBusinessEntity ? OBLIGOR_ENTITY_TYPE_LABELS[entityType!] : null;

  // Salutation name
  let obligorName: string;
  if (resolvedObligor?.name) {
    obligorName = resolvedObligor.name;
  } else if (data.claimType === 'rent_debt') {
    obligorName = data.tenantName ?? 'Tenant/Obligor';
  } else if (data.claimType === 'insurance_claim') {
    obligorName = data.insurer ?? 'Insurer/Obligor';
  } else {
    obligorName = 'Obligor';
  }

  // Salutation line: business entities always get "To Whom It May Concern:"
  const salutation = isBusinessEntity || !obligorName || obligorName === 'Obligor'
    ? `To Whom It May Concern:`
    : `Dear ${obligorName}:`;

  // Delivery address
  const deliveryAddress =
    resolvedObligor?.address ??
    (data.claimType === 'rent_debt' && data.propertyAddress
      ? data.propertyAddress
      : '[OBLIGOR MAILING ADDRESS — TO BE COMPLETED BEFORE DELIVERY]');

  // Basis of obligation paragraph (shown for known roles only)
  const role = resolvedObligor?.role;
  const basisParagraph: string | null = (() => {
    if (!role || role === 'unknown') return null;
    switch (role) {
      case 'tenant':
        return `<p><strong>Basis of Your Obligation:</strong> You are receiving this notice as a tenant under the lease agreement underlying the Claim. As the named tenant, you are directly obligated for the amounts described herein.</p>`;
      case 'lease_signatory':
        return `<p><strong>Basis of Your Obligation:</strong> You are receiving this notice as a signatory to the lease agreement underlying the Claim. As a party who signed the lease, you bear personal liability for the obligations described herein.</p>`;
      case 'business_owner':
        return `<p><strong>Basis of Your Obligation:</strong> You are receiving this notice as an owner or member of the business entity named in the lease agreement underlying the Claim. Your ownership or membership interest in the named business entity is the basis of your potential liability with respect to the assigned Claim.</p>`;
      case 'manager':
        return `<p><strong>Basis of Your Obligation:</strong> You are receiving this notice as a manager of the business entity named in the lease agreement underlying the Claim. Your role as manager of the named business entity is the basis of your potential liability with respect to the assigned Claim.</p>`;
      case 'guarantor':
        return `<p><strong>Basis of Your Obligation:</strong> You are receiving this notice as a personal guarantor of the obligations underlying the Claim. Your guarantee agreement is separate from the primary lease or obligation and independently subjects you to liability for the full amount of the assigned Claim.</p>`;
      case 'other':
        return `<p><strong>Basis of Your Obligation:</strong> You are receiving this notice based on your relationship to the obligations underlying the Claim.</p>`;
      default:
        return null;
    }
  })();

  const claimTypeLabel =
    data.claimType === 'rent_debt' ? 'Rent / Tenant Debt'
    : data.claimType === 'insurance_claim' ? 'Insurance Claim'
    : 'General Monetary Claim';

  const contactLine = [data.llcPhone, data.llcEmail].filter(Boolean).join('&ensp;&bull;&ensp;');

  const assigneeRows = [
    data.assignee.name,
    data.assignee.address,
    data.assignee.phone,
    data.assignee.email,
  ].filter(Boolean).map(v => `<tr><td>${v}</td></tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Notice of Assignment of Claim</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #111;
      margin: 0;
    }
    /* ── Letterhead ── */
    .letterhead {
      text-align: center;
      padding: 0.35in 0 0.2in;
    }
    .letterhead-name {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: 0.03em;
      color: #000;
    }
    .letterhead-address {
      font-size: 10pt;
      color: #444;
      margin-top: 0.06in;
    }
    .letterhead-contact {
      font-size: 10pt;
      color: #444;
      margin-top: 0.04in;
    }
    .letterhead-rule-thick {
      border: none;
      border-top: 3px solid #000;
      margin: 0.18in 0 0;
    }
    .letterhead-rule-thin {
      border: none;
      border-top: 1px solid #000;
      margin: 0.06in 0 0;
    }
    /* ── Body ── */
    .body {
      padding: 0.3in 0 0;
    }
    p { margin-bottom: 0.75em; }
    .date { text-align: right; margin-bottom: 0.3in; }
    .address-block { margin-bottom: 0.25in; }
    .address-block p { margin-bottom: 0; }
    .re-line { margin-bottom: 0.25in; }
    .claim-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.15in 0 0.25in;
      font-size: 10.5pt;
    }
    .claim-table td {
      padding: 0.07in 0.12in;
      border: 1px solid #ccc;
      vertical-align: top;
    }
    .claim-table td:first-child {
      font-weight: 600;
      white-space: nowrap;
      width: 1.4in;
      background: #f5f5f5;
    }
    .assignee-table {
      border-collapse: collapse;
      margin: 0.1in 0 0.25in 0.2in;
      font-size: 10.5pt;
    }
    .assignee-table td { padding: 0.02in 0; }
    .warning-box {
      border: 1.5px solid #000;
      padding: 0.1in 0.15in;
      margin: 0.2in 0;
      font-weight: 600;
    }
    .sig-line {
      border-top: 1px solid #000;
      width: 2.5in;
      margin-top: 0.5in;
      margin-bottom: 0.06in;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <div class="letterhead">
    <div class="letterhead-name">${data.llcName}</div>
    ${data.llcAddress ? `<div class="letterhead-address">${data.llcAddress}</div>` : ''}
    ${contactLine ? `<div class="letterhead-contact">${contactLine}</div>` : ''}
    <hr class="letterhead-rule-thick" />
    <hr class="letterhead-rule-thin" />
  </div>

  <div class="body">
    <p class="date">${today}</p>

    <div class="address-block">
      <p>${obligorName}</p>
      ${entityTypeLabel ? `<p>${entityTypeLabel}</p>` : ''}
      <p>${deliveryAddress}</p>
    </div>

    <p class="re-line"><strong>Re: Notice of Assignment of Claim — Effective ${effectiveDateFormatted}</strong></p>

    <p>${salutation}</p>

    <p>Please take notice that <strong>${data.llcName}</strong> ("<strong>Assignor</strong>") has assigned, transferred, and conveyed to <strong>${data.assignee.name}</strong> ("<strong>Assignee</strong>") all of Assignor's right, title, and interest in and to the following claim (the "<strong>Claim</strong>"):</p>

    <table class="claim-table">
      <tr><td>Claim Type</td><td>${claimTypeLabel}</td></tr>
      ${data.claimValueCents !== undefined ? `<tr><td>Claim Amount</td><td style="font-weight: 600; color: #000; font-size: 1.15rem">${formatCents(data.claimValueCents)}</td></tr>` : ''}
    </table>

    <p style="margin-bottom:0.1in"><strong>Description of Claim:</strong></p>
    <div style="margin-bottom:0.25in;padding-left:0.15in;border-left:3px solid #ccc;font-size:10.5pt">${descriptionToHtml(data.claimDescription)}</div>

    ${basisParagraph ?? ''}

    <div style="page-break-inside:avoid">
      <p>Effective as of <strong>${effectiveDateFormatted}</strong>, all payments, communications, and correspondence relating to the Claim must be directed exclusively to Assignee at:</p>

      <table class="assignee-table">${assigneeRows}</table>

      <div class="warning-box">WARNING: Any payment made to ${data.llcName} after the date of this notice will not discharge your obligation with respect to the Claim. You must direct all payments to Assignee at the address above.</div>

      <p>A copy of the Assignment of Claim is available upon written request.</p>

      <p>Sincerely,</p>

      ${data.noticeSignatoryName
        ? `<p style="font-style:italic;margin-bottom:0.02in">/s/ ${data.noticeSignatoryName}</p>
        <div class="sig-line" style="margin-top:0"></div>
        <p>Signature (Electronic)</p>`
        : `<div class="sig-line"></div>`
      }
      <p style="margin-bottom:0.02in">${data.llcName}</p>
      <p style="margin-bottom:0.02in">Authorized Representative</p>
      <p>Date: ${data.noticeSignedDate
        ? new Date(data.noticeSignedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '_________________________'
      }</p>
    </div>
  </div>

</body>
</html>`;
}
