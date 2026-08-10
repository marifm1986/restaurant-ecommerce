import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { Order, OrderStatus } from '@/types';

// GET /api/admin/orders/[id] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const docRef = db.collection('orders').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
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

    const data = doc.data()!;

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

// PUT /api/admin/orders/[id] - Update order (status, payment status, notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const body = await request.json();

    const docRef = db.collection('orders').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
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

    const currentData = doc.data()!;
    const { status, paymentStatus, notes } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Validate and set status
    if (status) {
      const validStatuses: OrderStatus[] = [
        'pending_payment',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'Invalid order status',
            },
          },
          { status: 400 }
        );
      }

      updateData.status = status;

      // If order is cancelled, restore stock
      if (status === 'cancelled' && currentData.status !== 'cancelled') {
        const batch = db.batch();
        batch.update(docRef, updateData);

        // Restore stock for each item
        for (const item of currentData.items || []) {
          const productRef = db.collection('products').doc(item.productId);
          const productDoc = await productRef.get();

          if (productDoc.exists) {
            const currentStock = productDoc.data()?.stockQty || 0;
            const newStock = currentStock + item.qty;

            batch.update(productRef, {
              stockQty: newStock,
              updatedAt: FieldValue.serverTimestamp(),
            });

            // Create stock movement record
            const movementRef = db.collection('stockMovements').doc();
            batch.set(movementRef, {
              companyId: APP_CONFIG.COMPANY_ID,
              productId: item.productId,
              type: 'stock_in',
              qty: item.qty,
              reason: `Order ${currentData.orderId} cancelled - stock restored`,
              referenceType: 'order',
              referenceId: currentData.orderId,
              previousQty: currentStock,
              newQty: newStock,
              createdBy: 'admin',
              createdAt: FieldValue.serverTimestamp(),
            });
          }
        }

        await batch.commit();

        return NextResponse.json({
          success: true,
          data: {
            id,
            status,
            message: 'Order cancelled and stock restored',
          },
        });
      }
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'partial', 'paid'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PAYMENT_STATUS',
              message: 'Invalid payment status',
            },
          },
          { status: 400 }
        );
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      data: {
        id,
        ...updateData,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update order',
        },
      },
      { status: 500 }
    );
  }
}
