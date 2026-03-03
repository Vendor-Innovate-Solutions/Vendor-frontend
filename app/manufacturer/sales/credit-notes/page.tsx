"use client";

import React, { useState, useEffect } from "react";
import { Plus, FileText, Search, Filter } from "lucide-react";
import Link from "next/link";
import { getAuthHeaders } from "@/utils/api";
import { API_BASE_URL } from "@/utils/config";

interface CreditNote {
  id: string;
  credit_note_number: string;
  credit_note_date: string;
  party_id: string;
  party_name: string;
  reference_invoice_number: string | null;
  reference_type: string;
  reason: string;
  status: string;
  total_amount: string;
  created_at: string;
}

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchCreditNotes();
  }, [statusFilter]);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(
        `${API_BASE_URL}/orders/credit-notes/?${params.toString()}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCreditNotes(data.results || data);
      }
    } catch (error) {
      console.error("Error fetching credit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = creditNotes.filter((note) =>
    note.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.party_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500",
      APPROVED: "bg-green-500/20 text-green-400 border-green-500",
      APPLIED: "bg-blue-500/20 text-blue-400 border-blue-500",
      CANCELLED: "bg-red-500/20 text-red-400 border-red-500",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">Credit Notes</h1>
            <p className="text-gray-400">Manage customer returns and credit notes</p>
          </div>
          <Link
            href="/manufacturer/sales/credit-notes/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Credit Note
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
                  placeholder="Search by credit note number or party..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="APPLIED">Applied</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Credit Notes List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Credit Notes Found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Try adjusting your search" : "Get started by creating your first credit note"}
            </p>
            {!searchTerm && (
              <Link
                href="/manufacturer/sales/credit-notes/create"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Credit Note
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/manufacturer/sales/credit-notes/${note.id}`}
                className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {note.credit_note_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(note.status)}`}>
                        {note.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Party: </span>
                        <span className="text-white">{note.party_name}</span>
                      </div>
                      {note.reference_invoice_number && (
                        <div>
                          <span className="text-gray-400">Reference Invoice: </span>
                          <span className="text-white">{note.reference_invoice_number}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Date: </span>
                        <span className="text-white">
                          {new Date(note.credit_note_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-sm text-gray-400 mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-green-400">
                      ₹{parseFloat(note.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
