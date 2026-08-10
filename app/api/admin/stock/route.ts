import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { StockMovement, StockMovementType, DamageReasonCode } from '@/types';

// GET /api/admin/stock - Get all products with stock info
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);

    const filter = searchParams.get('filter'); // 'all' | 'low_stock' | 'out_of_stock'
    const lowStockThreshold = parseInt(searchParams.get('threshold') || '10');

    const snapshot = await db
      .collection('products')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .where('isActive', '==', true)
      .orderBy('name', 'asc')
      .get();

    let products = snapshot.docs.map((doc) => {
      const data = doc.data();
      const stockQty = data.stockQty || 0;
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';

      if (stockQty <= 0) {
        stockStatus = 'out_of_stock';
      } else if (stockQty <= lowStockThreshold) {
        stockStatus = 'low_stock';
      }

      return {
        id: doc.id,
        name: data.name,
        sku: data.sku,
        category: data.category,
        stockQty,
        unit: data.unit,
        stockStatus,
        imageUrl: data.imageUrls?.[0] || null,
        price: data.price,
      };
    });

    // Apply filter
    if (filter === 'low_stock') {
      products = products.filter((p) => p.stockStatus === 'low_stock');
    } else if (filter === 'out_of_stock') {
      products = products.filter((p) => p.stockStatus === 'out_of_stock');
    }

    // Get stock summary
    const summary = {
      totalProducts: snapshot.size,
      inStock: products.filter((p) => p.stockStatus === 'in_stock').length,
      lowStock: products.filter((p) => p.stockStatus === 'low_stock').length,
      outOfStock: products.filter((p) => p.stockStatus === 'out_of_stock').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        products,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch stock data',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/stock - Update stock (stock in, stock out, adjustment)
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { productId, type, qty, reason, reasonCode } = body as {
      productId: string;
      type: StockMovementType;
      qty: number;
      reason: string;
      reasonCode?: DamageReasonCode;
    };

    // Validate required fields
    if (!productId || !type || qty === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: productId, type, qty',
          },
        },
        { status: 400 }
      );
    }

    // Get current product
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
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

    const productData = productDoc.data()!;
    const previousQty = productData.stockQty || 0;

    // Calculate new quantity based on movement type
    let newQty: number;
    let actualQtyChange: number;

    switch (type) {
      case 'stock_in':
        actualQtyChange = Math.abs(qty);
        newQty = previousQty + actualQtyChange;
        break;
      case 'stock_out':
      case 'damage':
        actualQtyChange = -Math.abs(qty);
        newQty = Math.max(0, previousQty + actualQtyChange);
        break;
      case 'adjustment':
        // For adjustment, qty is the new absolute value
        newQty = Math.max(0, qty);
        actualQtyChange = newQty - previousQty;
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_TYPE',
              message: 'Invalid stock movement type',
            },
          },
          { status: 400 }
        );
    }

    // Create stock movement record
    const movementData: Omit<StockMovement, 'id'> = {
      companyId: APP_CONFIG.COMPANY_ID,
      productId,
      type,
      qty: Math.abs(actualQtyChange),
      reason: reason || getDefaultReason(type),
      reasonCode: type === 'damage' ? reasonCode : undefined,
      referenceType: 'manual',
      previousQty,
      newQty,
      createdBy: 'admin', // TODO: Get from auth
      createdAt: new Date(),
    };

    // Use batch to update product and create movement
    const batch = db.batch();

    // Update product stock
    batch.update(productRef, {
      stockQty: newQty,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create stock movement record
    const movementRef = db.collection('stockMovements').doc();
    batch.set(movementRef, {
      ...movementData,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        productId,
        previousQty,
        newQty,
        change: actualQtyChange,
        movementId: movementRef.id,
      },
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update stock',
        },
      },
      { status: 500 }
    );
  }
}

function getDefaultReason(type: StockMovementType): string {
  switch (type) {
    case 'stock_in':
      return 'Stock replenishment';
    case 'stock_out':
      return 'Stock removal';
    case 'damage':
      return 'Damaged goods';
    case 'adjustment':
      return 'Stock adjustment';
    default:
      return 'Unknown';
  }
}
