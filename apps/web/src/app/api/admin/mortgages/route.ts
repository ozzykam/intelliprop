import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { createMortgageSchema } from '@shared/validators/mortgage';
import {
  listMortgages,
  createMortgage,
  getUniqueLenders,
} from '@/lib/services/mortgage.service';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/admin/mortgages
 * List all mortgages with optional filters (super-admin only)
 * Query params:
 * - llcId: Filter by LLC
 * - propertyId: Filter by property
 * - status: Filter by status (active, paid_off, etc.)
 * - lender: Filter by lender name
 * - upcomingPayments: Only mortgages with payments due within N days
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const llcIdFilter = searchParams.get('llcId') || undefined;
    const propertyId = searchParams.get('propertyId') || undefined;
    const status = searchParams.get('status') as 'active' | 'paid_off' | 'defaulted' | 'refinanced' | undefined;
    const lender = searchParams.get('lender') || undefined;
    const upcomingPaymentsParam = searchParams.get('upcomingPayments');
    const upcomingPaymentsDays = upcomingPaymentsParam
      ? parseInt(upcomingPaymentsParam, 10)
      : undefined;
    const accountId = searchParams.get('accountId');

    const emptySummary = { totalMortgages: 0, activeMortgages: 0, totalBalance: 0, totalMonthlyPayments: 0, avgInterestRate: 0, propertiesWithMortgages: 0 };
    if (!accountId) {
      return NextResponse.json({ ok: true, data: { mortgages: [], lenders: [], summary: emptySummary } });
    }

    // Resolve org's LLC IDs to scope the mortgage query
    const orgLlcsSnap = await adminDb.collection('llcs').where('accountId', '==', accountId).get();
    const orgLlcIds = new Set(orgLlcsSnap.docs.map(d => d.id));

    // If a specific llcId was requested but it's not in this org, return empty
    if (llcIdFilter && !orgLlcIds.has(llcIdFilter)) {
      return NextResponse.json({ ok: true, data: { mortgages: [], lenders: [], summary: emptySummary } });
    }

    const [allMortgages, lenders] = await Promise.all([
      listMortgages({ llcId: llcIdFilter, propertyId, status, lender, upcomingPaymentsDays }),
      getUniqueLenders(),
    ]);

    // Filter to this org's LLCs
    const mortgages = allMortgages.filter(m => orgLlcIds.has((m as unknown as { llcId: string }).llcId));

    // Calculate summary stats
    const activeMortgages = mortgages.filter(m => m.status === 'active');
    const totalBalance = activeMortgages.reduce((sum, m) => sum + m.currentBalance, 0);
    const totalMonthlyPayments = activeMortgages.reduce((sum, m) => sum + m.totalPayment, 0);
    const avgInterestRate = activeMortgages.length > 0
      ? activeMortgages.reduce((sum, m) => sum + m.interestRate, 0) / activeMortgages.length
      : 0;
    const propertiesWithMortgages = new Set(mortgages.map(m => m.propertyId)).size;

    return NextResponse.json({
      ok: true,
      data: {
        mortgages,
        lenders,
        summary: {
          totalMortgages: mortgages.length,
          activeMortgages: activeMortgages.length,
          totalBalance,
          totalMonthlyPayments,
          avgInterestRate: Math.round(avgInterestRate * 100) / 100,
          propertiesWithMortgages,
        },
      },
    });
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
    console.error('Error fetching mortgages:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch mortgages' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mortgages
 * Create a new mortgage (super-admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireSuperAdmin();

    const body = await request.json();
    const parseResult = createMortgageSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const mortgage = await createMortgage(parseResult.data, context.userId);

    return NextResponse.json({
      ok: true,
      data: mortgage,
    });
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
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: message.replace('NOT_FOUND: ', '') } },
        { status: 404 }
      );
    }
    console.error('Error creating mortgage:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create mortgage' } },
      { status: 500 }
    );
  }
}
