'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ProductUnit, ProductVariant } from '@/types';
import {
  PRODUCT_UNITS,
  UNIT_VARIANTS,
  getUnitConfig,
  getVariantsForUnit,
  createCustomVariant,
  getUnitsByCategory,
} from '@/config/units';

interface UnitVariantSelectorProps {
  selectedUnit: ProductUnit;
  selectedVariants: ProductVariant[];
  onUnitChange: (unit: ProductUnit) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  error?: string;
}

export function UnitVariantSelector({
  selectedUnit,
  selectedVariants,
  onUnitChange,
  onVariantsChange,
  error,
}: UnitVariantSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const unitConfig = getUnitConfig(selectedUnit);
  const availableVariants = getVariantsForUnit(selectedUnit);
  const groupedUnits = getUnitsByCategory();

  // Check if a variant is selected
  const isVariantSelected = (variant: ProductVariant) => {
    return selectedVariants.some(
      (v) => v.value === variant.value && v.unit === variant.unit
    );
  };

  // Toggle variant selection
  const toggleVariant = (variant: ProductVariant) => {
    if (isVariantSelected(variant)) {
      onVariantsChange(
        selectedVariants.filter(
          (v) => !(v.value === variant.value && v.unit === variant.unit)
        )
      );
    } else {
      onVariantsChange([...selectedVariants, variant]);
    }
  };

  // Add custom variant
  const handleAddCustomVariant = () => {
    const value = parseFloat(customValue);
    if (!isNaN(value) && value > 0) {
      const customVariant = createCustomVariant(value, selectedUnit);
      if (!isVariantSelected(customVariant)) {
        onVariantsChange([...selectedVariants, customVariant]);
      }
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  // Select all variants
  const selectAllVariants = () => {
    onVariantsChange([...availableVariants]);
  };

  // Clear all variants
  const clearAllVariants = () => {
    onVariantsChange([]);
  };

  // Handle unit change - reset variants
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as ProductUnit;
    onUnitChange(newUnit);
    // Optionally auto-select the first variant of the new unit
    const newVariants = getVariantsForUnit(newUnit);
    if (newVariants.length > 0) {
      onVariantsChange([newVariants[0]]);
    } else {
      onVariantsChange([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Unit Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Unit <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedUnit}
          onChange={handleUnitChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {/* Weight Units */}
          <optgroup label="Weight">
            {groupedUnits.weight.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </optgroup>

          {/* Volume Units */}
          <optgroup label="Volume">
            {groupedUnits.volume.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </optgroup>

          {/* Count Units */}
          <optgroup label="Count">
            {groupedUnits.count.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </optgroup>

          {/* Package Units */}
          <optgroup label="Package">
            {groupedUnits.package.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Variant Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Available Variants
            {selectedVariants.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                ({selectedVariants.length} selected)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllVariants}
              className="text-xs text-orange-600 hover:text-orange-700"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={clearAllVariants}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Standard Variants */}
        <div className="flex flex-wrap gap-2 mb-3">
          {availableVariants.map((variant) => {
            const isSelected = isVariantSelected(variant);
            return (
              <button
                key={`${variant.value}-${variant.unit}`}
                type="button"
                onClick={() => toggleVariant(variant)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-orange-100 text-orange-800 border-2 border-orange-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {variant.label}
              </button>
            );
          })}
        </div>

        {/* Custom Variant Input */}
        {showCustomInput ? (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder={`Enter value in ${unitConfig?.baseUnit || selectedUnit}`}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1"
              min="0"
              step="any"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomVariant}
              disabled={!customValue || parseFloat(customValue) <= 0}
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCustomInput(false);
                setCustomValue('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600 border-2 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Custom
          </button>
        )}

        {/* Selected Custom Variants (if any) */}
        {selectedVariants.filter(
          (sv) => !availableVariants.some((av) => av.value === sv.value && av.unit === sv.unit)
        ).length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Custom Variants:</p>
            <div className="flex flex-wrap gap-2">
              {selectedVariants
                .filter(
                  (sv) => !availableVariants.some((av) => av.value === sv.value && av.unit === sv.unit)
                )
                .map((variant) => (
                  <button
                    key={`custom-${variant.value}-${variant.unit}`}
                    type="button"
                    onClick={() => toggleVariant(variant)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border-2 border-blue-500"
                  >
                    <X className="h-3.5 w-3.5" />
                    {variant.label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Select the variants/sizes you want to offer for this product. Customers will be able to
        choose from these options when adding to cart.
      </p>
    </div>
  );
}

export default UnitVariantSelector;
