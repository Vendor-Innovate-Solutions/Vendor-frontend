"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "@/utils/auth_fn";
import { FileText, CheckCircle, Download } from "lucide-react";

function GenerateInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [applyGST, setApplyGST] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace("/retailer/orders");
      return;
    }
    fetchOrderDetails();
  }, [orderId, router]);

  const fetchOrderDetails = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/sales/${orderId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Pre-fill addresses if available
        setBillingAddress(data.billing_address || "");
        setShippingAddress(data.shipping_address || "");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };

  const handleGenerateInvoice = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/invoices/from_sales_order/${orderId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partial_allowed: false,
          apply_gst: applyGST,
          company_state_code: "27", // You might want to get this dynamically
          billing_address: billingAddress,
          shipping_address: shippingAddress,
          notes: notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoiceData(data);
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.detail || "Failed to generate invoice");
      }
    } catch (err) {
      console.error("Error generating invoice:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    // This would typically download the PDF
    // For now, just redirect to invoice view
    if (invoiceData?.id) {
      router.push(`/retailer/invoices/${invoiceData.id}`);
    }
  };

  const handleLater = () => {
    router.push("/retailer");
  };

  if (success && invoiceData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-gray-900 text-white border border-gray-700 max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <CardTitle className="text-center text-2xl">Invoice Generated!</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Invoice #{invoiceData.invoice_number} has been created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-800 p-4 rounded space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice Number:</span>
                <span className="font-semibold">{invoiceData.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount:</span>
                <span className="font-semibold">
                  {invoiceData.currency_code} {invoiceData.total_value}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-500">{invoiceData.status}</span>
              </div>
            </div>

            <Button
              onClick={handleDownloadInvoice}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download size={16} className="mr-2" />
              View Invoice
            </Button>
            <Button
              onClick={() => router.push("/retailer")}
              variant="outline"
              className="w-full border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Generate Invoice</h1>
          <p className="text-gray-400">Add billing details to generate invoice</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500 rounded p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <Card className="bg-gray-900 text-white border border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="text-blue-500" size={24} />
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Provide additional information for the invoice
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Billing Address */}
            <div className="space-y-2">
              <Label htmlFor="billingAddress">
                Billing Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="billingAddress"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                rows={3}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:ring focus:ring-blue-500"
                placeholder="Enter billing address"
              />
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">
                Shipping Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:ring focus:ring-blue-500"
                placeholder="Enter shipping address"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-gray-500 text-xs">(Optional)</span>
              </Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:ring focus:ring-blue-500"
                placeholder="Any additional notes for this invoice"
              />
            </div>

            {/* Apply GST */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="applyGST"
                checked={applyGST}
                onChange={(e) => setApplyGST(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="applyGST" className="cursor-pointer">
                Apply GST to invoice
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleGenerateInvoice}
                disabled={loading || !billingAddress || !shippingAddress}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Generating..." : "Generate Invoice"}
              </Button>
              <Button
                onClick={handleLater}
                variant="outline"
                className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Do This Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GenerateInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GenerateInvoicePageContent />
    </Suspense>
  );
}
