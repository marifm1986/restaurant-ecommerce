'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';
import { APP_CONFIG } from '@/config/features';

interface SettingsContextValue {
  currencyCode: string;
  currencySymbol: string;
  formatPrice: (amount: number) => string;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  currencyCode: APP_CONFIG.DEFAULT_CURRENCY,
  currencySymbol: APP_CONFIG.CURRENCY_SYMBOL,
  formatPrice: (amount) => formatCurrencyUtil(amount),
  isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, isLoading, fetchSettings, getCurrency } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const currency = getCurrency();

  const formatPrice = (amount: number) => {
    return formatCurrencyUtil(amount, currency.code);
  };

  return (
    <SettingsContext.Provider
      value={{
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        formatPrice,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
