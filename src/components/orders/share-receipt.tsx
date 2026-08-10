'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Copy, Check, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { Order } from '@/types';
import { generateReceiptText } from './order-receipt';
import { APP_CONFIG } from '@/config/features';

interface ShareReceiptProps {
  order: Order;
  formatPrice: (amount: number) => string;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export function ShareReceipt({
  order,
  formatPrice,
  companyName = APP_CONFIG.APP_NAME,
  companyPhone = '01756196928',
  companyEmail = 'orders@example.com',
}: ShareReceiptProps) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const receiptText = generateReceiptText(order, formatPrice, companyName, companyPhone);

  // Generate WhatsApp message
  const getWhatsAppUrl = (phoneNumber?: string) => {
    const message = encodeURIComponent(receiptText);
    if (phoneNumber) {
      // Remove non-digits and ensure it starts without +
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      return `https://wa.me/${cleanPhone}?text=${message}`;
    }
    return `https://wa.me/?text=${message}`;
  };

  // Generate Email mailto link
  const getEmailUrl = (email?: string) => {
    const subject = encodeURIComponent(`Order Receipt - ${order.orderId}`);
    const body = encodeURIComponent(receiptText);
    if (email) {
      return `mailto:${email}?subject=${subject}&body=${body}`;
    }
    return `mailto:?subject=${subject}&body=${body}`;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      success('Copied!', 'Receipt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Print receipt
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Receipt - ${order.orderId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h1 {
              font-size: 16px;
              margin: 0;
            }
            .section {
              border-bottom: 1px dashed #ccc;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .row {
              display: flex;
              justify-content: space-between;
            }
            .item {
              margin-bottom: 5px;
            }
            .total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyName}</h1>
            <p>Phone: ${companyPhone}</p>
          </div>

          <div style="text-align: center; margin-bottom: 10px;">
            <strong>ORDER RECEIPT</strong>
          </div>

          <div class="section">
            <div class="row"><span>Order ID:</span><span><strong>${order.orderId}</strong></span></div>
            <div class="row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleString()}</span></div>
            <div class="row"><span>Status:</span><span>${order.status}</span></div>
            <div class="row"><span>Payment:</span><span>${order.paymentStatus}</span></div>
          </div>

          ${order.guestInfo ? `
          <div class="section">
            <strong>BILL TO:</strong><br>
            ${order.guestInfo.name}<br>
            ${order.guestInfo.phone}<br>
            ${order.guestInfo.address}
          </div>
          ` : ''}

          <div class="section">
            <div class="row" style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="flex: 1;">Item</span>
              <span style="width: 40px; text-align: center;">Qty</span>
              <span style="width: 60px; text-align: right;">Amount</span>
            </div>
            ${order.items.map(item => `
              <div class="item">
                <div class="row">
                  <span style="flex: 1;">${item.productName}</span>
                  <span style="width: 40px; text-align: center;">${item.qty}</span>
                  <span style="width: 60px; text-align: right;">${formatPrice(item.totalPrice)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div>
            <div class="row"><span>Subtotal:</span><span>${formatPrice(order.subtotal)}</span></div>
            <div class="row"><span>Tax:</span><span>${formatPrice(order.tax)}</span></div>
            <div class="row"><span>Delivery:</span><span>Free</span></div>
            <div class="row total"><span>TOTAL:</span><span>${formatPrice(order.total)}</span></div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>Track: /orders/track?id=${order.orderId}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Send to customer WhatsApp
  const handleSendToCustomer = () => {
    if (order.guestInfo?.phone) {
      window.open(getWhatsAppUrl(order.guestInfo.phone), '_blank');
    }
  };

  // Send to customer Email
  const handleEmailToCustomer = () => {
    if (order.guestInfo?.email) {
      window.location.href = getEmailUrl(order.guestInfo.email);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Share Receipt</p>

      <div className="grid grid-cols-2 gap-2">
        {/* WhatsApp to Customer */}
        {order.guestInfo?.phone && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendToCustomer}
            className="justify-start text-green-600 border-green-200 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        )}

        {/* Email to Customer */}
        {order.guestInfo?.email && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailToCustomer}
            className="justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        )}

        {/* Copy Receipt */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="justify-start"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy'}
        </Button>

        {/* Print Receipt */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="justify-start"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Share via WhatsApp (general) */}
      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Share via WhatsApp
        </Button>
      </a>

      {/* Share via Email (general) */}
      <a href={getEmailUrl()} className="block">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        >
          <Mail className="h-4 w-4 mr-2" />
          Share via Email
        </Button>
      </a>
    </div>
  );
}

export default ShareReceipt;
