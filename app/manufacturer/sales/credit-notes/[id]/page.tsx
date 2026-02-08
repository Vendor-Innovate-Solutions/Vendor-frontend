"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/utils/api";
import { toast } from "sonner";

interface CreditNoteDetail {
  id: string;
  credit_note_number: string;
  credit_note_date: string;
  party_id: string;
  party_name: string;
  reference_invoice_number: string | null;
  reason: string;
  status: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  created_at: string;
  lines: LineItem[];
}

interface LineItem {
  id: string;
  line_no: number;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_rate: string;
  taxable_value: string;
  cgst_rate: string;
  cgst_amount: string;
  sgst_rate: string;
  sgst_amount: string;
  igst_rate: string;
  igst_amount: string;
  line_total: string;
}

export default function CreditNoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creditNote, setCreditNote] = useState<CreditNoteDetail | null>(null);

  useEffect(() => {
    fetchCreditNote();
  }, []);

  const fetchCreditNote = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `http://localhost:8000/api/orders/credit-notes/${params.id}/`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setCreditNote(data);
      } else {
        toast.error("Credit note not found");
        router.push("/manufacturer/sales/credit-notes");
      }
    } catch (error) {
      console.error("Error fetching credit note:", error);
      toast.error("Failed to load credit note");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500",
      APPROVED: "bg-green-500/20 text-green-400 border-green-500",
      APPLIED: "bg-blue-500/20 text-blue-400 border-blue-500",
      CANCELLED: "bg-red-500/20 text-red-400 border-red-500",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!creditNote) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/manufacturer/sales/credit-notes"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Credit Notes
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-blue-400">
                    {creditNote.credit_note_number}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      creditNote.status
                    )}`}
                  >
                    {creditNote.status}
                  </span>
                </div>
                <p className="text-gray-400 mt-1">Credit Note Details</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Amount</div>
              <div className="text-3xl font-bold text-green-400">
                ₹{parseFloat(creditNote.total_amount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4">Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Party / Customer</div>
              <div className="text-white font-medium">{creditNote.party_name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Date</div>
              <div className="text-white font-medium">
                {new Date(creditNote.credit_note_date).toLocaleDateString()}
              </div>
            </div>
            {creditNote.reference_invoice_number && (
              <div>
                <div className="text-sm text-gray-400">Reference Invoice</div>
                <div className="text-white font-medium">
                  {creditNote.reference_invoice_number}
                </div>
              </div>
            )}
            {creditNote.reason && (
              <div>
                <div className="text-sm text-gray-400">Reason</div>
                <div className="text-white font-medium">{creditNote.reason}</div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">#</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Product</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">Qty</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">Rate</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">Taxable</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">CGST</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">SGST</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">IGST</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {creditNote.lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-700/50">
                    <td className="py-3 px-2 text-sm">{line.line_no}</td>
                    <td className="py-3 px-2 text-sm">{line.product_name}</td>
                    <td className="py-3 px-2 text-sm text-right">{line.quantity}</td>
                    <td className="py-3 px-2 text-sm text-right">
                      ₹{parseFloat(line.unit_rate).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      ₹{parseFloat(line.taxable_value).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {parseFloat(line.cgst_rate).toFixed(2)}%<br />
                      <span className="text-gray-400">
                        ₹{parseFloat(line.cgst_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {parseFloat(line.sgst_rate).toFixed(2)}%<br />
                      <span className="text-gray-400">
                        ₹{parseFloat(line.sgst_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {parseFloat(line.igst_rate).toFixed(2)}%<br />
                      <span className="text-gray-400">
                        ₹{parseFloat(line.igst_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-right font-semibold">
                      ₹{parseFloat(line.line_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white">
                  ₹{parseFloat(creditNote.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax Amount:</span>
                <span className="text-white">
                  ₹{parseFloat(creditNote.tax_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-700 pt-2">
                <span className="text-gray-300">Total Amount:</span>
                <span className="text-green-400">
                  ₹{parseFloat(creditNote.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
