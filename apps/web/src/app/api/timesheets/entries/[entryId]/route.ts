import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb } from '@/lib/firebase/admin';
import {
  getTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
} from '@/lib/services/timesheetEntry.service';
import { getTimesheetAccessTier } from '../../_helpers/accessTier';
import { updateTimesheetEntrySchema } from '@shared/types';

interface RouteParams {
  params: Promise<{ entryId: string }>;
}

/**
 * GET /api/timesheets/entries/[entryId]
 * Owners can always fetch their own entry.
 * Admins/managers may fetch entries they have tier access to.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { entryId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const entry = await getTimesheetEntry(entryId);
    if (!entry) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }

    // Owner always has access
    if (entry.userId === user.uid) {
      return NextResponse.json({ ok: true, data: entry });
    }

    // Check if the entry owner is a super-admin — if so, apply sharedWith rule
    const ownerDoc = await adminDb.collection('users').doc(entry.userId).get();
    if (ownerDoc.exists && ownerDoc.data()?.isSuperAdmin === true) {
      const sharedWith: string[] = ownerDoc.data()?.timesheetSharedWith ?? [];
      if (!sharedWith.includes(user.uid)) {
        return NextResponse.json(
          { ok: false, error: { code: 'PERMISSION_DENIED', message: 'This user has not shared their timesheets with you' } },
          { status: 403 }
        );
      }
      return NextResponse.json({ ok: true, data: entry });
    }

    // Non-super-admin entry: check caller's access tier
    const tier = await getTimesheetAccessTier(user.uid);
    if (tier === 'superAdmin' || tier === 'employee') {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, data: entry });
  } catch (error) {
    console.error('[GET /api/timesheets/entries/[entryId]]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch entry' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/timesheets/entries/[entryId]
 * Only the entry owner may update their own entry.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { entryId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateTimesheetEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid input' } },
        { status: 400 }
      );
    }

    const entry = await updateTimesheetEntry(entryId, user.uid, parsed.data);
    return NextResponse.json({ ok: true, data: entry });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }
    if (msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Not your entry' } },
        { status: 403 }
      );
    }
    console.error('[PATCH /api/timesheets/entries/[entryId]]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update entry' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/timesheets/entries/[entryId]
 * Only the entry owner may delete their own entry.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { entryId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await deleteTimesheetEntry(entryId, user.uid);
    return NextResponse.json({ ok: true, data: null });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }
    if (msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Not your entry' } },
        { status: 403 }
      );
    }
    console.error('[DELETE /api/timesheets/entries/[entryId]]', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete entry' } },
      { status: 500 }
    );
  }
}
