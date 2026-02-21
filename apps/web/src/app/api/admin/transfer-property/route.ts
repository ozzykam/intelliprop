import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { transferProperty, TransferError } from '@/lib/services/transfer.service';
import { z } from 'zod';

const transferPropertySchema = z.object({
  sourceLlcId: z.string().min(1, 'Source LLC ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
  destLlcId: z.string().min(1, 'Destination LLC ID is required'),
});

/**
 * POST /api/admin/transfer-property
 * Transfer a property and all related data between LLCs (super-admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireSuperAdmin();

    const body = await request.json();
    const parsed = transferPropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    const result = await transferProperty(
      parsed.data.sourceLlcId,
      parsed.data.propertyId,
      parsed.data.destLlcId,
      context.userId
    );

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    if (error instanceof TransferError) {
      const status = error.code === 'NOT_FOUND' || error.code === 'SAME_LLC' || error.code === 'ALREADY_EXISTS'
        ? 400
        : 500;
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status }
      );
    }

    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED') || message.includes('Super-admin')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Super-admin access required' } },
        { status: 403 }
      );
    }
    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
        { status: 401 }
      );
    }

    console.error('Error transferring property:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to transfer property' } },
      { status: 500 }
    );
  }
}
