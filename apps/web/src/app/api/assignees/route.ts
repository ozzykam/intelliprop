import { NextResponse } from 'next/server';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import { listAssignees } from '@/lib/services/user.service';

/**
 * GET /api/assignees
 * List all users designated as assignees (any authenticated staff user).
 */
export async function GET() {
  try {
    const context = await requirePermissionContext();

    if (context.userType !== 'staff') {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Staff access required' } },
        { status: 403 }
      );
    }

    const assignees = await listAssignees();

    return NextResponse.json({ ok: true, data: assignees });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
        { status: 401 }
      );
    }
    console.error('Error listing assignees:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list assignees' } },
      { status: 500 }
    );
  }
}
