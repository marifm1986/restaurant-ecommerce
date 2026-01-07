import { type ClassValue, clsx } from 'clsx';
import { APP_CONFIG, getCurrencyByCode } from '@/config/features';

// Conditional class name helper
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Format currency with optional currency code
export function formatCurrency(amount: number, currencyCode?: string): string {
  const currency = currencyCode ? getCurrencyByCode(currencyCode) : getCurrencyByCode(APP_CONFIG.DEFAULT_CURRENCY);

  return `${currency.symbol}${amount.toLocaleString(currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate order ID
export function generateOrderId(companyId: string = APP_CONFIG.COMPANY_ID): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${APP_CONFIG.ORDER_PREFIX}-${companyId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`;
}

// Get stock status
export function getStockStatus(qty: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= APP_CONFIG.LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

// Stock status display config
export const STOCK_STATUS_CONFIG = {
  in_stock: { label: 'In Stock', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  low_stock: { label: 'Low Stock', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  out_of_stock: { label: 'Out of Stock', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
} as const;

// Calculate bulk price
export function calculatePrice(
  basePrice: number,
  qty: number,
  bulkPricing: { minQty: number; price: number }[] = []
): number {
  // Sort bulk pricing by minQty descending to find the best applicable price
  const sortedPricing = [...bulkPricing].sort((a, b) => b.minQty - a.minQty);

  for (const tier of sortedPricing) {
    if (qty >= tier.minQty) {
      return tier.price;
    }
  }

  return basePrice;
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone (Indian format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Format phone number
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  }
  return phone;
}

// Slugify string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Parse query params
export function parseQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// Sleep utility (for testing/delays)
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
