'use client';

import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserClaims, UserRole } from '@/types';
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  signInWithGoogle as firebaseSignInWithGoogle,
  onAuthChange,
  getUserClaims,
  refreshToken,
} from '@/lib/firebase/auth';

interface AuthState {
  user: User | null;
  claims: UserClaims | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
  clearError: () => void;

  // Computed helpers
  hasRole: (role: UserRole) => boolean;
  isOwnerOrSuper: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  claims: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const claims = await getUserClaims();
        set({
          user,
          claims,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          claims: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignIn(email, password);
      // Auth state change will update the store
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignInWithGoogle();
      // Auth state change will update the store
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignUp(email, password, name);
      // After signup, call API to set up user document and claims
      // This will be handled by the registration flow
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignOut();
      set({
        user: null,
        claims: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  refreshClaims: async () => {
    try {
      await refreshToken();
      const claims = await getUserClaims();
      set({ claims });
    } catch (error) {
      console.error('Failed to refresh claims:', error);
    }
  },

  clearError: () => set({ error: null }),

  hasRole: (role) => {
    const { claims } = get();
    if (!claims) return false;
    return claims.role === role;
  },

  isOwnerOrSuper: () => {
    const { claims } = get();
    if (!claims) return false;
    return claims.role === 'owner' || claims.role === 'superMaster';
  },
}));
