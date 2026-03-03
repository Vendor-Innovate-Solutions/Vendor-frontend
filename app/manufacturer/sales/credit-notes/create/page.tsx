"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/utils/api";
import { toast } from "sonner";
import { API_BASE_URL } from "@/utils/config";

interface Party {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
}

interface Product {
  id: string;
  name: string;
  hsn_code?: string;
}

interface CreditNoteLine {
  product: string;
  quantity: number;
  unit_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
}

export default function CreateCreditNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    party: "",
    reference_invoice: "",
    status: "DRAFT",
    reason: "",
  });

  const [lines, setLines] = useState<CreditNoteLine[]>([
    {
      product: "",
      quantity: 1,
      unit_rate: 0,
      cgst_rate: 9,
      sgst_rate: 9,
      igst_rate: 0,
    },
  ]);

  useEffect(() => {
    fetchParties();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (formData.party) {
      fetchInvoices(formData.party);
    }
  }, [formData.party]);

  const fetchParties = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/party/parties/`, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log("Parties response:", data);
        // API returns { parties: [...] }
        const partyList = data.parties || data.results || data;
        setParties(Array.isArray(partyList) ? partyList : []);
      } else {
        console.error("Failed to fetch parties:", response.status);
        setParties([]);
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
      setParties([]);
    }
  };

  const fetchInvoices = async (partyId: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/invoices/?party=${partyId}`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Invoices response:", data);
        // Check various response formats
        const invoiceList = data.invoices || data.results || data;
        setInvoices(Array.isArray(invoiceList) ? invoiceList : []);
      } else {
        console.error("Failed to fetch invoices:", response.status);
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/catalog/products/`, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log("Products response:", data);
        // API returns { products: [...] }
        const productList = data.products || data.results || data;
        setProducts(Array.isArray(productList) ? productList : []);
      } else {
        console.error("Failed to fetch products:", response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product: "",
        quantity: 1,
        unit_rate: 0,
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof CreditNoteLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.party) {
      toast.error("Please select a party");
      return;
    }

    const validLines = lines.filter(line => line.product && line.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Please add at least one product line");
      return;
    }

    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const payload = {
        party_id: formData.party,
        reference_invoice_id: formData.reference_invoice || null,
        status: formData.status,
        reason: formData.reason,
        lines: validLines.map(line => {
          const taxableValue = line.quantity * line.unit_rate;
          const cgstAmount = (taxableValue * line.cgst_rate) / 100;
          const sgstAmount = (taxableValue * line.sgst_rate) / 100;
          const igstAmount = (taxableValue * line.igst_rate) / 100;
          
          return {
            product_id: line.product,
            quantity: line.quantity,
            unit_rate: line.unit_rate,
            taxable_value: taxableValue,
            cgst_rate: line.cgst_rate,
            cgst_amount: cgstAmount,
            sgst_rate: line.sgst_rate,
            sgst_amount: sgstAmount,
            igst_rate: line.igst_rate,
            igst_amount: igstAmount,
          };
        }),
      };

      const response = await fetch(`${API_BASE_URL}/orders/credit-notes/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Credit note created successfully!");
        router.push("/manufacturer/sales/credit-notes");
      } else {
        const error = await response.json();
        toast.error(error.detail || error.message || "Failed to create credit note");
      }
    } catch (error) {
      console.error("Error creating credit note:", error);
      toast.error("Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  const calculateLineTotal = (line: CreditNoteLine) => {
    const subtotal = line.quantity * line.unit_rate;
    const cgst = (subtotal * line.cgst_rate) / 100;
    const sgst = (subtotal * line.sgst_rate) / 100;
    const igst = (subtotal * line.igst_rate) / 100;
    return subtotal + cgst + sgst + igst;
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/manufacturer/sales/credit-notes"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Credit Notes
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Create Credit Note</h1>
              <p className="text-gray-400">Issue a credit note for customer returns or adjustments</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Party / Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.party}
                  onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Party</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reference Invoice (Optional)
                </label>
                <select
                  value={formData.reference_invoice}
                  onChange={(e) => setFormData({ ...formData, reference_invoice: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.party}
                >
                  <option value="">Select Invoice (Optional)</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="DRAFT">Draft</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Product return, Damaged goods"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Line Items</h2>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Line
              </button>
            </div>

            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-400">Line {index + 1}</span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Product *</label>
                      <select
                        value={line.product}
                        onChange={(e) => updateLine(index, "product", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, "quantity", parseFloat(e.target.value))}
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Unit Rate *</label>
                      <input
                        type="number"
                        value={line.unit_rate}
                        onChange={(e) => updateLine(index, "unit_rate", parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">CGST %</label>
                      <input
                        type="number"
                        value={line.cgst_rate}
                        onChange={(e) => updateLine(index, "cgst_rate", parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">SGST %</label>
                      <input
                        type="number"
                        value={line.sgst_rate}
                        onChange={(e) => updateLine(index, "sgst_rate", parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm text-gray-400">
                    Line Total: ₹{calculateLineTotal(line).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total Amount</span>
              <span className="text-3xl font-bold text-green-400">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/manufacturer/sales/credit-notes"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Credit Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
