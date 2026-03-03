"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Building2, 
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  ArrowRight,
  Loader,
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';
import { apiClient } from '../../../utils/api';
import { UserContext, PaginatedResponse } from '@/types/api';
import { API_BASE_URL } from "@/utils/config";

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  order_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: string;
  item_count: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  company_name: string;
  company_id: string;
  status: 'DRAFT' | 'POSTED' | 'PAID' | 'CANCELLED';
  subtotal: string;
  tax_amount: string;
  grand_total: string;
  amount_received: string;
  outstanding_amount: string;
  order_number?: string;
}

interface InvoiceLineItem {
  id: string;
  product_name: string;
  description: string;
  hsn_code?: string;
  quantity: string;
  unit?: string;
  unit_rate: string;
  discount_percent: string;
  discount_amount: string;
  taxable_value: string;
  cgst_rate: string;
  cgst_amount: string;
  sgst_rate: string;
  sgst_amount: string;
  igst_rate: string;
  igst_amount: string;
  line_total: string;
}

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  invoice_date: string;
  due_date?: string;
  company: {
    id: string;
    name: string;
    gstin?: string;
    address?: string;
  };
  party: {
    id: string;
    name: string;
    gstin?: string;
    address?: string;
  };
  items: InvoiceLineItem[];
  subtotal: string;
  discount_total: string;
  tax_amount: string;
  grand_total: string;
  amount_received: string;
  outstanding_amount: string;
  sales_order?: {
    id: string;
    order_number: string;
  };
  notes?: string;
  created_at: string;
}

interface Company {
  id: string;
  company_name: string;
  status: string;
  connected_at: string;
}

const DashboardTab = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'invoices' | 'payments'>('overview');
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  
  // Dashboard data
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    connectedCompanies: 0,
    pendingPayments: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Invoice detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Fetch invoice details
  const fetchInvoiceDetail = async (invoiceId: string) => {
    setInvoiceDetailLoading(true);
    setShowInvoiceModal(true);
    setSelectedInvoice(null); // Reset previous invoice
    try {
      console.log('Fetching invoice detail for ID:', invoiceId);
      const data = await apiClient.get<InvoiceDetail>(`/portal/my-invoices/${invoiceId}/`);
      console.log('Invoice detail response:', data);
      setSelectedInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setInvoiceDetailLoading(false);
    }
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  // Check if retailer profile exists using context API
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const context = await apiClient.get<{is_portal_user: boolean}>('/users/me/context/');
        
        // If is_portal_user is false, profile not complete - redirect to setup
        if (!context.is_portal_user) {
          router.replace('/retailer/setup');
          return;
        }
        
        setProfileChecked(true);
      } catch (error) {
        router.replace('/retailer/setup');
      }
    };

    checkProfile();
  }, [router]);

  useEffect(() => {
    if (!profileChecked) return;
    fetchDashboardData();
  }, [profileChecked]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch orders using Portal API
      const ordersData = await apiClient.get<Order[] | PaginatedResponse<Order>>('/portal/my-orders/');
      const ordersList = Array.isArray(ordersData) 
        ? ordersData 
        : (ordersData as PaginatedResponse<Order>).results || [];
      setRecentOrders(ordersList.slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalOrders: ordersList.length
      }));

      // Fetch companies from retailer connections API
      const companiesData = await apiClient.get<any[]>('/portal/companies/');
      if (Array.isArray(companiesData)) {
        const approvedCompanies = companiesData.filter((c: any) => c.status === 'APPROVED');
        setCompanies(approvedCompanies.map((c: any) => ({
          id: c.company_id || c.id,
          company_name: c.company_name,
          status: c.status?.toLowerCase() || 'connected',
          connected_at: c.connected_at || ''
        })));
        setStats(prev => ({
          ...prev,
          connectedCompanies: approvedCompanies.length
        }));
      }

      // Fetch invoices from portal my-invoices endpoint
      try {
        const invoicesData = await apiClient.get<Invoice[]>('/portal/my-invoices/');
        if (Array.isArray(invoicesData)) {
          setInvoices(invoicesData);
          
          // Calculate pending payments (outstanding amount)
          const pendingAmount = invoicesData.reduce((sum: number, inv: Invoice) => 
            sum + parseFloat(inv.outstanding_amount || '0'), 0);
          setStats(prev => ({
            ...prev,
            pendingPayments: pendingAmount
          }));
        }
      } catch (invoiceError) {
        console.log('Invoices fetch failed, may not be available');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'PAID':
      case 'APPROVED':
        return 'bg-green-900/30 text-green-400';
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'CONFIRMED':
      case 'POSTED':
        return 'bg-blue-900/30 text-blue-400';
      case 'SHIPPED':
        return 'bg-purple-900/30 text-purple-400';
      case 'CANCELLED':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-neutral-700 text-neutral-400';
    }
  };

  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-neutral-400">Checking profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
              <p className="text-neutral-400 mt-2">
                Manage your orders, track deliveries, and handle payments
              </p>
            </div>
            <button
              onClick={() => router.push('/retailer/Orders')}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Place New Order
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Orders</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats.totalOrders}
                </p>
                <p className="text-sm text-green-400 mt-1">All time orders</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Connected Manufacturers</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats.connectedCompanies}
                </p>
                <p className="text-sm text-neutral-400 mt-1">Active connections</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <Building2 className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Pending Invoices</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : invoices.length}
                </p>
                <p className="text-sm text-yellow-400 mt-1">Awaiting payment</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <FileText className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Outstanding Amount</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : `₹${stats.pendingPayments.toLocaleString()}`}
                </p>
                <p className="text-sm text-red-400 mt-1">To be paid</p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex border-b border-neutral-800 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'orders', label: 'Track Orders', icon: Package },
              { id: 'invoices', label: 'View Invoices', icon: FileText },
              { id: 'payments', label: 'Make Payments', icon: CreditCard },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-neutral-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Orders</h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                    >
                      View All <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="h-6 w-6 animate-spin text-neutral-400" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400">No orders yet</p>
                      <button
                        onClick={() => router.push('/retailer/Orders')}
                        className="mt-3 text-green-400 hover:text-green-300 text-sm"
                      >
                        Place your first order
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                          <div>
                            <p className="font-medium">{order.order_number || `Order #${order.id}`}</p>
                            <p className="text-sm text-neutral-400">{order.company_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{parseFloat(order.total_amount || '0').toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connected Manufacturers */}
                <div className="bg-neutral-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Connected Manufacturers</h3>
                    <button 
                      onClick={() => router.push('/retailer/companies')}
                      className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                    >
                      Manage <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="h-6 w-6 animate-spin text-neutral-400" />
                    </div>
                  ) : companies.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400">No manufacturers connected</p>
                      <button
                        onClick={() => router.push('/retailer/companies')}
                        className="mt-3 text-green-400 hover:text-green-300 text-sm"
                      >
                        Connect with manufacturers
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {companies.slice(0, 5).map(company => (
                        <div key={company.id} className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">{company.company_name}</p>
                              <p className="text-sm text-neutral-400">
                                Connected {new Date(company.connected_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(company.status)}`}>
                            {company.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Track Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">All Orders</h3>
                  <button
                    onClick={() => router.push('/retailer/Orders')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Order
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-neutral-400" />
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No orders yet</h4>
                    <p className="text-neutral-400 mb-4">Start ordering from your connected manufacturers</p>
                    <button
                      onClick={() => router.push('/retailer/Orders')}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Place Your First Order
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-700">
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Order ID</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Company</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Items</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id} className="border-b border-neutral-700/50 hover:bg-neutral-800/50">
                            <td className="py-3 px-4 font-medium">{order.order_number || `#${order.id}`}</td>
                            <td className="py-3 px-4">{order.company_name}</td>
                            <td className="py-3 px-4">{new Date(order.order_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{order.item_count} items</td>
                            <td className="py-3 px-4 font-semibold">₹{parseFloat(order.total_amount || '0').toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* View Invoices Tab */}
            {activeTab === 'invoices' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Outstanding Invoices</h3>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-neutral-400" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No pending invoices</h4>
                    <p className="text-neutral-400">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-700">
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Invoice #</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Company</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Due Date</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Total</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Outstanding</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-neutral-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(invoice => (
                          <tr key={invoice.id} className="border-b border-neutral-700/50 hover:bg-neutral-800/50">
                            <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                            <td className="py-3 px-4">{invoice.company_name}</td>
                            <td className="py-3 px-4">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{new Date(invoice.due_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">₹{parseFloat(invoice.grand_total || '0').toLocaleString()}</td>
                            <td className="py-3 px-4 font-semibold text-red-400">
                              ₹{parseFloat(invoice.outstanding_amount || '0').toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => fetchInvoiceDetail(invoice.id)}
                                  className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                                  title="View Invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => setActiveTab('payments')}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                                >
                                  Pay
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Make Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Make Payments</h3>
                </div>
                
                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-sm text-neutral-400">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-400">
                      ₹{stats.pendingPayments.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-sm text-neutral-400">Pending Invoices</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-sm text-neutral-400">Overdue Invoices</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {invoices.filter(inv => new Date(inv.due_date) < new Date()).length}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-neutral-400" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">All payments complete!</h4>
                    <p className="text-neutral-400">You have no pending payments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map(invoice => (
                      <div key={invoice.id} className="bg-neutral-800 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="h-5 w-5 text-neutral-400" />
                              <span className="font-semibold">{invoice.invoice_number}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-400 mb-1">{invoice.company_name}</p>
                            <p className="text-sm text-neutral-400">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                              {new Date(invoice.due_date) < new Date() && (
                                <span className="ml-2 text-red-400">(Overdue)</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-neutral-400">Outstanding</p>
                              <p className="text-xl font-bold text-red-400">
                                ₹{parseFloat(invoice.outstanding_amount || '0').toLocaleString()}
                              </p>
                            </div>
                            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                              Pay Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900">
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <button 
                onClick={closeInvoiceModal}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {invoiceDetailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : selectedInvoice ? (
              <div className="p-6 space-y-6">
                {/* Invoice Header */}
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-green-400 mb-2">
                      {selectedInvoice.invoice_number}
                    </h3>
                    <div className="space-y-1 text-sm text-neutral-400">
                      <p>Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                      {selectedInvoice.due_date && (
                        <p>Due Date: {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                      )}
                      {selectedInvoice.sales_order && (
                        <p>Order: {selectedInvoice.sales_order.order_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-400 mb-2">From (Seller)</h4>
                    <p className="font-semibold">{selectedInvoice.company.name}</p>
                    {selectedInvoice.company.gstin && (
                      <p className="text-sm text-neutral-400">GSTIN: {selectedInvoice.company.gstin}</p>
                    )}
                    {selectedInvoice.company.address && (
                      <p className="text-sm text-neutral-400">{selectedInvoice.company.address}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-400 mb-2">To (Buyer)</h4>
                    <p className="font-semibold">{selectedInvoice.party.name}</p>
                    {selectedInvoice.party.gstin && (
                      <p className="text-sm text-neutral-400">GSTIN: {selectedInvoice.party.gstin}</p>
                    )}
                    {selectedInvoice.party.address && (
                      <p className="text-sm text-neutral-400">{selectedInvoice.party.address}</p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="font-semibold mb-3">Invoice Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-700 text-neutral-400">
                          <th className="text-left py-2 px-3">#</th>
                          <th className="text-left py-2 px-3">Product</th>
                          <th className="text-left py-2 px-3">HSN</th>
                          <th className="text-right py-2 px-3">Qty</th>
                          <th className="text-right py-2 px-3">Rate</th>
                          <th className="text-right py-2 px-3">GST %</th>
                          <th className="text-right py-2 px-3">GST Amt</th>
                          <th className="text-right py-2 px-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => {
                          const gstRate = parseFloat(item.cgst_rate || '0') + parseFloat(item.sgst_rate || '0') + parseFloat(item.igst_rate || '0');
                          const gstAmount = parseFloat(item.cgst_amount || '0') + parseFloat(item.sgst_amount || '0') + parseFloat(item.igst_amount || '0');
                          return (
                            <tr key={item.id} className="border-b border-neutral-800">
                              <td className="py-2 px-3">{index + 1}</td>
                              <td className="py-2 px-3">
                                <p className="font-medium">{item.product_name}</p>
                                {item.description && item.description !== item.product_name && (
                                  <p className="text-xs text-neutral-400">{item.description}</p>
                                )}
                              </td>
                              <td className="py-2 px-3">{item.hsn_code || '-'}</td>
                              <td className="text-right py-2 px-3">{parseFloat(item.quantity)}</td>
                              <td className="text-right py-2 px-3">₹{parseFloat(item.unit_rate).toLocaleString()}</td>
                              <td className="text-right py-2 px-3">{gstRate}%</td>
                              <td className="text-right py-2 px-3">₹{gstAmount.toFixed(2)}</td>
                              <td className="text-right py-2 px-3 font-medium">₹{parseFloat(item.line_total).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full md:w-80 space-y-2 p-4 bg-neutral-800 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Subtotal</span>
                      <span>₹{parseFloat(selectedInvoice.subtotal).toLocaleString()}</span>
                    </div>
                    {parseFloat(selectedInvoice.discount_total) > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span>-₹{parseFloat(selectedInvoice.discount_total).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Tax</span>
                      <span>₹{parseFloat(selectedInvoice.tax_amount).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-neutral-700 pt-2 flex justify-between font-semibold text-lg">
                      <span>Grand Total</span>
                      <span className="text-green-400">₹{parseFloat(selectedInvoice.grand_total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Paid</span>
                      <span>₹{parseFloat(selectedInvoice.amount_received).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-red-400">
                      <span>Outstanding</span>
                      <span>₹{parseFloat(selectedInvoice.outstanding_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <h4 className="text-sm font-medium text-neutral-400 mb-2">Notes</h4>
                    <p className="text-sm">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_BASE_URL}/invoices/${selectedInvoice.id}/download/`, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'X-Company-ID': localStorage.getItem('company_id') || '',
                          },
                        });
                        
                        if (!response.ok) throw new Error('Failed to download PDF');
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `invoice_${selectedInvoice.invoice_number}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        alert('Failed to download invoice PDF');
                        console.error(error);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={closeInvoiceModal}
                      className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        closeInvoiceModal();
                        setActiveTab('payments');
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400">
                Invoice details not found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
