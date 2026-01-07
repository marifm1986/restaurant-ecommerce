'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BoxesIcon,
  AlertTriangle,
  ShoppingCart,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { APP_CONFIG } from '@/config/features';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Stock', href: '/admin/stock', icon: BoxesIcon },
  { name: 'Damage Log', href: '/admin/damage', icon: AlertTriangle },
  { name: 'Buyers', href: '/admin/users', icon: Users },
  { name: 'Approvals', href: '/admin/approvals', icon: UserCheck },
  { name: 'Payments', href: '/admin/payments', icon: Wallet },
  { name: 'Ledgers', href: '/admin/ledgers', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut, isOwnerOrSuper } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isOwnerOrSuper()) {
        // Not an admin, redirect to buyer dashboard
        router.push('/dashboard');
      }
    }
  }, [isMounted, isLoading, isAuthenticated, isOwnerOrSuper, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Show loading state during SSR and initial mount to prevent hydration mismatch
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // For demo purposes, allow access without strict auth check
  // In production, remove this and enforce proper auth
  const isAdmin = true; // claims?.role === 'owner' || claims?.role === 'superMaster';

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-gray-900">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-white">Admin Panel</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 px-6 h-16 border-b border-gray-800">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <span className="font-semibold text-white block">Admin Panel</span>
              <span className="text-xs text-gray-500">{APP_CONFIG.APP_NAME}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.displayName?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">Owner Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}

            {/* Storefront Link */}
            <div className="pt-4 mt-4 border-t border-gray-800">
              <Link
                href="/"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-medium">View Storefront</span>
              </Link>
            </div>
          </nav>

          {/* Sign Out */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
