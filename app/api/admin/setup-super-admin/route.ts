import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, FieldValue } from '@/lib/firebase/admin';

/**
 * POST /api/admin/setup-super-admin
 *
 * Sets up a Super Admin user. Only works in development mode.
 *
 * Body: { email: string, password?: string }
 *
 * If the user doesn't exist and password is provided, creates the user.
 * Then sets the user as superMaster.
 */
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    let user;

    // Try to get existing user
    try {
      user = await auth.getUserByEmail(email);
    } catch {
      // User doesn't exist, create if password provided
      if (password) {
        user = await auth.createUser({
          email,
          password,
          displayName: 'Super Admin',
        });
      } else {
        return NextResponse.json(
          { error: 'User not found. Provide password to create new user.' },
          { status: 404 }
        );
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: 'superMaster',
      companyId: null,
    });

    // Create/update user document
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email,
      name: user.displayName || 'Super Admin',
      phone: '',
      role: 'superMaster',
      companyId: null,
      status: 'active',
      subscriptionExpiry: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create subscription document
    await db.collection('subscriptions').doc(user.uid).set({
      id: user.uid,
      userId: user.uid,
      companyId: null,
      plan: 'super_master',
      status: 'active',
      startDate: FieldValue.serverTimestamp(),
      expiryDate: null,
      approvedBy: 'system',
      approvedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Super Admin setup complete',
      user: {
        uid: user.uid,
        email: user.email,
        role: 'superMaster',
      },
    });

  } catch (error) {
    console.error('Setup super admin error:', error);
    return NextResponse.json(
      { error: 'Failed to setup super admin', details: String(error) },
      { status: 500 }
    );
  }
}
