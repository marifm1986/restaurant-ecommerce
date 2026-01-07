'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, Eye } from 'lucide-react';
import { Card, Button, Badge, Input, Select } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';

// Mock orders data
const mockOrders = [
  {
    id: 'ord-001',
    orderId: 'ORD-MEAT-7HJ4K-X9P2',
    total: 2450,
    status: 'delivered' as const,
    paymentStatus: 'paid' as const,
    createdAt: new Date(Date.now() - 86400000 * 2),
    itemCount: 5,
    items: ['Premium Chicken Breast (5kg)', 'Black Chickpeas (10kg)'],
  },
  {
    id: 'ord-002',
    orderId: 'ORD-MEAT-8KL5M-Y3Q7',
    total: 1890,
    status: 'processing' as const,
    paymentStatus: 'pending' as const,
    createdAt: new Date(Date.now() - 86400000),
    itemCount: 3,
    items: ['Mutton Leg (2kg)', 'Rajma (5kg)'],
  },
  {
    id: 'ord-003',
    orderId: 'ORD-MEAT-9MN6N-Z8R4',
    total: 3200,
    status: 'pending_payment' as const,
    paymentStatus: 'pending' as const,
    createdAt: new Date(),
    itemCount: 8,
    items: ['Fresh Prawns (3kg)', 'Lamb Mince (2kg)', 'Tuvar Dal (10kg)'],
  },
  {
    id: 'ord-004',
    orderId: 'ORD-MEAT-ABCD1-E2F3',
    total: 4500,
    status: 'shipped' as const,
    paymentStatus: 'paid' as const,
    createdAt: new Date(Date.now() - 86400000 * 5),
    itemCount: 10,
    items: ['Whole Chicken (10pc)', 'Green Moong Dal (15kg)'],
  },
  {
    id: 'ord-005',
    orderId: 'ORD-MEAT-GHIJ4-K5L6',
    total: 1200,
    status: 'cancelled' as const,
    paymentStatus: 'pending' as const,
    createdAt: new Date(Date.now() - 86400000 * 10),
    itemCount: 2,
    items: ['Fish Curry Cut (2kg)'],
  },
];

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getPaymentBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge variant="success" size="sm">Paid</Badge>;
    }
    if (status === 'partial') {
      return <Badge variant="warning" size="sm">Partial</Badge>;
    }
    return <Badge variant="default" size="sm">Pending</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">View and track all your orders</p>
      </div>

      {/* Filters */}
      <Card variant="bordered" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending_payment', label: 'Pending Payment' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card variant="bordered" className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : "You haven't placed any orders yet"}
          </p>
          <Link href="/">
            <Button>Start Shopping</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} variant="bordered" className="hover:border-gray-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-mono font-semibold text-gray-900">{order.orderId}</p>
                    <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                      {ORDER_STATUS_CONFIG[order.status].label}
                    </Badge>
                    {getPaymentBadge(order.paymentStatus)}
                  </div>

                  <p className="text-sm text-gray-500 mb-2">
                    {order.itemCount} items • Placed on {formatDate(order.createdAt)}
                  </p>

                  <div className="text-sm text-gray-600">
                    {order.items.slice(0, 2).join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
