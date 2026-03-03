"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Tag, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/utils/api";
import { toast } from "sonner";
import { API_BASE_URL } from "@/utils/config";

interface Product {
  id: string;
  name: string;
  hsn_code?: string;
}

interface PriceListItem {
  product: string;
  unit_price: number;
  min_quantity: number;
  discount_percent: number;
}

export default function CreatePriceListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    price_list_type: "STANDARD",
    is_active: true,
    valid_from: "",
    valid_to: "",
    description: "",
  });

  const [items, setItems] = useState<PriceListItem[]>([
    {
      product: "",
      unit_price: 0,
      min_quantity: 1,
      discount_percent: 0,
    },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/catalog/products/", { headers });
      if (response.ok) {
        const data = await response.json();
        console.log("Products response:", data);
        // API returns { products: [...] }
        const productList = data.products || data.results || data;
        setProducts(Array.isArray(productList) ? productList : []);
      } else {
        console.error("Failed to fetch products:", response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product: "",
        unit_price: 0,
        min_quantity: 1,
        discount_percent: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PriceListItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      toast.error("Please enter a price list name");
      return;
    }

    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Create price list
      const priceListPayload = {
        ...formData,
        valid_from: formData.valid_from || null,
        valid_to: formData.valid_to || null,
      };

      const response = await fetch(`${API_BASE_URL}/orders/price-lists/", {
        method: "POST",
        headers,
        body: JSON.stringify(priceListPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.detail || error.message || "Failed to create price list");
        setLoading(false);
        return;
      }

      const priceList = await response.json();

      // Add items if any are valid
      const validItems = items.filter(item => item.product && item.unit_price > 0);
      
      if (validItems.length > 0) {
        for (const item of validItems) {
          await fetch(`${API_BASE_URL}/orders/price-lists/${priceList.id}/items/`, {
            method: "POST",
            headers,
            body: JSON.stringify(item),
          });
        }
      }

      toast.success("Price list created successfully!");
      router.push("/manufacturer/sales/price-lists");
    } catch (error) {
      console.error("Error creating price list:", error);
      toast.error("Failed to create price list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/manufacturer/sales/price-lists"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Price Lists
          </Link>
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-purple-400">Create Price List</h1>
              <p className="text-gray-400">Set up pricing for different customer segments</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price List Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wholesale 2024, Retail Pricing"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.price_list_type}
                  onChange={(e) => setFormData({ ...formData, price_list_type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="STANDARD">Standard</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="RETAIL">Retail</option>
                  <option value="SPECIAL">Special</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valid From</label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valid To</label>
                <input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this price list"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Price List Items */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Products & Pricing</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-400">Product {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Product</label>
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(index, "product", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Unit Price (₹)</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Min Qty</label>
                      <input
                        type="number"
                        value={item.min_quantity}
                        onChange={(e) => updateItem(index, "min_quantity", parseInt(e.target.value))}
                        min="1"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs text-gray-400 mb-1">Discount %</label>
                      <input
                        type="number"
                        value={item.discount_percent}
                        onChange={(e) => updateItem(index, "discount_percent", parseFloat(e.target.value))}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-400">
              <p>💡 Tip: You can add products now or add them later from the price list details page</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/manufacturer/sales/price-lists"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Price List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
