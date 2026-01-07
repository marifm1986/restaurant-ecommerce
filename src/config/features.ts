// Feature Flags for controlling app behavior
export const FEATURES = {
  // Payment gateway integration (disabled until Stripe/Razorpay is set up)
  PAYMENT_GATEWAY_ENABLED: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ENABLED === 'true',
  PAYMENT_PROVIDER: (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'manual') as 'manual' | 'stripe' | 'razorpay',

  // Multi-tenancy (disabled for MVP, enable when ready for multiple companies)
  MULTI_TENANT_ENABLED: process.env.NEXT_PUBLIC_MULTI_TENANT_ENABLED === 'true',

  // Email/SMS notifications (future enhancement)
  EMAIL_NOTIFICATIONS_ENABLED: process.env.NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED === 'true',
  SMS_NOTIFICATIONS_ENABLED: process.env.NEXT_PUBLIC_SMS_NOTIFICATIONS_ENABLED === 'true',
} as const;

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'Meat N Beans Co.',
  COMPANY_ID: 'meatnbeansco', // Default company for single-tenant MVP
  DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'INR',
  CURRENCY_SYMBOL: '₹',
  TAX_RATE: 0.05, // 5% GST for food items
  LOW_STOCK_THRESHOLD: 10,
  ORDER_PREFIX: 'ORD',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Cache TTL (in seconds)
  PRODUCT_CACHE_TTL: 60,
  ORDER_CACHE_TTL: 30,

  // Image settings
  MAX_IMAGE_SIZE_KB: 200,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Product categories
export const PRODUCT_CATEGORIES = [
  { id: 'meat', name: 'Meat', slug: 'meat' },
  { id: 'poultry', name: 'Poultry', slug: 'poultry' },
  { id: 'seafood', name: 'Seafood', slug: 'seafood' },
  { id: 'beans', name: 'Beans & Legumes', slug: 'beans' },
  { id: 'vegetables', name: 'Vegetables', slug: 'vegetables' },
  { id: 'spices', name: 'Spices & Seasonings', slug: 'spices' },
  { id: 'dairy', name: 'Dairy', slug: 'dairy' },
  { id: 'frozen', name: 'Frozen Items', slug: 'frozen' },
] as const;

// Order status display
export const ORDER_STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  processing: { label: 'Processing', color: 'indigo' },
  shipped: { label: 'Shipped', color: 'purple' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const;

// Payment method display
export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: 'banknote' },
  bank_transfer: { label: 'Bank Transfer', icon: 'building' },
  check: { label: 'Check', icon: 'file-text' },
  upi: { label: 'UPI', icon: 'smartphone' },
  other: { label: 'Other', icon: 'credit-card' },
} as const;

// Supported currencies
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', locale: 'si-LK' },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee', locale: 'ne-NP' },
] as const;

// Get currency by code
export function getCurrencyByCode(code: string) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}
