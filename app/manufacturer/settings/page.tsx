'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  FileText, 
  CreditCard, 
  Image as ImageIcon, 
  Settings, 
  Save, 
  Loader,
  Upload,
  CheckCircle,
  XCircle,
  Calendar,
  Database,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/utils/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompanySettings {
  id: string;
  code: string;
  name: string;
  legal_name: string;
  company_type: string;
  phone?: string;
  email?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  logo?: string;
  logo_url?: string;
  invoice_footer?: string;
  invoice_terms?: string;
  timezone: string;
  language: string;
  base_currency: string;
  features?: {
    inventory_enabled: boolean;
    accounting_enabled: boolean;
    payroll_enabled: boolean;
    gst_enabled: boolean;
    locked: boolean;
  };
  current_financial_year?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    is_closed: boolean;
  };
}

export default function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'modules' | 'data-import' | 'financial' | 'gst' | 'branding'>('info');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has tokens before fetching
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const companyId = localStorage.getItem('company_id');
      
      console.log('Settings Page - Token Check:', {
        hasAccessToken: !!token,
        hasRefreshToken: !!refreshToken,
        hasCompanyId: !!companyId,
        tokenValue: token ? `${token.substring(0, 20)}...` : 'NULL',
        tokenType: typeof token,
      });
      
      if (!token || token === 'null' || token === 'undefined') {
        console.error('No valid token found, redirecting to login');
        localStorage.clear(); // Clear all storage
        window.location.replace('/authentication');
        return;
      }
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<CompanySettings>('/company/settings/');
      setSettings(data);
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      if (error.message?.includes('401')) {
        // Clear any invalid tokens and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('company_id');
        window.location.href = '/authentication';
        return;
      }
      showMessage('error', error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInputChange = (field: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleFeatureToggle = (feature: string, value: boolean) => {
    if (!settings || !settings.features) return;
    setSettings({
      ...settings,
      features: { ...settings.features, [feature]: value }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.keys(settings).forEach(key => {
        if (key === 'features' && settings.features) {
          formData.append('features', JSON.stringify(settings.features));
        } else if (key !== 'id' && key !== 'logo_url' && key !== 'current_financial_year') {
          const value = (settings as any)[key];
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        }
      });
      
      // Add logo if changed
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      await apiClient.patch('/company/settings/', formData);
      showMessage('success', 'Settings saved successfully');
      setLogoFile(null); // Clear the file after successful save
      fetchSettings(); // Refresh data
    } catch (error: any) {
      console.error('Error saving settings:', error);
      if (error.message?.includes('401')) {
        showMessage('error', 'Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/authentication';
        }, 1500);
        return;
      }
      showMessage('error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center text-white">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p>Failed to load company settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Company Settings</h1>
            <p className="text-gray-400 mt-1">Configure your company information and preferences</p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-[#1E293B] rounded-lg border border-blue-500/20">
          <div className="flex border-b border-blue-500/20 overflow-x-auto">
            {[
              { id: 'info', label: 'Company Info', icon: Building2 },
              { id: 'modules', label: 'Modules', icon: Settings },
              { id: 'data-import', label: 'Data Import', icon: Database },
              { id: 'financial', label: 'Financial Year', icon: Calendar },
              { id: 'gst', label: 'GST Setup', icon: CreditCard },
              { id: 'branding', label: 'Branding', icon: ImageIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Company Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-blue-400">Company Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Legal Name *</label>
                    <input
                      type="text"
                      value={settings.legal_name}
                      onChange={(e) => handleInputChange('legal_name', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company Type</label>
                    <select
                      value={settings.company_type}
                      onChange={(e) => handleInputChange('company_type', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    >
                      <option value="PRIVATE_LIMITED">Private Limited</option>
                      <option value="PUBLIC_LIMITED">Public Limited</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="PROPRIETORSHIP">Proprietorship</option>
                      <option value="LLP">LLP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={settings.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                    <input
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-blue-400 mt-8">Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address Line 1</label>
                    <input
                      type="text"
                      value={settings.address_line1 || ''}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address Line 2</label>
                    <input
                      type="text"
                      value={settings.address_line2 || ''}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
                    <input
                      type="text"
                      value={settings.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                    <input
                      type="text"
                      value={settings.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={settings.pincode || ''}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && settings.features && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-blue-400">Module Configuration</h2>
                <p className="text-gray-400">Enable or disable specific modules for your company</p>
                
                <div className="space-y-4">
                  {[
                    { key: 'inventory_enabled', label: 'Inventory Management', description: 'Manage stock, warehouses, and inventory transactions' },
                    { key: 'accounting_enabled', label: 'Accounting', description: 'Financial accounting, ledgers, and reports' },
                    { key: 'payroll_enabled', label: 'Payroll', description: 'Employee payroll and salary management' },
                    { key: 'gst_enabled', label: 'GST', description: 'Enable GST calculations and compliance' },
                    { key: 'locked', label: 'Lock Financials', description: 'Prevent modifications to financial transactions' }
                  ].map(module => (
                    <div key={module.key} className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg border border-blue-500/20">
                      <div>
                        <h3 className="font-medium text-white">{module.label}</h3>
                        <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(settings.features as any)[module.key]}
                          onChange={(e) => handleFeatureToggle(module.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Import Tab */}
            {activeTab === 'data-import' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-blue-400">Data Import & Migration</h2>
                <p className="text-gray-400">Import data from external accounting software like Tally Prime</p>
                
                {/* Tally Prime Import */}
                <div className="bg-[#0F172A] p-6 rounded-lg border border-blue-500/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Database className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Tally Prime Import</h3>
                        <p className="text-sm text-gray-400">Import Masters & Vouchers from Tally Prime</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs bg-green-900/30 text-green-400">
                      Supported
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#1E293B] rounded-lg">
                        <h4 className="font-medium text-white mb-2">Supported Data Types</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>• Account Groups & Ledgers</li>
                          <li>• Stock Groups & Items</li>
                          <li>• Godowns/Warehouses</li>
                          <li>• Units of Measure</li>
                          <li>• Cost Centers</li>
                          <li>• Vouchers (Sales, Purchase, etc.)</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-[#1E293B] rounded-lg">
                        <h4 className="font-medium text-white mb-2">File Formats</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>• XML Export (Recommended)</li>
                          <li>• Maximum file size: 100MB</li>
                          <li>• Multi-company supported</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Link href="/manufacturer/data-import">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Upload className="h-4 w-4 mr-2" />
                          Start Import
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      <Link href="/manufacturer/data-import/tally-mapping">
                        <Button className="bg-[#1E293B] hover:bg-[#2D3B4F] text-white border border-blue-500/20">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure Field Mapping
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Import History Summary */}
                <div className="bg-[#0F172A] p-6 rounded-lg border border-blue-500/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Import Guidelines</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-medium">1</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Export data from Tally Prime</p>
                        <p className="text-sm text-gray-400">Go to Gateway of Tally {'>'} Export {'>'} Masters/Vouchers {'>'} XML Format</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-medium">2</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Upload the XML file</p>
                        <p className="text-sm text-gray-400">Drag & drop or browse to select your exported file</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-medium">3</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Preview and verify mappings</p>
                        <p className="text-sm text-gray-400">Review how Tally fields map to your system</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-medium">4</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Execute import</p>
                        <p className="text-sm text-gray-400">Select data types and start the import process</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Warning */}
                <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-medium">Important</p>
                      <p className="text-sm text-amber-200/70">
                        Always backup your current data before importing. Import operations cannot be automatically reversed.
                        Test with a small data set first if this is your first import.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Year Tab */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-blue-400">Financial Year Settings</h2>
                
                {settings.current_financial_year ? (
                  <div className="bg-[#0F172A] p-6 rounded-lg border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-white mb-4">Current Financial Year</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="text-white font-medium">{settings.current_financial_year.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          settings.current_financial_year.is_closed 
                            ? 'bg-red-900/30 text-red-400' 
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {settings.current_financial_year.is_closed ? 'Closed' : 'Active'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Start Date</p>
                        <p className="text-white font-medium">{new Date(settings.current_financial_year.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">End Date</p>
                        <p className="text-white font-medium">{new Date(settings.current_financial_year.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#0F172A] rounded-lg border border-blue-500/20">
                    <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No financial year configured</p>
                  </div>
                )}
              </div>
            )}

            {/* GST Setup Tab */}
            {activeTab === 'gst' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-blue-400">GST Configuration</h2>
                <p className="text-gray-400">Configure your GST registration details</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">GSTIN (GST Number)</label>
                    <input
                      type="text"
                      value={settings.gstin || ''}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">15-digit GST identification number</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={settings.pan || ''}
                      onChange={(e) => handleInputChange('pan', e.target.value)}
                      placeholder="AAAAA9999A"
                      maxLength={10}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">10-character PAN number</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">State (for GST)</label>
                    <input
                      type="text"
                      value={settings.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                    <input
                      type="text"
                      value={settings.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                  </div>
                </div>

                {settings.features && (
                  <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg border border-blue-500/20 mt-6">
                    <div>
                      <h3 className="font-medium text-white">Enable GST</h3>
                      <p className="text-sm text-gray-400 mt-1">Activate GST calculations for all transactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.features.gst_enabled}
                        onChange={(e) => handleFeatureToggle('gst_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-blue-400">Branding & Customization</h2>
                <p className="text-gray-400">Customize how your company appears on documents</p>
                
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                          <Upload className="h-5 w-5" />
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Recommended: Square image, max 2MB</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Footer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Invoice Footer</label>
                    <textarea
                      value={settings.invoice_footer || ''}
                      onChange={(e) => handleInputChange('invoice_footer', e.target.value)}
                      rows={3}
                      placeholder="E.g., Thank you for your business!"
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">This text will appear at the bottom of all invoices</p>
                  </div>
                  
                  {/* Invoice Terms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Invoice Terms & Conditions</label>
                    <textarea
                      value={settings.invoice_terms || ''}
                      onChange={(e) => handleInputChange('invoice_terms', e.target.value)}
                      rows={5}
                      placeholder="Enter your terms and conditions..."
                      className="w-full p-3 bg-[#0F172A] border border-blue-500/20 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Terms and conditions that will appear on invoices</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
