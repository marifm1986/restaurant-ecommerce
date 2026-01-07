/**
 * Seed Products Script
 *
 * This script populates Firestore with initial product data.
 * Run with: npx ts-node --skip-project scripts/seed-products.ts
 *
 * Make sure you have the Firebase Admin SDK credentials set up.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    initializeApp({
      projectId: projectId || 'meatnbeansco',
    });
  }
}

const db = getFirestore();
const COMPANY_ID = 'meatnbeansco';

const products = [
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
  {
    companyId: COMPANY_ID,
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
  },
];

async function seedProducts() {
  console.log('Starting product seed...');

  // Check if products already exist
  const existingProducts = await db
    .collection('products')
    .where('companyId', '==', COMPANY_ID)
    .limit(1)
    .get();

  if (!existingProducts.empty) {
    console.log('Products already exist. Skipping seed.');
    console.log('To re-seed, delete existing products first.');
    return;
  }

  const batch = db.batch();

  for (const product of products) {
    const docRef = db.collection('products').doc();
    batch.set(docRef, {
      ...product,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  Adding: ${product.name}`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${products.length} products!`);
}

seedProducts()
  .then(() => {
    console.log('Seed completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
