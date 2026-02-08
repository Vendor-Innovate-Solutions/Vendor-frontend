"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { apiClient } from "@/utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronRight,
  Database,
  Users,
  Package,
  FileSpreadsheet,
  Building2,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface TallyInfo {
  company_name?: string;
  version?: string;
  export_date?: string;
}

interface RecordCounts {
  ledger_groups: number;
  ledgers: number;
  stock_groups: number;
  stock_categories: number;
  stock_items: number;
  units: number;
  godowns: number;
  vouchers: number;
  cost_centers: number;
  cost_categories: number;
}

interface ValidationError {
  type: string;
  index: number;
  field: string;
  error: string;
  record?: string;
}

interface ImportJob {
  id: string;
  file_name: string;
  status: string;
  tally_company_name: string;
  total_records: number;
  imported_records: number;
  failed_records: number;
  skipped_records: number;
  progress_percentage: number;
  created_at: string;
}

const DATA_TYPE_INFO: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  ledger_groups: {
    label: "Account Groups",
    icon: <Database className="h-4 w-4" />,
    description: "Chart of Accounts structure",
  },
  ledgers: {
    label: "Ledgers/Accounts",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: "Customers, Vendors, Bank Accounts",
  },
  stock_groups: {
    label: "Stock Groups",
    icon: <Package className="h-4 w-4" />,
    description: "Product categories",
  },
  stock_items: {
    label: "Stock Items",
    icon: <Package className="h-4 w-4" />,
    description: "Products and inventory items",
  },
  units: {
    label: "Units of Measure",
    icon: <FileText className="h-4 w-4" />,
    description: "Measurement units (Pcs, Kg, etc.)",
  },
  godowns: {
    label: "Godowns/Warehouses",
    icon: <Building2 className="h-4 w-4" />,
    description: "Storage locations",
  },
  vouchers: {
    label: "Vouchers",
    icon: <FileText className="h-4 w-4" />,
    description: "Invoices, Payments, Receipts",
  },
};

export default function TallyImportPage() {
  // State management
  const [step, setStep] = useState<"upload" | "preview" | "import" | "complete">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [tallyInfo, setTallyInfo] = useState<TallyInfo | null>(null);
  const [recordCounts, setRecordCounts] = useState<RecordCounts | null>(null);
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // Import options
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [skipExisting, setSkipExisting] = useState(true);
  
  // Preview data
  const [previewData, setPreviewData] = useState<Record<string, any[]>>({});
  const [activePreviewTab, setActivePreviewTab] = useState<string>("ledgers");
  
  // Import results
  const [importResults, setImportResults] = useState<any>(null);
  
  // Import history
  const [importHistory, setImportHistory] = useState<ImportJob[]>([]);
  
  // Load import history on mount
  useEffect(() => {
    loadImportHistory();
  }, []);
  
  const loadImportHistory = async () => {
    try {
      const response = await apiClient.get<{ results: ImportJob[] }>("/system/tally-import/");
      setImportHistory(response.results || []);
    } catch (err) {
      console.error("Failed to load import history:", err);
    }
  };
  
  // File upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setUploadedFile(file);
    setError(null);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiClient.upload<{
        job_id: string;
        tally_info: TallyInfo;
        data_types: string[];
        record_counts: RecordCounts;
        validation: {
          is_valid: boolean;
          validation_errors: ValidationError[];
        };
      }>("/system/tally-import/upload/", formData);
      
      setJobId(response.job_id);
      setTallyInfo(response.tally_info);
      setDataTypes(response.data_types);
      setRecordCounts(response.record_counts);
      setValidationErrors(response.validation?.validation_errors || []);
      
      // Pre-select all data types
      setSelectedTypes(response.data_types.map(t => t.toLowerCase().replace('_', '-')));
      
      // Load preview data for the first type
      if (response.data_types.length > 0) {
        await loadPreviewData(response.job_id, "ledgers");
      }
      
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/xml": [".xml"],
      "text/xml": [".xml"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });
  
  // Load preview data for a data type
  const loadPreviewData = async (jId: string, dataType: string) => {
    try {
      const response = await apiClient.get<{
        data_type: string;
        count: number;
        records: any[];
      }>(`/system/tally-import/${jId}/preview/?data_type=${dataType}&limit=10`);
      
      setPreviewData(prev => ({
        ...prev,
        [dataType]: response.records,
      }));
    } catch (err) {
      console.error(`Failed to load preview for ${dataType}:`, err);
    }
  };
  
  // Handle data type selection
  const toggleDataType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  // Execute import
  const executeImport = async () => {
    if (!jobId) return;
    
    setIsImporting(true);
    setError(null);
    
    try {
      const response = await apiClient.post<{
        success: boolean;
        results: any;
        summary: {
          success: number;
          failed: number;
          skipped: number;
        };
      }>(`/system/tally-import/${jobId}/execute/`, {
        data_types: selectedTypes,
        skip_existing: skipExisting,
      });
      
      setImportResults(response);
      setStep("complete");
      loadImportHistory();
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };
  
  // Reset to start new import
  const resetImport = () => {
    setStep("upload");
    setUploadedFile(null);
    setJobId(null);
    setTallyInfo(null);
    setRecordCounts(null);
    setDataTypes([]);
    setValidationErrors([]);
    setSelectedTypes([]);
    setPreviewData({});
    setImportResults(null);
    setError(null);
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PENDING: { variant: "outline", label: "Pending" },
      VALIDATING: { variant: "secondary", label: "Validating" },
      VALIDATED: { variant: "secondary", label: "Validated" },
      IMPORTING: { variant: "default", label: "Importing" },
      COMPLETED: { variant: "default", label: "Completed" },
      FAILED: { variant: "destructive", label: "Failed" },
    };
    
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Import</h1>
          <p className="text-muted-foreground">
            Import data from Tally Prime into your system
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/manufacturer/data-import/tally-mapping">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Mapping
            </Button>
          </Link>
          {step !== "upload" && (
            <Button variant="outline" onClick={resetImport}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start New Import
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {["upload", "preview", "import", "complete"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : ["upload", "preview", "import", "complete"].indexOf(step) > i
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {["upload", "preview", "import", "complete"].indexOf(step) > i ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
          </div>
        ))}
      </div>
      
      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Tally Export File</CardTitle>
              <CardDescription>
                Upload your Tally Prime XML export file to begin the import process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isUploading ? (
                  <div className="space-y-2">
                    <p>Uploading and parsing file...</p>
                    <Progress value={50} className="w-1/2 mx-auto" />
                  </div>
                ) : isDragActive ? (
                  <p>Drop the file here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">
                      Drag & drop your Tally export file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse (XML format, max 100MB)
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Supported Data Types:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Account Groups & Ledgers (Customers, Vendors, Banks)</li>
                  <li>• Stock Groups & Items (Products, Inventory)</li>
                  <li>• Units of Measure & Godowns</li>
                  <li>• Vouchers (Invoices, Payments, Receipts)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Imports</CardTitle>
              <CardDescription>
                View your recent import history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No previous imports found
                </p>
              ) : (
                <div className="space-y-4">
                  {importHistory.slice(0, 5).map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{job.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.tally_company_name || "Unknown Company"} •{" "}
                          {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {renderStatusBadge(job.status)}
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.imported_records}/{job.total_records} imported
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Step 2: Preview */}
      {step === "preview" && tallyInfo && recordCounts && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tally Company</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tallyInfo.company_name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">
                  Tally Version: {tallyInfo.version || "Unknown"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Object.values(recordCounts).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Across {dataTypes.length} data types
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Validation Status</CardTitle>
              </CardHeader>
              <CardContent>
                {validationErrors.length === 0 ? (
                  <div className="flex items-center text-green-600">
                    <Check className="h-6 w-6 mr-2" />
                    <span className="text-xl font-bold">All Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <span className="text-xl font-bold">{validationErrors.length} Issues</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Data to Import</CardTitle>
              <CardDescription>
                Choose which types of data you want to import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(DATA_TYPE_INFO).map(([type, info]) => {
                  const count = recordCounts[type as keyof RecordCounts] || 0;
                  if (count === 0) return null;
                  
                  return (
                    <div
                      key={type}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTypes.includes(type)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleDataType(type)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-muted rounded">
                            {info.icon}
                          </div>
                          <div>
                            <p className="font-medium">{info.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {info.description}
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleDataType(type)}
                        />
                      </div>
                      <div className="mt-3">
                        <Badge variant="secondary">{count} records</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex items-center space-x-2">
                <Checkbox
                  id="skip-existing"
                  checked={skipExisting}
                  onCheckedChange={(checked: boolean) => setSkipExisting(checked)}
                />
                <label htmlFor="skip-existing" className="text-sm">
                  Skip records that already exist in the system
                </label>
              </div>
            </CardContent>
          </Card>
          
          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Preview the data before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activePreviewTab} onValueChange={async (tab) => {
                setActivePreviewTab(tab);
                if (jobId && !previewData[tab]) {
                  await loadPreviewData(jobId, tab);
                }
              }}>
                <TabsList>
                  {dataTypes.map(type => {
                    const info = DATA_TYPE_INFO[type.toLowerCase()];
                    return (
                      <TabsTrigger key={type} value={type.toLowerCase()}>
                        {info?.label || type}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {dataTypes.map(type => (
                  <TabsContent key={type} value={type.toLowerCase()}>
                    {previewData[type.toLowerCase()]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(previewData[type.toLowerCase()][0])
                                .slice(0, 5)
                                .map(key => (
                                  <TableHead key={key}>
                                    {key.replace(/_/g, " ").toUpperCase()}
                                  </TableHead>
                                ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData[type.toLowerCase()].map((record, i) => (
                              <TableRow key={i}>
                                {Object.entries(record)
                                  .slice(0, 5)
                                  .map(([key, value]) => (
                                    <TableCell key={key}>
                                      {typeof value === "object"
                                        ? JSON.stringify(value)
                                        : String(value || "-")}
                                    </TableCell>
                                  ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        No preview data available. Click to load.
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-600">Validation Issues</CardTitle>
                <CardDescription>
                  These issues were found during validation. Records with errors may be skipped.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="flex items-start space-x-3 py-2 border-b last:border-0">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {err.type}: {err.record || `Record #${err.index + 1}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {err.field}: {err.error}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button
              onClick={executeImport}
              disabled={selectedTypes.length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Complete */}
      {step === "complete" && importResults && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {importResults.summary?.failed === 0 ? (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
              )}
            </div>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              Your Tally data has been imported into the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {importResults.summary?.success || 0}
                </p>
                <p className="text-sm text-green-700">Successfully Imported</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">
                  {importResults.summary?.skipped || 0}
                </p>
                <p className="text-sm text-amber-700">Skipped (Already Exist)</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {importResults.summary?.failed || 0}
                </p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>
            
            {/* Results by type */}
            {importResults.results && (
              <div className="space-y-2">
                <h4 className="font-medium">Results by Data Type:</h4>
                {Object.entries(importResults.results).map(([type, result]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded">
                    <span className="capitalize">{type.replace(/_/g, " ")}</span>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-green-600">{result.success} imported</span>
                      <span className="text-amber-600">{result.skipped} skipped</span>
                      <span className="text-red-600">{result.failed} failed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex justify-center space-x-4">
              <Button variant="outline" onClick={resetImport}>
                Import More Data
              </Button>
              <Button onClick={() => window.location.href = "/manufacturer"}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
