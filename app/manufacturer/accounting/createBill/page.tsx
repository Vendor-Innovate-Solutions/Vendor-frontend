"use client";

import React, { useState, useEffect } from "react";
import { fetchWithAuth, getAuthToken, API_URL } from "@/utils/auth_fn";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText } from "lucide-react";

// Payment mode/status choices
const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank" },
];
const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
];

function getCurrentDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function CreateBill() {
  const router = useRouter();
  const [notification, setNotification] = useState<string | null>(null);

  // API data
  const [companyObj, setCompanyObj] = useState<any>(null);
  const [retailers, setRetailers] = useState<
    {
      retailer_id: number;
      name: string;
      address?: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
      gstin?: string;
      email?: string;
      contact?: string;
    }[]
  >([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoiceCount, setInvoiceCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const companyId = localStorage.getItem("company_id");
      if (!companyId) return;

      // Fetch company details for preview
      const companyRes = await fetchWithAuth(
        `${API_URL}/company/${companyId}/`
      );
      if (companyRes.ok) {
        const companyObj = await companyRes.json();
        setCompanyObj(companyObj);
      }

      // Retailers for this company
      const retailerRes = await fetchWithAuth(
        `${API_URL}/retailers/?company=${companyId}`
      );
      if (retailerRes.ok) {
        const retailerData = await retailerRes.json();
        setRetailers(
          Array.isArray(retailerData)
            ? retailerData
            : retailerData.results || []
        );
      }

      // Products for this company
      const productRes = await fetchWithAuth(
        `${API_URL}/products/?company=${companyId}`
      );
      if (productRes.ok) {
        const productData = await productRes.json();
        setProducts(
          Array.isArray(productData) ? productData : productData.results || []
        );
      }

      // Invoice count
      const invoiceRes = await fetchWithAuth(
        `${API_URL}/invoices/count/?company=${companyId}`
      );
      let count = 0;
      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        count = invoiceData?.count || 0;
      }
      setInvoiceCount(count);
      setFormData((prev) => ({
        ...prev,
        invoice_number: `INV-${count + 1}`,
      }));
    };

    fetchData();
  }, []);

  // Main invoice form state
  const [formData, setFormData] = useState({
    invoice_number: "",
    Retailer: "",
    invoice_date: getCurrentDateTimeLocal(),
    due_date: "",
    is_einvoice_generated: false,
    qr_code: false,
    irn: "",
    total_taxable_value: "",
    total_cgst: "",
    total_sgst: "",
    total_igst: "",
    grand_total: "",
    payment_mode: "cash",
    payment_status: "unpaid",
    items: [
      {
        Product: "",
        quantity: "",
        taxable_value: "",
        gst_rate: "",
        cgst: "",
        sgst: "",
        igst: "",
        hsn_code: "",
      },
    ],
  });

  // Handle invoice field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setFormData({ ...formData, [name]: e.target.checked });
    } else if (name === "Retailer") {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Define type for item keys
  type ItemKey =
    | "Product"
    | "quantity"
    | "taxable_value"
    | "gst_rate"
    | "cgst"
    | "sgst"
    | "igst"
    | "hsn_code";

  // Handle item field changes
  const handleItemChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const key = name as ItemKey;
    const newItems = [...formData.items];
    newItems[idx][key] = value;
    setFormData({ ...formData, items: newItems });
  };

  // Add/remove item rows
  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          Product: "",
          quantity: "",
          taxable_value: "",
          gst_rate: "",
          cgst: "",
          sgst: "",
          igst: "",
          hsn_code: "",
        },
      ],
    });
  };

  const removeItem = (idx: number) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    let token = getAuthToken();
    if (!token) {
      setNotification("Not authenticated");
      return;
    }
    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setNotification("No company selected");
      return;
    }

    // Calculate items with all values
    const items = formData.items.map((item) => {
      const prod = products.find(
        (p) => String(p.product_id) === String(item.Product)
      );
      const quantity = Number(item.quantity) || 0;
      const price = prod ? Number(prod.price) : 0;
      const taxable_value = price * quantity;
      const cgst_rate = prod ? Number(prod.cgst_rate) : 0;
      const sgst_rate = prod ? Number(prod.sgst_rate) : 0;
      const igst_rate = prod ? Number(prod.igst_rate) : 0;
      const cgst = (taxable_value * cgst_rate) / 100;
      const sgst = (taxable_value * sgst_rate) / 100;
      const igst = (taxable_value * igst_rate) / 100;
      const gst_rate = cgst_rate + sgst_rate + igst_rate;
      return {
        ...item,
        Product: item.Product ? Number(item.Product) : null,
        price,
        quantity,
        taxable_value,
        gst_rate,
        cgst,
        sgst,
        igst,
        hsn_code: prod?.hsn_code || "",
      };
    });

    // Calculate totals
    const total_taxable_value = items.reduce(
      (sum, i) => sum + i.taxable_value,
      0
    );
    const total_cgst = items.reduce((sum, i) => sum + i.cgst, 0);
    const total_sgst = items.reduce((sum, i) => sum + i.sgst, 0);
    const total_igst = items.reduce((sum, i) => sum + i.igst, 0);
    const grand_total =
      total_taxable_value + total_cgst + total_sgst + total_igst;

    // Prepare payload with calculated values
    const payload = {
      ...formData,
      company: Number(companyId),
      Retailer: formData.Retailer ? Number(formData.Retailer) : null,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      is_einvoice_generated: formData.is_einvoice_generated,
      qr_code: formData.qr_code ? "generate" : null,
      total_taxable_value,
      total_cgst,
      total_sgst,
      total_igst,
      grand_total,
      items,
    };

    try {
      const res = await fetchWithAuth(`${API_URL}/invoices/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setNotification("Bill created successfully");
        let token = getAuthToken();
        const companyId = localStorage.getItem("company_id");
        if (token && companyId) {
          // Fetch new count and update invoice number
          const invoiceData = await fetch(
            `${API_URL}/invoices/?company=${companyId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          let count = 0;
          if (invoiceData.ok) {
            const data = await invoiceData.json();
            count = data.count || 0;
          }
          setInvoiceCount(count);
          setFormData((prev) => ({
            ...prev,
            invoice_number: `INV-${count + 1}`,
          }));
        }
        setTimeout(() => {
          router.push("/manufacturer/accounting/vendorBills");
        }, 2000);
      } else {
        setNotification("Failed to create bill");
      }
    } catch {
      setNotification("Failed to create bill");
    }
  };

  // Bill preview helpers
  const previewCompanyObj = companyObj;
  const retailerObj = retailers.find(
    (r) => String(r.retailer_id) === String(formData.Retailer)
  );

  // Helper to get product details by id
  const getProductById = (id: string | number) =>
    products.find((p) => String(p.product_id) === String(id));

  // Calculate item values and totals
  const calculatedItems = formData.items.map((item) => {
    const prod = getProductById(item.Product);
    const quantity = Number(item.quantity) || 0;
    const price = prod ? Number(prod.price) : 0;
    const taxable_value = price * quantity;
    const cgst_rate = prod ? Number(prod.cgst_rate) : 0;
    const sgst_rate = prod ? Number(prod.sgst_rate) : 0;
    const igst_rate = prod ? Number(prod.igst_rate) : 0;
    const cgst = (taxable_value * cgst_rate) / 100;
    const sgst = (taxable_value * sgst_rate) / 100;
    const igst = (taxable_value * igst_rate) / 100;
    const gst_rate = cgst_rate + sgst_rate + igst_rate;
    return {
      ...item,
      name: prod?.name || "",
      hsn_code: prod?.hsn_code || "",
      price,
      taxable_value,
      cgst_rate,
      sgst_rate,
      igst_rate,
      cgst,
      sgst,
      igst,
      gst_rate,
    };
  });

  const total_taxable_value = calculatedItems.reduce(
    (sum, i) => sum + i.taxable_value,
    0
  );
  const total_cgst = calculatedItems.reduce((sum, i) => sum + i.cgst, 0);
  const total_sgst = calculatedItems.reduce((sum, i) => sum + i.sgst, 0);
  const total_igst = calculatedItems.reduce((sum, i) => sum + i.igst, 0);
  const grand_total =
    total_taxable_value + total_cgst + total_sgst + total_igst;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {notification && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{notification}</AlertDescription>
        </Alert>
      )}

      <Button
        variant="outline"
        onClick={() => router.push("/manufacturer/accounting")}
        className="mb-6"
      >
        <FileText className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <Card className="bg-[#1E293B] border-0">
          <CardHeader>
            <CardTitle className="text-xl text-blue-400">
              Create New Bill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="invoice_number" className="text-white">
                  Invoice Number
                </Label>
                <Input
                  id="invoice_number"
                  name="invoice_number"
                  className="bg-[#0F172A] border-blue-500 text-white"
                  value={formData.invoice_number || "Loading..."}
                  onChange={handleChange}
                  readOnly
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="Retailer" className="text-white">
                  Retailer
                </Label>
                <select
                  id="Retailer"
                  name="Retailer"
                  className="bg-[#0F172A] border-blue-500 text-white w-full px-3 py-2 rounded"
                  value={formData.Retailer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Retailer</option>
                  {retailers.map((r) => (
                    <option key={r.retailer_id} value={String(r.retailer_id)}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_date" className="text-white">
                  Invoice Date & Time
                </Label>
                <Input
                  id="invoice_date"
                  name="invoice_date"
                  type="datetime-local"
                  className="bg-[#0F172A] border-blue-500 text-white"
                  value={formData.invoice_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-white">
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  className="bg-[#0F172A] border-blue-500 text-white"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="is_einvoice_generated"
                    name="is_einvoice_generated"
                    type="checkbox"
                    checked={formData.is_einvoice_generated}
                    onChange={handleChange}
                  />
                  <Label htmlFor="is_einvoice_generated" className="text-white">
                    E-Invoice
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="qr_code"
                    name="qr_code"
                    type="checkbox"
                    checked={formData.qr_code}
                    onChange={handleChange}
                  />
                  <Label htmlFor="qr_code" className="text-white">
                    Generate QR Code
                  </Label>
                </div>
              </div>

              {formData.is_einvoice_generated && (
                <div className="space-y-2">
                  <Label htmlFor="irn" className="text-white">
                    IRN
                  </Label>
                  <Input
                    id="irn"
                    name="irn"
                    className="bg-[#0F172A] border-blue-500 text-white"
                    value={formData.irn}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Items */}
              <div>
                <Label className="text-white mb-2 block">Items</Label>
                <table className="w-full text-sm text-white mb-2 border border-blue-800 rounded">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="p-2">Product</th>
                      <th className="p-2">HSN</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Taxable Value</th>
                      <th className="p-2">GST %</th>
                      <th className="p-2">CGST</th>
                      <th className="p-2">SGST</th>
                      <th className="p-2">IGST</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => {
                      const calc = calculatedItems[idx];
                      return (
                        <tr
                          key={idx}
                          className="bg-[#0F172A] border-b border-blue-800"
                        >
                          <td className="p-2">
                            <select
                              name="Product"
                              value={item.Product}
                              onChange={(e) => handleItemChange(idx, e)}
                              className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                              required
                            >
                              <option value="">Select Product</option>
                              {products.map((p) => (
                                <option key={p.product_id} value={p.product_id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">{calc.hsn_code}</td>
                          <td className="p-2">{calc.price}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              name="quantity"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, e)}
                              className="w-16 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
                              required
                            />
                          </td>
                          <td className="p-2">
                            {calc.taxable_value.toFixed(2)}
                          </td>
                          <td className="p-2">{calc.gst_rate}</td>
                          <td className="p-2">{calc.cgst.toFixed(2)}</td>
                          <td className="p-2">{calc.sgst.toFixed(2)}</td>
                          <td className="p-2">{calc.igst.toFixed(2)}</td>
                          <td className="p-2">
                            {formData.items.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                className="text-xs px-2 py-1"
                                onClick={() => removeItem(idx)}
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Button
                  type="button"
                  className="mt-2 bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={addItem}
                >
                  + Add Item
                </Button>
              </div>

              {/* Totals and payment section */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-white">Total Taxable Value</Label>
                  <Input
                    value={total_taxable_value.toFixed(2)}
                    readOnly
                    className="bg-[#0F172A] border-blue-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Grand Total</Label>
                  <Input
                    value={grand_total.toFixed(2)}
                    readOnly
                    className="bg-[#0F172A] border-blue-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Total CGST</Label>
                  <Input
                    value={total_cgst.toFixed(2)}
                    readOnly
                    className="bg-[#0F172A] border-blue-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Total SGST</Label>
                  <Input
                    value={total_sgst.toFixed(2)}
                    readOnly
                    className="bg-[#0F172A] border-blue-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Total IGST</Label>
                  <Input
                    value={total_igst.toFixed(2)}
                    readOnly
                    className="bg-[#0F172A] border-blue-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="payment_mode" className="text-white">
                    Payment Mode
                  </Label>
                  <select
                    id="payment_mode"
                    name="payment_mode"
                    className="bg-[#0F172A] border-blue-500 text-white w-full px-3 py-2 rounded"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    required
                  >
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="payment_status" className="text-white">
                    Payment Status
                  </Label>
                  <select
                    id="payment_status"
                    name="payment_status"
                    className="bg-[#0F172A] border-blue-500 text-white w-full px-3 py-2 rounded"
                    value={formData.payment_status}
                    onChange={handleChange}
                    required
                  >
                    {PAYMENT_STATUSES.map((ps) => (
                      <option key={ps.value} value={ps.value}>
                        {ps.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Bill
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bill Preview */}
        <Card className="bg-[#1E293B] border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-400">
              Invoice Bill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-[#0F172A] rounded-lg text-white space-y-6">
              {/* Company and Invoice Heading */}
              <div className="flex justify-between mb-6">
                <div>
                  <div className="text-xl font-bold">
                    {previewCompanyObj?.name || "Company Name"}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.address || "Company Address"}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.city && (
                      <>City: {previewCompanyObj.city}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.state && (
                      <>State: {previewCompanyObj.state}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.country && (
                      <>Country: {previewCompanyObj.country}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.pincode && (
                      <>Pincode: {previewCompanyObj.pincode}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.gstin && (
                      <>GSTIN: {previewCompanyObj.gstin}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.email && (
                      <>Email: {previewCompanyObj.email}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {previewCompanyObj?.phone && (
                      <>Phone: {previewCompanyObj.phone}</>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    INVOICE
                  </div>
                </div>
              </div>

              {/* Retailer and Invoice Details Side by Side */}
              <div className="flex justify-between mb-4 gap-8">
                <div>
                  <div className="font-semibold">Billed To:</div>
                  <div>{retailerObj?.name || "Retailer Name"}</div>
                  <div className="text-sm">{retailerObj?.address_line1}</div>
                  <div className="text-sm">{retailerObj?.address_line2}</div>
                  <div className="text-sm">
                    {retailerObj?.city && <>City: {retailerObj.city}</>}
                  </div>
                  <div className="text-sm">
                    {retailerObj?.pincode && (
                      <>Pincode: {retailerObj.pincode}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {retailerObj?.state && <>State: {retailerObj.state}</>}
                  </div>
                  <div className="text-sm">
                    {retailerObj?.country && (
                      <>Country: {retailerObj.country}</>
                    )}
                  </div>
                  <div className="text-sm">
                    {retailerObj?.gstin && <>GSTIN: {retailerObj.gstin}</>}
                  </div>
                  <div className="text-sm">
                    {retailerObj?.email && <>Email: {retailerObj.email}</>}
                  </div>
                  <div className="text-sm">
                    {retailerObj?.contact && (
                      <>Contact: {retailerObj.contact}</>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-right self-start">
                  <div>
                    <span className="font-semibold">Invoice No:</span>{" "}
                    {formData.invoice_number}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span>{" "}
                    {formData.invoice_date
                      ? new Date(formData.invoice_date).toLocaleString()
                      : "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold">Due Date:</span>{" "}
                    {formData.due_date || "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Mode:</span>{" "}
                    {
                      PAYMENT_MODES.find(
                        (pm) => pm.value === formData.payment_mode
                      )?.label
                    }
                  </div>
                  <div>
                    <span className="font-semibold">Payment Status:</span>{" "}
                    {
                      PAYMENT_STATUSES.find(
                        (ps) => ps.value === formData.payment_status
                      )?.label
                    }
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <table className="w-full text-sm text-white mb-2 border border-blue-800 rounded">
                <thead>
                  <tr className="bg-blue-900">
                    <th className="p-2">#</th>
                    <th className="p-2">Product</th>
                    <th className="p-2">HSN</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Rate</th>
                    <th className="p-2">Taxable</th>
                    <th className="p-2">GST %</th>
                    <th className="p-2">CGST</th>
                    <th className="p-2">SGST</th>
                    <th className="p-2">IGST</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="bg-[#0F172A] border-b border-blue-800"
                    >
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.hsn_code}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{item.price.toFixed(2)}</td>
                      <td className="p-2">{item.taxable_value.toFixed(2)}</td>
                      <td className="p-2">{item.gst_rate}</td>
                      <td className="p-2">{item.cgst.toFixed(2)}</td>
                      <td className="p-2">{item.sgst.toFixed(2)}</td>
                      <td className="p-2">{item.igst.toFixed(2)}</td>
                      <td className="p-2">
                        {(
                          item.taxable_value +
                          item.cgst +
                          item.sgst +
                          item.igst
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals - Aligned Left */}
              <div className="flex flex-col gap-2 mt-4 max-w-md w-full">
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">
                    Total Taxable Value:
                  </span>
                  <span className="text-right">
                    {total_taxable_value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total CGST:</span>
                  <span className="text-right">{total_cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total SGST:</span>
                  <span className="text-right">{total_sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total IGST:</span>
                  <span className="text-right">{total_igst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full text-lg font-bold mt-2 border-t border-blue-800 pt-2">
                  <span className="text-left">Grand Total:</span>
                  <span className="text-right">{grand_total.toFixed(2)}</span>
                </div>
              </div>

              {/* Note and Signature */}
              <div className="flex justify-between items-end mt-8">
                <div>
                  <div className="font-semibold">Note:</div>
                  <div className="text-sm text-gray-300">
                    Thank you for your business!
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Authorized Signature</div>
                  <div className="w-40 h-12 border-b border-gray-400 mx-0"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
