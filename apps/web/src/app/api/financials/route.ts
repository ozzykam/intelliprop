import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { getAccountsReceivable } from '@/lib/services/financials.service';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    const data = await getAccountsReceivable(user.uid);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error fetching financials:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch financials' } },
      { status: 500 }
    );
  }
}
