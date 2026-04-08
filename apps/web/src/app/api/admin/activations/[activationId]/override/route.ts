import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { overrideActivation } from '@/lib/services/activation.service';
import { z } from 'zod';

const overrideSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

interface RouteParams {
  params: Promise<{ activationId: string }>;
}

/**
 * POST /api/admin/activations/[activationId]/override
 * Super-admin only: bypass the activation flow and create the account directly.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { activationId } = await params;

    const body = await request.json();
    const parsed = overrideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message ?? 'Invalid input' } },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const result = await overrideActivation(activationId, email, password);

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
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
    if (message === 'Email already in use') {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: 'Email already in use' } },
        { status: 400 }
      );
    }
    if (message === 'Activation not found or already used') {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Activation not found or already used' } },
        { status: 404 }
      );
    }
    console.error('Error overriding activation:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to override activation' } },
      { status: 500 }
    );
  }
}
