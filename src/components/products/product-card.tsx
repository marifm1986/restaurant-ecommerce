'use client';

import Image from 'next/image';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/types';
import { Badge, Button } from '@/components/ui';
import { formatCurrency, getStockStatus, STOCK_STATUS_CONFIG } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { useToast } from '@/components/ui/toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const { success } = useToast();

  const stockStatus = getStockStatus(product.stockQty);
  const stockConfig = STOCK_STATUS_CONFIG[stockStatus];
  const isOutOfStock = stockStatus === 'out_of_stock';

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      qty: quantity,
      unit: product.unit,
      imageUrl: product.imageUrls[0],
    });

    success('Added to cart', `${quantity} x ${product.name}`);
    setQuantity(1);
  };

  const incrementQty = () => {
    if (quantity < product.stockQty) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute top-2 right-2">
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
            {stockConfig.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {product.category}
        </p>

        {/* Name */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          <span className="text-sm text-gray-500">/{product.unit}</span>
        </div>

        {/* Bulk pricing hint */}
        {product.bulkPricing.length > 0 && (
          <p className="text-xs text-orange-600 mb-3">
            Bulk discounts available
          </p>
        )}

        {/* Quantity selector & Add button */}
        {!isOutOfStock && (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                onClick={decrementQty}
                disabled={quantity <= 1}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={incrementQty}
                disabled={quantity >= product.stockQty}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="flex-1"
              leftIcon={<ShoppingCart className="h-4 w-4" />}
            >
              Add
            </Button>
          </div>
        )}

        {isOutOfStock && (
          <Button variant="secondary" size="sm" disabled className="w-full">
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  );
}
