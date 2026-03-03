"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { getAuthHeaders } from '@/utils/api';
import { toast } from 'sonner';
import { API_BASE_URL } from "@/utils/config";

interface AccountGroup {
  id: string;
  name: string;
  code: string;
  nature: string;
}

interface FinancialYear {
  id: string;
  name: string;
  is_closed: boolean;
}

export default function CreateLedgerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    group: '',
    account_type: 'ASSET',
    opening_balance: '0.00',
    opening_balance_type: 'DR',
    opening_balance_fy: '',
    is_bill_wise: false,
    is_active: true
  });

  useEffect(() => {
    fetchGroups();
    fetchFinancialYears();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounting/groups/`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setGroups(data.results || data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast.error('Failed to load account groups');
    }
  };

  const fetchFinancialYears = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounting/financial-years/`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      const fys = data.results || data;
      setFinancialYears(fys);
      
      // Set current FY as default
      const currentFY = fys.find((fy: FinancialYear) => !fy.is_closed);
      if (currentFY) {
        setFormData(prev => ({ ...prev, opening_balance_fy: currentFY.id }));
      }
    } catch (error) {
      console.error('Failed to fetch financial years:', error);
      toast.error('Failed to load financial years');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/accounting/ledgers/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create ledger');
      }

      toast.success('Ledger created successfully!');
      router.push('/manufacturer/accounting/ledgers');
    } catch (error: any) {
      console.error('Error creating ledger:', error);
      toast.error(error.message || 'Failed to create ledger');
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
            <h1 className="text-2xl font-bold text-white">Create Ledger / Bank Account</h1>
            <p className="text-sm text-neutral-400 mt-1">Add a new ledger account to your chart of accounts</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Ledger Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., BANK001"
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Ledger Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., HDFC Bank Current Account"
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Account Group */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Account Group <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Account Group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Choose "Bank Accounts" for bank accounts</p>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Balance Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Balance Type
              </label>
              <select
                value={formData.opening_balance_type}
                onChange={(e) => setFormData({ ...formData, opening_balance_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DR">Debit (DR)</option>
                <option value="CR">Credit (CR)</option>
              </select>
            </div>

            {/* Financial Year */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Financial Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.opening_balance_fy}
                onChange={(e) => setFormData({ ...formData, opening_balance_fy: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Financial Year</option>
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.name} {!fy.is_closed && '(Current)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Status
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Bill Wise */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_bill_wise}
                  onChange={(e) => setFormData({ ...formData, is_bill_wise: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-300">
                  Enable Bill-by-Bill tracking (for receivables/payables)
                </span>
              </label>
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
              {loading ? 'Creating...' : 'Create Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
