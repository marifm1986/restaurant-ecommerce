'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, Database } from 'lucide-react';
import { Card, Button, Badge, Input, Select, Modal, ModalFooter, TableRowSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { getStockStatus } from '@/lib/utils';
import { PRODUCT_CATEGORIES } from '@/config/features';
import { Product } from '@/types';
import { useSettings } from '@/providers/settings-provider';

export default function AdminProductsPage() {
  const { success, error: showError } = useToast();
  const { formatPrice } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const seedProducts = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/admin/products/seed', {
        method: 'POST',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to seed products');
      }

      if (result.data.seeded > 0) {
        success('Products seeded', result.data.message);
        fetchProducts();
      } else {
        showError('Info', result.data.message);
      }
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to seed products');
    } finally {
      setIsSeeding(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch products');
      }

      setProducts(result.data);
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, showError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (productId: string) => {
    setSelectedProduct(productId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete product');
      }

      success('Product deleted', 'The product has been removed successfully.');
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct));
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          {products.length === 0 && !loading && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Database className="h-4 w-4" />}
              onClick={seedProducts}
              isLoading={isSeeding}
            >
              Seed Data
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchProducts}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Link href="/admin/products/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card variant="bordered" className="mb-6 bg-white">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="sm:w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...PRODUCT_CATEGORIES.map((cat) => ({
                  value: cat.slug,
                  label: cat.name,
                })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card variant="bordered" className="bg-white overflow-hidden" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {products.length === 0
                        ? 'No products yet. Add your first product!'
                        : 'No products found matching your search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stockQty);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.imageUrls && product.imageUrls[0] ? (
                              <Image
                                src={product.imageUrls[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-gray-600">{product.sku}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 capitalize">{product.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            stockStatus === 'in_stock'
                              ? 'success'
                              : stockStatus === 'low_stock'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {product.stockQty} {product.unit}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isDeleting}>
            Delete Product
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
