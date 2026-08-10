import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { Order, OrderItem, GuestInfo } from '@/types';

// GET /api/orders - Get orders (by orderId for tracking, or by userId for user's orders)
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);

    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');

    // If orderId is provided, fetch single order (for tracking)
    if (orderId) {
      const snapshot = await db
        .collection('orders')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Order not found',
            },
          },
          { status: 404 }
        );
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      const order: Order = {
        id: doc.id,
        orderId: data.orderId,
        companyId: data.companyId,
        userId: data.userId,
        guestInfo: data.guestInfo,
        items: data.items,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        status: data.status,
        paymentStatus: data.paymentStatus,
        notes: data.notes || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };

      return NextResponse.json({
        success: true,
        data: order,
      });
    }

    // If userId is provided, fetch all orders for that user
    if (userId) {
      const snapshot = await db
        .collection('orders')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const orders: Order[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          orderId: data.orderId,
          companyId: data.companyId,
          userId: data.userId,
          guestInfo: data.guestInfo,
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          status: data.status,
          paymentStatus: data.paymentStatus,
          notes: data.notes || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });

      return NextResponse.json({
        success: true,
        data: orders,
      });
    }

    // Neither orderId nor userId provided
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Either orderId or userId is required',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch order',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order (guest checkout)
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { items, guestInfo, subtotal, tax, total } = body as {
      items: OrderItem[];
      guestInfo: GuestInfo;
      subtotal: number;
      tax: number;
      total: number;
    };

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Order must contain at least one item',
          },
        },
        { status: 400 }
      );
    }

    if (!guestInfo?.name || !guestInfo?.phone || !guestInfo?.email || !guestInfo?.address) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Guest information is incomplete',
          },
        },
        { status: 400 }
      );
    }

    // Generate order ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `${APP_CONFIG.ORDER_PREFIX}-${APP_CONFIG.COMPANY_ID.substring(0, 4).toUpperCase()}-${timestamp}-${random}`;

    // Create order document
    const orderData = {
      orderId,
      companyId: APP_CONFIG.COMPANY_ID,
      userId: null, // Guest order
      guestInfo,
      items,
      subtotal: Number(subtotal),
      tax: Number(tax),
      total: Number(total),
      status: 'pending_payment',
      paymentStatus: 'pending',
      notes: '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Use batch to create order and update stock
    const batch = db.batch();

    // Create order
    const orderRef = db.collection('orders').doc();
    batch.set(orderRef, orderData);

    // Update stock for each item
    for (const item of items) {
      const productRef = db.collection('products').doc(item.productId);
      const productDoc = await productRef.get();

      if (productDoc.exists) {
        const currentStock = productDoc.data()?.stockQty || 0;
        const newStock = Math.max(0, currentStock - item.qty);

        batch.update(productRef, {
          stockQty: newStock,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Create stock movement record
        const movementRef = db.collection('stockMovements').doc();
        batch.set(movementRef, {
          companyId: APP_CONFIG.COMPANY_ID,
          productId: item.productId,
          type: 'stock_out',
          qty: item.qty,
          reason: `Order ${orderId}`,
          referenceType: 'order',
          referenceId: orderId,
          previousQty: currentStock,
          newQty: newStock,
          createdBy: 'system',
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        id: orderRef.id,
        orderId,
        status: 'pending_payment',
        total,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create order',
        },
      },
      { status: 500 }
    );
  }
}
