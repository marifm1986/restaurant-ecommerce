'use client';

import Link from 'next/link';
import {
  Package,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';

// Mock data for dashboard
const mockLedgerSummary = {
  totalPurchases: 45680,
  totalPayments: 38500,
  currentDues: 7180,
};

const mockRecentOrders = [
  {
    id: 'ord-001',
    orderId: 'ORD-MEAT-7HJ4K-X9P2',
    total: 2450,
    status: 'delivered' as const,
    createdAt: new Date(Date.now() - 86400000 * 2),
    itemCount: 5,
  },
  {
    id: 'ord-002',
    orderId: 'ORD-MEAT-8KL5M-Y3Q7',
    total: 1890,
    status: 'processing' as const,
    createdAt: new Date(Date.now() - 86400000),
    itemCount: 3,
  },
  {
    id: 'ord-003',
    orderId: 'ORD-MEAT-9MN6N-Z8R4',
    total: 3200,
    status: 'pending_payment' as const,
    createdAt: new Date(),
    itemCount: 8,
  },
];

const mockSubscription = {
  status: 'active' as const,
  expiryDate: new Date(Date.now() + 86400000 * 30 * 6), // 6 months from now
};

export default function DashboardPage() {
  const { user } = useAuthStore();

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
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's an overview of your account and recent activity.
        </p>
      </div>

      {/* Subscription Status */}
      <Card variant="bordered" className="mb-6 bg-gradient-to-r from-orange-50 to-orange-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Subscription Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <span className="text-sm text-gray-500">
                  until {formatDate(mockSubscription.expiryDate)}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Manage Subscription
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="bordered">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(mockLedgerSummary.totalPurchases)}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(mockLedgerSummary.totalPayments)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Dues</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(mockLedgerSummary.currentDues)}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              Recent Orders
            </CardTitle>
            <Link
              href="/orders"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {mockRecentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
                <Link href="/">
                  <Button variant="outline" size="sm" className="mt-2">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {mockRecentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {order.orderId}
                      </p>
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                        {ORDER_STATUS_CONFIG[order.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {order.itemCount} items • {formatDate(order.createdAt)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/">
                <div className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center">
                  <ShoppingBag className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Place Order</p>
                </div>
              </Link>
              <Link href="/ledger">
                <div className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center">
                  <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">View Ledger</p>
                </div>
              </Link>
              <Link href="/orders">
                <div className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center">
                  <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Track Orders</p>
                </div>
              </Link>
              <Link href="/settings">
                <div className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Order History</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Reminder */}
      {mockLedgerSummary.currentDues > 0 && (
        <Card variant="bordered" className="mt-6 bg-orange-50 border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-orange-900">Payment Reminder</p>
                <p className="text-sm text-orange-700 mt-0.5">
                  You have outstanding dues of{' '}
                  <strong>{formatCurrency(mockLedgerSummary.currentDues)}</strong>. Please make a
                  payment to continue enjoying our services.
                </p>
              </div>
            </div>
            <Button size="sm">Make Payment</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
