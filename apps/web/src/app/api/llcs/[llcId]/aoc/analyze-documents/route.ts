import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { anthropic } from '@/lib/ai/anthropic';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

type SupportedMediaType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

interface DocumentAnalysis {
  fileName: string;
  documentType:
    | 'lease'
    | 'tenant_ledger'
    | 'correspondence'
    | 'eviction_notice'
    | 'invoice'
    | 'insurance'
    | 'other';
  summary: string;
  parties: { name: string; role: string }[];
  keyAmounts: { description: string; amount: string }[];
  keyDates: { description: string; date: string }[];
  suggestedFields: {
    tenantName?: string;
    propertyAddress?: string;
    claimType?: 'rent_debt' | 'insurance_claim' | 'general_monetary';
    claimValueDollars?: string;
  };
}

interface AnalysisResult {
  claimDescription: string;
  documents: DocumentAnalysis[];
}

const SUPPORTED_MEDIA_TYPES: Set<string> = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

const SYSTEM_PROMPT = `You are a legal document analyst specializing in property management and real estate assignments of claim.
Your primary job is to read all provided documents together and write a comprehensive, detailed Claim Description suitable for use in an Assignment of Claim legal document.

The Claim Description should:
- Be written in clear, professional language appropriate for a legal document
- Synthesize all documents into a single cohesive narrative
- Identify the nature of the claim (unpaid rent, damage, insurance, etc.)
- Name the parties (landlord/assignor, tenant/obligor, property address)
- Specify all monetary amounts owed with context (e.g. months of unpaid rent, specific charges)
- Reference key dates (lease start/end, when debt accrued, notices sent, etc.)
- Reference the supporting documents by type (e.g. "as evidenced by the attached lease agreement dated...")
- Be thorough enough to stand on its own as a clear record of the claim
- Use past tense for events that have already occurred

Also extract per-document structured data for reference.`;

const ANALYSIS_PROMPT = `Analyze all attached documents and return a single JSON object (not an array).

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "claimDescription": "Detailed, comprehensive claim description synthesizing all documents — multiple paragraphs as needed, written for an Assignment of Claim legal form",
  "documents": [
    {
      "fileName": "original filename",
      "documentType": "lease|tenant_ledger|correspondence|eviction_notice|invoice|insurance|other",
      "summary": "2-4 sentence plain-English summary of this document",
      "parties": [{"name": "...", "role": "..."}],
      "keyAmounts": [{"description": "...", "amount": "..."}],
      "keyDates": [{"description": "...", "date": "..."}],
      "suggestedFields": {
        "tenantName": "...",
        "propertyAddress": "...",
        "claimType": "rent_debt|insurance_claim|general_monetary",
        "claimValueDollars": "..."
      }
    }
  ]
}`;

interface RouteParams {
  params: Promise<{ llcId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId } = await params;

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid multipart form data' } },
      { status: 400 }
    );
  }

  const fileEntries = formData.getAll('files');
  if (!fileEntries.length) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'No files provided' } },
      { status: 400 }
    );
  }

  if (fileEntries.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: `Maximum ${MAX_FILES} files allowed` } },
      { status: 400 }
    );
  }

  const files: File[] = [];
  for (const entry of fileEntries) {
    if (!(entry instanceof File)) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'All entries must be files' } },
        { status: 400 }
      );
    }
    if (entry.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: 'INVALID_INPUT', message: `File "${entry.name}" exceeds 10 MB limit` },
        },
        { status: 400 }
      );
    }
    if (!SUPPORTED_MEDIA_TYPES.has(entry.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: `File "${entry.name}" has unsupported type "${entry.type}". Supported: PDF, images (JPEG/PNG/GIF/WebP), plain text`,
          },
        },
        { status: 400 }
      );
    }
    files.push(entry);
  }

  // Build Claude content blocks
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

  const contentBlocks: ContentBlock[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    contentBlocks.push({ type: 'text', text: `Document: ${file.name}` });

    if (file.type === 'text/plain') {
      const text = Buffer.from(arrayBuffer).toString('utf-8');
      contentBlocks.push({ type: 'text', text });
    } else if (file.type === 'application/pdf') {
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      });
    } else {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: file.type as SupportedMediaType, data: base64 },
      });
    }
  }

  contentBlocks.push({ type: 'text', text: ANALYSIS_PROMPT });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks as Parameters<typeof anthropic.messages.create>[0]['messages'][0]['content'] }],
    });

    // Extract text from response (skip thinking blocks)
    const textContent = response.content.find(b => b.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let result: AnalysisResult;
    try {
      const raw = textContent.text.trim();
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;
      result = JSON.parse(jsonStr) as AnalysisResult;
    } catch {
      throw new Error('Failed to parse Claude response as JSON');
    }

    // Stamp file names in case Claude returned wrong ones
    result.documents = result.documents.map((a, i) => ({
      ...a,
      fileName: files[i]?.name ?? a.fileName,
    }));

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    console.error('Document analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
