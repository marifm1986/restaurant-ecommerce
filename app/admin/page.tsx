'use client';

import Link from 'next/link';
import {
  Package,
  ClipboardList,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { ORDER_STATUS_CONFIG } from '@/config/features';
import { useSettings } from '@/providers/settings-provider';

// Mock dashboard data
const mockStats = {
  todayOrders: 12,
  todayRevenue: 34500,
  pendingOrders: 8,
  lowStockItems: 5,
  pendingApprovals: 3,
  totalBuyers: 45,
  monthlyRevenue: 285000,
  monthlyOrders: 156,
};

const mockRecentOrders = [
  {
    id: 'ord-001',
    orderId: 'ORD-MEAT-7HJ4K',
    buyerName: 'Restaurant ABC',
    total: 4500,
    status: 'pending_payment' as const,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'ord-002',
    orderId: 'ORD-MEAT-8KL5M',
    buyerName: 'Hotel XYZ',
    total: 8900,
    status: 'processing' as const,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'ord-003',
    orderId: 'ORD-MEAT-9MN6N',
    buyerName: 'Cafe Delight',
    total: 2200,
    status: 'confirmed' as const,
    createdAt: new Date(Date.now() - 10800000),
  },
];

const mockLowStockItems = [
  { name: 'Fresh Prawns (Large)', stock: 8, threshold: 10 },
  { name: 'Fish Curry Cut (Rohu)', stock: 0, threshold: 20 },
  { name: 'Lamb Mince (Keema)', stock: 5, threshold: 15 },
];

const mockPendingApprovals = [
  { id: 'usr-001', name: 'New Restaurant', email: 'new@restaurant.com', date: new Date(Date.now() - 86400000) },
  { id: 'usr-002', name: 'Food Court LLC', email: 'info@foodcourt.com', date: new Date(Date.now() - 172800000) },
];

export default function AdminDashboardPage() {
  const { formatPrice } = useSettings();

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="bordered" className="bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{mockStats.todayOrders}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" /> +15% from yesterday
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" className="bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPrice(mockStats.todayRevenue)}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" /> +8% from yesterday
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" className="bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{mockStats.pendingOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" className="bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{mockStats.lowStockItems}</p>
              <p className="text-xs text-red-600 mt-1">Need restocking</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card variant="bordered" className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500" />
                Recent Orders
              </CardTitle>
              <Link
                href="/admin/orders"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {order.orderId}
                        </p>
                        <p className="text-sm text-gray-500">{order.buyerName}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                        {ORDER_STATUS_CONFIG[order.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Cards */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          <Card variant="bordered" className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-gray-500" />
                Pending Approvals
              </CardTitle>
              <Link
                href="/admin/approvals"
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                View
              </Link>
            </CardHeader>
            <CardContent>
              {mockPendingApprovals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No pending approvals</p>
              ) : (
                <div className="space-y-3">
                  {mockPendingApprovals.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-orange-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Badge variant="warning" size="sm">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card variant="bordered" className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Low Stock Alert
              </CardTitle>
              <Link href="/admin/stock" className="text-sm text-orange-600 hover:text-orange-700">
                Manage
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLowStockItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg',
                      item.stock === 0 ? 'bg-red-50' : 'bg-yellow-50'
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">
                      {item.name}
                    </p>
                    <Badge variant={item.stock === 0 ? 'danger' : 'warning'} size="sm">
                      {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card variant="bordered" className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Orders</span>
                  <span className="font-semibold text-gray-900">{mockStats.monthlyOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Revenue</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(mockStats.monthlyRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Active Buyers</span>
                  <span className="font-semibold text-gray-900">{mockStats.totalBuyers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
