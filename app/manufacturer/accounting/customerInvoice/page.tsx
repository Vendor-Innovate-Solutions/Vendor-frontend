'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Loader, ArrowLeft } from "lucide-react";
import { apiClient } from '@/utils/api';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  party_name: string;
  invoice_type: string;
  status: string;
  subtotal: string;
  tax_amount: string;
  grand_total: string;
  amount_received: string;
  outstanding_amount: string;
}

export default function CustomerInvoice() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // apiClient.get returns data directly, not wrapped in .data
      const response = await apiClient.get<Invoice[] | { results: Invoice[] }>('/invoices/?invoice_type=SALES');
      const invoiceList = Array.isArray(response) 
        ? response 
        : (response as any).results || [];
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = async (invoiceId: string) => {
    try {
      // apiClient.get returns data directly
      const invoiceData = await apiClient.get<any>(`/invoices/${invoiceId}/`);
      setSelectedInvoice(invoiceData);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID': return 'bg-green-500/20 text-green-400';
      case 'POSTED': return 'bg-blue-500/20 text-blue-400';
      case 'DRAFT': return 'bg-yellow-500/20 text-yellow-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button 
        variant="outline" 
        onClick={() => router.push('/manufacturer/accounting')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="bg-[#1E293B] border-0">
        <CardHeader>
          <CardTitle className="text-xl text-blue-400">Customer Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-500/20">
                    <th className="text-left py-3 px-4 text-blue-400">Invoice #</th>
                    <th className="text-left py-3 px-4 text-blue-400">Customer</th>
                    <th className="text-left py-3 px-4 text-blue-400">Date</th>
                    <th className="text-left py-3 px-4 text-blue-400">Due Date</th>
                    <th className="text-right py-3 px-4 text-blue-400">Amount</th>
                    <th className="text-right py-3 px-4 text-blue-400">Outstanding</th>
                    <th className="text-center py-3 px-4 text-blue-400">Status</th>
                    <th className="text-center py-3 px-4 text-blue-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="border-b border-blue-500/10 hover:bg-blue-900/10">
                      <td className="py-3 px-4 font-medium text-white">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-gray-300">{invoice.party_name}</td>
                      <td className="py-3 px-4 text-gray-300">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-300">{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right text-white">₹{parseFloat(invoice.grand_total || '0').toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-red-400">₹{parseFloat(invoice.outstanding_amount || '0').toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewInvoice(invoice.id)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-400">Invoice Bill</h2>
                <p className="text-gray-400">#{selectedInvoice.invoice_number}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowModal(false)}>✕</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-400">Customer</p>
                <p className="text-white font-medium">{selectedInvoice.party_name}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Invoice Date</p>
                <p className="text-white">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Due Date</p>
                <p className="text-white">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-blue-500/20 rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-blue-900/20">
                  <tr>
                    <th className="py-2 px-3 text-left text-blue-400 text-sm">#</th>
                    <th className="py-2 px-3 text-left text-blue-400 text-sm">Item</th>
                    <th className="py-2 px-3 text-right text-blue-400 text-sm">Qty</th>
                    <th className="py-2 px-3 text-right text-blue-400 text-sm">Rate</th>
                    <th className="py-2 px-3 text-right text-blue-400 text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines?.map((line: any, index: number) => (
                    <tr key={line.id} className="border-t border-blue-500/10">
                      <td className="py-2 px-3 text-gray-300">{index + 1}</td>
                      <td className="py-2 px-3 text-white">{line.item_name || line.description}</td>
                      <td className="py-2 px-3 text-right text-gray-300">{line.quantity}</td>
                      <td className="py-2 px-3 text-right text-gray-300">₹{parseFloat(line.unit_rate).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-white">₹{parseFloat(line.line_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white">₹{parseFloat(selectedInvoice.subtotal || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tax:</span>
                <span className="text-white">₹{parseFloat(selectedInvoice.tax_amount || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-blue-500/20 pt-2">
                <span className="text-blue-400">Grand Total:</span>
                <span className="text-white">₹{parseFloat(selectedInvoice.grand_total || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Received:</span>
                <span className="text-green-400">₹{parseFloat(selectedInvoice.amount_received || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Outstanding:</span>
                <span className="text-red-400">₹{parseFloat(selectedInvoice.outstanding_amount || '0').toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}