'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { API_URL, fetchWithAuth } from "@/utils/auth_fn";

interface Invoice {
  id: number;
  invoice_number: string;
  party_name: string;
  invoice_date: string;
  grand_total: number;
  payment_status: string;
}

export default function CustomerInvoice() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const mockInvoices: Invoice[] = [
    { id: 1, invoice_number: "INV-001", party_name: "ABC Retailers", invoice_date: "2026-01-08", grand_total: 45000, payment_status: "Paid" },
    { id: 2, invoice_number: "INV-002", party_name: "XYZ Traders", invoice_date: "2026-01-07", grand_total: 32000, payment_status: "Unpaid" },
    { id: 3, invoice_number: "INV-003", party_name: "Global Suppliers", invoice_date: "2026-01-06", grand_total: 58000, payment_status: "Paid" },
    { id: 4, invoice_number: "INV-004", party_name: "Metro Stores", invoice_date: "2026-01-05", grand_total: 22000, payment_status: "Unpaid" },
    { id: 5, invoice_number: "INV-005", party_name: "City Retailers", invoice_date: "2026-01-04", grand_total: 75000, payment_status: "Paid" }
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/invoices/`);
        if (response.ok) {
          const data = await response.json();
          const results = Array.isArray(data) ? data : data.results || [];
          // Use mock data if empty
          setInvoices(results.length === 0 ? mockInvoices : results);
        } else {
          setInvoices(mockInvoices);
        }
      } catch (err) {
        console.error('Failed to fetch invoices, using mock data:', err);
        setInvoices(mockInvoices);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button 
        variant="outline" 
        onClick={() => router.push('/manufacturer/accounting')}
        className="mb-6"
      >
        <FileText className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="bg-[#1E293B] border-0">
        <CardHeader>
          <CardTitle className="text-xl text-blue-400">Customer Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-white">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p className="text-gray-400">No invoices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-blue-500/20">
                    <th className="text-left p-3">Invoice #</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-blue-500/10 hover:bg-blue-900/20">
                      <td className="p-3">{invoice.invoice_number}</td>
                      <td className="p-3">{invoice.party_name}</td>
                      <td className="p-3">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td className="p-3 text-right">₹{invoice.grand_total.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          invoice.payment_status?.toLowerCase() === 'paid' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}