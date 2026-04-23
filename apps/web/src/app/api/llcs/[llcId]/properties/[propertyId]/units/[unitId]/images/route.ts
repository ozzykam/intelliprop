import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcMember, requireLlcRole } from '@/lib/auth/requireLlcMember';
import { listUnitImages, createUnitImage } from '@/lib/services/unitImage.service';

interface RouteParams {
  params: Promise<{ llcId: string; propertyId: string; unitId: string }>;
}

/**
 * GET /api/llcs/[llcId]/properties/[propertyId]/units/[unitId]/images
 * List all images for a unit (includes signed read URLs).
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { llcId, propertyId, unitId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcMember(llcId);
    const images = await listUnitImages(llcId, propertyId, unitId);
    return NextResponse.json({ ok: true, data: images });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error listing unit images:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load images' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llcs/[llcId]/properties/[propertyId]/units/[unitId]/images
 * Save image metadata after upload to Storage.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { llcId, propertyId, unitId } = await params;

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
    const { storagePath, fileName, contentType, sizeBytes, caption } = body as {
      storagePath: string;
      fileName: string;
      contentType: string;
      sizeBytes: number;
      caption?: string;
    };

    if (!storagePath || !fileName || !contentType || !sizeBytes) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'storagePath, fileName, contentType, and sizeBytes are required' } },
        { status: 400 }
      );
    }

    const image = await createUnitImage(
      llcId,
      propertyId,
      unitId,
      { storagePath, fileName, contentType, sizeBytes, caption },
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
    console.error('Error creating unit image:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create image' } },
      { status: 500 }
    );
  }
}
