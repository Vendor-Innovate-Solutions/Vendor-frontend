"use client";
import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken, refreshAccessToken } from '@/utils/auth_fn';
import { Package, Warehouse, TrendingUp } from 'lucide-react';

interface StockBalance {
  product_id: string;
  product_name: string;
  godown_name: string;
  quantity: string;
  unit: string;
}

interface DetailedBalance {
  product_id: string;
  product_name: string;
  total_quantity: string;
  unit: string;
  by_godown: {
    godown_id: string;
    godown_name: string;
    quantity: string;
  }[];
}

export default function StockBalance() {
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<DetailedBalance | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    godown_id: '',
    product_id: '',
  });
  const [godowns, setGodowns] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ product_id: string; name: string }[]>([]);

  useEffect(() => {
    fetchGodowns();
    fetchProducts();
    fetchBalances();
  }, [filters]);

  const fetchGodowns = async () => {
    try {
      let token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/inventory/godowns/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGodowns(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch godowns:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      let token = await getAuthToken();
      if (!token) return;

      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}/catalog/products/?company=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchBalances = async () => {
    try {
      setLoading(true);
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filters.godown_id) params.append('godown_id', filters.godown_id);
      if (filters.product_id) params.append('product_id', filters.product_id);

      const response = await fetch(
        `${API_URL}/inventory/balances/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(
            `${API_URL}/inventory/balances/?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setBalances(Array.isArray(data) ? data : data.results || []);
          }
        }
      } else if (response.ok) {
        const data = await response.json();
        setBalances(Array.isArray(data) ? data : data.results || []);
      } else {
        setError('Failed to fetch stock balances');
      }
    } catch (err) {
      setError('Failed to load stock balances');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedBalance = async (productId: string) => {
    try {
      let token = await getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${API_URL}/inventory/balance/?product_id=${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch detailed balance:', err);
    }
  };

  const groupedBalances = balances.reduce((acc, balance) => {
    if (!acc[balance.product_name]) {
      acc[balance.product_name] = [];
    }
    acc[balance.product_name].push(balance);
    return acc;
  }, {} as Record<string, StockBalance[]>);

  if (loading) {
    return <div className="text-blue-300">Loading stock balances...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Stock Balance
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-blue-200">Warehouse</label>
            <select
              value={filters.godown_id}
              onChange={(e) => setFilters({ ...filters, godown_id: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            >
              <option value="">All Warehouses</option>
              {godowns.map((godown) => (
                <option key={godown.id} value={godown.id}>
                  {godown.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-blue-200">Product</label>
            <select
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>}

      {/* Balance Display */}
      <div className="space-y-4">
        {Object.keys(groupedBalances).length === 0 ? (
          <div className="text-center text-gray-400 py-8 bg-gray-900 rounded-lg border border-gray-700">
            No stock balances found
          </div>
        ) : (
          Object.entries(groupedBalances).map(([productName, productBalances]) => {
            const totalQty = productBalances.reduce(
              (sum, b) => sum + parseFloat(b.quantity),
              0
            );
            const unit = productBalances[0]?.unit || '';

            return (
              <div
                key={productName}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-300">{productName}</h3>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total: {totalQty.toFixed(3)} {unit}
                    </p>
                  </div>
                  <button
                    onClick={() => fetchDetailedBalance(productBalances[0].product_id)}
                    className="px-3 py-1 text-sm bg-blue-700 text-white rounded hover:bg-blue-800"
                  >
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {productBalances.map((balance, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800 border border-gray-700 rounded p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Warehouse className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">
                          {balance.godown_name}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {parseFloat(balance.quantity).toFixed(3)} {balance.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Balance Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Stock Details: {selectedProduct.product_name}
            </h2>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-200">Total Stock Across All Warehouses</p>
              <p className="text-2xl font-bold text-blue-300 mt-1">
                {parseFloat(selectedProduct.total_quantity).toFixed(3)}{' '}
                {selectedProduct.unit}
              </p>
            </div>

            <h3 className="text-sm font-semibold text-blue-300 mb-3">
              Stock by Warehouse
            </h3>
            <div className="space-y-2">
              {selectedProduct.by_godown.map((godown) => (
                <div
                  key={godown.godown_id}
                  className="bg-gray-800 border border-gray-700 rounded p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-blue-400" />
                    <span className="text-white">{godown.godown_name}</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-300">
                    {parseFloat(godown.quantity).toFixed(3)} {selectedProduct.unit}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
