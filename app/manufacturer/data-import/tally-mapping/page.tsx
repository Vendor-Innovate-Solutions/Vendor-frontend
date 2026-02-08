"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  FileText,
  Loader,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";

// Tally Prime to System field mapping configurations
const TALLY_FIELD_MAPPINGS: Record<string, {
  label: string;
  description: string;
  tallyFields: Array<{ key: string; label: string; required: boolean }>;
  systemFields: Array<{ key: string; label: string; type: string }>;
}> = {
  LEDGER_GROUP: {
    label: "Account Groups",
    description: "Map Tally Groups to System Account Groups",
    tallyFields: [
      { key: "NAME", label: "Group Name", required: true },
      { key: "PARENT", label: "Parent Group", required: false },
      { key: "ISREVENUE", label: "Is Revenue", required: false },
      { key: "ISDEEMEDPOSITIVE", label: "Is Deemed Positive", required: false },
      { key: "AFFECTSGROSSPROFIT", label: "Affects Gross Profit", required: false },
      { key: "SORTPOSITION", label: "Sort Position", required: false },
      { key: "GUID", label: "Tally GUID", required: false },
    ],
    systemFields: [
      { key: "name", label: "Group Name", type: "text" },
      { key: "code", label: "Group Code", type: "text" },
      { key: "parent", label: "Parent Group", type: "reference" },
      { key: "nature", label: "Nature (Asset/Liability/etc)", type: "choice" },
      { key: "report_type", label: "Report Type (BS/PL)", type: "choice" },
    ],
  },
  LEDGER: {
    label: "Ledgers/Accounts",
    description: "Map Tally Ledgers to System Ledgers",
    tallyFields: [
      { key: "NAME", label: "Ledger Name", required: true },
      { key: "PARENT", label: "Parent Group", required: true },
      { key: "OPENINGBALANCE", label: "Opening Balance", required: false },
      { key: "CLOSINGBALANCE", label: "Closing Balance", required: false },
      { key: "ISBILLWISEON", label: "Bill-wise On", required: false },
      { key: "ISCOSTCENTRESON", label: "Cost Centers On", required: false },
      { key: "AFFECTSSTOCK", label: "Affects Stock", required: false },
      { key: "LEDSTATENAME", label: "State Name", required: false },
      { key: "COUNTRYNAME", label: "Country Name", required: false },
      { key: "PINCODE", label: "Pincode", required: false },
      { key: "EMAIL", label: "Email", required: false },
      { key: "LEDGERPHONE", label: "Phone", required: false },
      { key: "PARTYGSTIN", label: "Party GSTIN", required: false },
      { key: "PANIT", label: "PAN Number", required: false },
      { key: "CREDITPERIOD", label: "Credit Period", required: false },
      { key: "CREDITLIMIT", label: "Credit Limit", required: false },
    ],
    systemFields: [
      { key: "name", label: "Ledger Name", type: "text" },
      { key: "code", label: "Ledger Code", type: "text" },
      { key: "account_group", label: "Account Group", type: "reference" },
      { key: "ledger_type", label: "Ledger Type", type: "choice" },
      { key: "opening_balance", label: "Opening Balance", type: "decimal" },
      { key: "balance_type", label: "Balance Type (Dr/Cr)", type: "choice" },
      { key: "is_bill_wise", label: "Bill-wise Tracking", type: "boolean" },
      { key: "gstin", label: "GSTIN", type: "text" },
      { key: "pan", label: "PAN", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "pincode", label: "Pincode", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "credit_period", label: "Credit Period (Days)", type: "number" },
      { key: "credit_limit", label: "Credit Limit", type: "decimal" },
    ],
  },
  STOCK_GROUP: {
    label: "Stock Groups",
    description: "Map Tally Stock Groups to System Stock Groups",
    tallyFields: [
      { key: "NAME", label: "Group Name", required: true },
      { key: "PARENT", label: "Parent Group", required: false },
      { key: "ISADDABLE", label: "Is Addable", required: false },
      { key: "GUID", label: "Tally GUID", required: false },
    ],
    systemFields: [
      { key: "name", label: "Group Name", type: "text" },
      { key: "code", label: "Group Code", type: "text" },
      { key: "parent", label: "Parent Group", type: "reference" },
    ],
  },
  STOCK_ITEM: {
    label: "Stock Items",
    description: "Map Tally Stock Items to System Stock Items",
    tallyFields: [
      { key: "NAME", label: "Item Name", required: true },
      { key: "PARENT", label: "Stock Group", required: false },
      { key: "BASEUNITS", label: "Base Units", required: false },
      { key: "OPENINGBALANCE", label: "Opening Balance", required: false },
      { key: "OPENINGRATE", label: "Opening Rate", required: false },
      { key: "OPENINGVALUE", label: "Opening Value", required: false },
      { key: "HSNCODE", label: "HSN/SAC Code", required: false },
      { key: "IGSTRATE", label: "IGST Rate", required: false },
      { key: "CGSTRATE", label: "CGST Rate", required: false },
      { key: "SGSTRATE", label: "SGST Rate", required: false },
      { key: "DESCRIPTION", label: "Description", required: false },
    ],
    systemFields: [
      { key: "name", label: "Item Name", type: "text" },
      { key: "code", label: "Item Code/SKU", type: "text" },
      { key: "stock_group", label: "Stock Group", type: "reference" },
      { key: "unit", label: "Unit of Measure", type: "reference" },
      { key: "is_inventory_item", label: "Is Inventory Item", type: "boolean" },
      { key: "hsn_code", label: "HSN/SAC Code", type: "text" },
      { key: "gst_rate", label: "GST Rate", type: "decimal" },
      { key: "opening_stock", label: "Opening Stock Qty", type: "decimal" },
      { key: "opening_rate", label: "Opening Rate", type: "decimal" },
      { key: "description", label: "Description", type: "text" },
    ],
  },
  VOUCHER: {
    label: "Vouchers",
    description: "Map Tally Vouchers to System Vouchers",
    tallyFields: [
      { key: "VOUCHERTYPENAME", label: "Voucher Type", required: true },
      { key: "VOUCHERNUMBER", label: "Voucher Number", required: true },
      { key: "DATE", label: "Date", required: true },
      { key: "REFERENCE", label: "Reference", required: false },
      { key: "REFERENCEDATE", label: "Reference Date", required: false },
      { key: "NARRATION", label: "Narration", required: false },
      { key: "PARTYNAME", label: "Party Name", required: false },
      { key: "PLACEOFSUPPLY", label: "Place of Supply", required: false },
    ],
    systemFields: [
      { key: "voucher_type", label: "Voucher Type", type: "reference" },
      { key: "voucher_number", label: "Voucher Number", type: "text" },
      { key: "date", label: "Date", type: "date" },
      { key: "reference", label: "Reference", type: "text" },
      { key: "reference_date", label: "Reference Date", type: "date" },
      { key: "narration", label: "Narration", type: "text" },
      { key: "party", label: "Party", type: "reference" },
      { key: "place_of_supply", label: "Place of Supply", type: "text" },
    ],
  },
  GODOWN: {
    label: "Godowns/Warehouses",
    description: "Map Tally Godowns to System Warehouses",
    tallyFields: [
      { key: "NAME", label: "Godown Name", required: true },
      { key: "PARENT", label: "Parent Godown", required: false },
      { key: "ADDRESS", label: "Address", required: false },
      { key: "HASNOSPACE", label: "Has No Space", required: false },
      { key: "HASNOSTOCK", label: "Has No Stock", required: false },
    ],
    systemFields: [
      { key: "name", label: "Warehouse Name", type: "text" },
      { key: "code", label: "Warehouse Code", type: "text" },
      { key: "parent", label: "Parent Warehouse", type: "reference" },
      { key: "address", label: "Address", type: "text" },
    ],
  },
  UNIT: {
    label: "Units of Measure",
    description: "Map Tally Units to System Units",
    tallyFields: [
      { key: "NAME", label: "Unit Name", required: true },
      { key: "ORIGINALNAME", label: "Original Name", required: false },
      { key: "ISSIMPLEUNIT", label: "Is Simple Unit", required: false },
      { key: "DECIMALPLACES", label: "Decimal Places", required: false },
    ],
    systemFields: [
      { key: "name", label: "Unit Name", type: "text" },
      { key: "symbol", label: "Symbol", type: "text" },
      { key: "category", label: "Category", type: "choice" },
      { key: "decimal_places", label: "Decimal Places", type: "number" },
    ],
  },
};

// Value transformation options
const VALUE_TRANSFORMATIONS: Record<string, {
  label: string;
  tallyValues: string[];
  systemValues: Array<{ value: string; label: string }>;
}> = {
  LEDGER_TYPE: {
    label: "Ledger Type Mapping",
    tallyValues: [
      "SUNDRY DEBTORS",
      "SUNDRY CREDITORS",
      "BANK ACCOUNTS",
      "BANK OD A/C",
      "CASH-IN-HAND",
      "DUTIES & TAXES",
      "SALES ACCOUNTS",
      "PURCHASE ACCOUNTS",
    ],
    systemValues: [
      { value: "CUSTOMER", label: "Customer" },
      { value: "SUPPLIER", label: "Supplier" },
      { value: "BANK", label: "Bank Account" },
      { value: "CASH", label: "Cash" },
      { value: "TAX", label: "Tax Ledger" },
      { value: "INCOME", label: "Income" },
      { value: "EXPENSE", label: "Expense" },
      { value: "GENERAL", label: "General" },
    ],
  },
  NATURE: {
    label: "Account Nature Mapping",
    tallyValues: [
      "CAPITAL ACCOUNT",
      "CURRENT ASSETS",
      "CURRENT LIABILITIES",
      "DIRECT EXPENSES",
      "DIRECT INCOMES",
      "FIXED ASSETS",
      "INDIRECT EXPENSES",
      "INDIRECT INCOMES",
      "INVESTMENTS",
      "LOANS (LIABILITY)",
      "LOANS & ADVANCES (ASSET)",
    ],
    systemValues: [
      { value: "ASSET", label: "Asset" },
      { value: "LIABILITY", label: "Liability" },
      { value: "EQUITY", label: "Equity" },
      { value: "INCOME", label: "Income" },
      { value: "EXPENSE", label: "Expense" },
    ],
  },
  VOUCHER_TYPE: {
    label: "Voucher Type Mapping",
    tallyValues: [
      "SALES",
      "PURCHASE",
      "PAYMENT",
      "RECEIPT",
      "CONTRA",
      "JOURNAL",
      "CREDIT NOTE",
      "DEBIT NOTE",
      "SALES ORDER",
      "PURCHASE ORDER",
      "DELIVERY NOTE",
      "RECEIPT NOTE",
    ],
    systemValues: [
      { value: "SALES", label: "Sales" },
      { value: "PURCHASE", label: "Purchase" },
      { value: "PAYMENT", label: "Payment" },
      { value: "RECEIPT", label: "Receipt" },
      { value: "CONTRA", label: "Contra" },
      { value: "JOURNAL", label: "Journal" },
      { value: "CREDIT_NOTE", label: "Credit Note" },
      { value: "DEBIT_NOTE", label: "Debit Note" },
    ],
  },
};

interface FieldMapping {
  id: string;
  name: string;
  data_type: string;
  field_mappings: Record<string, string>;
  value_transformations: Record<string, Record<string, string>>;
  default_values: Record<string, string>;
  is_default: boolean;
}

export default function TallyMappingPage() {
  const [activeTab, setActiveTab] = useState("LEDGER_GROUP");
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Current mapping being edited
  const [editingMapping, setEditingMapping] = useState<Partial<FieldMapping>>({
    name: "",
    data_type: "LEDGER_GROUP",
    field_mappings: {},
    value_transformations: {},
    default_values: {},
    is_default: false,
  });

  // Load existing mappings
  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ results: FieldMapping[] }>(
        "/system/tally-field-mappings/"
      );
      if (response && response.results) {
        setMappings(response.results);
      }
    } catch (err) {
      console.error("Failed to load mappings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    if (!editingMapping.name) {
      setError("Mapping name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingMapping.id) {
        await apiClient.patch(
          `/system/tally-field-mappings/${editingMapping.id}/`,
          editingMapping
        );
      } else {
        await apiClient.post("/system/tally-field-mappings/", editingMapping);
      }
      setSuccess("Mapping saved successfully");
      loadMappings();
      resetEditing();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const deleteMapping = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;

    try {
      await apiClient.delete(`/system/tally-field-mappings/${id}/`);
      setSuccess("Mapping deleted successfully");
      loadMappings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete mapping");
    }
  };

  const resetEditing = () => {
    setEditingMapping({
      name: "",
      data_type: activeTab,
      field_mappings: {},
      value_transformations: {},
      default_values: {},
      is_default: false,
    });
  };

  const loadMappingForEdit = (mapping: FieldMapping) => {
    setEditingMapping(mapping);
    setActiveTab(mapping.data_type);
  };

  const updateFieldMapping = (tallyField: string, systemField: string) => {
    setEditingMapping((prev) => ({
      ...prev,
      field_mappings: {
        ...prev.field_mappings,
        [tallyField]: systemField,
      },
    }));
  };

  const updateDefaultValue = (field: string, value: string) => {
    setEditingMapping((prev) => ({
      ...prev,
      default_values: {
        ...prev.default_values,
        [field]: value,
      },
    }));
  };

  const currentConfig = TALLY_FIELD_MAPPINGS[activeTab];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/manufacturer/data-import"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-blue-400">Tally Prime Field Mapping</h1>
            </div>
            <p className="text-gray-400">
              Configure how Tally Prime data fields map to your system fields
            </p>
          </div>
          <Button 
            onClick={saveMapping} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Mapping
              </>
            )}
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Saved Mappings Sidebar */}
          <Card className="lg:col-span-1 bg-[#1E293B] border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Saved Mappings</CardTitle>
              <CardDescription className="text-gray-400">Your custom field mappings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : mappings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No custom mappings yet
                </p>
              ) : (
                <div className="space-y-2">
                  {mappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        editingMapping.id === mapping.id
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-blue-500/20 hover:border-blue-500/50"
                      }`}
                      onClick={() => loadMappingForEdit(mapping)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{mapping.name}</p>
                          <p className="text-xs text-gray-400">
                            {TALLY_FIELD_MAPPINGS[mapping.data_type]?.label || mapping.data_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {mapping.is_default && (
                            <span className="px-2 py-0.5 text-xs bg-blue-900/30 text-blue-400 rounded">
                              Default
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMapping(mapping.id);
                            }}
                            className="p-1 hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4 border-blue-500/20 text-white hover:bg-blue-900/20"
                onClick={resetEditing}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Mapping
              </Button>
            </CardContent>
          </Card>

          {/* Mapping Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mapping Name */}
            <Card className="bg-[#1E293B] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Mapping Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="mapping-name" className="text-gray-400">Mapping Name</Label>
                    <Input
                      id="mapping-name"
                      placeholder="e.g., My Custom Ledger Mapping"
                      value={editingMapping.name || ""}
                      onChange={(e) =>
                        setEditingMapping((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="bg-[#0F172A] border-blue-500/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Data Type</Label>
                    <select
                      value={editingMapping.data_type}
                      onChange={(e) => {
                        setEditingMapping((prev) => ({
                          ...prev,
                          data_type: e.target.value,
                          field_mappings: {},
                        }));
                        setActiveTab(e.target.value);
                      }}
                      className="w-full p-2 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    >
                      {Object.entries(TALLY_FIELD_MAPPINGS).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={editingMapping.is_default || false}
                    onChange={(e) =>
                      setEditingMapping((prev) => ({ ...prev, is_default: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-blue-500/20 bg-[#0F172A]"
                  />
                  <Label htmlFor="is-default" className="text-gray-400">
                    Use as default mapping for {currentConfig?.label}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Field Mappings */}
            <Card className="bg-[#1E293B] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Field Mappings</CardTitle>
                <CardDescription className="text-gray-400">
                  {currentConfig?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 flex-wrap bg-[#0F172A]">
                    {Object.entries(TALLY_FIELD_MAPPINGS).map(([key, config]) => (
                      <TabsTrigger 
                        key={key} 
                        value={key} 
                        className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                      >
                        {config.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(TALLY_FIELD_MAPPINGS).map(([key, config]) => (
                    <TabsContent key={key} value={key}>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-blue-500/20">
                              <TableHead className="text-gray-400 w-1/3">Tally Field</TableHead>
                              <TableHead className="text-gray-400 w-12 text-center">→</TableHead>
                              <TableHead className="text-gray-400 w-1/3">System Field</TableHead>
                              <TableHead className="text-gray-400">Default Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {config.tallyFields.map((tallyField) => (
                              <TableRow key={tallyField.key} className="border-blue-500/20">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <code className="text-sm bg-[#0F172A] text-blue-300 px-2 py-1 rounded">
                                      {tallyField.key}
                                    </code>
                                    {tallyField.required && (
                                      <span className="px-2 py-0.5 text-xs bg-amber-900/30 text-amber-400 rounded">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {tallyField.label}
                                  </p>
                                </TableCell>
                                <TableCell className="text-center">
                                  <ArrowRight className="h-4 w-4 text-gray-500 mx-auto" />
                                </TableCell>
                                <TableCell>
                                  <select
                                    value={editingMapping.field_mappings?.[tallyField.key] || ""}
                                    onChange={(e) =>
                                      updateFieldMapping(tallyField.key, e.target.value)
                                    }
                                    className="w-full p-2 bg-[#0F172A] border border-blue-500/20 rounded text-white text-sm"
                                  >
                                    <option value="">-- Skip --</option>
                                    {config.systemFields.map((sysField) => (
                                      <option key={sysField.key} value={sysField.key}>
                                        {sysField.label}
                                      </option>
                                    ))}
                                  </select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Default if empty"
                                    value={editingMapping.default_values?.[tallyField.key] || ""}
                                    onChange={(e) =>
                                      updateDefaultValue(tallyField.key, e.target.value)
                                    }
                                    className="text-sm bg-[#0F172A] border-blue-500/20 text-white"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Value Transformations */}
            <Card className="bg-[#1E293B] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Value Transformations</CardTitle>
                <CardDescription className="text-gray-400">
                  Define how Tally values should be converted to system values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="LEDGER_TYPE">
                  <TabsList className="mb-4 bg-[#0F172A]">
                    {Object.entries(VALUE_TRANSFORMATIONS).map(([key, config]) => (
                      <TabsTrigger 
                        key={key} 
                        value={key}
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                      >
                        {config.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(VALUE_TRANSFORMATIONS).map(([key, config]) => (
                    <TabsContent key={key} value={key}>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-blue-500/20">
                              <TableHead className="text-gray-400">Tally Value</TableHead>
                              <TableHead className="text-gray-400 w-12 text-center">→</TableHead>
                              <TableHead className="text-gray-400">System Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {config.tallyValues.map((tallyVal) => (
                              <TableRow key={tallyVal} className="border-blue-500/20">
                                <TableCell>
                                  <code className="text-sm bg-[#0F172A] text-blue-300 px-2 py-1 rounded">
                                    {tallyVal}
                                  </code>
                                </TableCell>
                                <TableCell className="text-center">
                                  <ArrowRight className="h-4 w-4 text-gray-500 mx-auto" />
                                </TableCell>
                                <TableCell>
                                  <select
                                    value={
                                      editingMapping.value_transformations?.[key]?.[tallyVal] || ""
                                    }
                                    onChange={(e) =>
                                      setEditingMapping((prev) => ({
                                        ...prev,
                                        value_transformations: {
                                          ...prev.value_transformations,
                                          [key]: {
                                            ...(prev.value_transformations?.[key] || {}),
                                            [tallyVal]: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    className="w-full p-2 bg-[#0F172A] border border-blue-500/20 rounded text-white text-sm"
                                  >
                                    <option value="">Auto-detect</option>
                                    {config.systemValues.map((sysVal) => (
                                      <option key={sysVal.value} value={sysVal.value}>
                                        {sysVal.label}
                                      </option>
                                    ))}
                                  </select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* How to Export from Tally */}
            <Card className="bg-[#1E293B] border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  How to Export Data from Tally Prime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Method 1: Export Masters & Vouchers</h4>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li>Open Tally Prime and select your company</li>
                      <li>Go to Gateway of Tally {">"} Export {">"} Masters</li>
                      <li>Select the masters you want to export (Ledgers, Stock Items, etc.)</li>
                      <li>Choose XML format and save the file</li>
                      <li>Repeat for Vouchers if needed</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Method 2: Using ODBC Integration</h4>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li>Enable Tally.NET Features in Tally Prime</li>
                      <li>Configure ODBC connectivity</li>
                      <li>Export data using database tools</li>
                      <li>Convert to XML format for import</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                    <h4 className="font-semibold text-amber-400 mb-2">Important Notes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-amber-300/70">
                      <li>Export data from one company at a time</li>
                      <li>Ensure all masters are exported before vouchers</li>
                      <li>GST details are included when GST is enabled in Tally</li>
                      <li>Large files may take time to process</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
