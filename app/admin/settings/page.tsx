'use client';

import { useState, useEffect } from 'react';
import { Save, Settings, DollarSign, Percent, Package, FileText } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { CURRENCIES } from '@/config/features';
import { useSettingsStore } from '@/stores/settings-store';

export default function AdminSettingsPage() {
  const { settings, isLoading, error, fetchSettings, updateSettings, clearError } = useSettingsStore();
  const [formData, setFormData] = useState({
    currency: 'INR',
    taxRate: 5,
    lowStockThreshold: 10,
    orderPrefix: 'ORD',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        currency: settings.currency,
        taxRate: settings.taxRate * 100, // Convert to percentage for display
        lowStockThreshold: settings.lowStockThreshold,
        orderPrefix: settings.orderPrefix,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    clearError();

    try {
      await updateSettings({
        currency: formData.currency,
        taxRate: formData.taxRate / 100, // Convert back to decimal
        lowStockThreshold: formData.lowStockThreshold,
        orderPrefix: formData.orderPrefix,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error is handled by the store
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === formData.currency);

  if (isLoading && !settings) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-7 w-7 text-orange-600" />
          Company Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Configure your company preferences and business settings
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Currency Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Currency Settings</h2>
                <p className="text-sm text-gray-500">Set your preferred currency for all transactions</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-lg font-medium text-gray-900">
                    {selectedCurrency?.symbol}1,234.56
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({selectedCurrency?.name})
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tax Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Tax Settings</h2>
                <p className="text-sm text-gray-500">Configure tax rates for your products</p>
              </div>
            </div>

            <div className="max-w-xs">
              <Input
                label="Tax Rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                hint="Enter the tax percentage (e.g., 5 for 5% GST)"
              />
            </div>
          </Card>

          {/* Inventory Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Inventory Settings</h2>
                <p className="text-sm text-gray-500">Configure inventory management preferences</p>
              </div>
            </div>

            <div className="max-w-xs">
              <Input
                label="Low Stock Threshold"
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
                hint="Products below this quantity will be marked as low stock"
              />
            </div>
          </Card>

          {/* Order Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Order Settings</h2>
                <p className="text-sm text-gray-500">Configure order numbering and preferences</p>
              </div>
            </div>

            <div className="max-w-xs">
              <Input
                label="Order Prefix"
                value={formData.orderPrefix}
                onChange={(e) => setFormData({ ...formData, orderPrefix: e.target.value.toUpperCase() })}
                hint="Prefix for order numbers (e.g., ORD-001)"
                maxLength={5}
              />
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<Save className="h-5 w-5" />}
              isLoading={isSaving}
              disabled={isLoading || isSaving}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
