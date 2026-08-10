'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, ClipboardList, RefreshCw } from 'lucide-react';
import { Card, Button, Badge, Input, Select, Modal, ModalFooter } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';
import { useSettings } from '@/providers/settings-provider';
import { Order, OrderStatus, PaymentStatus } from '@/types';

interface OrderListItem {
  id: string;
  orderId: string;
  buyerName: string;
  buyerPhone: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  itemCount: number;
  isGuest: boolean;
}

export default function AdminOrdersPage() {
  const { success, error: showError } = useToast();
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setOrders(
          result.data.orders.map((order: Order) => ({
            id: order.id,
            orderId: order.orderId,
            buyerName: order.guestInfo?.name || 'Unknown',
            buyerPhone: order.guestInfo?.phone || '',
            total: order.total,
            status: order.status,
            paymentStatus: order.paymentStatus,
            createdAt: new Date(order.createdAt),
            itemCount: order.items.length,
            isGuest: !order.userId,
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
    fetchOrders();
  }, [statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

  const handleStatusUpdate = (order: OrderListItem) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setUpdateModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        success('Order updated', `Order status updated successfully`);
        setUpdateModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        showError('Failed to update order', result.error?.message);
      }
    } catch (err) {
      showError('Failed to update order', 'Please try again');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track all orders</p>
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
      <Card variant="bordered" className="mb-6 bg-white">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by Order ID or buyer name..."
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

      {/* Orders Table */}
      <Card variant="bordered" className="bg-white overflow-hidden" padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900">
                            {order.orderId}
                          </p>
                          <p className="text-xs text-gray-500">{order.itemCount} items</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {order.buyerName}
                            {order.isGuest && (
                              <Badge variant="default" size="sm">Guest</Badge>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{order.buyerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-900">
                          {formatPrice(order.total)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleStatusUpdate(order)}>
                          <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                            {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-4">{getPaymentBadge(order.paymentStatus)}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="Update Order Status"
        description={`Update status for order ${selectedOrder?.orderId}`}
      >
        <div className="space-y-4 mb-4">
          <Select
            label="Order Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: 'pending_payment', label: 'Pending Payment' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Select
            label="Payment Status"
            value={newPaymentStatus}
            onChange={(e) => setNewPaymentStatus(e.target.value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
            ]}
          />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusConfirm} isLoading={isUpdating}>
            Update Status
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
