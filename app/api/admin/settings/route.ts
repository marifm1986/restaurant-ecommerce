import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';
import { APP_CONFIG, CURRENCIES } from '@/config/features';
import { CompanySettings } from '@/types';

// Default settings
const DEFAULT_SETTINGS: Omit<CompanySettings, 'id' | 'updatedAt'> = {
  companyId: APP_CONFIG.COMPANY_ID,
  currency: 'INR',
  taxRate: 0.05,
  lowStockThreshold: 10,
  orderPrefix: 'ORD',
};

// GET /api/admin/settings - Get company settings
export async function GET() {
  try {
    const db = getAdminDb();

    const settingsDoc = await db
      .collection('settings')
      .doc(APP_CONFIG.COMPANY_ID)
      .get();

    if (!settingsDoc.exists) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          id: APP_CONFIG.COMPANY_ID,
          ...DEFAULT_SETTINGS,
          updatedAt: new Date(),
        },
      });
    }

    const data = settingsDoc.data()!;
    const settings: CompanySettings = {
      id: settingsDoc.id,
      companyId: data.companyId,
      currency: data.currency || 'INR',
      taxRate: data.taxRate ?? 0.05,
      lowStockThreshold: data.lowStockThreshold ?? 10,
      orderPrefix: data.orderPrefix || 'ORD',
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch settings',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update company settings
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    // Validate currency if provided
    if (body.currency) {
      const validCurrency = CURRENCIES.find((c) => c.code === body.currency);
      if (!validCurrency) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CURRENCY',
              message: 'Invalid currency code',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate tax rate if provided
    if (body.taxRate !== undefined) {
      const taxRate = Number(body.taxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_TAX_RATE',
              message: 'Tax rate must be between 0 and 1 (e.g., 0.05 for 5%)',
            },
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      companyId: APP_CONFIG.COMPANY_ID,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only update provided fields
    if (body.currency) updateData.currency = body.currency;
    if (body.taxRate !== undefined) updateData.taxRate = Number(body.taxRate);
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(body.lowStockThreshold);
    if (body.orderPrefix) updateData.orderPrefix = body.orderPrefix;

    await db
      .collection('settings')
      .doc(APP_CONFIG.COMPANY_ID)
      .set(updateData, { merge: true });

    // Fetch updated settings
    const updatedDoc = await db
      .collection('settings')
      .doc(APP_CONFIG.COMPANY_ID)
      .get();

    const data = updatedDoc.data()!;
    const settings: CompanySettings = {
      id: updatedDoc.id,
      companyId: data.companyId,
      currency: data.currency || 'INR',
      taxRate: data.taxRate ?? 0.05,
      lowStockThreshold: data.lowStockThreshold ?? 10,
      orderPrefix: data.orderPrefix || 'ORD',
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update settings',
        },
      },
      { status: 500 }
    );
  }
}
