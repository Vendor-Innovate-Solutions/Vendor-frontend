'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, UserPlus, FileInput, Building2, Settings, CreditCard } from "lucide-react";
import Link from 'next/link';
import { API_URL ,fetchWithAuth} from "@/utils/auth_fn";

export default function AccountingDashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    pendingPayments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
  const fetchStats = async () => {
    const companyId = localStorage.getItem('company_id');
    if (!companyId) return;

    // Fetch total invoices count
    const countRes = await fetchWithAuth(`${API_URL}/invoices/count/?company=${companyId}`);
    const countData = await countRes.json();

    // Fetch all invoices for the company
    const invoicesRes = await fetchWithAuth(`${API_URL}/invoices/?company=${companyId}`);
    const invoicesData = await invoicesRes.json();

    // Support both paginated and plain array responses
    const invoices = Array.isArray(invoicesData)
      ? invoicesData
      : Array.isArray(invoicesData.results)
        ? invoicesData.results
        : [];

    // Calculate pending payments and total revenue
    let pendingPayments = invoices.filter(
      (inv: any) => inv.payment_status && inv.payment_status.toLowerCase() === 'unpaid'
    ).length;

    let totalRevenue = invoices.reduce(
      (sum: number, inv: any) => sum + (parseFloat(inv.grand_total) || 0), 0
    );

    setStats({
      totalInvoices: countData.count || invoices.length,
      pendingPayments,
      totalRevenue,
    });
  };

  fetchStats();
}, []);

  const menuItems = [
    { icon: <FileText className="h-6 w-6" />, title: "Create New Bill", href: "/manufacturer/accounting/createBill" },
    { icon: <UserPlus className="h-6 w-6" />, title: "Add New Customer", href: "/manufacturer/accounting/addCustomer" },
    { icon: <FileInput className="h-6 w-6" />, title: "Customer Invoices", href: "/manufacturer/accounting/customerInvoice" },
    { icon: <Building2 className="h-6 w-6" />, title: "Vendor Bills", href: "/manufacturer/accounting/vendorBills" },
    { icon: <Settings className="h-6 w-6" />, title: "Configure Documents", href: "/manufacturer/accounting/configureDocuments" },
    { icon: <CreditCard className="h-6 w-6" />, title: "Track Payment", href: "/manufacturer/accounting/trackPayment" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-[#1E293B] border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-400">Accounting Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#0F172A] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalInvoices}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0F172A] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.pendingPayments}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0F172A] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex flex-col items-center justify-center p-8 bg-[#1E293B] rounded-lg border border-blue-500/20 hover:bg-blue-900/20 transition-colors duration-200 group"
              >
                <div className="mb-4 text-blue-400 group-hover:text-blue-300">
                  {item.icon}
                </div>
                <span className="text-white">{item.title}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}