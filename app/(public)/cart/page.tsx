'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { Button, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { APP_CONFIG } from '@/config/features';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTax, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any products yet.
          </p>
          <Link href="/">
            <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8">
          <Card variant="bordered" padding="none">
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.productId} className="p-4 sm:p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {formatCurrency(item.price)} / {item.unit}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.productId, item.qty - 1)}
                            className="p-2 hover:bg-gray-100 rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center text-sm font-medium">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.qty + 1)}
                            className="p-2 hover:bg-gray-100 rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Continue Shopping */}
          <div className="mt-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <Card variant="bordered">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({APP_CONFIG.TAX_RATE * 100}% GST)</span>
                <span className="font-medium">{formatCurrency(getTax())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <p className="text-xs text-gray-500 text-center mt-4">
              Payment will be collected manually after order confirmation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
