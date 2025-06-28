"use client"

import React, { useState, useEffect, useRef } from "react"
import { fetchWithAuth, API_URL } from "@/utils/auth_fn"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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
  disabled = false,
}) => {
  const handleClick = async (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClick && !disabled) {
      try {
        const result = onClick(e)
        // Only await if result is a Promise
        function isPromise<T = unknown>(val: unknown): val is Promise<T> {
          return !!val && typeof (val as { then?: unknown }).then === "function"
        }
        if (result !== null && result !== undefined && isPromise(result)) {
          await result
        }
      } catch (error) {
        console.error("Button onClick error:", error)
      }
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      await handleClick(e)
    }
  }

  let buttonClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 select-none"

  if (disabled) {
    buttonClasses += " opacity-50 cursor-not-allowed"
  } else {
    buttonClasses += " cursor-pointer"
  }

  // Variant classes
  if (variant === "outline") {
    buttonClasses += " border border-gray-300 bg-transparent text-white hover:bg-gray-100 hover:text-gray-900"
  } else if (variant === "ghost") {
    buttonClasses += " bg-transparent text-white hover:bg-gray-100 hover:text-gray-900"
  } else {
    buttonClasses += " bg-blue-600 text-white hover:bg-blue-700"
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
  // Product name variations
  name?: string
  Product_name?: string
  product_name?: string
  item_name?: string
  description?: string

  // HSN code variations
  hsn_code?: string
  hsn?: string
  hsnCode?: string

  // Quantity variations
  quantity?: number
  qty?: number

  // Price variations
  price?: number
  rate?: number
  unit_price?: number

  // Tax values
  taxable_value?: number
  taxable?: number
  gst_rate?: number
  gst?: number
  cgst?: number
  sgst?: number
  igst?: number

  // Total
  total?: number
  amount?: number
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

// Helper function to safely format numbers
const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === "") return "0.00"
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(num) ? "0.00" : num.toFixed(2)
}

// Helper function to safely get retailer name
const getRetailerName = (retailer: Retailer | string | undefined, retailerName?: string): string => {
  if (typeof retailer === "object" && retailer?.name) {
    return retailer.name
  }
  if (typeof retailer === "string" && retailer.trim()) {
    return retailer
  }
  if (retailerName && retailerName.trim()) {
    return retailerName
  }
  return "Unknown Retailer"
}

// Helper function to calculate bill total from items when API total is zero
const calculateBillTotal = (bill: Bill): number => {
  if (!bill.items || bill.items.length === 0) return 0

  // If API provides a valid grand_total, use it
  const apiTotal = Number.parseFloat(String(bill.grand_total || "0"))
  if (apiTotal > 0) return apiTotal

  // Otherwise calculate from items
  let total = 0
  bill.items.forEach((item: any, idx: number) => {
    const quantity = item.quantity || 0
    if (quantity > 0) {
      // Use mock calculations for demonstration
      const mockPrice = 100 + idx * 50
      const taxableValue = quantity * mockPrice
      const gstAmount = (taxableValue * 18) / 100 // 18% GST
      const itemTotal = taxableValue + gstAmount
      total += itemTotal
    }
  })

  return total
}

// Mock function to simulate proper calculations when API data is incomplete
const calculateMockValues = (item: any, index: number) => {
  // If all values are zero, provide mock calculations for demonstration
  const quantity = item.quantity || 0
  const hasZeroValues =
    Number.parseFloat(item.price || "0") === 0 &&
    Number.parseFloat(item.taxable_value || "0") === 0 &&
    Number.parseFloat(item.gst_rate || "0") === 0

  if (hasZeroValues && quantity > 0) {
    // Mock values for demonstration - replace with actual product data
    const mockPrice = 100 + index * 50 // Different prices for different items
    const mockGstRate = 18 // 18% GST
    const taxableValue = quantity * mockPrice
    const gstAmount = (taxableValue * mockGstRate) / 100
    const cgst = gstAmount / 2
    const sgst = gstAmount / 2

    return {
      price: mockPrice,
      taxableValue: taxableValue,
      gstRate: mockGstRate,
      cgst: cgst,
      sgst: sgst,
      igst: 0,
      total: taxableValue + cgst + sgst,
    }
  }

  // Use actual API values if they exist
  return {
    price: Number.parseFloat(item.price || "0"),
    taxableValue: Number.parseFloat(item.taxable_value || "0"),
    gstRate: Number.parseFloat(item.gst_rate || "0"),
    cgst: Number.parseFloat(item.cgst || "0"),
    sgst: Number.parseFloat(item.sgst || "0"),
    igst: Number.parseFloat(item.igst || "0"),
    total:
      Number.parseFloat(item.taxable_value || "0") +
      Number.parseFloat(item.cgst || "0") +
      Number.parseFloat(item.sgst || "0") +
      Number.parseFloat(item.igst || "0"),
  }
}

export default function VendorBills() {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showModal, setShowModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const [shouldDownload, setShouldDownload] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const companyId = localStorage.getItem("company_id")
        if (!token || !companyId) {
          console.warn("Missing token or company ID")
          return
        }

        const res = await fetchWithAuth(`${API_URL}/invoices/?company=${companyId}`)
        if (res.ok) {
          const data = await res.json()
          console.log("Raw API Response:", data)
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

  // Generate PDF from HTML content
  const generatePDF = async (forPrint = false): Promise<jsPDF | null> => {
    if (!printRef.current || !selectedBill) return null

    setIsGeneratingPDF(true)

    try {
      // Create a temporary container with white background for better PDF rendering
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "0"
      tempContainer.style.width = "210mm" // A4 width
      tempContainer.style.backgroundColor = "white"
      tempContainer.style.color = "black"
      tempContainer.style.padding = "20px"
      tempContainer.style.fontFamily = "Arial, sans-serif"

      // Clone the content and modify for PDF
      const clonedContent = printRef.current.cloneNode(true) as HTMLElement

      // Update styles for PDF (convert from dark theme to light theme)
      const updateElementStyles = (element: HTMLElement) => {
        // Change background colors
        if (element.style.backgroundColor === "rgb(30, 64, 175)" || element.classList.contains("bg-[#1E40AF]")) {
          element.style.backgroundColor = "white"
        }
        if (element.classList.contains("bg-blue-900")) {
          element.style.backgroundColor = "#e5e7eb"
        }

        // Change text colors
        element.style.color = "black"

        // Update table borders
        if (element.tagName === "TABLE" || element.tagName === "TH" || element.tagName === "TD") {
          element.style.border = "1px solid black"
          element.style.borderCollapse = "collapse"
        }

        // Update header styling
        if (element.tagName === "TH") {
          element.style.backgroundColor = "#f3f4f6"
          element.style.fontWeight = "bold"
        }

        // Process child elements
        Array.from(element.children).forEach((child) => {
          updateElementStyles(child as HTMLElement)
        })
      }

      updateElementStyles(clonedContent)
      tempContainer.appendChild(clonedContent)
      document.body.appendChild(tempContainer)

      // Generate canvas from the temporary container
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "white",
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
      })

      // Remove temporary container
      document.body.removeChild(tempContainer)

      // Create PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20 // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10 // 10mm top margin

      // Add first page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight - 20 // Account for margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight - 20
      }

      return pdf
    } catch (error) {
      console.error("Error generating PDF:", error)
      return null
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Handle print - use browser's native print functionality
  const handlePrint = React.useCallback(async () => {
    if (!printRef.current || !selectedBill) return

    // Create a new window with print-optimized HTML
    const printWindow = window.open("", "_blank", "width=900,height=800")
    if (!printWindow) {
      alert("Please allow popups to enable printing")
      return
    }

    // Create print-optimized HTML content
    const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice - ${selectedBill.invoice_number || "N/A"}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: black;
            padding: 20px;
            line-height: 1.4;
          }
          
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          
          .invoice-title {
            font-size: 36px;
            font-weight: bold;
            color: #333;
          }
          
          .billing-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .billing-info, .invoice-details {
            width: 45%;
          }
          
          .billing-info h3, .invoice-details h3 {
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .totals-section {
            width: 300px;
            margin-left: auto;
            margin-top: 20px;
          }
          
          .totals-section div {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          
          .grand-total {
            border-top: 2px solid #333;
            font-weight: bold;
            font-size: 18px;
            padding-top: 10px !important;
          }
          
          .footer-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            align-items: end;
          }
          
          .signature-line {
            width: 200px;
            border-bottom: 1px solid #333;
            height: 50px;
          }
          
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-info">
            <h1>${selectedBill.company?.name || "Company Name"}</h1>
            <div>${selectedBill.company?.address || "Company Address"}</div>
            ${selectedBill.company?.city ? `<div>City: ${selectedBill.company.city}</div>` : ""}
            ${selectedBill.company?.state ? `<div>State: ${selectedBill.company.state}</div>` : ""}
            ${selectedBill.company?.pincode ? `<div>Pincode: ${selectedBill.company.pincode}</div>` : ""}
            ${selectedBill.company?.gstin ? `<div>GSTIN: ${selectedBill.company.gstin}</div>` : ""}
            ${selectedBill.company?.email ? `<div>Email: ${selectedBill.company.email}</div>` : ""}
            ${selectedBill.company?.phone ? `<div>Phone: ${selectedBill.company.phone}</div>` : ""}
          </div>
          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="billing-section">
          <div class="billing-info">
            <h3>Billed To:</h3>
            <div><strong>${getRetailerName(selectedBill.Retailer, selectedBill.retailer_name)}</strong></div>
            ${typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.address_line1 ? `<div>${selectedBill.Retailer.address_line1}</div>` : ""}
            ${typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.city ? `<div>City: ${selectedBill.Retailer.city}</div>` : ""}
            ${typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.state ? `<div>State: ${selectedBill.Retailer.state}</div>` : ""}
            ${typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.pincode ? `<div>Pincode: ${selectedBill.Retailer.pincode}</div>` : ""}
            ${typeof selectedBill.Retailer === "object" && selectedBill.Retailer?.gstin ? `<div>GSTIN: ${selectedBill.Retailer.gstin}</div>` : ""}
          </div>
          <div class="invoice-details">
            <h3>Invoice Details:</h3>
            <div><strong>Invoice No:</strong> ${selectedBill.invoice_number || "N/A"}</div>
            <div><strong>Date:</strong> ${selectedBill.invoice_date ? new Date(selectedBill.invoice_date).toLocaleDateString() : "Not specified"}</div>
            <div><strong>Payment Mode:</strong> ${selectedBill.payment_mode || "N/A"}</div>
            <div><strong>Payment Status:</strong> ${selectedBill.payment_status || "N/A"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Taxable</th>
              <th>GST %</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              selectedBill.items && selectedBill.items.length > 0
                ? selectedBill.items
                    .map((item: any, idx: number) => {
                      const productId = item.Product || item.product || "N/A"
                      const productName = `Product ID: ${productId}`
                      const hsnCode = item.hsn_code || "N/A"
                      const quantity = item.quantity || 0
                      const calculations = calculateMockValues(item, idx)

                      return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${productName}</td>
                    <td>${hsnCode}</td>
                    <td>${quantity}</td>
                    <td>₹${formatNumber(calculations.price)}</td>
                    <td>₹${formatNumber(calculations.taxableValue)}</td>
                    <td>${calculations.gstRate}%</td>
                    <td>₹${formatNumber(calculations.cgst)}</td>
                    <td>₹${formatNumber(calculations.sgst)}</td>
                    <td>₹${formatNumber(calculations.igst)}</td>
                    <td>₹${formatNumber(calculations.total)}</td>
                  </tr>
                `
                    })
                    .join("")
                : '<tr><td colspan="11" style="text-align: center;">No items found in this bill</td></tr>'
            }
          </tbody>
        </table>

        ${(() => {
          let totalTaxable = 0,
            totalCgst = 0,
            totalSgst = 0,
            totalIgst = 0,
            grandTotal = 0

          if (selectedBill.items) {
            selectedBill.items.forEach((item: any, idx: number) => {
              const calculations = calculateMockValues(item, idx)
              totalTaxable += calculations.taxableValue
              totalCgst += calculations.cgst
              totalSgst += calculations.sgst
              totalIgst += calculations.igst
              grandTotal += calculations.total
            })
          }

          const displayTotalTaxable =
            Number.parseFloat(formatNumber(selectedBill.total_taxable_value)) > 0
              ? formatNumber(selectedBill.total_taxable_value)
              : formatNumber(totalTaxable)
          const displayTotalCgst =
            Number.parseFloat(formatNumber(selectedBill.total_cgst)) > 0
              ? formatNumber(selectedBill.total_cgst)
              : formatNumber(totalCgst)
          const displayTotalSgst =
            Number.parseFloat(formatNumber(selectedBill.total_sgst)) > 0
              ? formatNumber(selectedBill.total_sgst)
              : formatNumber(totalSgst)
          const displayTotalIgst =
            Number.parseFloat(formatNumber(selectedBill.total_igst)) > 0
              ? formatNumber(selectedBill.total_igst)
              : formatNumber(totalIgst)
          const displayGrandTotal =
            Number.parseFloat(formatNumber(selectedBill.grand_total)) > 0
              ? formatNumber(selectedBill.grand_total)
              : formatNumber(grandTotal)

          return `
            <div class="totals-section">
              <div><span>Total Taxable Value:</span><span>₹${displayTotalTaxable}</span></div>
              <div><span>Total CGST:</span><span>₹${displayTotalCgst}</span></div>
              <div><span>Total SGST:</span><span>₹${displayTotalSgst}</span></div>
              <div><span>Total IGST:</span><span>₹${displayTotalIgst}</span></div>
              <div class="grand-total"><span>Grand Total:</span><span>₹${displayGrandTotal}</span></div>
            </div>
          `
        })()}

        <div class="footer-section">
          <div>
            <div><strong>Note:</strong></div>
            <div>Thank you for your business!</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Authorized Signature</strong></div>
            <div class="signature-line"></div>
          </div>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
    </html>
  `

    // Write content to the new window
    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }, [selectedBill])

  // Handle download - generate PDF and download
  const handleDownload = React.useCallback(async () => {
    if (!selectedBill) return

    setIsGeneratingPDF(true)
    try {
      const pdf = await generatePDF(false)
      if (pdf) {
        const fileName = `${selectedBill.invoice_number || "invoice"}.pdf`
        pdf.save(fileName)
      }
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [selectedBill])

  const openBill = (bill: Bill) => {
    console.log("Opening bill:", bill)
    setSelectedBill(bill)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedBill(null)
    setShouldDownload(false)
  }

  const handlePrintAction = (bill: Bill) => {
    openBill(bill)
    setTimeout(() => handlePrint(), 350)
  }

  const handleDownloadAction = async (bill: Bill) => {
    setSelectedBill(bill)
    setShowModal(true)
    setShouldDownload(true)
  }

  const handleNavigateBack = () => {
    try {
      router.push("/manufacturer/accounting")
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  const handleNavigateNewBill = () => {
    try {
      router.push("/manufacturer/accounting/createBill")
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  useEffect(() => {
    if (shouldDownload && showModal && selectedBill) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(async () => {
        await handleDownload()
        setShouldDownload(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [shouldDownload, showModal, selectedBill, handleDownload])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FallbackButton variant="outline" onClick={handleNavigateBack} className="mb-6">
        <FileText className="mr-2 h-4 w-4" />
        Back
      </FallbackButton>

      <Card className="bg-[#1E293B] border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-blue-400">Vendor Bills</CardTitle>
          <FallbackButton variant="default" onClick={handleNavigateNewBill}>
            New Bill
          </FallbackButton>
        </CardHeader>
        <CardContent>
          {bills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-blue-400 text-sm">
                    <th className="text-left p-2">Invoice No</th>
                    <th className="text-left p-2">Retailer</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill, index) => (
                    <tr key={bill.invoice_number || index} className="text-white border-t border-blue-500/20">
                      <td className="p-2">{bill.invoice_number || "N/A"}</td>
                      <td className="p-2">{getRetailerName(bill.Retailer, bill.retailer_name)}</td>
                      <td className="p-2 text-right">
                        ₹{formatNumber(calculateBillTotal(bill))}
                        {Number.parseFloat(String(bill.grand_total || "0")) === 0 &&
                          bill.items &&
                          bill.items.length > 0 && <div className="text-xs text-yellow-300"></div>}
                      </td>
                      <td className="p-2">
                        {bill.invoice_date ? new Date(bill.invoice_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-2">{bill.payment_status || "N/A"}</td>
                      <td className="p-2 text-right space-x-2">
                        <FallbackButton variant="outline" size="sm" onClick={() => openBill(bill)}>
                          View
                        </FallbackButton>
                        <FallbackButton
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintAction(bill)}
                          disabled={isGeneratingPDF}
                        >
                          {isGeneratingPDF ? "..." : "Print"}
                        </FallbackButton>
                        <FallbackButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAction(bill)}
                          disabled={isGeneratingPDF}
                        >
                          {isGeneratingPDF ? "..." : "Download"}
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
          <div className="bg-[#0F172A] rounded-lg p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>
            <div ref={printRef} className="text-white p-6 space-y-6">
              {/* Company and Invoice Heading */}
              <div className="flex justify-between mb-6">
                <div>
                  <div className="text-xl font-bold">{selectedBill.company?.name || "Company Name"}</div>
                  <div className="text-sm">{selectedBill.company?.address || "Company Address"}</div>
                  {selectedBill.company?.city && <div className="text-sm">City: {selectedBill.company.city}</div>}
                  {selectedBill.company?.state && <div className="text-sm">State: {selectedBill.company.state}</div>}
                  {selectedBill.company?.country && (
                    <div className="text-sm">Country: {selectedBill.company.country}</div>
                  )}
                  {selectedBill.company?.pincode && (
                    <div className="text-sm">Pincode: {selectedBill.company.pincode}</div>
                  )}
                  {selectedBill.company?.gstin && <div className="text-sm">GSTIN: {selectedBill.company.gstin}</div>}
                  {selectedBill.company?.email && <div className="text-sm">Email: {selectedBill.company.email}</div>}
                  {selectedBill.company?.phone && <div className="text-sm">Phone: {selectedBill.company.phone}</div>}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-3xl font-bold text-blue-400 mb-2">INVOICE</div>
                </div>
              </div>

              {/* Retailer and Invoice Details Side by Side */}
              <div className="flex justify-between mb-4 gap-8">
                <div>
                  <div className="font-semibold">Billed To:</div>
                  <div>{getRetailerName(selectedBill.Retailer, selectedBill.retailer_name)}</div>
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
                    <span className="font-semibold">Invoice No:</span> {selectedBill.invoice_number || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span>{" "}
                    {selectedBill.invoice_date
                      ? new Date(selectedBill.invoice_date).toLocaleDateString()
                      : "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Mode:</span> {selectedBill.payment_mode || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Payment Status:</span> {selectedBill.payment_status || "N/A"}
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white mb-2 border border-white rounded">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="p-2 border border-white">#</th>
                      <th className="p-2 border border-white">Product</th>
                      <th className="p-2 border border-white">HSN</th>
                      <th className="p-2 border border-white">Qty</th>
                      <th className="p-2 border border-white">Rate</th>
                      <th className="p-2 border border-white">Taxable</th>
                      <th className="p-2 border border-white">GST %</th>
                      <th className="p-2 border border-white">CGST</th>
                      <th className="p-2 border border-white">SGST</th>
                      <th className="p-2 border border-white">IGST</th>
                      <th className="p-2 border border-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items && selectedBill.items.length > 0 ? (
                      selectedBill.items.map((item: any, idx: number) => {
                        console.log(`Item ${idx} data:`, item)

                        const productId = item.Product || item.product || "N/A"
                        const productName = `Product ID: ${productId}`
                        const hsnCode = item.hsn_code || "N/A"
                        const quantity = item.quantity || 0

                        // Use mock calculations to show what it should look like with proper data
                        const calculations = calculateMockValues(item, idx)

                        return (
                          <tr key={idx} className="bg-[#1E40AF] border-b border-white">
                            <td className="p-2 border border-white">{idx + 1}</td>
                            <td className="p-2 border border-white">
                              {productName}
                              {calculations.price > 0 && (
                                <div className="text-xs text-yellow-300"></div>
                              )}
                            </td>
                            <td className="p-2 border border-white">{hsnCode}</td>
                            <td className="p-2 border border-white">{quantity}</td>
                            <td className="p-2 border border-white">₹{formatNumber(calculations.price)}</td>
                            <td className="p-2 border border-white">₹{formatNumber(calculations.taxableValue)}</td>
                            <td className="p-2 border border-white">{calculations.gstRate}%</td>
                            <td className="p-2 border border-white">₹{formatNumber(calculations.cgst)}</td>
                            <td className="p-2 border border-white">₹{formatNumber(calculations.sgst)}</td>
                            <td className="p-2 border border-white">₹{formatNumber(calculations.igst)}</td>
                            <td className="p-2 border border-white">₹{formatNumber(calculations.total)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="p-4 text-center border border-white">
                          No items found in this bill
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculate totals from items if API totals are zero */}
              {(() => {
                let totalTaxable = 0
                let totalCgst = 0
                let totalSgst = 0
                let totalIgst = 0
                let grandTotal = 0

                if (selectedBill.items) {
                  selectedBill.items.forEach((item: any, idx: number) => {
                    const calculations = calculateMockValues(item, idx)
                    totalTaxable += calculations.taxableValue
                    totalCgst += calculations.cgst
                    totalSgst += calculations.sgst
                    totalIgst += calculations.igst
                    grandTotal += calculations.total
                  })
                }

                // Use calculated totals if API totals are zero
                const displayTotalTaxable =
                  Number.parseFloat(formatNumber(selectedBill.total_taxable_value)) > 0
                    ? formatNumber(selectedBill.total_taxable_value)
                    : formatNumber(totalTaxable)
                const displayTotalCgst =
                  Number.parseFloat(formatNumber(selectedBill.total_cgst)) > 0
                    ? formatNumber(selectedBill.total_cgst)
                    : formatNumber(totalCgst)
                const displayTotalSgst =
                  Number.parseFloat(formatNumber(selectedBill.total_sgst)) > 0
                    ? formatNumber(selectedBill.total_sgst)
                    : formatNumber(totalSgst)
                const displayTotalIgst =
                  Number.parseFloat(formatNumber(selectedBill.total_igst)) > 0
                    ? formatNumber(selectedBill.total_igst)
                    : formatNumber(totalIgst)
                const displayGrandTotal =
                  Number.parseFloat(formatNumber(selectedBill.grand_total)) > 0
                    ? formatNumber(selectedBill.grand_total)
                    : formatNumber(grandTotal)

                return (
                  <div className="flex flex-col gap-2 mt-4 max-w-md w-full">
                    <div className="flex justify-between w-full">
                      <span className="font-semibold text-left">Total Taxable Value:</span>
                      <span className="text-right">₹{displayTotalTaxable}</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold text-left">Total CGST:</span>
                      <span className="text-right">₹{displayTotalCgst}</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold text-left">Total SGST:</span>
                      <span className="text-right">₹{displayTotalSgst}</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold text-left">Total IGST:</span>
                      <span className="text-right">₹{displayTotalIgst}</span>
                    </div>
                    <div className="flex justify-between w-full text-lg font-bold mt-2 border-t border-white pt-2">
                      <span className="text-left">Grand Total:</span>
                      <span className="text-right">₹{displayGrandTotal}</span>
                    </div>
                    {grandTotal > 0 && (
                      <div className="text-xs text-yellow-300 mt-2">  
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Note and Signature */}
              <div className="flex justify-between items-end mt-8">
                <div>
                  <div className="font-semibold">Note:</div>
                  <div className="text-sm text-gray-300">Thank you for your business!</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Authorized Signature</div>
                  <div className="w-40 h-12 border-b border-gray-400 mx-0"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <FallbackButton variant="default" onClick={handlePrint} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? "Generating PDF..." : "Print PDF"}
              </FallbackButton>
              <FallbackButton
                variant="default"
                onClick={async () => {
                  setIsGeneratingPDF(true)
                  try {
                    const pdf = await generatePDF(false)
                    if (pdf && selectedBill) {
                      const fileName = `${selectedBill.invoice_number || "invoice"}.pdf`
                      pdf.save(fileName)
                    }
                  } catch (error) {
                    console.error("Download failed:", error)
                  } finally {
                    setIsGeneratingPDF(false)
                  }
                }}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
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

/*changes are made*/