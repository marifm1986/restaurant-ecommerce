import { Product, Order, User, Ledger, LedgerEntry } from '@/types';
import { APP_CONFIG } from '@/config/features';

// Mock products for development
// Using placeholder images - replace with actual product images in production
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Premium Chicken Breast',
    sku: 'CHK-BRS-001',
    category: 'poultry',
    description: 'Fresh boneless chicken breast, ideal for restaurants. Tender and lean.',
    price: 280,
    bulkPricing: [
      { minQty: 10, price: 260 },
      { minQty: 25, price: 245 },
    ],
    stockQty: 150,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-002',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Mutton Leg',
    sku: 'MTN-LEG-001',
    category: 'meat',
    description: 'Fresh mutton leg pieces with bone. Perfect for biryanis and curries.',
    price: 650,
    bulkPricing: [
      { minQty: 5, price: 620 },
      { minQty: 15, price: 590 },
    ],
    stockQty: 45,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-003',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Fresh Prawns (Large)',
    sku: 'SFD-PRW-001',
    category: 'seafood',
    description: 'Large fresh prawns, cleaned and deveined. Restaurant grade quality.',
    price: 850,
    bulkPricing: [
      { minQty: 5, price: 800 },
    ],
    stockQty: 8,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-004',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Black Chickpeas (Kala Chana)',
    sku: 'BNS-KCH-001',
    category: 'beans',
    description: 'Premium quality black chickpeas. High protein, great for chole dishes.',
    price: 95,
    bulkPricing: [
      { minQty: 10, price: 88 },
      { minQty: 25, price: 82 },
    ],
    stockQty: 500,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-005',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Rajma (Kidney Beans)',
    sku: 'BNS-RJM-001',
    category: 'beans',
    description: 'Kashmiri rajma, small variety. Cooks soft and creamy.',
    price: 140,
    bulkPricing: [
      { minQty: 10, price: 130 },
      { minQty: 25, price: 120 },
    ],
    stockQty: 350,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-006',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Whole Chicken',
    sku: 'CHK-WHL-001',
    category: 'poultry',
    description: 'Farm fresh whole chicken, cleaned and dressed. Approx 1.2-1.5 kg each.',
    price: 195,
    bulkPricing: [
      { minQty: 10, price: 180 },
    ],
    stockQty: 75,
    unit: 'piece',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-007',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Fish Curry Cut (Rohu)',
    sku: 'SFD-ROH-001',
    category: 'seafood',
    description: 'Fresh Rohu fish cut into curry pieces. River fish, great taste.',
    price: 320,
    bulkPricing: [],
    stockQty: 0,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-008',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Lamb Mince (Keema)',
    sku: 'MTN-KMA-001',
    category: 'meat',
    description: 'Fresh lamb mince, medium ground. Perfect for kebabs and keema dishes.',
    price: 580,
    bulkPricing: [
      { minQty: 5, price: 550 },
    ],
    stockQty: 25,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-009',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Tuvar Dal (Toor Dal)',
    sku: 'BNS-TVR-001',
    category: 'beans',
    description: 'Premium quality arhar/toor dal. Polished and ready to cook.',
    price: 135,
    bulkPricing: [
      { minQty: 10, price: 125 },
      { minQty: 25, price: 118 },
    ],
    stockQty: 400,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-010',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Chicken Drumsticks',
    sku: 'CHK-DRM-001',
    category: 'poultry',
    description: 'Fresh chicken drumsticks. Great for tandoori and fries.',
    price: 240,
    bulkPricing: [
      { minQty: 10, price: 225 },
    ],
    stockQty: 120,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-011',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Buffalo Meat (Buff)',
    sku: 'MTN-BUF-001',
    category: 'meat',
    description: 'Fresh buffalo meat, lean cuts. Economical option for restaurants.',
    price: 380,
    bulkPricing: [
      { minQty: 10, price: 360 },
    ],
    stockQty: 60,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-012',
    companyId: APP_CONFIG.COMPANY_ID,
    name: 'Green Moong Dal',
    sku: 'BNS-GMD-001',
    category: 'beans',
    description: 'Split green moong dal. Quick cooking, nutritious.',
    price: 145,
    bulkPricing: [
      { minQty: 10, price: 135 },
    ],
    stockQty: 280,
    unit: 'kg',
    imageUrls: [],
    isActive: true,
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-15'),
  },
];

// Helper to filter products
export function filterProducts(
  products: Product[],
  filters: { category?: string; search?: string; inStockOnly?: boolean }
): Product[] {
  return products.filter((product) => {
    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (product.category !== filters.category) return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(searchLower);
      const matchesSku = product.sku.toLowerCase().includes(searchLower);
      const matchesCategory = product.category.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesSku && !matchesCategory) return false;
    }

    // Stock filter
    if (filters.inStockOnly && product.stockQty <= 0) {
      return false;
    }

    return product.isActive;
  });
}

// Get product by ID
export function getProductById(productId: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === productId);
}
