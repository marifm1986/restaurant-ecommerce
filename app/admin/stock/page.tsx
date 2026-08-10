'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Package,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  RefreshCw,
  BoxesIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings2,
  History,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  ModalFooter,
  TableRowSkeleton,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSettings } from '@/providers/settings-provider';
import { StockMovementType, DamageReasonCode } from '@/types';

interface StockProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockQty: number;
  unit: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  imageUrl: string | null;
  price: number;
}

interface StockSummary {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  qty: number;
  reason: string;
  reasonCode?: DamageReasonCode;
  previousQty: number;
  newQty: number;
  createdBy: string;
  createdAt: Date;
}

const DAMAGE_REASONS: { value: DamageReasonCode; label: string }[] = [
  { value: 'expired', label: 'Expired' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'broken', label: 'Broken / Damaged' },
  { value: 'lost', label: 'Lost / Missing' },
  { value: 'other', label: 'Other' },
];

export default function AdminStockPage() {
  const { success, error: showError } = useToast();
  const { formatPrice } = useSettings();

  const [products, setProducts] = useState<StockProduct[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  // Stock adjustment modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<StockMovementType>('stock_in');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [damageReasonCode, setDamageReasonCode] = useState<DamageReasonCode>('expired');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stockFilter !== 'all') {
        params.append('filter', stockFilter);
      }

      const response = await fetch(`/api/admin/stock?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch stock');
      }

      setProducts(result.data.products);
      setSummary(result.data.summary);
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, [stockFilter, showError]);

  const fetchMovements = async (productId?: string) => {
    try {
      setLoadingMovements(true);
      const params = new URLSearchParams();
      if (productId) {
        params.append('productId', productId);
      }
      params.append('limit', '20');

      const response = await fetch(`/api/admin/stock/movements?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setMovements(result.data);
      }
    } catch (err) {
      console.error('Error fetching movements:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjustClick = (product: StockProduct, type: StockMovementType) => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQty('');
    setAdjustmentReason('');
    setDamageReasonCode('expired');
    setAdjustModalOpen(true);
  };

  const handleHistoryClick = (product?: StockProduct) => {
    setSelectedProduct(product || null);
    fetchMovements(product?.id);
    setHistoryModalOpen(true);
  };

  const handleAdjustmentSubmit = async () => {
    if (!selectedProduct || !adjustmentQty) {
      showError('Error', 'Please enter a quantity');
      return;
    }

    const qty = parseInt(adjustmentQty);
    if (isNaN(qty) || qty <= 0) {
      showError('Error', 'Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustmentType,
          qty: adjustmentType === 'adjustment' ? qty : qty,
          reason: adjustmentReason,
          reasonCode: adjustmentType === 'damage' ? damageReasonCode : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update stock');
      }

      success(
        'Stock Updated',
        `${selectedProduct.name} stock updated from ${result.data.previousQty} to ${result.data.newQty}`
      );

      setAdjustModalOpen(false);
      fetchStock();
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success" size="sm">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="danger" size="sm">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const getMovementIcon = (type: StockMovementType) => {
    switch (type) {
      case 'stock_in':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'stock_out':
        return <ArrowDownCircle className="h-4 w-4 text-blue-500" />;
      case 'damage':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'adjustment':
        return <Settings2 className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'stock_in':
        return <Badge variant="success" size="sm">Stock In</Badge>;
      case 'stock_out':
        return <Badge variant="info" size="sm">Stock Out</Badge>;
      case 'damage':
        return <Badge variant="danger" size="sm">Damage</Badge>;
      case 'adjustment':
        return <Badge variant="default" size="sm">Adjustment</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-500 mt-1">Monitor and manage inventory levels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<History className="h-4 w-4" />}
            onClick={() => handleHistoryClick()}
          >
            View History
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchStock}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card variant="bordered" className="bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BoxesIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{summary.totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card variant="bordered" className="bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-xl font-bold text-green-600">{summary.inStock}</p>
              </div>
            </div>
          </Card>

          <Card variant="bordered" className="bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600">{summary.lowStock}</p>
              </div>
            </div>
          </Card>

          <Card variant="bordered" className="bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">{summary.outOfStock}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

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
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Products' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Stock Table */}
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
                  Stock Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                </>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{formatPrice(product.price)}/{product.unit}</p>
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
                      <span className="text-lg font-semibold text-gray-900">
                        {product.stockQty}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">{product.unit}</span>
                    </td>
                    <td className="px-4 py-4">
                      {getStockBadge(product.stockStatus)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAdjustClick(product, 'stock_in')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Add Stock"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAdjustClick(product, 'stock_out')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Remove Stock"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAdjustClick(product, 'damage')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Log Damage"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleHistoryClick(product)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={
          adjustmentType === 'stock_in'
            ? 'Add Stock'
            : adjustmentType === 'stock_out'
            ? 'Remove Stock'
            : adjustmentType === 'damage'
            ? 'Log Damage'
            : 'Adjust Stock'
        }
        description={selectedProduct ? `Adjust stock for ${selectedProduct.name}` : ''}
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Stock</span>
                <span className="text-lg font-bold text-gray-900">
                  {selectedProduct.stockQty} {selectedProduct.unit}
                </span>
              </div>
            </div>

            <Input
              label={adjustmentType === 'adjustment' ? 'New Stock Level' : 'Quantity'}
              type="number"
              min="0"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(e.target.value)}
              placeholder={adjustmentType === 'adjustment' ? 'Enter new stock level' : 'Enter quantity'}
            />

            {adjustmentType === 'damage' && (
              <Select
                label="Damage Reason"
                value={damageReasonCode}
                onChange={(e) => setDamageReasonCode(e.target.value as DamageReasonCode)}
                options={DAMAGE_REASONS}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                placeholder="Add any notes about this adjustment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>

            {adjustmentQty && parseInt(adjustmentQty) > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Preview:</strong> Stock will change from{' '}
                  <span className="font-semibold">{selectedProduct.stockQty}</span> to{' '}
                  <span className="font-semibold">
                    {adjustmentType === 'stock_in'
                      ? selectedProduct.stockQty + parseInt(adjustmentQty)
                      : adjustmentType === 'adjustment'
                      ? parseInt(adjustmentQty)
                      : Math.max(0, selectedProduct.stockQty - parseInt(adjustmentQty))}
                  </span>{' '}
                  {selectedProduct.unit}
                </p>
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={() => setAdjustModalOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAdjustmentSubmit}
            isLoading={isSubmitting}
            variant={adjustmentType === 'damage' ? 'danger' : 'primary'}
          >
            {adjustmentType === 'stock_in'
              ? 'Add Stock'
              : adjustmentType === 'stock_out'
              ? 'Remove Stock'
              : adjustmentType === 'damage'
              ? 'Log Damage'
              : 'Update Stock'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Stock Movement History"
        description={selectedProduct ? `History for ${selectedProduct.name}` : 'Recent stock movements'}
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          {loadingMovements ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading history...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No stock movements found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{movement.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getMovementBadge(movement.type)}
                          <span className="text-xs text-gray-500">
                            {movement.previousQty} → {movement.newQty}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          movement.type === 'stock_in' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {movement.type === 'stock_in' ? '+' : '-'}
                        {movement.qty}
                      </span>
                    </div>
                    {movement.reason && (
                      <p className="text-sm text-gray-500 mt-1">{movement.reason}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(movement.createdAt).toLocaleString()} by {movement.createdBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
