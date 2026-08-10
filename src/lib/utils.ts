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

// Phone validation rules by currency/country
export const PHONE_FORMATS: Record<string, {
  pattern: RegExp;
  example: string;
  countryCode: string;
  minDigits: number;
  maxDigits: number;
}> = {
  INR: { pattern: /^[6-9]\d{9}$/, example: '9876543210', countryCode: '+91', minDigits: 10, maxDigits: 10 },
  USD: { pattern: /^\d{10}$/, example: '2025551234', countryCode: '+1', minDigits: 10, maxDigits: 10 },
  EUR: { pattern: /^\d{9,12}$/, example: '1234567890', countryCode: '+49', minDigits: 9, maxDigits: 12 },
  GBP: { pattern: /^[0-9]{10,11}$/, example: '07123456789', countryCode: '+44', minDigits: 10, maxDigits: 11 },
  AED: { pattern: /^[0-9]{9}$/, example: '501234567', countryCode: '+971', minDigits: 9, maxDigits: 9 },
  SAR: { pattern: /^[0-9]{9}$/, example: '512345678', countryCode: '+966', minDigits: 9, maxDigits: 9 },
  CAD: { pattern: /^\d{10}$/, example: '4165551234', countryCode: '+1', minDigits: 10, maxDigits: 10 },
  AUD: { pattern: /^[0-9]{9,10}$/, example: '0412345678', countryCode: '+61', minDigits: 9, maxDigits: 10 },
  SGD: { pattern: /^[89]\d{7}$/, example: '81234567', countryCode: '+65', minDigits: 8, maxDigits: 8 },
  MYR: { pattern: /^[0-9]{9,10}$/, example: '0123456789', countryCode: '+60', minDigits: 9, maxDigits: 10 },
  PKR: { pattern: /^[0-9]{10}$/, example: '3001234567', countryCode: '+92', minDigits: 10, maxDigits: 10 },
  BDT: { pattern: /^[0-9]{10,11}$/, example: '01712345678', countryCode: '+880', minDigits: 10, maxDigits: 11 },
  LKR: { pattern: /^[0-9]{9}$/, example: '712345678', countryCode: '+94', minDigits: 9, maxDigits: 9 },
  NPR: { pattern: /^[0-9]{10}$/, example: '9812345678', countryCode: '+977', minDigits: 10, maxDigits: 10 },
};

// Get phone format for a currency code
export function getPhoneFormat(currencyCode: string = APP_CONFIG.DEFAULT_CURRENCY) {
  return PHONE_FORMATS[currencyCode] || PHONE_FORMATS.INR;
}

// Validate phone based on currency/country
export function isValidPhone(phone: string, currencyCode?: string): boolean {
  const format = getPhoneFormat(currencyCode);
  const digits = phone.replace(/\D/g, '');
  return format.pattern.test(digits);
}

// Get phone validation error message
export function getPhoneValidationMessage(currencyCode?: string): string {
  const format = getPhoneFormat(currencyCode);
  if (format.minDigits === format.maxDigits) {
    return `Enter a valid ${format.minDigits}-digit phone number`;
  }
  return `Enter a valid ${format.minDigits}-${format.maxDigits} digit phone number`;
}

// Get phone placeholder
export function getPhonePlaceholder(currencyCode?: string): string {
  const format = getPhoneFormat(currencyCode);
  return format.example;
}

// Format phone number based on currency/country
export function formatPhone(phone: string, currencyCode?: string): string {
  const format = getPhoneFormat(currencyCode);
  const digits = phone.replace(/\D/g, '');

  // Format based on country
  switch (currencyCode) {
    case 'INR':
      if (digits.length === 10) {
        return `${format.countryCode} ${digits.substring(0, 5)} ${digits.substring(5)}`;
      }
      break;
    case 'USD':
    case 'CAD':
      if (digits.length === 10) {
        return `${format.countryCode} (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      }
      break;
    case 'GBP':
      if (digits.length >= 10) {
        return `${format.countryCode} ${digits.substring(0, 4)} ${digits.substring(4)}`;
      }
      break;
    case 'BDT':
      if (digits.length >= 10) {
        return `${format.countryCode} ${digits.substring(0, 5)} ${digits.substring(5)}`;
      }
      break;
    default:
      if (digits.length >= format.minDigits) {
        return `${format.countryCode} ${digits}`;
      }
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
