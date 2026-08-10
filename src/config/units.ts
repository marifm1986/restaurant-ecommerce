import { ProductUnit, ProductVariant } from '@/types';

// Unit configuration with display information
export interface UnitConfig {
  value: ProductUnit;
  label: string;
  shortLabel: string;
  category: 'weight' | 'volume' | 'count' | 'package';
  baseUnit: string; // The base unit for variants (e.g., 'gm' for kg, 'ml' for liter)
}

export const PRODUCT_UNITS: UnitConfig[] = [
  // Weight-based units
  { value: 'kg', label: 'Kilogram (kg)', shortLabel: 'kg', category: 'weight', baseUnit: 'gm' },
  { value: 'gram', label: 'Gram (gm)', shortLabel: 'gm', category: 'weight', baseUnit: 'gm' },

  // Volume-based units
  { value: 'liter', label: 'Liter (L)', shortLabel: 'L', category: 'volume', baseUnit: 'ml' },
  { value: 'ml', label: 'Milliliter (ml)', shortLabel: 'ml', category: 'volume', baseUnit: 'ml' },

  // Count-based units
  { value: 'piece', label: 'Piece', shortLabel: 'pc', category: 'count', baseUnit: 'pc' },
  { value: 'dozen', label: 'Dozen (12 pcs)', shortLabel: 'dz', category: 'count', baseUnit: 'pc' },

  // Package-based units
  { value: 'pack', label: 'Pack', shortLabel: 'pack', category: 'package', baseUnit: 'pack' },
  { value: 'box', label: 'Box', shortLabel: 'box', category: 'package', baseUnit: 'box' },
  { value: 'case', label: 'Case', shortLabel: 'case', category: 'package', baseUnit: 'case' },
  { value: 'bag', label: 'Bag', shortLabel: 'bag', category: 'package', baseUnit: 'bag' },
];

// Standard variants for each unit type
export const UNIT_VARIANTS: Record<ProductUnit, ProductVariant[]> = {
  // Kilogram variants (in grams)
  kg: [
    { value: 1000, unit: 'gm', label: '1kg' },
    { value: 500, unit: 'gm', label: '500gm' },
    { value: 250, unit: 'gm', label: '250gm' },
    { value: 100, unit: 'gm', label: '100gm' },
    { value: 50, unit: 'gm', label: '50gm' },
  ],

  // Gram variants
  gram: [
    { value: 500, unit: 'gm', label: '500gm' },
    { value: 250, unit: 'gm', label: '250gm' },
    { value: 100, unit: 'gm', label: '100gm' },
    { value: 50, unit: 'gm', label: '50gm' },
    { value: 25, unit: 'gm', label: '25gm' },
  ],

  // Liter variants (in ml)
  liter: [
    { value: 1000, unit: 'ml', label: '1L' },
    { value: 500, unit: 'ml', label: '500ml' },
    { value: 250, unit: 'ml', label: '250ml' },
    { value: 200, unit: 'ml', label: '200ml' },
    { value: 100, unit: 'ml', label: '100ml' },
  ],

  // Milliliter variants
  ml: [
    { value: 500, unit: 'ml', label: '500ml' },
    { value: 250, unit: 'ml', label: '250ml' },
    { value: 200, unit: 'ml', label: '200ml' },
    { value: 100, unit: 'ml', label: '100ml' },
    { value: 50, unit: 'ml', label: '50ml' },
  ],

  // Piece variants
  piece: [
    { value: 1, unit: 'pc', label: '1 piece' },
    { value: 2, unit: 'pc', label: '2 pieces' },
    { value: 5, unit: 'pc', label: '5 pieces' },
    { value: 10, unit: 'pc', label: '10 pieces' },
    { value: 25, unit: 'pc', label: '25 pieces' },
  ],

  // Dozen variants (multiples)
  dozen: [
    { value: 12, unit: 'pc', label: '1 dozen (12)' },
    { value: 6, unit: 'pc', label: 'Half dozen (6)' },
    { value: 24, unit: 'pc', label: '2 dozen (24)' },
    { value: 36, unit: 'pc', label: '3 dozen (36)' },
  ],

  // Pack variants
  pack: [
    { value: 1, unit: 'pack', label: '1 pack' },
    { value: 2, unit: 'pack', label: '2 packs' },
    { value: 3, unit: 'pack', label: '3 packs' },
    { value: 5, unit: 'pack', label: '5 packs' },
    { value: 10, unit: 'pack', label: '10 packs' },
  ],

  // Box variants
  box: [
    { value: 1, unit: 'box', label: '1 box' },
    { value: 2, unit: 'box', label: '2 boxes' },
    { value: 5, unit: 'box', label: '5 boxes' },
    { value: 10, unit: 'box', label: '10 boxes' },
  ],

  // Case variants
  case: [
    { value: 1, unit: 'case', label: '1 case' },
    { value: 2, unit: 'case', label: '2 cases' },
    { value: 5, unit: 'case', label: '5 cases' },
  ],

  // Bag variants
  bag: [
    { value: 1, unit: 'bag', label: '1 bag' },
    { value: 2, unit: 'bag', label: '2 bags' },
    { value: 5, unit: 'bag', label: '5 bags' },
    { value: 10, unit: 'bag', label: '10 bags' },
  ],
};

// Helper function to get unit config
export function getUnitConfig(unit: ProductUnit): UnitConfig | undefined {
  return PRODUCT_UNITS.find((u) => u.value === unit);
}

// Helper function to get variants for a unit
export function getVariantsForUnit(unit: ProductUnit): ProductVariant[] {
  return UNIT_VARIANTS[unit] || [];
}

// Helper function to create a custom variant
export function createCustomVariant(value: number, unit: ProductUnit): ProductVariant {
  const config = getUnitConfig(unit);
  const displayUnit = config?.baseUnit || unit;

  // Format the label based on unit type
  let label = `${value}${displayUnit}`;

  if (config?.category === 'count' || config?.category === 'package') {
    label = value === 1 ? `${value} ${displayUnit}` : `${value} ${displayUnit}s`;
  }

  return {
    value,
    unit: displayUnit,
    label,
  };
}

// Get select options for unit dropdown
export function getUnitSelectOptions() {
  return PRODUCT_UNITS.map((unit) => ({
    value: unit.value,
    label: unit.label,
  }));
}

// Group units by category for display
export function getUnitsByCategory() {
  const grouped: Record<string, UnitConfig[]> = {
    weight: [],
    volume: [],
    count: [],
    package: [],
  };

  PRODUCT_UNITS.forEach((unit) => {
    grouped[unit.category].push(unit);
  });

  return grouped;
}
