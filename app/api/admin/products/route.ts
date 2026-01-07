import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { Product } from '@/types';

// GET /api/admin/products - List all products
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db
      .collection('products')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .orderBy('createdAt', 'desc');

    if (category && category !== 'all') {
      query = db
        .collection('products')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
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
          p.sku.toLowerCase().includes(searchLower)
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

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'sku', 'category', 'price', 'unit'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Missing required field: ${field}`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate SKU
    const existingProduct = await db
      .collection('products')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .where('sku', '==', body.sku)
      .get();

    if (!existingProduct.empty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_SKU',
            message: 'A product with this SKU already exists',
          },
        },
        { status: 400 }
      );
    }

    const productData = {
      companyId: APP_CONFIG.COMPANY_ID,
      name: body.name,
      sku: body.sku,
      category: body.category,
      description: body.description || '',
      price: Number(body.price),
      bulkPricing: body.bulkPricing || [],
      stockQty: Number(body.stockQty) || 0,
      unit: body.unit,
      imageUrls: body.imageUrls || [],
      isActive: body.isActive ?? true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('products').add(productData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create product',
        },
      },
      { status: 500 }
    );
  }
}
