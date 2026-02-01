"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { ChevronRight, ChevronLeft, Copy, Check } from "lucide-react";

type Phase = "A" | "B" | "C";

const COMPANY_TYPES = [
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
  "PARTNERSHIP",
  "PROPRIETORSHIP",
  "LLP",
];

const TIMEZONES = ["Asia/Kolkata", "UTC", "Asia/Dubai", "US/Eastern", "US/Pacific"];
const LANGUAGES = ["en", "hi"];

const generateCompanyCode = (name: string): string => {
  const base = name
    .toUpperCase()
    .replace(/PRIVATE|LIMITED|LTD|PV/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 8);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${suffix}`;
};

const CompanyOnboardingPage = () => {
  const [phase, setPhase] = useState<Phase>("A");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Phase A - Company Basics (for creation)
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [companyType, setCompanyType] = useState("PRIVATE_LIMITED");
  const [baseTimezone, setBaseTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("en");
  const [baseCurrencyId, setBaseCurrencyId] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Phase B - Business Settings
  const [inventoryEnabled, setInventoryEnabled] = useState(true);
  const [hrEnabled, setHrEnabled] = useState(false);
  const [logisticsEnabled, setLogisticsEnabled] = useState(false);
  const [workflowEnabled, setWorkflowEnabled] = useState(true);
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [pricingEnabled, setPricingEnabled] = useState(true);

  // Phase C - Addresses
  const [addresses, setAddresses] = useState([
    {
      addressType: "REGISTERED",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
      isPrimary: true,
    },
  ]);

  useEffect(() => {
    // Fetch currencies
    const fetchCurrencies = async () => {
      try {
        const response = await apiClient.get<any[]>("/company/currencies/", false);
        if (response.data) {
          setCurrencies(response.data);
          if (response.data.length > 0) {
            setBaseCurrencyId(response.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch currencies:", err);
      }
    };
    fetchCurrencies();
  }, []);

  const handleGenerateCode = () => {
    if (companyName.trim()) {
      setCompanyCode(generateCompanyCode(companyName));
    }
  };

  const handleCopyCode = () => {
    if (companyCode) {
      navigator.clipboard.writeText(companyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validatePhaseA = () => {
    if (!companyCode.trim()) {
      setError("Company code is required");
      return false;
    }
    if (!companyName.trim()) {
      setError("Company name is required");
      return false;
    }
    if (!legalName.trim()) {
      setError("Legal name is required");
      return false;
    }
    if (!baseCurrencyId) {
      setError("Please select a currency");
      return false;
    }
    setError("");
    return true;
  };

  const handleCreateCompany = async () => {
    if (!validatePhaseA()) return;

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        code: companyCode,
        name: companyName,
        legal_name: legalName,
        company_type: companyType,
        timezone: baseTimezone,
        language: language,
        base_currency_id: baseCurrencyId,
        is_active: true,
      };

      const response = await apiClient.post<{ company?: { id: string }; id?: string }>(
        "/company/create/",
        payload
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setCompanyId(response.data.company?.id || response.data.id || "");
        setPhase("B");
      }
    } catch (err) {
      console.error("Company Creation Error:", err);
      setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBusinessSettings = async () => {
    if (!companyId) {
      setError("Company ID not found. Please go back and create the company first.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        inventory_enabled: inventoryEnabled,
        hr_enabled: hrEnabled,
        logistics_enabled: logisticsEnabled,
        workflow_enabled: workflowEnabled,
        portal_enabled: portalEnabled,
        pricing_enabled: pricingEnabled,
      };

      const response = await apiClient.put(
        `/company/${companyId}/features/`,
        payload
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Proceed to Phase C
      setPhase("C");
    } catch (err) {
      console.error("Business Settings Error:", err);
      setError(err instanceof Error ? err.message : "Failed to save business settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPhase = () => {
    if (phase === "B") {
      setPhase("A");
    } else if (phase === "C") {
      setPhase("B");
    }
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setAddresses(updatedAddresses);
  };

  const validateAddresses = () => {
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i];
      if (!addr.addressLine1.trim()) {
        setError(`Address ${i + 1}: Address Line 1 is required`);
        return false;
      }
      if (!addr.city.trim()) {
        setError(`Address ${i + 1}: City is required`);
        return false;
      }
      if (!addr.state.trim()) {
        setError(`Address ${i + 1}: State is required`);
        return false;
      }
      if (!addr.postalCode.trim()) {
        setError(`Address ${i + 1}: Postal Code is required`);
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleCompleteSetup = async () => {
    if (!companyId) {
      setError("Company ID not found. Please go back and create the company first.");
      return;
    }

    if (!validateAddresses()) return;

    setIsLoading(true);
    setError("");

    try {
      // Save all addresses
      for (const address of addresses) {
        const payload = {
          address_type: address.addressType,
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.postalCode,
          country: address.country,
          is_primary: address.isPrimary,
        };

        const response = await apiClient.post(
          `/company/${companyId}/addresses/`,
          payload
        );

        if (response.error) {
          throw new Error(response.error);
        }
      }

      // Store company ID and clean up temp data
      localStorage.setItem("company_id", companyId);
      localStorage.removeItem("temp_user_email");
      localStorage.removeItem("temp_user_phone");
      
      router.push("/manufacturer");
    } catch (err) {
      console.error("Address Save Error:", err);
      setError(err instanceof Error ? err.message : "Failed to save addresses");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black py-10")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full md:w-[700px]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <CardTitle className="text-2xl font-bold">
                {phase === "A"
                  ? "Phase A: Company Basics"
                  : phase === "B"
                  ? "Phase B: Business Settings & Operations"
                  : "Phase C: Locations"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {phase === "A"
                  ? "Create your company"
                  : phase === "B"
                  ? "Configure business settings"
                  : "Add company addresses"}
              </CardDescription>
            </div>
            <div className="text-sm font-semibold text-blue-400">
              Step {phase === "A" ? "1" : phase === "B" ? "2" : "3"} of 3
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: phase === "A" ? "33%" : phase === "B" ? "66%" : "100%",
              }}
            ></div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Phase A - Company Basics */}
            {phase === "A" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="e.g., ABC Private Limited"
                    className="bg-gray-800 text-white border border-gray-700"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="legal_name">Legal Name *</Label>
                  <Input
                    id="legal_name"
                    type="text"
                    placeholder="e.g., ABC Private Limited"
                    className="bg-gray-800 text-white border border-gray-700"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Company Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Auto-generated or custom"
                      className="bg-gray-800 text-white border border-gray-700"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateCode}
                      className="bg-gray-700 hover:bg-gray-600 whitespace-nowrap"
                    >
                      Generate
                    </Button>
                    {companyCode && (
                      <Button
                        type="button"
                        onClick={handleCopyCode}
                        className="bg-gray-700 hover:bg-gray-600 whitespace-nowrap"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Auto-generates from company name: removes PRIVATE/LIMITED/LTD, special chars, adds suffix
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company_type">Company Type *</Label>
                  <select
                    id="company_type"
                    className="bg-gray-800 text-white border border-gray-700 w-full h-10 px-3 rounded-md"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                  >
                    {COMPANY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <select
                    id="timezone"
                    className="bg-gray-800 text-white border border-gray-700 w-full h-10 px-3 rounded-md"
                    value={baseTimezone}
                    onChange={(e) => setBaseTimezone(e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="language">Language *</Label>
                  <select
                    id="language"
                    className="bg-gray-800 text-white border border-gray-700 w-full h-10 px-3 rounded-md"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang === "en" ? "English" : "Hindi"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <select
                    id="currency"
                    className="bg-gray-800 text-white border border-gray-700 w-full h-10 px-3 rounded-md"
                    value={baseCurrencyId}
                    onChange={(e) => setBaseCurrencyId(e.target.value)}
                  >
                    <option value="">-- Select Currency --</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Phase B - Business Settings */}
            {phase === "B" && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-400 mb-4">Enable Features</h3>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="cursor-pointer">Inventory Management</Label>
                    <Button
                      type="button"
                      className={cn(
                        "w-16",
                        inventoryEnabled
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => setInventoryEnabled(!inventoryEnabled)}
                    >
                      {inventoryEnabled ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="cursor-pointer">HR Management</Label>
                    <Button
                      type="button"
                      className={cn(
                        "w-16",
                        hrEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => setHrEnabled(!hrEnabled)}
                    >
                      {hrEnabled ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="cursor-pointer">Logistics</Label>
                    <Button
                      type="button"
                      className={cn(
                        "w-16",
                        logisticsEnabled
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => setLogisticsEnabled(!logisticsEnabled)}
                    >
                      {logisticsEnabled ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="cursor-pointer">Workflow</Label>
                    <Button
                      type="button"
                      className={cn(
                        "w-16",
                        workflowEnabled
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => setWorkflowEnabled(!workflowEnabled)}
                    >
                      {workflowEnabled ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="cursor-pointer">Portal</Label>
                    <Button
                      type="button"
                      className={cn(
                        "w-16",
                        portalEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => setPortalEnabled(!portalEnabled)}
                    >
                      {portalEnabled ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="cursor-pointer">Pricing</Label>
                    <Button
                      type="button"
                      className={cn(
                        "w-16",
                        pricingEnabled
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => setPricingEnabled(!pricingEnabled)}
                    >
                      {pricingEnabled ? "On" : "Off"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Phase C - Addresses */}
            {phase === "C" && (
              <>
                <div className="space-y-6">
                  {addresses.map((address, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded space-y-3">
                      <h3 className="font-semibold text-blue-400">Address {index + 1}</h3>

                      <div className="grid gap-2">
                        <Label htmlFor={`address_type_${index}`}>Address Type</Label>
                        <select
                          id={`address_type_${index}`}
                          className="bg-gray-700 text-white border border-gray-600 w-full h-10 px-3 rounded-md"
                          value={address.addressType}
                          onChange={(e) =>
                            handleAddressChange(index, "addressType", e.target.value)
                          }
                        >
                          <option value="REGISTERED">Registered</option>
                          <option value="BILLING">Billing</option>
                          <option value="SHIPPING">Shipping</option>
                          <option value="BRANCH">Branch</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`address_line1_${index}`}>Address Line 1 *</Label>
                        <Input
                          id={`address_line1_${index}`}
                          type="text"
                          placeholder="Street address"
                          className="bg-gray-700 text-white border border-gray-600"
                          value={address.addressLine1}
                          onChange={(e) =>
                            handleAddressChange(index, "addressLine1", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`address_line2_${index}`}>Address Line 2</Label>
                        <Input
                          id={`address_line2_${index}`}
                          type="text"
                          placeholder="Apartment, suite, etc."
                          className="bg-gray-700 text-white border border-gray-600"
                          value={address.addressLine2}
                          onChange={(e) =>
                            handleAddressChange(index, "addressLine2", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`city_${index}`}>City *</Label>
                          <Input
                            id={`city_${index}`}
                            type="text"
                            placeholder="City"
                            className="bg-gray-700 text-white border border-gray-600"
                            value={address.city}
                            onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`state_${index}`}>State *</Label>
                          <Input
                            id={`state_${index}`}
                            type="text"
                            placeholder="State"
                            className="bg-gray-700 text-white border border-gray-600"
                            value={address.state}
                            onChange={(e) => handleAddressChange(index, "state", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`postal_code_${index}`}>Postal Code *</Label>
                        <Input
                          id={`postal_code_${index}`}
                          type="text"
                          placeholder="Postal code"
                          className="bg-gray-700 text-white border border-gray-600"
                          value={address.postalCode}
                          onChange={(e) =>
                            handleAddressChange(index, "postalCode", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {phase !== "A" && (
                <Button
                  type="button"
                  onClick={handlePreviousPhase}
                  className="flex-1 bg-gray-700 hover:bg-gray-600"
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {phase === "A" && (
                <Button
                  type="button"
                  onClick={handleCreateCompany}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Company..." : "Create Company"}
                </Button>
              )}

              {phase === "B" && (
                <Button
                  type="button"
                  onClick={handleSaveBusinessSettings}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Next"}
                  {!isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
              )}

              {phase === "C" && (
                <Button
                  type="button"
                  onClick={handleCompleteSetup}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving Addresses..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyOnboardingPage;
