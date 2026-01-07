'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';

interface OrderStatus {
  status: string;
  date: string;
  description: string;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('id') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [isSearching, setIsSearching] = useState(false);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    status: keyof typeof ORDER_STATUS_CONFIG;
    total: number;
    items: { name: string; qty: number; price: number }[];
    guestInfo: { name: string; phone: string; address: string };
    createdAt: string;
    timeline: OrderStatus[];
  } | null>(initialOrderId ? {
    // Mock data for demo
    orderId: initialOrderId,
    status: 'confirmed',
    total: 2450,
    items: [
      { name: 'Premium Chicken Breast', qty: 5, price: 280 },
      { name: 'Black Chickpeas (Kala Chana)', qty: 10, price: 95 },
    ],
    guestInfo: {
      name: 'Demo Customer',
      phone: '01756196928',
      address: '123 Restaurant Street, Mumbai, MH 400001',
    },
    createdAt: new Date().toISOString(),
    timeline: [
      { status: 'Order Placed', date: new Date(Date.now() - 3600000).toISOString(), description: 'Your order has been received' },
      { status: 'Confirmed', date: new Date(Date.now() - 1800000).toISOString(), description: 'Order confirmed and being prepared' },
    ],
  } : null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Replace with actual Firestore query
      // For demo, show mock data for any order ID starting with 'ORD'
      if (orderId.startsWith('ORD')) {
        setOrderData({
          orderId,
          status: 'confirmed',
          total: 2450,
          items: [
            { name: 'Premium Chicken Breast', qty: 5, price: 280 },
            { name: 'Black Chickpeas (Kala Chana)', qty: 10, price: 95 },
          ],
          guestInfo: {
            name: 'Demo Customer',
            phone: '01756196928',
            address: '123 Restaurant Street, Mumbai, MH 400001',
          },
          createdAt: new Date().toISOString(),
          timeline: [
            { status: 'Order Placed', date: new Date(Date.now() - 3600000).toISOString(), description: 'Your order has been received' },
            { status: 'Confirmed', date: new Date(Date.now() - 1800000).toISOString(), description: 'Order confirmed and being prepared' },
          ],
        });
      } else {
        setOrderData(null);
        setError('Order not found. Please check your order ID and try again.');
      }
    } catch {
      setError('Failed to fetch order. Please try again.');
    } finally {
      setIsSearching(false);
    }
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

  const getStatusBadgeVariant = (status: keyof typeof ORDER_STATUS_CONFIG) => {
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
                <span className="ml-1">{ORDER_STATUS_CONFIG[orderData.status].label}</span>
              </Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">{formatDateTime(orderData.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-gray-900">{formatCurrency(orderData.total)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm text-gray-500">Payment Status</p>
                <Badge variant="warning" size="sm">Pending</Badge>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card variant="bordered">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {orderData.timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    {index < orderData.timeline.length - 1 && (
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
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Delivery Info */}
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
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{orderData.guestInfo.address}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
