import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createDraft, createDraftFromTemplate, listDrafts } from '@/lib/services/leaseBuilder.service';
import { createLeaseBuilderDraftSchema } from '@shared/validators/leaseBuilder';

interface RouteParams {
  params: Promise<{ llcId: string }>;
}

/**
 * GET /api/llcs/[llcId]/lease-builder
 * List lease builder drafts
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { llcId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const leaseClass = searchParams.get('leaseClass') as 'residential' | 'commercial' | undefined;

    const drafts = await listDrafts(llcId, { status, leaseClass });
    return NextResponse.json({ ok: true, data: drafts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin, manager, or legal access required' } },
        { status: 403 }
      );
    }
    console.error('Error listing lease builder drafts:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list drafts' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/lease-builder
 * Create a new lease builder draft
 */
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
    await requireLlcRole(llcId, ['admin', 'manager']);

    const body = await request.json();
    const parsed = createLeaseBuilderDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    // If fromDefault, try to create from template first
    if (parsed.data.fromDefault) {
      const fromTemplate = await createDraftFromTemplate(llcId, parsed.data.leaseClass, user.uid);
      if (fromTemplate) {
        return NextResponse.json({ ok: true, data: fromTemplate }, { status: 201 });
      }
      // No template found — fall through to normal creation
    }

    const draft = await createDraft(llcId, parsed.data.leaseClass, user.uid);
    return NextResponse.json({ ok: true, data: { ...draft, fromTemplate: false } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or manager access required' } },
        { status: 403 }
      );
    }
    console.error('Error creating lease builder draft:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create draft' } },
      { status: 500 }
    );
  }
}
