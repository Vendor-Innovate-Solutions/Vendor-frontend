"use client";
import React, { useState, useEffect } from 'react';
import { RetailerNavbar } from '@/components/retailer/nav_bar';
import { apiClient } from '@/utils/api';
import { PaginatedResponse } from '@/types/api';
import { ShoppingCart, Search, Filter, Package, Plus, Minus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string | null;
  category_id: string | null;
  price: string;
  available_quantity: number;
  unit: string;
  hsn_code: string;
  brand: string;
  company: {
    id: string;
    name: string;
    code: string;
  };
  in_stock: boolean;
  cgst_rate: string;
  sgst_rate: string;
  igst_rate: string;
}

interface Company {
  id: string;
  company_id?: string;
  company_name: string;
  name?: string;
  status: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const BrowseProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Order form
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      fetchProducts();
      fetchCategories();
    }
  }, [selectedCompany, selectedCategory, searchQuery, inStockOnly, companies]);

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<Company> | Company[]>('/portal/companies/');
      if (response.data) {
        const companiesList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as PaginatedResponse<Company>).results || [];
        // Filter for approved connections (case-insensitive)
        setCompanies(companiesList.filter((c: Company) => 
          c.status && c.status.toUpperCase() === 'APPROVED'
        ));
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setError('Failed to load connected companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/portal/products/?';
      const params = new URLSearchParams();
      
      if (selectedCompany) params.append('company_id', selectedCompany);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (inStockOnly) params.append('in_stock', 'true');
      
      const response = await apiClient.get<PaginatedResponse<Product> | Product[]>(`${url}${params.toString()}`);
      if (response.data) {
        const productsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as PaginatedResponse<Product>).results || [];
        setProducts(productsList);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<{name: string}> | {name: string}[]>('/portal/categories/');
      if (response.data) {
        const categoriesList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as PaginatedResponse<{name: string}>).results || [];
        const uniqueCategories = Array.from(new Set(categoriesList.map((c: any) => c.name)));
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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
    setSuccess(`Added ${product.name} to cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => 
      sum + (parseFloat(item.product.price) * item.quantity), 0
    ).toFixed(2);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    // Group items by company
    const ordersByCompany = cart.reduce((acc, item) => {
      const companyId = item.product.company.id;
      if (!acc[companyId]) {
        acc[companyId] = {
          company_id: companyId,
          company_name: item.product.company.name,
          items: []
        };
      }
      acc[companyId].items.push({
        product_id: item.product.id,
        quantity: item.quantity
      });
      return acc;
    }, {} as Record<string, any>);

    setPlacingOrder(true);
    setError('');
    setSuccess('');

    try {
      // Place order for each company
      for (const order of Object.values(ordersByCompany)) {
        await apiClient.post('/portal/orders/place/', {
          company_id: order.company_id,
          items: order.items,
          delivery_address: deliveryAddress,
          notes: orderNotes
        });
      }

      setSuccess('Order(s) placed successfully!');
      setCart([]);
      setShowCart(false);
      setDeliveryAddress('');
      setOrderNotes('');
    } catch (error: any) {
      console.error('Failed to place order:', error);
      setError(error?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (companies.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <RetailerNavbar />
        <div className="container mx-auto p-6 text-center">
          <Package className="h-16 w-16 mx-auto text-neutral-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Companies Connected</h2>
          <p className="text-neutral-400 mb-4">Connect to a company first to browse products</p>
          <a href="/retailer/companies" className="text-blue-500 hover:underline">
            Go to Companies Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6">
        {/* Header with Cart */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Browse Products</h1>
            <p className="text-neutral-400 mt-2">Order products from connected companies</p>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Cart ({cart.length})
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Company Filter */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.company_id || company.id}>
                  {company.company_name || company.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* In Stock Filter */}
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              In Stock Only
            </label>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-neutral-400 mt-4">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-neutral-500 mb-4" />
            <p className="text-neutral-400">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-neutral-400">{product.company.name}</p>
                  {product.category && (
                    <span className="inline-block bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded mt-2">
                      {product.category}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{product.description}</p>
                )}

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-white">₹{product.price}</span>
                    <span className="text-sm text-neutral-400">/{product.unit}</span>
                  </div>
                  <div className="text-sm">
                    <span className={`${product.in_stock ? 'text-green-400' : 'text-red-400'}`}>
                      {product.in_stock ? `${product.available_quantity} available` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {product.brand && (
                  <p className="text-xs text-neutral-500 mb-2">Brand: {product.brand}</p>
                )}

                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.in_stock}
                  className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    product.in_stock
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-neutral-900 w-full max-w-md h-full overflow-y-auto border-l border-neutral-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-neutral-400 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-neutral-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{item.product.name}</h3>
                            <p className="text-sm text-neutral-400">{item.product.company.name}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="bg-neutral-700 text-white p-1 rounded hover:bg-neutral-600"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="bg-neutral-700 text-white p-1 rounded hover:bg-neutral-600"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="text-white font-semibold">
                            ₹{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Form */}
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Delivery Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={3}
                        placeholder="Enter delivery address..."
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Order Notes (Optional)
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={2}
                        placeholder="Any special instructions..."
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Total and Checkout */}
                  <div className="border-t border-neutral-800 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-white">₹{calculateTotal()}</span>
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={placingOrder || cart.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      {placingOrder ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseProductsPage;
