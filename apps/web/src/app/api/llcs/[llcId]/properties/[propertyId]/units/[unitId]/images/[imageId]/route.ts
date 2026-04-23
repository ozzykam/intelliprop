import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcRole } from '@/lib/auth/requireLlcMember';
import { updateUnitImage, deleteUnitImage } from '@/lib/services/unitImage.service';

interface RouteParams {
  params: Promise<{ llcId: string; propertyId: string; unitId: string; imageId: string }>;
}

/**
 * PATCH /api/llcs/[llcId]/properties/[propertyId]/units/[unitId]/images/[imageId]
 * Update a unit image caption.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { llcId, propertyId, unitId, imageId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const ctx = await requireLlcRole(llcId, ['admin', 'manager']);

    const body = await request.json();
    const image = await updateUnitImage(
      llcId,
      propertyId,
      unitId,
      imageId,
      { caption: body.caption },
      ctx.user.uid
    );

    return NextResponse.json({ ok: true, data: image });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Image not found' } },
        { status: 404 }
      );
    }
    console.error('Error updating unit image:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update image' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llcs/[llcId]/properties/[propertyId]/units/[unitId]/images/[imageId]
 * Delete a unit image from Storage and Firestore.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { llcId, propertyId, unitId, imageId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const ctx = await requireLlcRole(llcId, ['admin', 'manager']);
    await deleteUnitImage(llcId, propertyId, unitId, imageId, ctx.user.uid);
    return NextResponse.json({ ok: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Image not found' } },
        { status: 404 }
      );
    }
    console.error('Error deleting unit image:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete image' } },
      { status: 500 }
    );
  }
}
