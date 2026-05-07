import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createAoc, listAocs } from '@/lib/services/aoc.service';
import { createAssignmentSchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string }>;
}

/**
 * GET /api/llcs/[llcId]/aoc
 * List all Assignments of Claim for an LLC
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
    await requireLlcRole(llcId, ['admin', 'manager', 'legal', 'accounting']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const claimType = searchParams.get('claimType') ?? undefined;
    const caseId = searchParams.get('caseId') ?? undefined;

    const assignments = await listAocs(llcId, { status, claimType, caseId });
    return NextResponse.json({ ok: true, data: assignments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access to this LLC' } },
        { status: 403 }
      );
    }
    console.error('Error listing assignments:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list assignments' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/aoc
 * Create a new Assignment of Claim (admin/legal only)
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
    await requireLlcRole(llcId, ['admin', 'legal']);

    const body = await request.json();
    const parsed = createAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: parsed.error.issues?.[0]?.message || 'Invalid input',
          },
        },
        { status: 400 }
      );
    }

    const assignment = await createAoc(llcId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: assignment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or legal access required' } },
        { status: 403 }
      );
    }
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create assignment' } },
      { status: 500 }
    );
  }
}
