import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const COLLECTION = 'pendingActivations';

/**
 * POST /api/activate/prefill
 * Returns pre-fill data (email) for the create-account step.
 * Requires a valid confirmationToken. Public endpoint - no auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirmationToken } = body;

    if (!confirmationToken || typeof confirmationToken !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing confirmation token' },
        { status: 400 }
      );
    }

    // Find the activation by confirmation token
    const snapshot = await adminDb.collection(COLLECTION)
      .where('confirmationToken', '==', confirmationToken)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ ok: true, data: { email: '' } });
    }

    const activation = snapshot.docs[0]!.data();

    // Look up tenant email if this activation has a tenantId
    let email = '';
    if (activation.tenantId) {
      const tenantDoc = await adminDb.collection('tenants').doc(activation.tenantId).get();
      if (tenantDoc.exists) {
        email = tenantDoc.data()?.email || '';
      }
    }

    return NextResponse.json({ ok: true, data: { email } });
  } catch (error) {
    console.error('Error fetching prefill data:', error);
    return NextResponse.json({ ok: true, data: { email: '' } });
  }
}
