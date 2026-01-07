'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, ImageUpload } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { PRODUCT_CATEGORIES } from '@/config/features';
import { Product, ProductUnit, BulkPricing } from '@/types';

const PRODUCT_UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'piece', label: 'Piece' },
  { value: 'case', label: 'Case' },
  { value: 'liter', label: 'Liter' },
  { value: 'dozen', label: 'Dozen' },
];

interface ProductFormProps {
  product?: Product;
  isEditing?: boolean;
}

interface FormData {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  stockQty: string;
  unit: ProductUnit;
  isActive: boolean;
  bulkPricing: BulkPricing[];
  imageUrls: string[];
}

export function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    stockQty: product?.stockQty?.toString() || '0',
    unit: product?.unit || 'kg',
    isActive: product?.isActive ?? true,
    bulkPricing: product?.bulkPricing || [],
    imageUrls: product?.imageUrls || [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    } else if (!/^[A-Z0-9-]+$/i.test(formData.sku)) {
      newErrors.sku = 'SKU can only contain letters, numbers, and hyphens';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (formData.stockQty && (isNaN(Number(formData.stockQty)) || Number(formData.stockQty) < 0)) {
      newErrors.stockQty = 'Stock quantity must be a non-negative number';
    }

    // Validate bulk pricing
    for (let i = 0; i < formData.bulkPricing.length; i++) {
      const tier = formData.bulkPricing[i];
      if (tier.minQty <= 0) {
        newErrors.bulkPricing = `Bulk pricing tier ${i + 1}: Minimum quantity must be greater than 0`;
        break;
      }
      if (tier.price <= 0) {
        newErrors.bulkPricing = `Bulk pricing tier ${i + 1}: Price must be greater than 0`;
        break;
      }
      if (tier.price >= Number(formData.price)) {
        newErrors.bulkPricing = `Bulk pricing tier ${i + 1}: Bulk price should be less than base price`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        category: formData.category,
        description: formData.description.trim(),
        price: Number(formData.price),
        stockQty: Number(formData.stockQty) || 0,
        unit: formData.unit,
        isActive: formData.isActive,
        bulkPricing: formData.bulkPricing,
        imageUrls: formData.imageUrls,
      };

      const url = isEditing ? `/api/admin/products/${product?.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save product');
      }

      success(
        isEditing ? 'Product updated' : 'Product created',
        `${formData.name} has been ${isEditing ? 'updated' : 'added'} successfully.`
      );

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      error('Error', err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean | ProductUnit) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addBulkPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: [...prev.bulkPricing, { minQty: 10, price: Number(prev.price) * 0.9 || 0 }],
    }));
  };

  const updateBulkPricingTier = (index: number, field: 'minQty' | 'price', value: string) => {
    setFormData((prev) => {
      const updated = [...prev.bulkPricing];
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
      return { ...prev, bulkPricing: updated };
    });
  };

  const removeBulkPricingTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: prev.bulkPricing.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card variant="bordered" className="bg-white">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                placeholder="e.g., Premium Chicken Breast"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                required
              />

              <Input
                label="SKU"
                placeholder="e.g., CHK-BRS-001"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                error={errors.sku}
                hint="Unique identifier for inventory tracking"
                required
              />

              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                options={[
                  { value: '', label: 'Select a category' },
                  ...PRODUCT_CATEGORIES.map((cat) => ({
                    value: cat.slug,
                    label: cat.name,
                  })),
                ]}
                error={errors.category}
                required
              />

              <Select
                label="Unit"
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value as ProductUnit)}
                options={PRODUCT_UNITS}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  rows={3}
                  placeholder="Describe the product..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card variant="bordered" className="bg-white">
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.imageUrls}
              onChange={(urls) => setFormData((prev) => ({ ...prev, imageUrls: urls }))}
              maxImages={5}
            />
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card variant="bordered" className="bg-white">
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Base Price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                error={errors.price}
                leftIcon={<span className="text-gray-500">&#8377;</span>}
                required
              />

              <Input
                label="Stock Quantity"
                type="number"
                placeholder="0"
                value={formData.stockQty}
                onChange={(e) => handleChange('stockQty', e.target.value)}
                error={errors.stockQty}
              />

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (visible in store)</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Pricing */}
        <Card variant="bordered" className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bulk Pricing Tiers</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={addBulkPricingTier}
            >
              Add Tier
            </Button>
          </CardHeader>
          <CardContent>
            {errors.bulkPricing && (
              <p className="text-sm text-red-600 mb-4">{errors.bulkPricing}</p>
            )}

            {formData.bulkPricing.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No bulk pricing tiers configured. Add tiers to offer discounts for larger orders.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.bulkPricing.map((tier, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Minimum Quantity
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={tier.minQty}
                        onChange={(e) => updateBulkPricingTier(index, 'minQty', e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Price per {formData.unit}
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={tier.price}
                        onChange={(e) => updateBulkPricingTier(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBulkPricingTier(index)}
                      className="mt-5 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            leftIcon={<X className="h-4 w-4" />}
            onClick={() => router.push('/admin/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={<Save className="h-4 w-4" />}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>
    </form>
  );
}
