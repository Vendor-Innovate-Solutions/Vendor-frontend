"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Scale, TrendingUp, TrendingDown, Loader, Calendar } from 'lucide-react';
import { getAuthHeaders } from '@/utils/api';
import { toast } from 'sonner';

interface FinancialYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}

interface TrialBalanceEntry {
  ledger_id: string;
  ledger: string;
  group: string;
  dr: number;
  cr: number;
}

interface TrialBalanceData {
  financial_year: string;
  rows: TrialBalanceEntry[];
  total_dr: number;
  total_cr: number;
  difference: number;
  is_balanced: boolean;
}

export default function TrialBalancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null);

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    if (selectedFY) {
      fetchTrialBalance();
    } else {
      setLoading(false);
    }
  }, [selectedFY]);

  const fetchFinancialYears = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/accounting/financial-years/', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch financial years');
      }
      const data = await response.json();
      const fys = Array.isArray(data) ? data : (data.results || []);
      setFinancialYears(fys);
      
      // Select current FY by default
      const currentFY = fys.find((fy: FinancialYear) => !fy.is_closed);
      if (currentFY) {
        setSelectedFY(currentFY.id);
      } else if (fys.length > 0) {
        setSelectedFY(fys[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch financial years:', error);
      toast.error('Failed to load financial years');
      setLoading(false);
    }
  };

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const url = selectedFY
        ? `http://localhost:8000/api/accounting/reports/trial-balance/?financial_year_id=${selectedFY}`
        : 'http://localhost:8000/api/accounting/reports/trial-balance/';
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trial balance');
      }
      
      const data = await response.json();
      setTrialBalance(data);
    } catch (error) {
      console.error('Failed to fetch trial balance:', error);
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!trialBalance) return;

    const csvRows = [
      ['Trial Balance Report'],
      [`Financial Year: ${trialBalance.financial_year}`],
      [],
      ['Ledger Name', 'Group', 'Debit', 'Credit'],
      ...(trialBalance.rows || []).map(entry => [
        entry.ledger,
        entry.group,
        entry.dr.toString(),
        entry.cr.toString(),
      ]),
      [],
      ['TOTAL', '', trialBalance.total_dr.toString(), trialBalance.total_cr.toString()],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial_balance_${trialBalance.financial_year.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Trial balance exported successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Trial Balance</h1>
              <p className="text-sm text-neutral-400 mt-1">View trial balance report for financial year</p>
            </div>
          </div>

          {trialBalance && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>

        {/* Financial Year Selector */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Financial Year</option>
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.name} ({new Date(fy.start_date).toLocaleDateString()} - {new Date(fy.end_date).toLocaleDateString()})
                  {!fy.is_closed && ' - Current'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : !trialBalance ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
            <Scale className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
            <p className="text-neutral-400">Select a financial year to view trial balance</p>
          </div>
        ) : (
          <>
            {/* Report Info */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Trial Balance Report
                  </h2>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-neutral-400">Financial Year: </span>
                      <span className="text-white font-medium">{trialBalance.financial_year}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Total Entries: </span>
                      <span className="text-white font-medium">
                        {trialBalance.rows?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className={`h-6 w-6 ${trialBalance.is_balanced ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${trialBalance.is_balanced ? 'text-green-400' : 'text-red-400'}`}>
                    {trialBalance.is_balanced ? 'Balanced' : 'Unbalanced'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trial Balance Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                        Ledger Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                        Group
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">
                        Debit (₹)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">
                        Credit (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trialBalance.rows && trialBalance.rows.length > 0 ? (
                      trialBalance.rows.map((entry, index) => (
                        <tr key={entry.ledger_id || index} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-white">
                            {entry.ledger}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-300">
                            {entry.group}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {entry.dr > 0 ? (
                              <span className="text-red-400 font-medium">
                                {entry.dr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-neutral-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {entry.cr > 0 ? (
                              <span className="text-green-400 font-medium">
                                {entry.cr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-neutral-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                          No ledger entries found for this financial year
                        </td>
                      </tr>
                    )}
                    {/* Total Row */}
                    <tr className="bg-white/10 font-bold border-t-2 border-white/20">
                      <td colSpan={2} className="px-4 py-4 text-sm text-white uppercase">
                        Total
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-red-400">
                        {(trialBalance.total_dr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-green-400">
                        {(trialBalance.total_cr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Total Debit</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                      ₹{(trialBalance.total_dr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-red-500" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Total Credit</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      ₹{(trialBalance.total_cr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingDown className="h-10 w-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Difference</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      Math.abs(trialBalance.difference || 0) < 0.01
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      ₹{Math.abs(trialBalance.difference || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Scale className={`h-10 w-10 ${trialBalance.is_balanced ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
