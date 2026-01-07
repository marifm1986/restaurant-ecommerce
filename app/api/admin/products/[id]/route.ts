import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { Product } from '@/types';

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    const data = doc.data()!;

    // Verify it belongs to the company
    if (data.companyId !== APP_CONFIG.COMPANY_ID) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    const product: Product = {
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
    };

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch product',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const body = await request.json();

    // Check if product exists
    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    const existingData = doc.data()!;

    // Verify it belongs to the company
    if (existingData.companyId !== APP_CONFIG.COMPANY_ID) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    // If SKU is being changed, check for duplicates
    if (body.sku && body.sku !== existingData.sku) {
      const duplicateCheck = await db
        .collection('products')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
        .where('sku', '==', body.sku)
        .get();

      if (!duplicateCheck.empty) {
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
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only update provided fields
    const allowedFields = [
      'name',
      'sku',
      'category',
      'description',
      'price',
      'bulkPricing',
      'stockQty',
      'unit',
      'imageUrls',
      'isActive',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'price' || field === 'stockQty') {
          updateData[field] = Number(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data()!;

    const product: Product = {
      id: updatedDoc.id,
      companyId: updatedData.companyId,
      name: updatedData.name,
      sku: updatedData.sku,
      category: updatedData.category,
      description: updatedData.description || '',
      price: updatedData.price,
      bulkPricing: updatedData.bulkPricing || [],
      stockQty: updatedData.stockQty,
      unit: updatedData.unit,
      imageUrls: updatedData.imageUrls || [],
      isActive: updatedData.isActive ?? true,
      createdAt: updatedData.createdAt?.toDate() || new Date(),
      updatedAt: updatedData.updatedAt?.toDate() || new Date(),
    };

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update product',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    const data = doc.data()!;

    // Verify it belongs to the company
    if (data.companyId !== APP_CONFIG.COMPANY_ID) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete product',
        },
      },
      { status: 500 }
    );
  }
}
