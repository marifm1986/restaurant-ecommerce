'use client';

import { create } from 'zustand';
import { CompanySettings } from '@/types';
import { getCurrencyByCode, APP_CONFIG } from '@/config/features';

interface SettingsState {
  settings: CompanySettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<CompanySettings>) => Promise<void>;
  clearError: () => void;

  // Computed helpers
  getCurrency: () => { code: string; symbol: string; name: string; locale: string };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();

      if (result.success) {
        set({ settings: result.data, isLoading: false });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch settings');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateSettings: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        set({ settings: result.data, isLoading: false });
      } else {
        throw new Error(result.error?.message || 'Failed to update settings');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  getCurrency: () => {
    const { settings } = get();
    const currencyCode = settings?.currency || APP_CONFIG.DEFAULT_CURRENCY;
    return getCurrencyByCode(currencyCode);
  },
}));
