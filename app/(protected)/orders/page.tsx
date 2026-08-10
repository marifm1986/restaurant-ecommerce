'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, RefreshCw, Eye } from 'lucide-react';
import { Card, Button, Badge, Input, Select } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';
import { useSettings } from '@/providers/settings-provider';
import { useAuthStore } from '@/stores/auth-store';
import { Order, OrderStatus, PaymentStatus } from '@/types';

export default function OrdersPage() {
  const { formatPrice } = useSettings();
  const { error: showError } = useToast();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrders = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders?userId=${user.uid}`);
      const result = await response.json();

      if (result.success) {
        setOrders(
          result.data.map((order: Order) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          }))
        );
      } else {
        showError('Failed to fetch orders', result.error?.message);
      }
    } catch (err) {
      showError('Failed to fetch orders', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchOrders();
    }
  }, [user?.uid]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: OrderStatus) => {
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
    return <Badge variant="default" size="sm">Pending</Badge>;
  };

  if (!isMounted) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">View and track all your orders</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchOrders}
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
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
      {isLoading ? (
        <Card variant="bordered" className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-500 mt-4">Loading orders...</p>
        </Card>
      ) : filteredOrders.length === 0 ? (
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
                      {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                    </Badge>
                    {getPaymentBadge(order.paymentStatus)}
                  </div>

                  <p className="text-sm text-gray-500 mb-2">
                    {order.items.length} items • Placed on {formatDate(order.createdAt)}
                  </p>

                  <div className="text-sm text-gray-600">
                    {order.items
                      .slice(0, 2)
                      .map((item) => item.productName)
                      .join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <Link href={`/orders/track?id=${order.orderId}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                      Track
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
