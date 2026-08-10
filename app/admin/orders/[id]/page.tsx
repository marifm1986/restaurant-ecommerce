'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Edit2,
  FileText,
} from 'lucide-react';
import { Card, Button, Badge, Select, Modal, ModalFooter } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';
import { useSettings } from '@/providers/settings-provider';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { OrderReceipt, ShareReceipt } from '@/components/orders';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { formatPrice } = useSettings();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Status update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Receipt modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${id}`);
      const result = await response.json();

      if (result.success) {
        setOrder({
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        });
      } else {
        showError('Order not found', result.error?.message);
        router.push('/admin/orders');
      }
    } catch (err) {
      showError('Failed to fetch order', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleOpenStatusModal = () => {
    if (order) {
      setNewStatus(order.status);
      setNewPaymentStatus(order.paymentStatus);
      setUpdateModalOpen(true);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        success('Order updated', 'Order status updated successfully');
        setUpdateModalOpen(false);
        fetchOrder();
      } else {
        showError('Failed to update order', result.error?.message);
      }
    } catch (err) {
      showError('Failed to update order', 'Please try again');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
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
      return <Badge variant="success">Paid</Badge>;
    }
    if (status === 'partial') {
      return <Badge variant="warning">Partial</Badge>;
    }
    return <Badge variant="default">Pending</Badge>;
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Order not found</h3>
        <Link href="/admin/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Order {order.orderId}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
          <Button
            onClick={handleOpenStatusModal}
            leftIcon={<Edit2 className="h-4 w-4" />}
          >
            Update Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card variant="bordered" className="bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              <Badge variant={getStatusBadgeVariant(order.status)} size="md">
                {getStatusIcon(order.status)}
                <span className="ml-1">{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <div className="mt-1">{getPaymentBadge(order.paymentStatus)}</div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(order.updatedAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card variant="bordered" className="bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">ID: {item.productId}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{item.qty}</span>
                        <span className="text-gray-500 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatPrice(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card variant="bordered" className="bg-white">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card variant="bordered" className="bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>

            {order.guestInfo ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{order.guestInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{order.guestInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{order.guestInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium text-gray-900">{order.guestInfo.address}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No customer information available</p>
            )}

            {!order.userId && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Badge variant="default">Guest Order</Badge>
              </div>
            )}
          </Card>

          {/* Order Summary */}
          <Card variant="bordered" className="bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-medium text-gray-900">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-900">{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Quantity</span>
                <span className="font-medium text-gray-900">
                  {order.items.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-gray-900 font-medium">Total Amount</span>
                <span className="font-bold text-orange-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card variant="bordered" className="bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleOpenStatusModal}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setReceiptModalOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Receipt
              </Button>
              <Link href={`/orders/track?id=${order.orderId}`} target="_blank">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  View Tracking Page
                </Button>
              </Link>
            </div>
          </Card>

          {/* Share Receipt */}
          <Card variant="bordered" className="bg-white">
            <ShareReceipt order={order} formatPrice={formatPrice} />
          </Card>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="Update Order Status"
        description={`Update status for order ${order.orderId}`}
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

          {newStatus === 'cancelled' && order.status !== 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> Cancelling this order will restore the stock quantities for all items.
              </p>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdate} isLoading={isUpdating}>
            Update Status
          </Button>
        </ModalFooter>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Order Receipt"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-auto">
          <OrderReceipt order={order} formatPrice={formatPrice} />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setReceiptModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
