"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, Clock, CheckCircle, X, Eye, Building2 } from 'lucide-react';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';
import { authStorage } from '../../../utils/localStorage';
import { fetchWithAuth, API_URL } from '../../../utils/auth_fn';

interface Order {
  id: number;
  order_id: string;
  company_name: string;
  company_id: number;
  product_name: string;
  product_id: number;
  required_qty: number;
  order_date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  notes?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  company_name: string;
  company_id: number;
}

interface Company {
  id: number;
  name: string;
  status: string;
}

const OrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [profileChecked, setProfileChecked] = useState(false);

  // Mock data as fallback
  const mockOrders: Order[] = [
    {
      id: 1,
      order_id: "ORD-001",
      company_name: "Demo Company Pvt Ltd",
      company_id: 1,
      product_name: "Laptop HP Pavilion",
      product_id: 1,
      required_qty: 3,
      order_date: new Date(2026, 0, 5).toISOString(),
      status: "delivered",
      total_amount: 135000,
      notes: "Bulk order for office setup"
    },
    {
      id: 2,
      order_id: "ORD-002",
      company_name: "Demo Company Pvt Ltd",
      company_id: 1,
      product_name: "Office Chair Executive",
      product_id: 2,
      required_qty: 5,
      order_date: new Date(2026, 0, 6).toISOString(),
      status: "confirmed",
      total_amount: 42500,
      notes: "For new employees"
    },
    {
      id: 3,
      order_id: "ORD-003",
      company_name: "Demo Company Pvt Ltd",
      company_id: 1,
      product_name: "A4 Paper Ream",
      product_id: 3,
      required_qty: 100,
      order_date: new Date(2026, 0, 7).toISOString(),
      status: "shipped",
      total_amount: 25000
    },
    {
      id: 4,
      order_id: "ORD-004",
      company_name: "Demo Company Pvt Ltd",
      company_id: 1,
      product_name: "Wireless Mouse Logitech",
      product_id: 4,
      required_qty: 10,
      order_date: new Date(2026, 0, 8).toISOString(),
      status: "pending",
      total_amount: 6500
    }
  ];

  const mockCompanies: Company[] = [
    { id: 1, name: "Demo Company Pvt Ltd", status: "connected" },
    { id: 2, name: "Global Suppliers Inc", status: "connected" }
  ];

  const mockProducts: Product[] = [
    { id: 1, name: "Laptop HP Pavilion", price: 45000, stock: 50, company_name: "Demo Company Pvt Ltd", company_id: 1 },
    { id: 2, name: "Office Chair Executive", price: 8500, stock: 25, company_name: "Demo Company Pvt Ltd", company_id: 1 },
    { id: 3, name: "A4 Paper Ream", price: 250, stock: 500, company_name: "Demo Company Pvt Ltd", company_id: 1 },
    { id: 4, name: "Wireless Mouse Logitech", price: 650, stock: 100, company_name: "Demo Company Pvt Ltd", company_id: 1 },
    { id: 5, name: "Power Drill Set", price: 3200, stock: 30, company_name: "Demo Company Pvt Ltd", company_id: 1 }
  ];

  // Check if retailer profile exists
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/portal/retailers/profile/`);
        if (!response.ok) {
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

    fetchOrders();
    fetchConnectedCompanies();
    fetchProducts();
  }, [profileChecked]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/portal/orders/`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        // Use mock data if empty
        setOrders(results.length === 0 ? mockOrders : results);
      } else {
        setOrders(mockOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders, using mock data:', error);
      setOrders(mockOrders);
    }
    setLoading(false);
  };

  const fetchConnectedCompanies = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/portal/retailers/`);
      if (response.ok) {
        const data = await response.json();
        const connectedCompanies = (Array.isArray(data) ? data : data.results || [])
          .filter((company: Company) => company.status === 'connected');
        // Use mock data if empty
        setCompanies(connectedCompanies.length === 0 ? mockCompanies : connectedCompanies);
      } else {
        setCompanies(mockCompanies);
      }
    } catch (error) {
      console.error('Failed to fetch companies, using mock data:', error);
      setCompanies(mockCompanies);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/portal/items/`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        // Use mock data if empty
        setProducts(results.length === 0 ? mockProducts : results);
      } else {
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products, using mock data:', error);
      setProducts(mockProducts);
    }
  };

  const createOrder = async () => {
    if (!selectedCompany || !selectedProduct || quantity < 1) {
      alert('Please fill all required fields');
      return;
    }

    setCreating(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/api/portal/orders/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: parseInt(selectedCompany),
          product_id: parseInt(selectedProduct),
          required_qty: quantity,
          notes: notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchOrders();
        alert('Order created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create order: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to create order');
    }
    setCreating(false);
  };

  const resetForm = () => {
    setSelectedCompany('');
    setSelectedProduct('');
    setQuantity(1);
    setNotes('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const companyProducts = products.filter(product => 
    selectedCompany ? product.company_id.toString() === selectedCompany : false
  );

  const selectedProductData = products.find(p => p.id.toString() === selectedProduct);

  // Don't render if profile check hasn't completed
  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Checking profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-2">Manage your orders from connected companies</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={companies.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Order
          </button>
        </div>

        {companies.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800">
              You need to connect to companies before you can create orders.{' '}
              <a href="/retailer/companies" className="underline font-medium">
                Connect to companies
              </a>
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
          <div className="flex items-center gap-4">
            <span className="font-medium text-neutral-300">Filter by status:</span>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'shipped', label: 'Shipped' },
                { key: 'delivered', label: 'Delivered' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    filter === key
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                      : 'text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">
              {filteredOrders.length} Orders {filter !== 'all' && `(${filter})`}
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
                </h3>
                <p className="text-neutral-400 mb-4">
                  {companies.length === 0 
                    ? 'Connect to companies and start ordering products'
                    : 'Create your first order to get started'
                  }
                </p>
                {companies.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Order
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">#{order.order_id}</h3>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Company:</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Building2 className="h-4 w-4" />
                              <span>{order.company_name}</span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium">Product:</span>
                            <p className="mt-1">{order.product_name}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium">Quantity:</span>
                            <p className="mt-1">{order.required_qty} units</p>
                          </div>
                          
                          <div>
                            <span className="font-medium">Date:</span>
                            <p className="mt-1">{new Date(order.order_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {order.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-gray-900">${order.total_amount?.toFixed(2) || '0.00'}</p>
                        <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Order</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setSelectedProduct(''); // Reset product when company changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a company...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    disabled={!selectedCompany}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">Select a product...</option>
                    {companyProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={selectedProductData?.stock || 999}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  {selectedProductData && (
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {selectedProductData.stock} units
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {selectedProductData && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Order Summary:</p>
                    <p className="text-sm text-gray-600">
                      {quantity} × ${selectedProductData.price} = <span className="font-medium">${(quantity * selectedProductData.price).toFixed(2)}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createOrder}
                    disabled={creating || !selectedCompany || !selectedProduct || quantity < 1}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;