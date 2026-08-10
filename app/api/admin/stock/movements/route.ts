import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';

// GET /api/admin/stock/movements - Get stock movement history
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'stock_in' | 'stock_out' | 'damage' | 'adjustment'

    let query = db
      .collection('stockMovements')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .orderBy('createdAt', 'desc');

    if (productId) {
      query = db
        .collection('stockMovements')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
        .where('productId', '==', productId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(limit).get();

    let movements = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get product name
        let productName = 'Unknown Product';
        if (data.productId) {
          const productDoc = await db.collection('products').doc(data.productId).get();
          if (productDoc.exists) {
            productName = productDoc.data()?.name || 'Unknown Product';
          }
        }

        return {
          id: doc.id,
          productId: data.productId,
          productName,
          type: data.type,
          qty: data.qty,
          reason: data.reason,
          reasonCode: data.reasonCode,
          previousQty: data.previousQty,
          newQty: data.newQty,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      })
    );

    // Filter by type if specified
    if (type) {
      movements = movements.filter((m) => m.type === type);
    }

    return NextResponse.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch stock movements',
        },
      },
      { status: 500 }
    );
  }
}
