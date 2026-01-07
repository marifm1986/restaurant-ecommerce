'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CategoryFilter, ProductGrid } from '@/components/products';
import { ProductGridSkeleton } from '@/components/ui';
import { APP_CONFIG } from '@/config/features';
import { Product } from '@/types';

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch products');
      }

      setProducts(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <ProductGrid products={products} />;
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero Section */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 sm:p-10 text-white">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Welcome to {APP_CONFIG.APP_NAME}
          </h1>
          <p className="text-orange-100 text-sm sm:text-base max-w-2xl">
            Premium quality meat and beans for your restaurant. Fresh products,
            competitive prices, and reliable delivery.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Fresh Daily
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Bulk Discounts
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Same Day Delivery
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mb-6">
        <Suspense fallback={<div className="h-10" />}>
          <CategoryFilter />
        </Suspense>
      </section>

      {/* Products Grid */}
      <section>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <ProductsContent />
        </Suspense>
      </section>
    </div>
  );
}
