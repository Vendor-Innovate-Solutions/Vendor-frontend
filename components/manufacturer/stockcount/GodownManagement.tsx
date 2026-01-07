"use client";
import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken, refreshAccessToken } from '@/utils/auth_fn';
import { Warehouse, Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface Godown {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
}

interface GodownFormData {
  name: string;
  location: string;
  is_active: boolean;
}

export default function GodownManagement() {
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGodown, setEditingGodown] = useState<Godown | null>(null);
  const [formData, setFormData] = useState<GodownFormData>({
    name: '',
    location: '',
    is_active: true,
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchGodowns();
  }, []);

  const fetchGodowns = async () => {
    try {
      setLoading(true);
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/inventory/godowns/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(`${API_URL}/inventory/godowns/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setGodowns(Array.isArray(data) ? data : data.results || []);
          }
        }
      } else if (response.ok) {
        const data = await response.json();
        setGodowns(Array.isArray(data) ? data : data.results || []);
      } else {
        setError('Failed to fetch godowns');
      }
    } catch (err) {
      setError('Failed to load godowns');
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

      const url = editingGodown
        ? `${API_URL}/inventory/godowns/${editingGodown.id}/`
        : `${API_URL}/inventory/godowns/`;

      const method = editingGodown ? 'PUT' : 'POST';

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
            await fetchGodowns();
            setShowModal(false);
            resetForm();
          } else {
            const errorData = await retryResponse.json();
            setError(errorData.error || 'Failed to save godown');
          }
        }
      } else if (response.ok) {
        await fetchGodowns();
        setShowModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save godown');
      }
    } catch (err) {
      setError('Failed to save godown');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this godown?')) return;

    try {
      let token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/inventory/godowns/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          const retryResponse = await fetch(`${API_URL}/inventory/godowns/${id}/`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (retryResponse.ok) {
            await fetchGodowns();
          }
        }
      } else if (response.ok) {
        await fetchGodowns();
      } else {
        setError('Failed to delete godown');
      }
    } catch (err) {
      setError('Failed to delete godown');
    }
  };

  const handleEdit = (godown: Godown) => {
    setEditingGodown(godown);
    setFormData({
      name: godown.name,
      location: godown.location,
      is_active: godown.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      is_active: true,
    });
    setEditingGodown(null);
    setError('');
  };

  if (loading) {
    return <div className="text-blue-300">Loading godowns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          Warehouse Management
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Warehouse
        </button>
      </div>

      {error && <div className="text-red-400 bg-red-900/20 p-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {godowns.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-8">
            No warehouses found. Create your first warehouse!
          </div>
        ) : (
          godowns.map((godown) => (
            <div
              key={godown.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-300">{godown.name}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {godown.location}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    godown.is_active
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {godown.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(godown)}
                  className="flex-1 px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 flex items-center justify-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(godown.id)}
                  className="px-3 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-white">
              {editingGodown ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  placeholder="e.g., Main Warehouse"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700"
                />
                <label htmlFor="is_active" className="text-sm text-blue-200">
                  Active Warehouse
                </label>
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : editingGodown ? 'Update' : 'Create'}
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
