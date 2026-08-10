'use client';

import { useState } from 'react';
import { Search, Plus, Wallet, User, Calendar, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Badge, Input, Select, Modal, ModalFooter } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/config/features';
import { useSettings } from '@/providers/settings-provider';

// Mock payments data
const mockPayments = [
  {
    id: 'pay-001',
    userId: 'usr-001',
    buyerName: 'Restaurant ABC',
    amount: 5000,
    method: 'upi' as const,
    reference: 'UPI123456789',
    notes: 'Payment for order ORD-MEAT-7HJ4K',
    receivedBy: 'Admin',
    receivedAt: new Date(Date.now() - 3600000),
    status: 'verified' as const,
  },
  {
    id: 'pay-002',
    userId: 'usr-002',
    buyerName: 'Hotel XYZ',
    amount: 12000,
    method: 'bank_transfer' as const,
    reference: 'NEFT2024010112345',
    notes: 'Monthly settlement',
    receivedBy: 'Admin',
    receivedAt: new Date(Date.now() - 86400000),
    status: 'recorded' as const,
  },
  {
    id: 'pay-003',
    userId: 'usr-003',
    buyerName: 'Cafe Delight',
    amount: 3500,
    method: 'cash' as const,
    reference: 'CASH-2024-001',
    notes: '',
    receivedBy: 'Admin',
    receivedAt: new Date(Date.now() - 172800000),
    status: 'verified' as const,
  },
];

// Mock buyers for dropdown
const mockBuyers = [
  { value: 'usr-001', label: 'Restaurant ABC' },
  { value: 'usr-002', label: 'Hotel XYZ' },
  { value: 'usr-003', label: 'Cafe Delight' },
  { value: 'usr-004', label: 'Food Court' },
];

export default function AdminPaymentsPage() {
  const { success, error } = useToast();
  const { formatPrice, currencySymbol } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredPayments = mockPayments.filter((payment) =>
    payment.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodIcon = (method: keyof typeof PAYMENT_METHODS) => {
    return PAYMENT_METHODS[method]?.label || method;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success" size="sm">Verified</Badge>;
      case 'disputed':
        return <Badge variant="danger" size="sm">Disputed</Badge>;
      default:
        return <Badge variant="warning" size="sm">Recorded</Badge>;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.userId) errors.userId = 'Please select a buyer';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Enter a valid amount';
    if (!formData.reference.trim()) errors.reference = 'Reference is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // TODO: Implement actual payment recording
    success('Payment recorded', `Payment of ${formatPrice(parseFloat(formData.amount))} recorded successfully.`);
    setRecordModalOpen(false);
    setFormData({ userId: '', amount: '', method: 'cash', reference: '', notes: '' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Record and manage buyer payments</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRecordModalOpen(true)}>
          Record Payment
        </Button>
      </div>

      {/* Search */}
      <Card variant="bordered" className="mb-6 bg-white">
        <Input
          placeholder="Search by buyer name or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5" />}
        />
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card variant="bordered" className="bg-white text-center py-12">
            <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No payments found</h3>
            <p className="text-gray-500">Record a payment to get started</p>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} variant="bordered" className="bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{payment.buyerName}</h3>
                    {getStatusBadge(payment.status)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        Method
                      </p>
                      <p className="font-medium text-gray-900 capitalize">
                        {getMethodIcon(payment.method)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Reference</p>
                      <p className="font-mono text-gray-900">{payment.reference}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Received By
                      </p>
                      <p className="text-gray-900">{payment.receivedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date
                      </p>
                      <p className="text-gray-900">{formatDateTime(payment.receivedAt)}</p>
                    </div>
                  </div>

                  {payment.notes && (
                    <p className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Notes:</span> {payment.notes}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(payment.amount)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Payment"
        description="Record a manual payment from a buyer"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Buyer"
            value={formData.userId}
            onChange={(e) => {
              setFormData({ ...formData, userId: e.target.value });
              if (formErrors.userId) setFormErrors({ ...formErrors, userId: '' });
            }}
            options={[{ value: '', label: 'Select a buyer' }, ...mockBuyers]}
            error={formErrors.userId}
          />

          <Input
            label="Amount"
            type="number"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value });
              if (formErrors.amount) setFormErrors({ ...formErrors, amount: '' });
            }}
            leftIcon={<span className="text-gray-500">{currencySymbol}</span>}
            error={formErrors.amount}
          />

          <Select
            label="Payment Method"
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'upi', label: 'UPI' },
              { value: 'check', label: 'Check' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Input
            label="Reference Number"
            placeholder="Transaction ID, check number, etc."
            value={formData.reference}
            onChange={(e) => {
              setFormData({ ...formData, reference: e.target.value });
              if (formErrors.reference) setFormErrors({ ...formErrors, reference: '' });
            }}
            error={formErrors.reference}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={2}
              placeholder="Additional notes about this payment"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setRecordModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record Payment</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
