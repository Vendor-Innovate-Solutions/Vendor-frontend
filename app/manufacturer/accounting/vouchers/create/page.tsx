"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { getAuthHeaders } from '@/utils/api';
import { toast } from 'sonner';

interface Party {
  id: string;
  name: string;
  party_type: string;
}

interface BankAccount {
  id: string;
  name: string;
  account_number: string;
}

export default function CreateVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  const [formData, setFormData] = useState({
    party_id: '',
    bank_account_id: '',
    payment_type: 'PAYMENT',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'CASH',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchParties();
    fetchBankAccounts();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/party/parties/', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setParties(data.parties || data.results || data);
    } catch (error) {
      console.error('Failed to fetch parties:', error);
      toast.error('Failed to load parties');
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/accounting/ledgers/?group__name=Bank Accounts', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setBankAccounts(data.results || data);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      toast.error('Failed to load bank accounts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/payments/create/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create voucher');
      }

      const payment = await response.json();
      toast.success('Payment voucher created successfully!');
      router.push(`/manufacturer/accounting/vouchers/${payment.id}`);
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      toast.error(error.message || 'Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Payment Voucher</h1>
            <p className="text-sm text-neutral-400 mt-1">Create a new payment or receipt voucher</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Voucher Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="PAYMENT">Payment (Money Out)</option>
                <option value="RECEIPT">Receipt (Money In)</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Party */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Party <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.party_id}
                onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Party</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name} ({party.party_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Bank Account <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bank_account_id}
                onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Bank Account</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Cheque/Transaction number"
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Voucher'}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> After creating the voucher, you can allocate it to specific invoices before posting.
          </p>
        </div>
      </div>
    </div>
  );
}
