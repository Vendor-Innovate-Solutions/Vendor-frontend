"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  X, 
  Eye, 
  Building2,
  ShoppingCart,
  Minus,
  Trash2,
  Loader,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';
import { apiClient } from '../../../utils/api';
import { UserContext, PaginatedResponse } from '@/types/api';

interface Product {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  category?: string;
  category_name?: string;
  category_id?: string;
  company_name?: string;
  company_id?: string;
  company?: {
    id: string;
    name: string;
    code: string;
  };
  available_quantity: string | number;
  unit: string;
  price: string;
  status?: string;
  brand?: string;
  hsn_code?: string;
  in_stock?: boolean;
  cgst_rate?: string;
  sgst_rate?: string;
  igst_rate?: string;
}

interface Company {
  id: string;
  company_id?: string;
  company_name: string;
  status: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  order_date: string;
  status: string;
  total_amount: string;
  item_count: number;
}

const OrdersPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'create'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileChecked, setProfileChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if retailer profile exists using context API
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const contextResponse = await apiClient.get<UserContext>('/users/me/context/');
        
        if (contextResponse.data) {
          const context = contextResponse.data;
          
          // If is_portal_user is false, profile not complete - redirect to setup
          if (!context.is_portal_user) {
            router.replace('/retailer/setup');
            return;
          }
        } else {
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
  }, [profileChecked]);

  useEffect(() => {
    if (selectedCompany) {
      fetchProducts(selectedCompany);
    } else {
      setProducts([]);
    }
  }, [selectedCompany]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<PaginatedResponse<Order> | Order[]>('/portal/my-orders/');
      if (response.data) {
        const ordersList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as PaginatedResponse<Order>).results || [];
        setOrders(ordersList);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
    setLoading(false);
  };

  const fetchConnectedCompanies = async () => {
    try {
      // Get companies from retailer connections API
      const response = await apiClient.get<any[]>('/portal/companies/');
      if (response.data && Array.isArray(response.data)) {
        const companiesList = response.data
          .filter((c) => c.status === 'APPROVED')
          .map((c) => ({
            id: c.company_id || c.id,
            company_id: c.company_id || c.id,
            company_name: c.company_name,
            status: c.status?.toLowerCase() || 'connected'
          }));
        setCompanies(companiesList);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setCompanies([]);
    }
  };

  const fetchProducts = async (companyId: string) => {
    try {
      // Use Portal products API with company filter
      const response = await apiClient.get<Product[]>(
        `/portal/products/?company_id=${companyId}`
      );
      if (response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => 
      total + (parseFloat(item.product.price) * item.quantity), 0
    );
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError('Please add items to your cart');
      return;
    }

    if (!selectedCompany) {
      setError('Please select a manufacturer');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const orderItems = cart.map(item => ({
        product_id: item.product.id,
        quantity: parseInt(item.quantity.toString())
      }));

      const response = await apiClient.post('/portal/orders/place/', {
        company_id: selectedCompany,
        items: orderItems,
        notes: notes
      });

      if (response.error) {
        setError(response.error || 'Failed to create order');
      } else {
        setSuccess('Order placed successfully!');
        setCart([]);
        setNotes('');
        setActiveTab('orders');
        fetchOrders();
      }
    } catch (error) {
      setError('Failed to create order. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-green-900/30 text-green-400';
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'CONFIRMED':
        return 'bg-blue-900/30 text-blue-400';
      case 'SHIPPED':
        return 'bg-purple-900/30 text-purple-400';
      case 'CANCELLED':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-neutral-700 text-neutral-400';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status.toLowerCase() === filter.toLowerCase();
  });

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-neutral-400 mt-1">Manage and place orders from your manufacturers</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="h-5 w-5 text-red-400" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-400">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X className="h-5 w-5 text-green-400" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 mb-6">
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="h-5 w-5" />
              My Orders
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Plus className="h-5 w-5" />
              Place Order
            </button>
          </div>
        </div>

        {/* My Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-neutral-900 rounded-lg border border-neutral-800">
            {/* Filter */}
            <div className="p-4 border-b border-neutral-800 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-neutral-400" />
                <span className="text-neutral-400">Filter:</span>
              </div>
              {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    filter === status
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                  <p className="text-neutral-400 mb-4">
                    {filter === 'all' 
                      ? "You haven't placed any orders yet" 
                      : `No ${filter} orders found`}
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
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
                        <th className="text-left py-3 px-4 font-medium text-neutral-400">Manufacturer</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-400">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-400">Items</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-400">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-400">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
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
          </div>
        )}

        {/* Place Order Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Selection */}
            <div className="lg:col-span-2 bg-neutral-900 rounded-lg border border-neutral-800">
              {/* Manufacturer Selection */}
              <div className="p-4 border-b border-neutral-800">
                <label className="block text-sm text-neutral-400 mb-2">Select Manufacturer</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                >
                  <option value="">Choose a manufacturer...</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.company_id || company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
                {companies.length === 0 && (
                  <p className="text-sm text-yellow-400 mt-2">
                    No connected manufacturers.{' '}
                    <button 
                      onClick={() => router.push('/retailer/companies')}
                      className="underline hover:text-yellow-300"
                    >
                      Connect with manufacturers
                    </button>
                  </p>
                )}
              </div>

              {/* Product Search */}
              {selectedCompany && (
                <div className="p-4 border-b border-neutral-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    />
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="p-4">
                {!selectedCompany ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">Select a manufacturer to view products</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">
                      {searchQuery ? 'No products match your search' : 'No products available'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="bg-neutral-800 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          {(product.category || product.category_name) && (
                            <p className="text-sm text-neutral-400">
                              {product.category || product.category_name}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-green-400">
                              ₹{parseFloat(product.price).toLocaleString()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              Number(product.available_quantity) > 10 
                                ? 'bg-green-900/30 text-green-400' 
                                : Number(product.available_quantity) > 0 
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-red-900/30 text-red-400'
                            }`}>
                              {product.available_quantity} {product.unit}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={Number(product.available_quantity) <= 0}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 h-fit sticky top-6">
              <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-400" />
                <h3 className="font-semibold">Your Order</h3>
                {cart.length > 0 && (
                  <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    {cart.length}
                  </span>
                )}
              </div>

              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">Your cart is empty</p>
                    <p className="text-sm text-neutral-500">Add products to place an order</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.id} className="bg-neutral-800 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-xs text-neutral-400">
                              ₹{parseFloat(item.product.price).toLocaleString()} / {item.product.unit}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="font-semibold">
                            ₹{(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Order Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Special instructions..."
                        rows={2}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500 text-sm resize-none"
                      />
                    </div>

                    {/* Total */}
                    <div className="border-t border-neutral-700 pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-400">₹{getCartTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <button
                      onClick={handleCreateOrder}
                      disabled={creating || cart.length === 0}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {creating ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
