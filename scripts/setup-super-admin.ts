/**
 * Setup Super Admin Script
 *
 * This script creates or updates a user to be a Super Master admin.
 *
 * Usage:
 * 1. First, create a user through the registration page or Firebase Console
 * 2. Set the FIREBASE_ADMIN credentials in your .env.local file
 * 3. Run: npx ts-node --skip-project scripts/setup-super-admin.ts <email>
 *
 * Example:
 *   npx ts-node --skip-project scripts/setup-super-admin.ts admin@meatnbeans.co
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId) {
  console.error('Error: FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
  process.exit(1);
}

// Initialize Firebase Admin
const app = initializeApp({
  credential: clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : undefined,
  projectId,
});

const auth = getAuth(app);
const db = getFirestore(app);

async function setupSuperAdmin(email: string) {
  try {
    console.log(`Setting up Super Admin for: ${email}`);

    // Get user by email
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`Found existing user: ${user.uid}`);
    } catch (error) {
      console.error(`User with email ${email} not found.`);
      console.log('\nPlease create the user first:');
      console.log('1. Go to Firebase Console > Authentication > Users');
      console.log('2. Click "Add user" and enter the email and password');
      console.log('3. Run this script again');
      process.exit(1);
    }

    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: 'superMaster',
      companyId: null, // Super Master has access to all companies
    });
    console.log('✓ Custom claims set: role=superMaster');

    // Create/update user document in Firestore
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email,
      name: user.displayName || 'Super Admin',
      phone: '',
      role: 'superMaster',
      companyId: null,
      status: 'active',
      subscriptionExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    console.log('✓ User document created/updated in Firestore');

    // Create subscription document (always active for super admin)
    await db.collection('subscriptions').doc(user.uid).set({
      id: user.uid,
      userId: user.uid,
      companyId: null,
      plan: 'super_master',
      status: 'active',
      startDate: new Date(),
      expiryDate: null, // Never expires
      approvedBy: 'system',
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    console.log('✓ Subscription document created/updated');

    console.log('\n========================================');
    console.log('Super Admin setup complete!');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`UID: ${user.uid}`);
    console.log(`Role: superMaster`);
    console.log('\nYou can now log in at /login');
    console.log('And access the admin panel at /admin');

  } catch (error) {
    console.error('Error setting up super admin:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx ts-node --skip-project scripts/setup-super-admin.ts <email>');
  console.log('Example: npx ts-node --skip-project scripts/setup-super-admin.ts admin@meatnbeans.co');
  process.exit(1);
}

setupSuperAdmin(email).then(() => process.exit(0));
