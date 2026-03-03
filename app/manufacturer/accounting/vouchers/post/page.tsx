"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, FileText, Calendar, User, CreditCard, Loader } from 'lucide-react';
import { getAuthHeaders } from '@/utils/api';
import { toast } from 'sonner';
import { API_BASE_URL } from "@/utils/config";

interface Payment {
  id: string;
  voucher_number: string | null;
  payment_type: string;
  party_name: string;
  payment_date: string;
  payment_mode: string;
  status: string;
  total_allocated: string;
  reference_number: string;
}

export default function PostVouchersPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'PAYMENT' | 'RECEIPT'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setPayments(data.results || data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handlePostVoucher = async (paymentId: string) => {
    if (!confirm('Are you sure you want to post this voucher? This action cannot be undone.')) {
      return;
    }

    setPosting(paymentId);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/post_voucher/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post voucher');
      }

      toast.success('Voucher posted successfully!');
      fetchPayments(); // Refresh list
    } catch (error: any) {
      console.error('Error posting voucher:', error);
      toast.error(error.message || 'Failed to post voucher');
    } finally {
      setPosting(null);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.payment_type === filter;
  });

  const draftPayments = filteredPayments.filter(p => p.status === 'DRAFT');
  const postedPayments = filteredPayments.filter(p => p.status === 'POSTED');

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
              <h1 className="text-2xl font-bold text-white">Post Vouchers</h1>
              <p className="text-sm text-neutral-400 mt-1">Review and post draft payment vouchers</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PAYMENT')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'PAYMENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setFilter('RECEIPT')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'RECEIPT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              Receipts
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Draft Vouchers */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-white">
                  Draft Vouchers ({draftPayments.length})
                </h2>
              </div>

              {draftPayments.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                  <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
                  <p className="text-neutral-400">No draft vouchers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-neutral-400">
                            {payment.voucher_number || 'Draft'}
                          </p>
                          <h3 className="text-lg font-semibold text-white mt-1">
                            {payment.payment_type === 'PAYMENT' ? 'Payment' : 'Receipt'}
                          </h3>
                        </div>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
                          DRAFT
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-neutral-500" />
                          <span className="text-neutral-300">{payment.party_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-neutral-500" />
                          <span className="text-neutral-300">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-neutral-500" />
                          <span className="text-neutral-300">{payment.payment_mode}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-700">
                        <div>
                          <p className="text-xs text-neutral-500">Allocated</p>
                          <p className="text-lg font-semibold text-white">
                            ₹{parseFloat(payment.total_allocated).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handlePostVoucher(payment.id)}
                          disabled={posting === payment.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {posting === payment.id ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Post
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posted Vouchers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-white">
                  Posted Vouchers ({postedPayments.length})
                </h2>
              </div>

              {postedPayments.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
                  <p className="text-neutral-400">No posted vouchers found</p>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                          Voucher No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                          Party
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                          Mode
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {postedPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-white">
                            {payment.voucher_number || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-300">
                            {payment.payment_type === 'PAYMENT' ? 'Payment' : 'Receipt'}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-300">
                            {payment.party_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-300">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-300">
                            {payment.payment_mode}
                          </td>
                          <td className="px-4 py-3 text-sm text-white text-right font-medium">
                            ₹{parseFloat(payment.total_allocated).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                              POSTED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
