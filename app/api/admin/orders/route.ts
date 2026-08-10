import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { APP_CONFIG } from '@/config/features';
import { Order } from '@/types';

// GET /api/admin/orders - List all orders for admin
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    let query = db
      .collection('orders')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .orderBy('createdAt', 'desc');

    if (status && status !== 'all') {
      query = db
        .collection('orders')
        .where('companyId', '==', APP_CONFIG.COMPANY_ID)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.limit(limit).get();

    let orders: (Order & { itemCount: number; buyerName: string; buyerPhone: string; isGuest: boolean })[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: data.orderId,
        companyId: data.companyId,
        userId: data.userId,
        guestInfo: data.guestInfo,
        items: data.items || [],
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        status: data.status,
        paymentStatus: data.paymentStatus,
        notes: data.notes || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Additional fields for display
        itemCount: data.items?.length || 0,
        buyerName: data.guestInfo?.name || 'Unknown',
        buyerPhone: data.guestInfo?.phone || '',
        isGuest: !data.userId,
      };
    });

    // Client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(searchLower) ||
          o.buyerName.toLowerCase().includes(searchLower) ||
          o.buyerPhone.includes(search)
      );
    }

    // Get summary stats
    const allOrders = await db
      .collection('orders')
      .where('companyId', '==', APP_CONFIG.COMPANY_ID)
      .get();

    const summary = {
      total: allOrders.size,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    allOrders.docs.forEach((doc) => {
      const status = doc.data().status;
      if (status === 'pending_payment' || status === 'confirmed') {
        summary.pending++;
      } else if (status === 'processing') {
        summary.processing++;
      } else if (status === 'shipped') {
        summary.shipped++;
      } else if (status === 'delivered') {
        summary.delivered++;
      } else if (status === 'cancelled') {
        summary.cancelled++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch orders',
        },
      },
      { status: 500 }
    );
  }
}
