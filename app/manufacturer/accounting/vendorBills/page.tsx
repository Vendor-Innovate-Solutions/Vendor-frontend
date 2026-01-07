"use client"

import React, { useState, useEffect, useRef } from "react"
import { fetchWithAuth, API_URL } from "@/utils/auth_fn"
import { authStorage } from "@/utils/localStorage"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { useReactToPrint } from "react-to-print"
// Dynamic import for html2pdf to avoid SSR issues
let html2pdf: any;
// Fallback Button Component using div to avoid button conflicts
type FallbackButtonProps = {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void | Promise<void>
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  disabled?: boolean
}

const FallbackButton: React.FC<FallbackButtonProps> = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  disabled = false
}) => {
  const handleClick = async (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClick && !disabled) {
      try {
        const result = onClick(e)
        if (
          result !== null &&
          result !== undefined &&
          typeof result === "object" && result !== null && "then" in result && typeof (result as Promise<unknown>).then === "function"
        ) {
          await result
        }
      } catch (error) {
        console.error('Button onClick error:', error)
      }
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      await handleClick(e)
    }
  }

  let buttonClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 select-none"

  if (disabled) {
    buttonClasses += " opacity-50 cursor-not-allowed"
  } else {
    buttonClasses += " cursor-pointer"
  }

  // Variant classes
  if (variant === "outline") {
    buttonClasses += " border border-gray-300 bg-transparent text-black hover:bg-gray-100 hover:text-black"
  } else if (variant === "ghost") {
    buttonClasses += " bg-transparent text-black hover:bg-gray-100 hover:text-black"
  } else {
    buttonClasses += " bg-black text-white hover:bg-gray-800"
  }

  // Size classes
  if (size === "sm") {
    buttonClasses += " h-9 px-3 py-1.5"
  } else if (size === "lg") {
    buttonClasses += " h-11 px-8 py-2.5"
  } else {
    buttonClasses += " h-10 px-4 py-2"
  }

  if (className) {
    buttonClasses += " " + className
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={buttonClasses}
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}

type BillItem = {
  name?: string
  Product_name?: string
  hsn_code?: string
  quantity?: number
  price?: number
  taxable_value?: number
  gst_rate?: number
  cgst?: number
  sgst?: number
  igst?: number
}

type Retailer = {
  name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  pincode?: string
  state?: string
  country?: string
  gstin?: string
  email?: string
  contact?: string
}

type Company = {
  name?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  gstin?: string
  email?: string
  phone?: string
}

type Bill = {
  invoice_number?: string
  Retailer?: Retailer | string
  retailer_name?: string
  company?: Company
  invoice_date?: string
  payment_mode?: string
  payment_status?: string
  items?: BillItem[]
  total_taxable_value?: number
  total_cgst?: number
  total_sgst?: number
  total_igst?: number
  grand_total?: number
}

export default function VendorBills() {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showModal, setShowModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const token = authStorage.getAccessToken()
        const companyId = authStorage.getCompanyId()
        if (!token || !companyId) {
          console.warn("Missing token or company ID")
          return
        }

        const res = await fetchWithAuth(`${API_URL}/invoices/?company=${companyId}`)
        if (res.ok) {
          const data = await res.json()
          setBills(Array.isArray(data) ? data : data.results || [])
        } else {
          console.error("Failed to fetch bills: HTTP error", res.status)
        }
      } catch (error) {
        console.error("Failed to fetch bills:", error)
      }
    }
    fetchBills()
  }, [])

  // Updated print handler using contentRef (new API)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedBill ? `Invoice-${selectedBill.invoice_number}` : "Invoice",
    onBeforePrint: () => {
      console.log("Preparing to print...")
      if (printRef.current) {
        const style = document.createElement("style")
        style.setAttribute("id", "bw-print-style")
        style.innerHTML = `
          @media print {
            body, .print-bw, .print-bw * {
              background: #fff !important;
              color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-shadow: none !important;
            }
            table, tr, td, th {
              border: 1px solid #000 !important;
              color: #000 !important;
              background: #fff !important;
            }
            th {
              background: #eee !important;
              color: #000 !important;
            }
          }
        `
        document.head.appendChild(style)
      }
      return Promise.resolve()
    },
    onAfterPrint: () => {
      console.log("Print completed")
      const style = document.getElementById("bw-print-style")
      if (style) {
        document.head.removeChild(style)
      }
    },
  })

  // Black & White download handler
  const handleDownload = React.useCallback(async () => {
  if (!selectedBill || !printRef.current) {
    console.error("Cannot download: missing bill or ref");
    return;
  }

  // Dynamic import to avoid SSR issues
  if (!html2pdf) {
    try {
      const html2pdfModule = await import('html2pdf.js');
      html2pdf = html2pdfModule.default;
    } catch (error) {
      console.error("Failed to load html2pdf:", error);
      return;
    }
  }

  // Optional: Add a class for print styling
  printRef.current.classList.add("print-bw");

  // PDF options for better alignment and look
  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right in inches
    filename:     `Invoice-${selectedBill.invoice_number}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf()
    .set(opt)
    .from(printRef.current)
    .save()
    .then(() => {
      if (printRef.current) printRef.current.classList.remove("print-bw");
      console.log("PDF download completed");
    })
    .catch((error: any) => {
      if (printRef.current) printRef.current.classList.remove("print-bw");
      console.error("PDF download failed:", error);
    });
}, [selectedBill]);

  const openBill = (bill: Bill) => {
    setSelectedBill(bill)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedBill(null)
  }

  const handlePrintAction = (bill: Bill) => {
    setSelectedBill(bill)
    setShowModal(true)
    // Wait for modal to render before printing
    setTimeout(() => {
      if (printRef.current) {
        handlePrint()
      } else {
        console.error("Print ref not available")
      }
    }, 500)
  }

  const handleDownloadAction = (bill: Bill) => {
    setSelectedBill(bill)
    setShowModal(true)
    // Wait for modal to render before downloading
    setTimeout(() => {
      handleDownload()
    }, 500)
  }

  const handleNavigateBack = () => {
    try {
      router.push("/manufacturer/accounting")
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  const handleNavigateNewBill = () => {
    try {
      router.push("/manufacturer/accounting/createBill")
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FallbackButton
        variant="outline"
        onClick={handleNavigateBack}
        className="mb-6 text-white"
      >
        <FileText className="mr-2 h-4 w-4" />
        Back
      </FallbackButton>
      <Card className="bg-[#0F172A] border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-white">Vendor Bills</CardTitle>
          <FallbackButton
            variant="default"
            onClick={handleNavigateNewBill}
          >
            New Bill
          </FallbackButton>
        </CardHeader>
        <CardContent>
          {bills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white text-sm">
                    <th className="text-left p-2">Invoice No</th>
                    <th className="text-left p-2">Retailer</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.invoice_number} className="text-white border-t border-white/20">
                      <td className="p-2">{bill.invoice_number}</td>
                      <td className="p-2">
                        {typeof bill.Retailer === "object"
                          ? bill.Retailer?.name
                          : bill.retailer_name || bill.Retailer}
                      </td>
                      <td className="p-2 text-right">{bill.grand_total}</td>
                      <td className="p-2">{bill.invoice_date ? new Date(bill.invoice_date).toLocaleDateString() : ""}</td>
                      <td className="p-2">{bill.payment_status}</td>
                      <td className="p-2 text-right space-x-2">
                        <FallbackButton variant="outline" size="sm" onClick={() => openBill(bill)} className="text-white">
                          View
                        </FallbackButton>
                        <FallbackButton variant="outline" size="sm" onClick={() => handlePrintAction(bill)} className="text-white">
                          Print
                        </FallbackButton>
                        <FallbackButton variant="outline" size="sm" onClick={() => handleDownloadAction(bill)} className="text-white">
                          Download
                        </FallbackButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-white p-8">No bills found. Click &quot;New Bill&quot; to create one.</div>
          )}
        </CardContent>
      </Card>
      {/* Bill Preview Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>
            <div ref={printRef} className="text-black p-6 space-y-6 print-bw">
              {/* Company and Invoice Heading */}
              <div className="flex justify-between mb-6">
                <div>
                  <div className="text-xl font-bold">{selectedBill.company?.name || "Company Name"}</div>
                  <div className="text-sm">{selectedBill.company?.address || "Company Address"}</div>
                  {selectedBill.company?.city && <div className="text-sm">City: {selectedBill.company.city}</div>}
                  {selectedBill.company?.state && <div className="text-sm">State: {selectedBill.company.state}</div>}
                  {selectedBill.company?.country && <div className="text-sm">Country: {selectedBill.company.country}</div>}
                  {selectedBill.company?.pincode && <div className="text-sm">Pincode: {selectedBill.company.pincode}</div>}
                  {selectedBill.company?.gstin && <div className="text-sm">GSTIN: {selectedBill.company.gstin}</div>}
                  {selectedBill.company?.email && <div className="text-sm">Email: {selectedBill.company.email}</div>}
                  {selectedBill.company?.phone && <div className="text-sm">Phone: {selectedBill.company.phone}</div>}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-3xl font-bold text-black mb-2">INVOICE</div>
                </div>
              </div>

              {/* Retailer and Invoice Details Side by Side */}
              <div className="flex justify-between mb-4 gap-8">
                <div>
                  <div className="font-semibold">Billed To:</div>
                  <div>
                    {typeof selectedBill.Retailer === "object"
                      ? selectedBill.Retailer?.name
                      : selectedBill.Retailer || "Retailer Name"}
                  </div>
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.address_line1 && (
                    <div className="text-sm">{selectedBill.Retailer.address_line1}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.address_line2 && (
                    <div className="text-sm">{selectedBill.Retailer.address_line2}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.city && (
                    <div className="text-sm">City: {selectedBill.Retailer.city}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.pincode && (
                    <div className="text-sm">Pincode: {selectedBill.Retailer.pincode}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.state && (
                    <div className="text-sm">State: {selectedBill.Retailer.state}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.country && (
                    <div className="text-sm">Country: {selectedBill.Retailer.country}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.gstin && (
                    <div className="text-sm">GSTIN: {selectedBill.Retailer.gstin}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.email && (
                    <div className="text-sm">Email: {selectedBill.Retailer.email}</div>
                  )}
                  {typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.contact && (
                    <div className="text-sm">Contact: {selectedBill.Retailer.contact}</div>
                  )}
                </div>
                <div className="space-y-1 text-right self-start">
                  <div>
                    <span className="font-semibold">Invoice No:</span> {selectedBill.invoice_number}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span>{" "}
                    {selectedBill.invoice_date ? new Date(selectedBill.invoice_date).toLocaleString() : "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Mode:</span> {selectedBill.payment_mode}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Status:</span> {selectedBill.payment_status}
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <table className="w-full text-sm text-black mb-2 border border-black rounded">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border border-black">#</th>
                    <th className="p-2 border border-black">Product</th>
                    <th className="p-2 border border-black">HSN</th>
                    <th className="p-2 border border-black">Qty</th>
                    <th className="p-2 border border-black">Rate</th>
                    <th className="p-2 border border-black">Taxable</th>
                    <th className="p-2 border border-black">GST %</th>
                    <th className="p-2 border border-black">CGST</th>
                    <th className="p-2 border border-black">SGST</th>
                    <th className="p-2 border border-black">IGST</th>
                    <th className="p-2 border border-black">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item: BillItem, idx: number) => (
                    <tr key={idx} className="bg-white border-b border-black">
                      <td className="p-2 border border-black">{idx + 1}</td>
                      <td className="p-2 border border-black">{item.name || item.Product_name || ""}</td>
                      <td className="p-2 border border-black">{item.hsn_code}</td>
                      <td className="p-2 border border-black">{item.quantity}</td>
                      <td className="p-2 border border-black">{item.price?.toFixed ? item.price.toFixed(2) : item.price}</td>
                      <td className="p-2 border border-black">
                        {item.taxable_value?.toFixed ? item.taxable_value.toFixed(2) : item.taxable_value}
                      </td>
                      <td className="p-2 border border-black">{item.gst_rate}</td>
                      <td className="p-2 border border-black">{item.cgst?.toFixed ? item.cgst.toFixed(2) : item.cgst}</td>
                      <td className="p-2 border border-black">{item.sgst?.toFixed ? item.sgst.toFixed(2) : item.sgst}</td>
                      <td className="p-2 border border-black">{item.igst?.toFixed ? item.igst.toFixed(2) : item.igst}</td>
                      <td className="p-2 border border-black">
                        {item.taxable_value && item.cgst && item.sgst && item.igst
                          ? (
                            Number(item.taxable_value) +
                            Number(item.cgst) +
                            Number(item.sgst) +
                            Number(item.igst)
                          ).toFixed(2)
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals - Aligned Left */}
              <div className="flex flex-col gap-2 mt-4 max-w-md w-full">
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total Taxable Value:</span>
                  <span className="text-right">
                    {selectedBill.total_taxable_value?.toFixed
                      ? selectedBill.total_taxable_value.toFixed(2)
                      : selectedBill.total_taxable_value}
                  </span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total CGST:</span>
                  <span className="text-right">
                    {selectedBill.total_cgst?.toFixed ? selectedBill.total_cgst.toFixed(2) : selectedBill.total_cgst}
                  </span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total SGST:</span>
                  <span className="text-right">
                    {selectedBill.total_sgst?.toFixed ? selectedBill.total_sgst.toFixed(2) : selectedBill.total_sgst}
                  </span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-left">Total IGST:</span>
                  <span className="text-right">
                    {selectedBill.total_igst?.toFixed ? selectedBill.total_igst.toFixed(2) : selectedBill.total_igst}
                  </span>
                </div>
                <div className="flex justify-between w-full text-lg font-bold mt-2 border-t border-black pt-2">
                  <span className="text-left">Grand Total:</span>
                  <span className="text-right">
                    {selectedBill.grand_total?.toFixed ? selectedBill.grand_total.toFixed(2) : selectedBill.grand_total}
                  </span>
                </div>
              </div>

              {/* Note and Signature */}
              <div className="flex justify-between items-end mt-8">
                <div>
                  <div className="font-semibold">Note:</div>
                  <div className="text-sm text-gray-700">Thank you for your business!</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Authorized Signature</div>
                  <div className="w-40 h-12 border-b border-gray-700 mx-0"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <FallbackButton variant="default" onClick={handlePrint}>
                Print
              </FallbackButton>
              <FallbackButton variant="default" onClick={handleDownload}>
                Download
              </FallbackButton>
              <FallbackButton variant="outline" onClick={closeModal}>
                Close
              </FallbackButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}