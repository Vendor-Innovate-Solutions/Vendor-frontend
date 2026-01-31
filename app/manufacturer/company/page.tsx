"use client";
import React, { useState, useEffect, Suspense } from "react";
import { apiClient } from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Settings, Plus, Trash2, Edit2, Save, X } from "lucide-react";

// Types matching API documentation
interface CompanyFeatures {
  inventory_enabled: boolean;
  hr_enabled: boolean;
  logistics_enabled: boolean;
  workflow_enabled: boolean;
  portal_enabled: boolean;
  pricing_enabled: boolean;
}

interface CompanyAddress {
  id?: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  is_active?: boolean;
}

interface Company {
  id: string;
  code: string;
  name: string;
  legal_name: string;
  company_type: string;
  timezone: string;
  language: string;
  base_currency: string;
  base_currency_code?: string;
  base_currency_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

const COMPANY_TYPES = [
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "PUBLIC_LIMITED", label: "Public Limited" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "LLP", label: "Limited Liability Partnership" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "UTC", label: "UTC" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "US/Eastern", label: "US/Eastern (EST)" },
  { value: "US/Pacific", label: "US/Pacific (PST)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

const ADDRESS_TYPES = [
  { value: "REGISTERED", label: "Registered Address" },
  { value: "BILLING", label: "Billing Address" },
  { value: "SHIPPING", label: "Shipping Address" },
  { value: "BRANCH", label: "Branch Office" },
];

function CompanyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstTime = searchParams.get("first") === "true";

  // Company state
  const [company, setCompany] = useState<Company | null>(null);
  const [features, setFeatures] = useState<CompanyFeatures | null>(null);
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "features" | "addresses">("details");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Editable form states
  const [editCompany, setEditCompany] = useState<Partial<Company>>({});
  const [editFeatures, setEditFeatures] = useState<CompanyFeatures | null>(null);
  const [newAddress, setNewAddress] = useState<CompanyAddress | null>(null);

  // Fetch company data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      const companyId = localStorage.getItem("company_id");
      if (!companyId) {
        setError("No company selected");
        setLoading(false);
        return;
      }

      try {
        // Fetch company details
        const companyRes = await apiClient.get<Company>(`/company/${companyId}/`);
        if (companyRes.data) {
          setCompany(companyRes.data);
          setEditCompany(companyRes.data);
        } else if (companyRes.error) {
          setError(companyRes.error);
        }

        // Fetch features
        const featuresRes = await apiClient.get<CompanyFeatures>(`/company/${companyId}/features/`);
        if (featuresRes.data) {
          setFeatures(featuresRes.data);
          setEditFeatures(featuresRes.data);
        }

        // Fetch addresses
        const addressesRes = await apiClient.get<CompanyAddress[]>(`/company/${companyId}/addresses/`);
        if (addressesRes.data) {
          setAddresses(addressesRes.data);
        }

        // Fetch currencies for dropdown
        const currenciesRes = await apiClient.get<Currency[]>("/company/currencies/", false);
        if (currenciesRes.data) {
          setCurrencies(currenciesRes.data);
        }
      } catch (err) {
        setError("Failed to fetch company data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update company details
  const handleUpdateCompany = async () => {
    if (!company?.id) return;
    setError("");
    setMessage("");

    try {
      const res = await apiClient.patch<Company>(`/company/${company.id}/`, {
        name: editCompany.name,
        legal_name: editCompany.legal_name,
        company_type: editCompany.company_type,
        timezone: editCompany.timezone,
        language: editCompany.language,
      });

      if (res.data) {
        setCompany(res.data);
        setMessage("Company details updated successfully!");
        setIsEditing(false);
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError("Failed to update company");
    }
  };

  // Update features
  const handleUpdateFeatures = async () => {
    if (!company?.id || !editFeatures) return;
    setError("");
    setMessage("");

    try {
      const res = await apiClient.put<CompanyFeatures>(`/company/${company.id}/features/`, editFeatures);

      if (res.data) {
        setFeatures(res.data);
        setMessage("Features updated successfully!");
        setIsEditing(false);
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError("Failed to update features");
    }
  };

  // Add new address
  const handleAddAddress = async () => {
    if (!company?.id || !newAddress) return;
    setError("");
    setMessage("");

    try {
      const res = await apiClient.post<CompanyAddress>(`/company/${company.id}/addresses/`, {
        address_type: newAddress.address_type,
        address_line1: newAddress.address_line1,
        address_line2: newAddress.address_line2,
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.postal_code,
        country: newAddress.country,
        is_primary: newAddress.is_primary,
      });

      if (res.data) {
        setAddresses([...addresses, res.data]);
        setNewAddress(null);
        setMessage("Address added successfully!");
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError("Failed to add address");
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!company?.id) return;
    setError("");

    try {
      const res = await apiClient.delete(`/company/${company.id}/addresses/${addressId}/`);
      if (!res.error) {
        setAddresses(addresses.filter((a) => a.id !== addressId));
        setMessage("Address deleted successfully!");
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to delete address");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Company Profile</h1>
          {company && (
            <span className="text-gray-400 text-sm">
              Code: <span className="text-blue-400 font-mono">{company.code}</span>
            </span>
          )}
        </div>

        {/* Error/Message display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          <Button
            variant={activeTab === "details" ? "default" : "ghost"}
            onClick={() => setActiveTab("details")}
            className={activeTab === "details" ? "bg-blue-600" : "text-gray-400"}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Button
            variant={activeTab === "features" ? "default" : "ghost"}
            onClick={() => setActiveTab("features")}
            className={activeTab === "features" ? "bg-blue-600" : "text-gray-400"}
          >
            <Settings className="w-4 h-4 mr-2" />
            Features
          </Button>
          <Button
            variant={activeTab === "addresses" ? "default" : "ghost"}
            onClick={() => setActiveTab("addresses")}
            className={activeTab === "addresses" ? "bg-blue-600" : "text-gray-400"}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Addresses
          </Button>
        </div>

        {/* Company Details Tab */}
        {activeTab === "details" && company && (
          <Card className="bg-gray-900 text-white border border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Company Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Basic information about your company
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setIsEditing(false); setEditCompany(company); }}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleUpdateCompany}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  {isEditing ? (
                    <Input
                      value={editCompany.name || ""}
                      onChange={(e) => setEditCompany({ ...editCompany, name: e.target.value })}
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  ) : (
                    <p className="text-lg">{company.name}</p>
                  )}
                </div>
                <div>
                  <Label>Legal Name</Label>
                  {isEditing ? (
                    <Input
                      value={editCompany.legal_name || ""}
                      onChange={(e) => setEditCompany({ ...editCompany, legal_name: e.target.value })}
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  ) : (
                    <p className="text-lg">{company.legal_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Type</Label>
                  {isEditing ? (
                    <select
                      value={editCompany.company_type || ""}
                      onChange={(e) => setEditCompany({ ...editCompany, company_type: e.target.value })}
                      className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                    >
                      {COMPANY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-lg">
                      {COMPANY_TYPES.find((t) => t.value === company.company_type)?.label || company.company_type}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Timezone</Label>
                  {isEditing ? (
                    <select
                      value={editCompany.timezone || ""}
                      onChange={(e) => setEditCompany({ ...editCompany, timezone: e.target.value })}
                      className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-lg">{company.timezone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Language</Label>
                  {isEditing ? (
                    <select
                      value={editCompany.language || ""}
                      onChange={(e) => setEditCompany({ ...editCompany, language: e.target.value })}
                      className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-lg">
                      {LANGUAGES.find((l) => l.value === company.language)?.label || company.language}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Base Currency</Label>
                  <p className="text-lg">
                    {company.base_currency_code} - {company.base_currency_name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-sm">
                    {company.created_at ? new Date(company.created_at).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Last Updated</Label>
                  <p className="text-sm">
                    {company.updated_at ? new Date(company.updated_at).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Tab */}
        {activeTab === "features" && features && (
          <Card className="bg-gray-900 text-white border border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Business Features</CardTitle>
                <CardDescription className="text-gray-400">
                  Enable or disable business modules
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setIsEditing(false); setEditFeatures(features); }}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleUpdateFeatures}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "inventory_enabled", label: "Inventory Management" },
                  { key: "hr_enabled", label: "HR Management" },
                  { key: "logistics_enabled", label: "Logistics" },
                  { key: "workflow_enabled", label: "Workflow Automation" },
                  { key: "portal_enabled", label: "Customer Portal" },
                  { key: "pricing_enabled", label: "Dynamic Pricing" },
                ].map((feature) => (
                  <div
                    key={feature.key}
                    className={`p-4 rounded-lg border ${
                      (editFeatures as any)?.[feature.key]
                        ? "border-green-500 bg-green-900/20"
                        : "border-gray-700 bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{feature.label}</span>
                      {isEditing ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editFeatures as any)?.[feature.key] || false}
                            onChange={(e) =>
                              setEditFeatures({
                                ...editFeatures!,
                                [feature.key]: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            (features as any)?.[feature.key]
                              ? "bg-green-600 text-white"
                              : "bg-gray-600 text-gray-300"
                          }`}
                        >
                          {(features as any)?.[feature.key] ? "Enabled" : "Disabled"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <div className="space-y-4">
            {/* Existing Addresses */}
            {addresses.map((address) => (
              <Card key={address.id} className="bg-gray-900 text-white border border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                      {ADDRESS_TYPES.find((t) => t.value === address.address_type)?.label || address.address_type}
                    </span>
                    {address.is_primary && (
                      <span className="px-2 py-1 bg-green-600 rounded text-xs">Primary</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => address.id && handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="py-2">
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>
                    {address.city}, {address.state} - {address.postal_code}
                  </p>
                  <p className="text-gray-400">{address.country}</p>
                </CardContent>
              </Card>
            ))}

            {/* Add New Address Form */}
            {newAddress ? (
              <Card className="bg-gray-900 text-white border border-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg">Add New Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Address Type</Label>
                      <select
                        value={newAddress.address_type}
                        onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value })}
                        className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                      >
                        {ADDRESS_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={newAddress.is_primary}
                        onChange={(e) => setNewAddress({ ...newAddress, is_primary: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label>Primary Address</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Address Line 1</Label>
                    <Input
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      placeholder="Street address"
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>

                  <div>
                    <Label>Address Line 2</Label>
                    <Input
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      placeholder="Floor, Building, etc."
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddAddress} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Address
                    </Button>
                    <Button variant="outline" onClick={() => setNewAddress(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={() =>
                  setNewAddress({
                    address_type: "REGISTERED",
                    address_line1: "",
                    address_line2: "",
                    city: "",
                    state: "",
                    postal_code: "",
                    country: "IN",
                    is_primary: addresses.length === 0,
                  })
                }
                className="w-full bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
      <CompanyPageContent />
    </Suspense>
  );
}
