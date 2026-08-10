'use client';

import { forwardRef } from 'react';
import { formatDateTime } from '@/lib/utils';
import { APP_CONFIG, ORDER_STATUS_CONFIG } from '@/config/features';
import { Order } from '@/types';

interface OrderReceiptProps {
  order: Order;
  formatPrice: (amount: number) => string;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  (
    {
      order,
      formatPrice,
      companyName = APP_CONFIG.APP_NAME,
      companyPhone = '01756196928',
      companyAddress = 'Your Business Address',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="bg-white p-6 max-w-md mx-auto font-mono text-sm"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
          <h1 className="text-xl font-bold">{companyName}</h1>
          <p className="text-gray-600 text-xs mt-1">{companyAddress}</p>
          <p className="text-gray-600 text-xs">Phone: {companyPhone}</p>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">ORDER RECEIPT</h2>
          <p className="text-xs text-gray-500">Thank you for your order!</p>
        </div>

        {/* Order Info */}
        <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
          <div className="flex justify-between text-xs">
            <span>Order ID:</span>
            <span className="font-bold">{order.orderId}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Date:</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Status:</span>
            <span>{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Payment:</span>
            <span className="capitalize">{order.paymentStatus}</span>
          </div>
        </div>

        {/* Customer Info */}
        {order.guestInfo && (
          <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
            <p className="text-xs font-bold mb-1">BILL TO:</p>
            <p className="text-xs">{order.guestInfo.name}</p>
            <p className="text-xs">{order.guestInfo.phone}</p>
            <p className="text-xs">{order.guestInfo.email}</p>
            <p className="text-xs">{order.guestInfo.address}</p>
          </div>
        )}

        {/* Items Header */}
        <div className="border-b border-gray-300 pb-1 mb-2">
          <div className="flex text-xs font-bold">
            <span className="flex-1">Item</span>
            <span className="w-12 text-center">Qty</span>
            <span className="w-20 text-right">Amount</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex text-xs py-1">
              <div className="flex-1">
                <p className="truncate">{item.productName}</p>
                <p className="text-gray-500">@ {formatPrice(item.unitPrice)}/{item.unit}</p>
              </div>
              <span className="w-12 text-center">{item.qty}</span>
              <span className="w-20 text-right">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs">
            <span>Subtotal:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Tax ({APP_CONFIG.TAX_RATE * 100}% GST):</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Delivery:</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300">
            <span>TOTAL:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Payment Instructions */}
        {order.paymentStatus === 'pending' && (
          <div className="bg-gray-100 p-3 rounded text-xs mb-4">
            <p className="font-bold mb-1">PAYMENT INSTRUCTIONS:</p>
            <p>Please make payment via UPI, bank transfer, or cash.</p>
            <p>Contact: {companyPhone}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-dashed border-gray-300 pt-4">
          <p className="text-xs text-gray-600">Thank you for shopping with us!</p>
          <p className="text-xs text-gray-500 mt-1">
            Track your order at: /orders/track?id={order.orderId}
          </p>
          <div className="mt-3 text-xs text-gray-400">
            ********************************
          </div>
        </div>
      </div>
    );
  }
);

OrderReceipt.displayName = 'OrderReceipt';

// Generate plain text receipt for sharing
export function generateReceiptText(
  order: Order,
  formatPrice: (amount: number) => string,
  companyName: string = APP_CONFIG.APP_NAME,
  companyPhone: string = '01756196928'
): string {
  const lines: string[] = [];

  lines.push('================================');
  lines.push(companyName.toUpperCase());
  lines.push('================================');
  lines.push('');
  lines.push('ORDER RECEIPT');
  lines.push('');
  lines.push(`Order ID: ${order.orderId}`);
  lines.push(`Date: ${formatDateTime(order.createdAt)}`);
  lines.push(`Status: ${ORDER_STATUS_CONFIG[order.status]?.label || order.status}`);
  lines.push(`Payment: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}`);
  lines.push('');

  if (order.guestInfo) {
    lines.push('BILL TO:');
    lines.push(order.guestInfo.name);
    lines.push(order.guestInfo.phone);
    lines.push(order.guestInfo.address);
    lines.push('');
  }

  lines.push('--------------------------------');
  lines.push('ITEMS:');
  lines.push('--------------------------------');

  order.items.forEach((item) => {
    lines.push(`${item.productName}`);
    lines.push(`  ${item.qty} x ${formatPrice(item.unitPrice)} = ${formatPrice(item.totalPrice)}`);
  });

  lines.push('--------------------------------');
  lines.push(`Subtotal: ${formatPrice(order.subtotal)}`);
  lines.push(`Tax (${APP_CONFIG.TAX_RATE * 100}% GST): ${formatPrice(order.tax)}`);
  lines.push(`Delivery: Free`);
  lines.push('--------------------------------');
  lines.push(`TOTAL: ${formatPrice(order.total)}`);
  lines.push('================================');

  if (order.paymentStatus === 'pending') {
    lines.push('');
    lines.push('PAYMENT PENDING');
    lines.push(`Contact: ${companyPhone}`);
  }

  lines.push('');
  lines.push('Thank you for your order!');

  return lines.join('\n');
}

export default OrderReceipt;
