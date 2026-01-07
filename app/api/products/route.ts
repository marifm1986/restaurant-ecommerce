import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { Product } from '@/types';

// GET /api/products - Public endpoint to list active products
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Base query - only active products
    let query = db
      .collection('products')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc');

    // Category filter requires a different query due to Firestore limitations
    if (category && category !== 'all') {
      query = db
        .collection('products')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
        .where('isActive', '==', true)
        .where('category', '==', category)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(limit).get();

    let products: Product[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        companyId: data.companyId,
        name: data.name,
        sku: data.sku,
        category: data.category,
        description: data.description || '',
        price: data.price,
        bulkPricing: data.bulkPricing || [],
        stockQty: data.stockQty,
        unit: data.unit,
        imageUrls: data.imageUrls || [],
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });

    // Client-side search filtering (Firestore doesn't support full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch products',
        },
      },
      { status: 500 }
    );
  }
}
