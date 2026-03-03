"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, Search, Filter, Calendar } from "lucide-react";
import Link from "next/link";
import { getAuthHeaders } from "@/utils/api";
import { API_BASE_URL } from "@/utils/config";

interface PriceList {
  id: string;
  name: string;
  price_list_type: string;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  description: string;
  created_at: string;
  items_count?: number;
}

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    fetchPriceLists();
  }, [typeFilter, activeFilter]);

  const fetchPriceLists = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const params = new URLSearchParams();
      
      if (typeFilter !== "ALL") {
        params.append("price_list_type", typeFilter);
      }
      if (activeFilter === "ACTIVE") {
        params.append("is_active", "true");
      } else if (activeFilter === "INACTIVE") {
        params.append("is_active", "false");
      }
      
      const response = await fetch(
        `${API_BASE_URL}/orders/price-lists/?${params.toString()}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPriceLists(data.results || data);
      }
    } catch (error) {
      console.error("Error fetching price lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLists = priceLists.filter((list) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      STANDARD: "bg-blue-500/20 text-blue-400 border-blue-500",
      WHOLESALE: "bg-purple-500/20 text-purple-400 border-purple-500",
      RETAIL: "bg-green-500/20 text-green-400 border-green-500",
      SPECIAL: "bg-orange-500/20 text-orange-400 border-orange-500",
    };
    return colors[type] || "bg-gray-500/20 text-gray-400 border-gray-500";
  };

  const isValidNow = (validFrom: string | null, validTo: string | null) => {
    const now = new Date();
    if (validFrom && new Date(validFrom) > now) return false;
    if (validTo && new Date(validTo) < now) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">Price Lists</h1>
            <p className="text-gray-400">Manage pricing for different customer segments</p>
          </div>
          <Link
            href="/manufacturer/sales/price-lists/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Price List
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by price list name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="STANDARD">Standard</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="RETAIL">Retail</option>
                <option value="SPECIAL">Special</option>
              </select>
            </div>

            {/* Active Filter */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Price Lists Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <Tag className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Price Lists Found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Try adjusting your search" : "Get started by creating your first price list"}
            </p>
            {!searchTerm && (
              <Link
                href="/manufacturer/sales/price-lists/create"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Price List
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLists.map((list) => {
              const validNow = isValidNow(list.valid_from, list.valid_to);
              return (
                <Link
                  key={list.id}
                  href={`/manufacturer/sales/price-lists/${list.id}`}
                  className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{list.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(list.price_list_type)}`}>
                        {list.price_list_type}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {list.is_active ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500">
                          Inactive
                        </span>
                      )}
                      {!validNow && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {list.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{list.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {list.valid_from && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>From: {new Date(list.valid_from).toLocaleDateString()}</span>
                      </div>
                    )}
                    {list.valid_to && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>To: {new Date(list.valid_to).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Created: {new Date(list.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
