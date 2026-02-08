'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Eye,
  Loader
} from 'lucide-react';
import { apiClient } from '@/utils/api';
import { toast } from 'sonner';

interface Payment {
  id: string;
  voucher_number: string;
  payment_type: string;
  party_name: string;
  payment_date: string;
  payment_mode: string;
  status: string;
  total_allocated: string;
  reference_number?: string | null;
  created_at: string;
}

export default function TrackPayment() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, statusFilter, modeFilter, dateFilter, payments]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Payment[]>('/payments/');
      
      if (response.data) {
        setPayments(response.data);
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.voucher_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Payment mode filter
    if (modeFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_mode === modeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.payment_date);
        switch (dateFilter) {
          case 'today':
            return paymentDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return paymentDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            return paymentDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', icon: Clock },
      POSTED: { bg: 'bg-green-900/30', text: 'text-green-400', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-900/30', text: 'text-red-400', icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'CASH':
        return '💵';
      case 'CHEQUE':
        return '🏦';
      case 'BANK_TRANSFER':
        return '🔄';
      case 'CARD':
        return '💳';
      case 'UPI':
        return '📱';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/manufacturer/accounting')}
              className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-blue-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Track Payments</h1>
              <p className="text-gray-400 mt-1">View and track all payment transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/manufacturer/accounting/vouchers/create')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              Create Payment
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-white">{filteredPayments.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1E293B] rounded-lg border border-blue-500/20 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by party, voucher, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-[#1E293B] rounded-lg border border-blue-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F172A]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Voucher #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Bank/Cash
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/10">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg">No payments found</p>
                      <p className="text-sm mt-2">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-blue-500/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-blue-400 font-mono text-sm">
                          {payment.voucher_number || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-white">{payment.party_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{payment.payment_type === 'PAYMENT' ? 'Cash Out' : 'Cash In'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPaymentModeIcon(payment.payment_mode)}</span>
                          <span className="text-sm text-gray-300">
                            {payment.payment_mode.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400 font-mono">
                          {payment.reference_number || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-400">
                          ₹{parseFloat(payment.total_allocated || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/manufacturer/accounting/payments/${payment.id}`)}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-blue-400" />
                          </button>
                          <button
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        {filteredPayments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1E293B] rounded-lg border border-blue-500/20 p-4">
              <p className="text-sm text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-green-400 mt-2">
                ₹{filteredPayments.reduce((sum, p) => sum + parseFloat(p.total_allocated || '0'), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-[#1E293B] rounded-lg border border-blue-500/20 p-4">
              <p className="text-sm text-gray-400">Posted</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">
                {filteredPayments.filter(p => p.status === 'POSTED').length}
              </p>
            </div>
            <div className="bg-[#1E293B] rounded-lg border border-blue-500/20 p-4">
              <p className="text-sm text-gray-400">Draft</p>
              <p className="text-2xl font-bold text-yellow-400 mt-2">
                {filteredPayments.filter(p => p.status === 'DRAFT').length}
              </p>
            </div>
            <div className="bg-[#1E293B] rounded-lg border border-blue-500/20 p-4">
              <p className="text-sm text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-red-400 mt-2">
                {filteredPayments.filter(p => p.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
