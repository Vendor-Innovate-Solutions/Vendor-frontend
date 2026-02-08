"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { getAuthHeaders } from '@/utils/api';
import { toast } from 'sonner';

export default function CreateAccountGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nature: 'ASSET',
    report_type: 'BS',
    parent: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/accounting/groups/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create account group');
      }

      toast.success('Account group created successfully!');
      router.push('/manufacturer/accounting/ledgers');
    } catch (error: any) {
      console.error('Error creating account group:', error);
      toast.error(error.message || 'Failed to create account group');
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
            <h1 className="text-2xl font-bold text-white">Create Account Group</h1>
            <p className="text-sm text-neutral-400 mt-1">Add a new account group for organizing ledgers</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Group Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., BA, CA, etc."
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bank Accounts"
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Nature */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Nature <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.nature}
                onChange={(e) => setFormData({ ...formData, nature: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
                <option value="EQUITY">Equity</option>
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Report Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.report_type}
                onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="BS">Balance Sheet</option>
                <option value="PL">Profit & Loss</option>
              </select>
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
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>

        {/* Quick Setup Info */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Common Account Groups:</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• <strong>Bank Accounts</strong> (BA) - Asset, Balance Sheet</li>
            <li>• <strong>Cash in Hand</strong> (CASH) - Asset, Balance Sheet</li>
            <li>• <strong>Sundry Debtors</strong> (SD) - Asset, Balance Sheet</li>
            <li>• <strong>Sundry Creditors</strong> (SC) - Liability, Balance Sheet</li>
            <li>• <strong>Sales</strong> (SALES) - Income, Profit & Loss</li>
            <li>• <strong>Purchases</strong> (PURCH) - Expense, Profit & Loss</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
