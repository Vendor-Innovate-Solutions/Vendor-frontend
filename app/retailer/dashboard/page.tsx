"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, TrendingUp, Package, DollarSign, Building2, Users } from 'lucide-react';
import { PRODUCTS, ORDERS, fetchStockFromAPI, fetchOrdersFromAPI } from '../../../components/retailer/data/mockData';
import { API_URL, fetchWithAuth } from '../../../utils/auth_fn';
import { authStorage } from '../../../utils/localStorage';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';

const DashboardTab = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [connectedCompanies, setConnectedCompanies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  // Check if retailer profile exists
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/portal/retailers/profile/`);
        if (!response.ok) {
          // Profile doesn't exist, redirect to setup
          router.replace('/retailer/setup');
          return;
        }
        setProfileChecked(true);
      } catch (error) {
        // Profile doesn't exist, redirect to setup
        router.replace('/retailer/setup');
      }
    };

    checkProfile();
  }, [router]);

  useEffect(() => {
    if (!profileChecked) return; // Wait for profile check
    
    const fetchData = async () => {
      try {
        await fetchStockFromAPI();
        await fetchOrdersFromAPI();

        // Fetch total orders from retailer count API
        try {
          const response = await fetchWithAuth(`${API_URL}/api/portal/orders/`);
          if (response.ok) {
            const data = await response.json();
            setTotalOrders(data.total_orders || 0);
          }
        } catch (error) {
          console.error('Failed to fetch total orders from API:', error);
        }

        // Fetch connected companies count
        try {
          const response = await fetchWithAuth(`${API_URL}/api/portal/retailers/`);
          if (response.ok) {
            const data = await response.json();
            setConnectedCompanies(data.count || 0);
          }
        } catch (error) {
          console.error('Failed to fetch companies count:', error);
        }

        // Calculate total spent from ORDERS
        const totalSpent = ORDERS.reduce((sum, order) => sum + order.total, 0);
        setTotalSpent(totalSpent);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileChecked]);

  // Don't render dashboard if profile check hasn't completed
  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Checking profile...</div>
      </div>
    );
  }

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = search === '' || 
      (product.name && product.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
              <p className="text-neutral-400 mt-2">
                You have {ORDERS.length} active orders from {connectedCompanies} connected companies
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-80 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Orders</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : totalOrders}
                </p>
                <p className="text-sm text-green-400 mt-1">+12% from last month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Total Spent</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : `$${totalSpent.toFixed(2)}`}
                </p>
                <p className="text-sm text-green-400 mt-1">+8% from last month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Available Products</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : PRODUCTS.length}
                </p>
                <p className="text-sm text-blue-400 mt-1">From {connectedCompanies} companies</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Connected Companies</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : connectedCompanies}
                </p>
                <p className="text-sm text-neutral-400 mt-1">Active partnerships</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
          </div>
          <div className="p-6">
            {ORDERS.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">
                No orders yet. Browse products from your connected companies to place your first order.
              </p>
            ) : (
              <div className="space-y-4">
                {ORDERS.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors">
                    <div>
                      <h3 className="font-semibold text-white">{order.id}</h3>
                      <p className="text-neutral-400">{order.date} • {order.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">${order.total.toFixed(2)}</p>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-900/30 text-green-400' :
                        order.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-blue-900/30 text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Products */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold text-white">Available Products</h2>
            <p className="text-neutral-400">Products from your connected companies</p>
          </div>
          <div className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-400">
                  {search ? 'No products match your search.' : 'No products available. Connect to companies to see their products.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.slice(0, 8).map(product => (
                  <div key={product.id} className="border border-neutral-700 rounded-lg p-4 hover:shadow-lg hover:border-neutral-600 transition-all bg-neutral-800">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                    <p className="text-neutral-400 text-sm mb-2">{product.category}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-white">${product.price.toFixed(2)}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        product.stock > 10 ? 'bg-green-900/30 text-green-400' :
                        product.stock > 0 ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <button 
                      disabled={product.stock === 0}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;