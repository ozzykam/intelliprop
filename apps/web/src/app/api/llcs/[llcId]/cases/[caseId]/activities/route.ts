import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { createCaseActivity, listCaseActivities } from '@/lib/services/caseActivity.service';
import { createActivitySchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ llcId: string; caseId: string }>;
}

/**
 * GET /api/llcs/[llcId]/cases/[caseId]/activities
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, caseId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcRole(llcId, ['admin', 'manager', 'legal']);

    const activities = await listCaseActivities(llcId, caseId);
    return NextResponse.json({ ok: true, data: activities });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error listing activities:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list activities' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/cases/[caseId]/activities
 */
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

    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]?.message ?? 'Invalid input';
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: firstIssue } },
        { status: 400 }
      );
    }

    const activity = await createCaseActivity(llcId, caseId, parsed.data, user.uid);
    return NextResponse.json({ ok: true, data: activity }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Admin or legal access required' } },
        { status: 403 }
      );
    }
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create activity' } },
      { status: 500 }
    );
  }
}
