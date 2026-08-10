'use client';

import { useState } from 'react';
import { Download, Filter, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';
import { LedgerEntryType } from '@/types';
import { useSettings } from '@/providers/settings-provider';

// Mock ledger data
const mockLedgerEntries = [
  {
    id: 'entry-001',
    type: 'purchase' as LedgerEntryType,
    amount: 2450,
    referenceType: 'order' as const,
    referenceId: 'ORD-MEAT-7HJ4K-X9P2',
    description: 'Order placed - 5 items',
    balanceAfter: 7180,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'entry-002',
    type: 'payment' as LedgerEntryType,
    amount: -3000,
    referenceType: 'payment' as const,
    referenceId: 'PAY-001',
    description: 'UPI Payment received',
    balanceAfter: 4730,
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'entry-003',
    type: 'purchase' as LedgerEntryType,
    amount: 1890,
    referenceType: 'order' as const,
    referenceId: 'ORD-MEAT-8KL5M-Y3Q7',
    description: 'Order placed - 3 items',
    balanceAfter: 7730,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 86400000 * 8),
  },
  {
    id: 'entry-004',
    type: 'payment' as LedgerEntryType,
    amount: -5000,
    referenceType: 'payment' as const,
    referenceId: 'PAY-002',
    description: 'Bank Transfer received',
    balanceAfter: 5840,
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 86400000 * 12),
  },
  {
    id: 'entry-005',
    type: 'adjustment' as LedgerEntryType,
    amount: -500,
    referenceType: 'manual' as const,
    referenceId: 'ADJ-001',
    description: 'Discount adjustment for damaged items',
    balanceAfter: 10840,
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 86400000 * 15),
  },
];

const mockSummary = {
  totalPurchases: 45680,
  totalPayments: 38500,
  totalAdjustments: -500,
  currentBalance: 7180,
};

export default function LedgerPage() {
  const { formatPrice } = useSettings();
  const [filterType, setFilterType] = useState('all');

  const filteredEntries = mockLedgerEntries.filter((entry) => {
    if (filterType === 'all') return true;
    return entry.type === filterType;
  });

  const getEntryIcon = (type: LedgerEntryType) => {
    if (type === 'purchase') {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-green-500" />;
  };

  const getEntryBadge = (type: LedgerEntryType) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="danger" size="sm">Purchase</Badge>;
      case 'payment':
        return <Badge variant="success" size="sm">Payment</Badge>;
      case 'adjustment':
        return <Badge variant="info" size="sm">Adjustment</Badge>;
      case 'refund':
        return <Badge variant="warning" size="sm">Refund</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Ledger</h1>
          <p className="text-gray-500 mt-1">Track your purchases, payments, and balance</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
          Download Statement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card variant="bordered" padding="sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Purchases</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatPrice(mockSummary.totalPurchases)}
          </p>
        </Card>
        <Card variant="bordered" padding="sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Payments</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {formatPrice(mockSummary.totalPayments)}
          </p>
        </Card>
        <Card variant="bordered" padding="sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Adjustments</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatPrice(Math.abs(mockSummary.totalAdjustments))}
          </p>
        </Card>
        <Card variant="bordered" padding="sm" className="bg-orange-50 border-orange-200">
          <p className="text-xs text-orange-600 uppercase tracking-wide">Current Balance</p>
          <p className="text-xl font-bold text-orange-600 mt-1">
            {formatPrice(mockSummary.currentBalance)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="bordered" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <Select
              label="Filter by Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'All Entries' },
                { value: 'purchase', label: 'Purchases' },
                { value: 'payment', label: 'Payments' },
                { value: 'adjustment', label: 'Adjustments' },
                { value: 'refund', label: 'Refunds' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Ledger Entries */}
      <Card variant="bordered" padding="none">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No entries found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {getEntryIcon(entry.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{entry.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getEntryBadge(entry.type)}
                          <span className="text-xs text-gray-500">
                            Ref: {entry.referenceId}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            entry.amount > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {entry.amount > 0 ? '+' : ''}
                          {formatPrice(entry.amount)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Balance: {formatPrice(entry.balanceAfter)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Box */}
      <Card variant="bordered" className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">About Your Ledger</p>
            <p className="text-sm text-blue-700 mt-1">
              Your ledger tracks all purchases and payments. Purchases increase your balance
              (amount due), while payments decrease it. Contact the admin if you notice any
              discrepancies.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
