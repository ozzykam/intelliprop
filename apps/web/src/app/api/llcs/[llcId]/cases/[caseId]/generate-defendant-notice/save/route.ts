import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createDocument } from '@/lib/services/document.service';
import { adminStorage } from '@/lib/firebase/admin';

const bodySchema = z.object({
  html: z.string().min(1),
  defendantName: z.string().min(1),
});

interface RouteParams {
  params: Promise<{ llcId: string; caseId: string }>;
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

  const { html, defendantName } = parsed.data;

  try {
    const buffer = Buffer.from(html, 'utf-8');
    const slug = defendantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const fileName = `${Date.now()}_notice_${slug}.html`;
    const storagePath = `llcs/${llcId}/cases/${caseId}/documents/${fileName}`;

    await adminStorage.bucket().file(storagePath).save(buffer, { contentType: 'text/html' });

    const document = await createDocument(
      llcId,
      caseId,
      {
        title: `Notice to Defendant: ${defendantName}`,
        type: 'notice',
        fileName,
        storagePath,
        contentType: 'text/html',
        sizeBytes: buffer.length,
      },
      user.uid
    );

    return NextResponse.json({ ok: true, data: document }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error saving defendant notice:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save notice' } },
      { status: 500 }
    );
  }
}
