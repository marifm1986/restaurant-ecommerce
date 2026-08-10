'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { isValidEmail, isValidPhone, getPhoneValidationMessage, getPhonePlaceholder } from '@/lib/utils';
import { APP_CONFIG } from '@/config/features';
import { GuestInfo, Order } from '@/types';
import { useSettings } from '@/providers/settings-provider';
import { OrderReceipt, ShareReceipt } from '@/components/orders';

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const { formatPrice, currencyCode } = useSettings();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [formData, setFormData] = useState<GuestInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone, currencyCode)) {
      newErrors.phone = getPhoneValidationMessage(currencyCode);
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GuestInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            qty: item.qty,
            unitPrice: item.price,
            totalPrice: item.price * item.qty,
            unit: item.unit,
          })),
          guestInfo: formData,
          subtotal: getSubtotal(),
          tax: getTax(),
          total: getTotal(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to place order');
      }

      // Build the completed order object for receipt
      const orderData: Order = {
        id: result.data.id,
        orderId: result.data.orderId,
        companyId: APP_CONFIG.COMPANY_ID,
        userId: null,
        guestInfo: formData,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          qty: item.qty,
          unitPrice: item.price,
          totalPrice: item.price * item.qty,
          unit: item.unit,
        })),
        subtotal: getSubtotal(),
        tax: getTax(),
        total: getTotal(),
        status: 'pending_payment',
        paymentStatus: 'pending',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCompletedOrder(orderData);
      setOrderComplete(true);
      clearCart();
      success('Order placed successfully!', `Order ID: ${result.data.orderId}`);
    } catch (err) {
      showError('Failed to place order', err instanceof Error ? err.message : 'Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart redirect
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Add some products before checking out.</p>
          <Link href="/">
            <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Order complete
  if (orderComplete && completedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you for your order. We will process it shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Receipt */}
          <div className="lg:col-span-2">
            <Card variant="bordered" className="overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Order Receipt</h2>
              </div>
              <OrderReceipt order={completedOrder} formatPrice={formatPrice} />
            </Card>
          </div>

          {/* Share & Actions */}
          <div className="space-y-6">
            {/* Share Options */}
            <Card variant="bordered">
              <ShareReceipt order={completedOrder} formatPrice={formatPrice} />
            </Card>

            {/* Payment Instructions */}
            <Card variant="bordered" className="bg-orange-50 border-orange-200">
              <h3 className="font-medium text-orange-800 mb-2">Payment Instructions</h3>
              <p className="text-sm text-orange-700">
                This is a manual payment order. Please make the payment via UPI, bank transfer, or cash.
                Contact us at <strong>01756196928</strong> to confirm your payment.
              </p>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href={`/orders/track?id=${completedOrder.orderId}`} className="block">
                <Button className="w-full">Track Order</Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <Card variant="bordered">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={errors.name}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder={getPhonePlaceholder(currencyCode)}
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    error={errors.phone}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter your complete delivery address"
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    required
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="manual-payment"
                      name="payment-method"
                      checked
                      readOnly
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="manual-payment" className="text-sm text-gray-700">
                      Manual Payment (Cash / UPI / Bank Transfer)
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 ml-7">
                    You will receive payment details after placing the order.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <Card variant="bordered">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.qty} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({APP_CONFIG.TAX_RATE * 100}% GST)</span>
                  <span className="font-medium">{formatPrice(getTax())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(getTotal())}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our terms and conditions.
              </p>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
