"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, BookOpen, TrendingUp, TrendingDown, FileText, Loader, Plus } from 'lucide-react';
import { getAuthHeaders } from '@/utils/api';
import { toast } from 'sonner';
import { API_BASE_URL } from "@/utils/config";

interface Ledger {
  id: string;
  name: string;
  code: string;
  group: {
    id: string;
    name: string;
  };
  opening_balance: string;
  balance_type: string;
  is_active: boolean;
}

interface LedgerBalance {
  ledger_name: string;
  debit_total: string;
  credit_total: string;
  closing_balance: string;
  balance_type: string;
}

export default function LedgersPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'balance'>('list');

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounting/ledgers/`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      const ledgersList = data.results || data;
      setLedgers(ledgersList);
      
      // Extract unique groups
      const uniqueGroups = [...new Set(ledgersList.map((l: Ledger) => l.group.name))];
      setGroups(uniqueGroups as string[]);
    } catch (error) {
      console.error('Failed to fetch ledgers:', error);
      toast.error('Failed to load ledgers');
    } finally {
      setLoading(false);
    }
  };

  const filteredLedgers = ledgers.filter(ledger => {
    const matchesSearch = ledger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ledger.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || ledger.group.name === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const viewLedgerStatement = (ledgerId: string) => {
    router.push(`/manufacturer/accounting/ledgers/${ledgerId}`);
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
              <h1 className="text-2xl font-bold text-white">Ledger Reports</h1>
              <p className="text-sm text-neutral-400 mt-1">View all ledger accounts and balances</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/manufacturer/accounting/groups/create')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Group
            </button>
            <button
              onClick={() => router.push('/manufacturer/accounting/ledgers/create')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Ledger
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('balance')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'balance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              Balance View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Groups</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
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
        ) : filteredLedgers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
            <BookOpen className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
            <p className="text-neutral-400">No ledgers found</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                    Ledger Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                    Group
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">
                    Opening Balance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLedgers.map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-neutral-300 font-mono">
                      {ledger.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-white font-medium">{ledger.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300">
                      {ledger.group.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-right font-medium">
                      ₹{parseFloat(ledger.opening_balance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {ledger.balance_type === 'DR' ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          ledger.balance_type === 'DR' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {ledger.balance_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        ledger.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {ledger.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewLedgerStatement(ledger.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        Statement
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Ledgers</p>
                <p className="text-2xl font-bold text-white mt-1">{filteredLedgers.length}</p>
              </div>
              <BookOpen className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Active Ledgers</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {filteredLedgers.filter(l => l.is_active).length}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Groups</p>
                <p className="text-2xl font-bold text-white mt-1">{groups.length}</p>
              </div>
              <FileText className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
