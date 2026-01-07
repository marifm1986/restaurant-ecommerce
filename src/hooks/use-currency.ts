'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';

/**
 * Hook to get currency formatting based on company settings
 * Usage: const { formatPrice, currency } = useCurrency();
 */
export function useCurrency() {
  const { settings, fetchSettings, getCurrency } = useSettingsStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  const currency = getCurrency();

  const formatPrice = (amount: number) => {
    return formatCurrencyUtil(amount, currency.code);
  };

  return {
    currency,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    formatPrice,
  };
}
