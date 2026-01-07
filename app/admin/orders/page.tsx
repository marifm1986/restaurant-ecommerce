'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Eye, ClipboardList, Filter } from 'lucide-react';
import { Card, Button, Badge, Input, Select, Modal, ModalFooter } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';

// Mock orders for admin
const mockAdminOrders = [
  {
    id: 'ord-001',
    orderId: 'ORD-MEAT-7HJ4K-X9P2',
    buyerName: 'Restaurant ABC',
    buyerPhone: '01756196928',
    total: 4500,
    status: 'pending_payment' as const,
    paymentStatus: 'pending' as const,
    createdAt: new Date(Date.now() - 3600000),
    itemCount: 5,
    isGuest: false,
  },
  {
    id: 'ord-002',
    orderId: 'ORD-MEAT-8KL5M-Y3Q7',
    buyerName: 'Guest User',
    buyerPhone: '+91 87654 32109',
    total: 8900,
    status: 'processing' as const,
    paymentStatus: 'paid' as const,
    createdAt: new Date(Date.now() - 7200000),
    itemCount: 8,
    isGuest: true,
  },
  {
    id: 'ord-003',
    orderId: 'ORD-MEAT-9MN6N-Z8R4',
    buyerName: 'Hotel XYZ',
    buyerPhone: '+91 76543 21098',
    total: 2200,
    status: 'confirmed' as const,
    paymentStatus: 'pending' as const,
    createdAt: new Date(Date.now() - 10800000),
    itemCount: 3,
    isGuest: false,
  },
  {
    id: 'ord-004',
    orderId: 'ORD-MEAT-ABCD1-E2F3',
    buyerName: 'Cafe Delight',
    buyerPhone: '+91 65432 10987',
    total: 15600,
    status: 'shipped' as const,
    paymentStatus: 'paid' as const,
    createdAt: new Date(Date.now() - 86400000),
    itemCount: 12,
    isGuest: false,
  },
  {
    id: 'ord-005',
    orderId: 'ORD-MEAT-EFGH5-I6J7',
    buyerName: 'Food Court',
    buyerPhone: '+91 54321 09876',
    total: 6800,
    status: 'delivered' as const,
    paymentStatus: 'paid' as const,
    createdAt: new Date(Date.now() - 172800000),
    itemCount: 6,
    isGuest: false,
  },
];

export default function AdminOrdersPage() {
  const { success } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof mockAdminOrders[0] | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const filteredOrders = mockAdminOrders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleStatusUpdate = (order: typeof mockAdminOrders[0]) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setUpdateModalOpen(true);
  };

  const handleStatusConfirm = () => {
    // TODO: Implement actual status update
    success('Order updated', `Order status changed to ${ORDER_STATUS_CONFIG[newStatus as keyof typeof ORDER_STATUS_CONFIG]?.label || newStatus}`);
    setUpdateModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track all orders</p>
        </div>
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
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
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => handleStatusUpdate(order)}>
                        <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                          {ORDER_STATUS_CONFIG[order.status].label}
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
      </Card>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="Update Order Status"
        description={`Update status for order ${selectedOrder?.orderId}`}
      >
        <div className="mb-4">
          <Select
            label="New Status"
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
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusConfirm}>Update Status</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
