"use client";
import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken, refreshAccessToken } from '@/utils/auth_fn';
import { Package2, Plus, Pencil, Trash2, Eye } from 'lucide-react';

interface StockItem {
  id: string;
  product_id: string;
  product_name: string;
  godown_id: string;
  godown_name: string;
  quantity: string;
  unit: string;
  status: string;
  created_at: string;
}

interface StockItemFormData {
  product_id: string;
  godown_id: string;
  quantity: string;
  unit: string;
}

export default function StockItems() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<StockItemFormData>({
    product_id: '',
    godown_id: '',
    quantity: '',
    unit: 'PCS',
  });
  const [products, setProducts] = useState<{ product_id: string; name: string }[]>([]);
  const [godowns, setGodowns] = useState<{ id: string; name: string }[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filters, setFilters] = useState({
    godown: '',
    product: '',
    status: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchGodowns();
  }, []);

  useEffect(() => {
    fetchStockItems();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      let token = await getAuthToken();
      if (!token) return;

      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}/api/catalog/products/`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...(companyId && { "X-Company-ID": companyId }),
        },
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

      const response = await fetch(`${API_URL}/api/inventory/godowns/`, {
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

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (filters.godown) params.append('godown', filters.godown);
      if (filters.product) params.append('product', filters.product);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(
        `${API_URL}/api/inventory/items/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(
            `${API_URL}/api/inventory/items/?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setStockItems(Array.isArray(data) ? data : data.results || []);
          }
        }
      } else if (response.ok) {
        const data = await response.json();
        setStockItems(Array.isArray(data) ? data : data.results || []);
      } else {
        setError('Failed to fetch stock items');
      }
    } catch (err) {
      setError('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const url = editingItem
        ? `${API_URL}/api/inventory/items/${editingItem.id}/`
        : `${API_URL}/api/inventory/items/`;

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });
          if (retryResponse.ok) {
            await fetchStockItems();
            setShowModal(false);
            resetForm();
          } else {
            const errorData = await retryResponse.json();
            setError(errorData.error || 'Failed to save stock item');
          }
        }
      } else if (response.ok) {
        await fetchStockItems();
        setShowModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save stock item');
      }
    } catch (err) {
      setError('Failed to save stock item');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;

    try {
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/api/inventory/items/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(`${API_URL}/api/inventory/items/${id}/`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (retryResponse.ok) {
            await fetchStockItems();
          }
        }
      } else if (response.ok) {
        await fetchStockItems();
      } else {
        setError('Failed to delete stock item');
      }
    } catch (err) {
      setError('Failed to delete stock item');
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      godown_id: item.godown_id,
      quantity: item.quantity,
      unit: item.unit,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      godown_id: '',
      quantity: '',
      unit: 'PCS',
    });
    setEditingItem(null);
    setError('');
  };

  if (loading) {
    return <div className="text-blue-300">Loading stock items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Package2 className="h-6 w-6" />
          Stock Items Management
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Stock Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1 text-blue-200">Warehouse</label>
            <select
              value={filters.godown}
              onChange={(e) => setFilters({ ...filters, godown: e.target.value })}
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
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
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
            <label className="block text-sm mb-1 text-blue-200">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="LOW">Low Stock</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>}

      {/* Stock Items Table */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {stockItems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No stock items found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-blue-300 font-semibold">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-blue-300 font-semibold">
                    Warehouse
                  </th>
                  <th className="text-right py-3 px-4 text-blue-300 font-semibold">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-blue-300 font-semibold">
                    Unit
                  </th>
                  <th className="text-left py-3 px-4 text-blue-300 font-semibold">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-blue-300 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {item.product_name}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{item.godown_name}</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">
                      {parseFloat(item.quantity).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{item.unit}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.status === 'AVAILABLE'
                            ? 'bg-green-900 text-green-300'
                            : item.status === 'RESERVED'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-700 text-white rounded hover:bg-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-white">
              {editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Product *
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  required
                  disabled={!!editingItem}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 disabled:opacity-50"
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Warehouse *
                </label>
                <select
                  value={formData.godown_id}
                  onChange={(e) =>
                    setFormData({ ...formData, godown_id: e.target.value })
                  }
                  required
                  disabled={!!editingItem}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 disabled:opacity-50"
                >
                  <option value="">Select Warehouse</option>
                  {godowns.map((godown) => (
                    <option key={godown.id} value={godown.id}>
                      {godown.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  required
                  min="0"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-blue-200">Unit *</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  placeholder="e.g., PCS, KG, LTR"
                />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded disabled:opacity-50"
                >
                  {submitLoading
                    ? 'Saving...'
                    : editingItem
                    ? 'Update'
                    : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
