'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, Clock, Truck, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';
import { useSettings } from '@/providers/settings-provider';
import { Order, OrderStatus as OrderStatusType, PaymentStatus } from '@/types';

interface OrderTimeline {
  status: string;
  date: string;
  description: string;
}

function buildTimeline(order: Order): OrderTimeline[] {
  const timeline: OrderTimeline[] = [];
  const createdAt = new Date(order.createdAt).toISOString();

  // Order placed
  timeline.push({
    status: 'Order Placed',
    date: createdAt,
    description: 'Your order has been received',
  });

  // Add status-based timeline
  const statusOrder: OrderStatusType[] = [
    'pending_payment',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
  ];

  const currentIndex = statusOrder.indexOf(order.status);

  if (order.status === 'cancelled') {
    timeline.push({
      status: 'Cancelled',
      date: new Date(order.updatedAt).toISOString(),
      description: 'Order has been cancelled',
    });
  } else {
    statusOrder.forEach((status, index) => {
      if (index <= currentIndex && index > 0) {
        timeline.push({
          status: ORDER_STATUS_CONFIG[status]?.label || status,
          date: createdAt, // In a real app, each status would have its own timestamp
          description: getStatusDescription(status),
        });
      }
    });
  }

  return timeline;
}

function getStatusDescription(status: OrderStatusType): string {
  switch (status) {
    case 'confirmed':
      return 'Order confirmed and being prepared';
    case 'processing':
      return 'Order is being processed';
    case 'shipped':
      return 'Order has been shipped';
    case 'delivered':
      return 'Order has been delivered';
    default:
      return '';
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('id') || '';
  const { formatPrice } = useSettings();

  const [orderId, setOrderId] = useState(initialOrderId);
  const [isSearching, setIsSearching] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrder = async (searchOrderId: string) => {
    if (!searchOrderId.trim()) {
      setError('Please enter an order ID');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(`/api/orders?orderId=${encodeURIComponent(searchOrderId)}`);
      const result = await response.json();

      if (result.success) {
        setOrderData({
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        });
      } else {
        setOrderData(null);
        setError(result.error?.message || 'Order not found. Please check your order ID and try again.');
      }
    } catch {
      setError('Failed to fetch order. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch order on mount if initialOrderId exists
  useEffect(() => {
    if (initialOrderId) {
      fetchOrder(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchOrder(orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="h-5 w-5" />;
      case 'confirmed':
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusBadgeVariant = (status: OrderStatusType) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'pending_payment':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    if (status === 'paid') {
      return <Badge variant="success" size="sm">Paid</Badge>;
    }
    if (status === 'partial') {
      return <Badge variant="warning" size="sm">Partial</Badge>;
    }
    return <Badge variant="warning" size="sm">Pending</Badge>;
  };

  if (!isMounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const timeline = orderData ? buildTimeline(orderData) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
      <p className="text-gray-600 mb-6">
        Enter your order ID to check the current status of your delivery.
      </p>

      {/* Search Form */}
      <Card variant="bordered" className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter Order ID (e.g., ORD-MEAT-ABC123)"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setError('');
              }}
              leftIcon={<Search className="h-5 w-5" />}
              error={error}
            />
          </div>
          <Button type="submit" isLoading={isSearching}>
            Track
          </Button>
        </form>
      </Card>

      {/* Order Details */}
      {orderData && (
        <div className="space-y-6">
          {/* Order Header */}
          <Card variant="bordered">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-bold text-gray-900">{orderData.orderId}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(orderData.status)} size="md">
                {getStatusIcon(orderData.status)}
                <span className="ml-1">{ORDER_STATUS_CONFIG[orderData.status]?.label || orderData.status}</span>
              </Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">{formatDateTime(orderData.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-gray-900">{formatPrice(orderData.total)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm text-gray-500">Payment Status</p>
                {getPaymentBadge(orderData.paymentStatus)}
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card variant="bordered">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-orange-200 mt-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900">{event.status}</p>
                    <p className="text-sm text-gray-500">{event.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Order Items */}
          <Card variant="bordered">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.qty} {item.unit}</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(orderData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatPrice(orderData.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(orderData.total)}</span>
              </div>
            </div>
          </Card>

          {/* Delivery Info */}
          {orderData.guestInfo && (
            <Card variant="bordered">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{orderData.guestInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{orderData.guestInfo.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{orderData.guestInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{orderData.guestInfo.address}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Instructions for Pending Payment */}
          {orderData.status === 'pending_payment' && (
            <Card variant="bordered" className="bg-orange-50 border-orange-200">
              <h3 className="font-medium text-orange-800 mb-2">Payment Instructions</h3>
              <p className="text-sm text-orange-700">
                This is a manual payment order. Please make the payment via UPI, bank transfer, or cash.
                Contact us at <strong>01756196928</strong> to confirm your payment.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
