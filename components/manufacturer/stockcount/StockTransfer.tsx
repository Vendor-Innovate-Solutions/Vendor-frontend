"use client";
import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken, refreshAccessToken } from '@/utils/auth_fn';
import { ArrowRightLeft, CheckCircle } from 'lucide-react';

interface TransferFormData {
  product_id: string;
  from_godown_id: string;
  to_godown_id: string;
  quantity: string;
  transfer_date: string;
  notes: string;
}

export default function StockTransfer() {
  const [products, setProducts] = useState<{ product_id: string; name: string }[]>([]);
  const [godowns, setGodowns] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<TransferFormData>({
    product_id: '',
    from_godown_id: '',
    to_godown_id: '',
    quantity: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchGodowns();
  }, []);

  const fetchProducts = async () => {
    try {
      let token = await getAuthToken();
      if (!token) return;

      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}/products/?company=${companyId}`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.from_godown_id === formData.to_godown_id) {
      setError('Source and destination warehouses cannot be the same');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/inventory/transfers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: formData.product_id,
          from_godown_id: formData.from_godown_id,
          to_godown_id: formData.to_godown_id,
          quantity: formData.quantity,
          transfer_date: formData.transfer_date,
          notes: formData.notes,
        }),
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(`${API_URL}/inventory/transfers/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              product_id: formData.product_id,
              from_godown_id: formData.from_godown_id,
              to_godown_id: formData.to_godown_id,
              quantity: formData.quantity,
              transfer_date: formData.transfer_date,
              notes: formData.notes,
            }),
          });

          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setSuccess(data.message || 'Stock transferred successfully!');
            // Reset form
            setFormData({
              product_id: '',
              from_godown_id: '',
              to_godown_id: '',
              quantity: '',
              transfer_date: new Date().toISOString().split('T')[0],
              notes: '',
            });
          } else {
            const errorData = await retryResponse.json();
            setError(errorData.error || 'Failed to transfer stock');
          }
        }
      } else if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || 'Stock transferred successfully!');
        // Reset form
        setFormData({
          product_id: '',
          from_godown_id: '',
          to_godown_id: '',
          quantity: '',
          transfer_date: new Date().toISOString().split('T')[0],
          notes: '',
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to transfer stock');
      }
    } catch (err) {
      setError('Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id: string) => {
    return products.find((p) => p.product_id === id)?.name || '';
  };

  const getGodownName = (id: string) => {
    return godowns.find((g) => g.id === id)?.name || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6" />
          Stock Transfer
        </h2>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">
          Transfer Stock Between Warehouses
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
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
                min="0.001"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-blue-200">
                From Warehouse *
              </label>
              <select
                value={formData.from_godown_id}
                onChange={(e) =>
                  setFormData({ ...formData, from_godown_id: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
              >
                <option value="">Select Source Warehouse</option>
                {godowns
                  .filter((g) => g.id !== formData.to_godown_id)
                  .map((godown) => (
                    <option key={godown.id} value={godown.id}>
                      {godown.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-blue-200">
                To Warehouse *
              </label>
              <select
                value={formData.to_godown_id}
                onChange={(e) =>
                  setFormData({ ...formData, to_godown_id: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
              >
                <option value="">Select Destination Warehouse</option>
                {godowns
                  .filter((g) => g.id !== formData.from_godown_id)
                  .map((godown) => (
                    <option key={godown.id} value={godown.id}>
                      {godown.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-blue-200">
              Transfer Date *
            </label>
            <input
              type="date"
              value={formData.transfer_date}
              onChange={(e) =>
                setFormData({ ...formData, transfer_date: e.target.value })
              }
              required
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-blue-200">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
              placeholder="Add any notes or comments about this transfer..."
            />
          </div>

          {error && (
            <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>
          )}

          {success && (
            <div className="text-green-400 bg-green-900/20 p-3 rounded flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Transfer Preview */}
          {formData.product_id &&
            formData.from_godown_id &&
            formData.to_godown_id &&
            formData.quantity && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-3">
                  Transfer Preview
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 text-center">
                    <p className="text-gray-400 mb-1">From</p>
                    <p className="text-white font-semibold">
                      {getGodownName(formData.from_godown_id)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 px-4">
                    <ArrowRightLeft className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-gray-400 mb-1">To</p>
                    <p className="text-white font-semibold">
                      {getGodownName(formData.to_godown_id)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-700/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Product</p>
                      <p className="text-white font-semibold">
                        {getProductName(formData.product_id)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Quantity</p>
                      <p className="text-white font-semibold">
                        {parseFloat(formData.quantity).toFixed(3)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing Transfer...' : 'Transfer Stock'}
          </button>
        </form>
      </div>

      {/* Information Box */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">
          Important Information
        </h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Stock will be deducted from the source warehouse</li>
          <li>• Stock will be added to the destination warehouse</li>
          <li>• Transfer creates movement records for tracking</li>
          <li>• Ensure sufficient stock is available at source warehouse</li>
        </ul>
      </div>
    </div>
  );
}
