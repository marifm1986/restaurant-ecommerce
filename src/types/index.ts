// User Types
export type UserRole = 'guest' | 'buyer' | 'owner' | 'superMaster';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export interface UserClaims {
  role: UserRole;
  companyId: string | null;
  permissions?: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface User {
  id: string;
  companyId: string | null;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  subscriptionExpiry: Date | null;
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export type ProductUnit = 'kg' | 'piece' | 'case' | 'liter' | 'dozen';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface BulkPricing {
  minQty: number;
  price: number;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  bulkPricing: BulkPricing[];
  stockQty: number;
  unit: ProductUnit;
  imageUrls: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export type OrderStatus = 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  unit: ProductUnit;
}

export interface GuestInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Order {
  id: string;
  orderId: string;
  companyId: string;
  userId: string | null;
  guestInfo?: GuestInfo;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ledger Types
export type LedgerEntryType = 'purchase' | 'payment' | 'adjustment' | 'refund';

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  referenceType: 'order' | 'payment' | 'manual';
  referenceId: string;
  description: string;
  balanceAfter: number;
  createdBy: string;
  createdAt: Date;
}

export interface Ledger {
  id: string;
  companyId: string;
  userId: string;
  entries: LedgerEntry[];
  currentBalance: number;
  lastEntryAt: Date;
  updatedAt: Date;
}

// Payment Types
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'upi' | 'other';
export type PaymentRecordStatus = 'recorded' | 'verified' | 'disputed';

export interface Payment {
  id: string;
  companyId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
  receivedBy: string;
  receivedAt: Date;
  status: PaymentRecordStatus;
  createdAt: Date;
}

// Stock Types
export type StockMovementType = 'stock_in' | 'stock_out' | 'damage' | 'adjustment';
export type DamageReasonCode = 'expired' | 'spoiled' | 'broken' | 'lost' | 'other';

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  type: StockMovementType;
  qty: number;
  reason: string;
  reasonCode?: DamageReasonCode;
  referenceType?: 'purchase' | 'order' | 'manual';
  referenceId?: string;
  previousQty: number;
  newQty: number;
  createdBy: string;
  createdAt: Date;
}

// Subscription Types
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'terminated';

export interface Subscription {
  id: string;
  companyId: string;
  userId: string;
  plan: string;
  status: SubscriptionStatus;
  startDate: Date | null;
  expiryDate: Date | null;
  paymentReference?: string;
  externalPaymentId?: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types (Client-side)
export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  qty: number;
  unit: ProductUnit;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Category type for filtering
export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

// Currency type
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

// Company Settings
export interface CompanySettings {
  id: string;
  companyId: string;
  currency: string; // Currency code (e.g., 'INR', 'USD')
  taxRate: number;
  lowStockThreshold: number;
  orderPrefix: string;
  updatedAt: Date;
}
