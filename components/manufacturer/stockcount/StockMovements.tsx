"use client";
import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken, refreshAccessToken } from '@/utils/auth_fn';
import { History, ArrowUpCircle, ArrowDownCircle, Calendar, Filter } from 'lucide-react';

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  godown_id: string;
  godown_name: string;
  movement_type: 'IN' | 'OUT';
  quantity: string;
  reference_type: string;
  reference_id: string;
  movement_date: string;
  created_at: string;
}

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    product_id: '',
    godown_id: '',
    start_date: '',
    end_date: '',
  });
  const [products, setProducts] = useState<{ product_id: string; name: string }[]>([]);
  const [godowns, setGodowns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchGodowns();
    fetchMovements();
  }, [filters]);

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

  const fetchMovements = async () => {
    try {
      setLoading(true);
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.godown_id) params.append('godown_id', filters.godown_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(
        `${API_URL}/inventory/movements/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(
            `${API_URL}/inventory/movements/?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setMovements(Array.isArray(data) ? data : data.results || []);
          }
        }
      } else if (response.ok) {
        const data = await response.json();
        setMovements(Array.isArray(data) ? data : data.results || []);
      } else {
        setError('Failed to fetch stock movements');
      }
    } catch (err) {
      setError('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setFilters({
      product_id: '',
      godown_id: '',
      start_date: '',
      end_date: '',
    });
  };

  if (loading) {
    return <div className="text-blue-300">Loading stock movements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <History className="h-6 w-6" />
          Stock Movement History
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <label className="block text-sm mb-1 text-blue-200">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-blue-200">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>}

      {/* Movements List */}
      <div className="space-y-3">
        {movements.length === 0 ? (
          <div className="text-center text-gray-400 py-8 bg-gray-900 rounded-lg border border-gray-700">
            No stock movements found
          </div>
        ) : (
          movements.map((movement) => (
            <div
              key={movement.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`mt-1 p-2 rounded ${
                      movement.movement_type === 'IN'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}
                  >
                    {movement.movement_type === 'IN' ? (
                      <ArrowDownCircle className="h-5 w-5" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-300">
                          {movement.product_name}
                        </h3>
                        <p className="text-sm text-gray-400">{movement.godown_name}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            movement.movement_type === 'IN'
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {movement.movement_type === 'IN' ? '+' : '-'}
                          {parseFloat(movement.quantity).toFixed(3)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Movement Type</p>
                        <p className="text-sm text-white font-medium">
                          {movement.movement_type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reference</p>
                        <p className="text-sm text-white font-medium">
                          {movement.reference_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Date
                        </p>
                        <p className="text-sm text-white font-medium">
                          {formatDate(movement.movement_date)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        Created: {formatDateTime(movement.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {movements.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-3">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded p-3">
              <p className="text-sm text-gray-400">Total Movements</p>
              <p className="text-2xl font-bold text-blue-300">{movements.length}</p>
            </div>
            <div className="bg-green-900/20 rounded p-3">
              <p className="text-sm text-gray-400">Stock In</p>
              <p className="text-2xl font-bold text-green-400">
                {movements.filter((m) => m.movement_type === 'IN').length}
              </p>
            </div>
            <div className="bg-red-900/20 rounded p-3">
              <p className="text-sm text-gray-400">Stock Out</p>
              <p className="text-2xl font-bold text-red-400">
                {movements.filter((m) => m.movement_type === 'OUT').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
