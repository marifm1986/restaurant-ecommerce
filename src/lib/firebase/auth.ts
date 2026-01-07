'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './config';
import { UserClaims } from '@/types';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<UserCredential> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return signInWithPopup(auth, googleProvider);
}

// Register new user with email and password
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  if (!auth) throw new Error('Firebase auth not initialized');

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update profile with display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }

  return userCredential;
}

// Sign out
export async function signOut(): Promise<void> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return firebaseSignOut(auth);
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase auth not initialized');
  return sendPasswordResetEmail(auth, email);
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    console.error('Firebase auth not initialized');
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}

// Get user ID token
export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}

// Get user claims from token
export async function getUserClaims(): Promise<UserClaims | null> {
  const user = getCurrentUser();
  if (!user) return null;

  const tokenResult = await user.getIdTokenResult();
  return {
    role: tokenResult.claims.role as UserClaims['role'] || 'buyer',
    companyId: tokenResult.claims.companyId as string | null || null,
    permissions: tokenResult.claims.permissions as string[] || [],
  };
}

// Force refresh token (call after claims are updated)
export async function refreshToken(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  await user.getIdToken(true);
}
