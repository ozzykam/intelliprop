import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { getCase } from '@/lib/services/case.service';
import { getMember } from '@/lib/services/member.service';
import { listDocuments } from '@/lib/services/document.service';
import { adminStorage, adminDb } from '@/lib/firebase/admin';
import { anthropic } from '@/lib/ai/anthropic';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const SUPPORTED_MEDIA_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

const bodySchema = z.object({
  defendantIndex: z.number().int().min(0),
  selectedDocumentIds: z.array(z.string().min(1)).min(1).max(5),
  contactUserId: z.string().min(1),
  letterheadName: z.string().optional(),
  letterheadAddress: z.string().optional(),
  letterheadPhone: z.string().optional(),
  letterheadEmail: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ llcId: string; caseId: string }>;
}

function descriptionToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(para => `<p style="margin:0 0 0.75em 0">${para.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function buildDefendantNoticeHtml(params: {
  llcName: string;
  llcAddress?: string;
  llcPhone?: string;
  llcEmail?: string;
  defendantName: string;
  defendantAddress?: string;
  docketNumber?: string;
  court: string;
  bodyText: string;
  nextHearingDate?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
}): string {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const contactLine = [params.llcPhone, params.llcEmail].filter(Boolean).join('&ensp;&bull;&ensp;');
  const nextHearingFormatted = params.nextHearingDate
    ? (() => {
        const parts = params.nextHearingDate!.split('-').map(Number);
        return new Date(parts[0]!, (parts[1]! - 1), parts[2]!).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      })()
    : 'Not yet scheduled';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Notice to Defendant — ${params.defendantName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #111;
      margin: 0;
      padding: 0.4in 0.65in;
    }
    .letterhead { text-align: center; padding: 0.35in 0 0.2in; }
    .letterhead-name { font-size: 20pt; font-weight: 700; letter-spacing: 0.03em; color: #000; }
    .letterhead-address { font-size: 10pt; color: #444; margin-top: 0.06in; }
    .letterhead-contact { font-size: 10pt; color: #444; margin-top: 0.04in; }
    .letterhead-rule-thick { border: none; border-top: 3px solid #000; margin: 0.18in 0 0; }
    .letterhead-rule-thin { border: none; border-top: 1px solid #000; margin: 0.06in 0 0; }
    .body { padding: 0.3in 0 0; }
    p { margin-bottom: 0.75em; }
    .date { text-align: right; margin-bottom: 0.3in; }
    .address-block { margin-bottom: 0.25in; }
    .address-block p { margin-bottom: 0; }
    .re-line { margin-bottom: 0.25in; }
    .sig-line { border-top: 1px solid #000; width: 2.5in; margin-top: 0.5in; margin-bottom: 0.06in; }
    @media print { body { margin: 0; padding: 0.5in; } }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="letterhead-name">${params.llcName}</div>
    ${params.llcAddress ? `<div class="letterhead-address">${params.llcAddress}</div>` : ''}
    ${contactLine ? `<div class="letterhead-contact">${contactLine}</div>` : ''}
    <hr class="letterhead-rule-thick" />
    <hr class="letterhead-rule-thin" />
  </div>

  <div class="body">
    <p class="date">${today}</p>

    <div class="address-block">
      <p>${params.defendantName}</p>
      ${params.defendantAddress ? `<p>${params.defendantAddress}</p>` : ''}
    </div>

    <p class="re-line"><strong>Re: Notice of Complaint Filed — Case No. ${params.docketNumber ?? 'Pending'} (${params.court})</strong></p>
    <p class="re-line"><strong>Next Hearing Date: ${nextHearingFormatted}</strong></p>

    <p>Dear ${params.defendantName}:</p>

    ${descriptionToHtml(params.bodyText)}

    <p>Sincerely,</p>

    <div class="sig-line"></div>
    <p style="margin-bottom:0.02in">${params.contactName}</p>
    <p style="margin-bottom:0.02in">${params.llcName}</p>
    ${params.contactEmail ? `<p style="margin-bottom:0.02in">${params.contactEmail}</p>` : ''}
    ${params.contactPhone ? `<p style="margin-bottom:0.02in">${params.contactPhone}</p>` : ''}
    <p>Date: ${today}</p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId, caseId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'legal']);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or legal access required' } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]?.message ?? 'Invalid input';
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: firstIssue } },
      { status: 400 }
    );
  }

  const { defendantIndex, selectedDocumentIds, contactUserId, letterheadName, letterheadAddress, letterheadPhone, letterheadEmail } = parsed.data;

  try {
    const [llcDoc, caseRecord, contactMember, allDocuments] = await Promise.all([
      adminDb.collection('llcs').doc(llcId).get(),
      getCase(llcId, caseId),
      getMember(llcId, contactUserId),
      listDocuments(llcId, caseId),
    ]);

    if (!caseRecord) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Case not found' } },
        { status: 404 }
      );
    }

    if (!contactMember) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Contact member not found' } },
        { status: 404 }
      );
    }

    const llcName: string = (llcDoc.data()?.legalName as string | undefined) ?? llcId;

    // Normalize opposing parties
    const opposingParties = Array.isArray(caseRecord.opposingParty)
      ? caseRecord.opposingParty
      : caseRecord.opposingParty
      ? [caseRecord.opposingParty]
      : [];

    if (defendantIndex >= opposingParties.length) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid defendant index' } },
        { status: 400 }
      );
    }

    const defendant = opposingParties[defendantIndex]!;
    const defendantName =
      defendant.type === 'tenant' ? defendant.tenantName : defendant.name;
    const defendantRole = defendant.type === 'tenant' ? 'tenant' : 'other';
    const defendantAddress =
      defendant.type === 'tenant' ? (defendant.propertyAddress ?? undefined) : undefined;

    // Filter documents to selected IDs
    const selectedDocs = allDocuments.filter(d => selectedDocumentIds.includes(d.id));

    // Build Claude content blocks
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

    const contentBlocks: ContentBlock[] = [];
    const skippedDocs: string[] = [];

    // Text context block with case metadata
    const contactName = contactMember.displayName ?? contactMember.email;
    const contextLines: string[] = [
      `Court: ${caseRecord.court}`,
      `Docket Number: ${caseRecord.docketNumber ?? 'Pending'}`,
      `Case Type: ${caseRecord.caseType}`,
      `Plaintiff: ${caseRecord.plaintiff?.type === 'llc' ? caseRecord.plaintiff.llcName : caseRecord.plaintiff?.name ?? llcName}`,
      `Defendant: ${defendantName ?? 'Defendant'} (${defendantRole})`,
      `Next Hearing Date: ${caseRecord.nextHearingDate ?? 'Not yet scheduled'}`,
    ];
    if (caseRecord.description) {
      contextLines.push(`\nCase Description:\n${caseRecord.description}`);
    }
    contextLines.push(`\nContact Representative: ${contactName}`);
    contextLines.push(`Contact Email: ${contactMember.email}`);

    contentBlocks.push({ type: 'text', text: contextLines.join('\n') });

    // Download and attach each selected document
    const bucket = adminStorage.bucket();
    for (const doc of selectedDocs.slice(0, MAX_FILES)) {
      if (!SUPPORTED_MEDIA_TYPES.has(doc.contentType)) {
        skippedDocs.push(doc.fileName);
        continue;
      }

      try {
        const file = bucket.file(doc.storagePath);
        const [exists] = await file.exists();
        if (!exists) {
          skippedDocs.push(doc.fileName);
          continue;
        }

        const [fileBuffer] = await file.download();
        if ((fileBuffer as Buffer).length > MAX_FILE_BYTES) {
          skippedDocs.push(doc.fileName);
          continue;
        }

        const base64 = (fileBuffer as Buffer).toString('base64');
        contentBlocks.push({ type: 'text', text: `Document: ${doc.title} (type: ${doc.type})` });

        if (doc.contentType === 'text/plain') {
          contentBlocks.push({ type: 'text', text: (fileBuffer as Buffer).toString('utf-8') });
        } else if (doc.contentType === 'application/pdf') {
          contentBlocks.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          });
        } else {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: doc.contentType, data: base64 },
          });
        }
      } catch {
        skippedDocs.push(doc.fileName);
      }
    }

    // Instruction block
    const instruction = `Write the body of a formal legal notice to ${defendantName ?? 'Defendant'} (${defendantRole}).
The notice must:
- Summarize the claim filed against them (their specific role as ${defendantRole})
- Reference the attached documents where relevant
- State the next hearing date: ${caseRecord.nextHearingDate ?? 'not yet scheduled'}
- Invite direct resolution by contacting ${contactName} at ${contactMember.email}
- Be no more than 2000 characters total
- Use professional but accessible language (not dense legalese)
Return ONLY the body text — no salutation, no closing — just 2-3 paragraphs.`;

    contentBlocks.push({ type: 'text', text: instruction });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system:
        'You are a legal notice writer for a property management LLC. Write professional, factual notices that are clear and accessible. Keep notices to no more than 2000 characters.',
      messages: [
        {
          role: 'user',
          content: contentBlocks as Parameters<typeof anthropic.messages.create>[0]['messages'][0]['content'],
        },
      ],
    });

    const textContent = response.content.find(b => b.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const bodyText = textContent.text.trim().slice(0, 2000);

    const html = buildDefendantNoticeHtml({
      llcName: letterheadName?.trim() || llcName,
      llcAddress: letterheadAddress?.trim() || undefined,
      llcPhone: letterheadPhone?.trim() || undefined,
      llcEmail: letterheadEmail?.trim() || undefined,
      defendantName: defendantName ?? 'Defendant',
      defendantAddress,
      docketNumber: caseRecord.docketNumber,
      court: caseRecord.court,
      bodyText,
      nextHearingDate: caseRecord.nextHearingDate,
      contactName,
      contactEmail: contactMember.email,
    });

    return NextResponse.json({ ok: true, data: { html, skippedDocs } });
  } catch (error: unknown) {
    console.error('Error generating defendant notice:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate notice';
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
