"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, User } from 'lucide-react';
import { PRODUCTS, ORDERS, fetchStockFromAPI, fetchOrdersFromAPI } from '../../../components/retailer/data/mockData';
import { API_URL } from '../../../utils/auth_fn';
import { authStorage } from '../../../utils/localStorage';
const DashboardTab = () => {
  const [search, setSearch] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      await fetchStockFromAPI();
      await fetchOrdersFromAPI();

      // Fetch total orders from count API
      try {
        const token = authStorage.getAccessToken();
        if (!token) throw new Error('Authentication token not found. Please log in again.');

        const response = await fetch(`${API_URL}/count/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`Count API request failed with status ${response.status}`);

        const data = await response.json();
        setTotalOrders(data.orders_placed);
      } catch (error) {
        console.error('Failed to fetch total orders from API:', error);
      }

      // Calculate total spent from ORDERS
      const totalSpent = ORDERS.reduce((sum, order) => sum + order.total, 0);
      setTotalSpent(totalSpent);
    };

    fetchData();
  }, []);

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = search === '' || 
      (product.name && product.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="text-xl font-bold">Store Name</div>
            <div className="flex-1 mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full max-w-xl px-4 py-2 bg-gray-900 rounded-lg text-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center">
                <ShoppingCart className="w-6 h-6" />
                <span className="ml-2">Cart</span>
              </button>
              <button className="flex items-center">
                <User className="w-6 h-6" />
                <span className="ml-2">Account</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 max-w-[1600px] mx-auto">
          {/* Welcome Card */}
          <div className="bg-white text-black rounded-lg p-6 mb-8">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-gray-600 mt-2">You have {ORDERS.length} active orders</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-gray-400 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold">{totalOrders}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-gray-400 mb-2">Total Spent</h3>
              <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-gray-400 mb-2">Active Cart Items</h3>
              <p className="text-3xl font-bold">3</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
            <div className="space-y-4">
              {ORDERS.map(order => (
                <div key={order.id} className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{order.id}</h3>
                      <p className="text-gray-400">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.total.toFixed(2)}</p>
                      <p className="text-gray-400">{order.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtered Products */}
          <div>
            <h2 className="text-xl font-bold mb-4">Filtered Products</h2>
            <div className="grid grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-gray-900 p-4 rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-400">{product.stock} in stock</span>
                  </div>
                  <button className="w-full mt-4 bg-white text-black py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardTab;