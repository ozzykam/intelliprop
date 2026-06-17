import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  userType: 'staff' | 'tenant';
  status: string;
  createdAt?: string;
  orgName?: string;
}

/**
 * GET /api/portal/profile
 * Get the authenticated user's profile.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Resolve org name from the first tenant link's LLC accountId
    let orgName: string | undefined;
    const tenantLinks: { llcId: string }[] = userData?.tenantLinks ?? [];
    if (tenantLinks.length > 0 && tenantLinks[0]?.llcId) {
      const llcDoc = await adminDb.collection('llcs').doc(tenantLinks[0].llcId).get();
      const accountId = llcDoc.data()?.accountId as string | undefined;
      if (accountId) {
        const orgDoc = await adminDb.collection('accounts').doc(accountId).get();
        orgName = orgDoc.data()?.name as string | undefined;
      }
    }

    const profile: UserProfile = {
      id: user.uid,
      email: userData?.email || user.email || '',
      firstName: userData?.firstName,
      middleInitial: userData?.middleInitial,
      lastName: userData?.lastName,
      displayName: userData?.displayName,
      phoneNumber: userData?.phoneNumber,
      photoURL: userData?.photoURL,
      userType: userData?.userType || 'tenant',
      status: userData?.status || 'active',
      createdAt: userData?.createdAt?.toDate?.()?.toISOString(),
      orgName,
    };

    return NextResponse.json({ ok: true, data: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export interface UpdateProfileInput {
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  phoneNumber?: string;
}

/**
 * PATCH /api/portal/profile
 * Update the authenticated user's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json() as UpdateProfileInput;
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only allow updating specific fields
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName.trim();
    }
    if (body.middleInitial !== undefined) {
      updateData.middleInitial = body.middleInitial.trim().slice(0, 1).toUpperCase() || null;
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName.trim();
    }
    if (body.phoneNumber !== undefined) {
      updateData.phoneNumber = body.phoneNumber.trim() || null;
    }

    // Auto-compute displayName from first + last name
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const userDoc = await adminDb.collection('users').doc(user.uid).get();
      const existing = userDoc.data() || {};
      const first = (updateData.firstName as string) ?? existing.firstName ?? '';
      const last = (updateData.lastName as string) ?? existing.lastName ?? '';
      const displayName = `${first} ${last}`.trim();
      updateData.displayName = displayName || null;
    }

    const userRef = adminDb.collection('users').doc(user.uid);
    await userRef.update(updateData);

    // Sync displayName to Firebase Auth record
    if (updateData.displayName !== undefined) {
      await adminAuth.updateUser(user.uid, { displayName: (updateData.displayName as string) || undefined });
    }

    // Fetch updated profile
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();

    const profile: UserProfile = {
      id: user.uid,
      email: userData?.email || user.email || '',
      firstName: userData?.firstName,
      middleInitial: userData?.middleInitial,
      lastName: userData?.lastName,
      displayName: userData?.displayName,
      phoneNumber: userData?.phoneNumber,
      photoURL: userData?.photoURL,
      userType: userData?.userType || 'tenant',
      status: userData?.status || 'active',
      createdAt: userData?.createdAt?.toDate?.()?.toISOString(),
    };

    return NextResponse.json({ ok: true, data: profile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
