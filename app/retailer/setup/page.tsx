"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { UserContext } from '@/types/api';
import { 
  MapPin, 
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight,
  Building2,
  Search
} from 'lucide-react';

interface CompanyDiscover {
  company_code: string;
  company_name: string;
  description?: string;
  contact_email?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const RetailerOnboarding = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Manufacturer search
  const [manufacturerCode, setManufacturerCode] = useState('');
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [foundCompany, setFoundCompany] = useState<CompanyDiscover | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  // Form data - single form
  const [formData, setFormData] = useState({
    business_name: '',
    address_line1: '',
    city: '',
    state: 'Tamil Nadu',
    postal_code: '',
    country: 'IN'
  });

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      // Use context API to check if retailer is already registered
      const contextResponse = await apiClient.get<UserContext>('/users/me/context/');
      
      if (contextResponse.data) {
        const context = contextResponse.data;
        
        // If is_portal_user is true, profile is complete - go to dashboard
        if (context.is_portal_user) {
          router.replace('/retailer');
          return;
        }
      }
    } catch (error) {
      // Context check failed, continue with setup
      console.error('Context check failed:', error);
    }
    
    setCheckingProfile(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSearchCompany = async () => {
    if (!manufacturerCode.trim()) {
      return;
    }
    
    setSearchingCompany(true);
    setFoundCompany(null);
    setSelectedCompanyId('');
    
    try {
      const response = await apiClient.get(`/portal/companies/discover/?search=${manufacturerCode.trim()}`);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const company = response.data[0];
        setFoundCompany(company);
        // Use company_code as the ID for connection
        setSelectedCompanyId(company.company_code);
      } else {
        setError('No manufacturer found with this code.');
      }
    } catch (error) {
      setError('Failed to search. Please try again.');
    } finally {
      setSearchingCompany(false);
    }
  };

  const clearSelectedCompany = () => {
    setFoundCompany(null);
    setSelectedCompanyId('');
    setManufacturerCode('');
  };

  const validateForm = (): boolean => {
    return !!(formData.business_name && formData.address_line1 && formData.city && formData.state && formData.postal_code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use Complete Profile API
      const requestData: Record<string, unknown> = {
        business_name: formData.business_name,
        address: {
          address_line1: formData.address_line1,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country
        }
      };
      
      // Add company_id only if a company was selected
      if (selectedCompanyId) {
        requestData.company_id = selectedCompanyId;
      }

      const response = await apiClient.post('/portal/complete-profile/', requestData);

      if (response.error) {
        setError(response.error || 'Failed to complete profile');
      } else {
        if (selectedCompanyId) {
          setSuccess('Profile completed! Your connection request is pending approval.');
        } else {
          setSuccess('Profile completed! You can connect with manufacturers later.');
        }
        setTimeout(() => {
          router.push('/retailer');
        }, 2000);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-neutral-400">Checking profile status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-neutral-400">Set up your business details to start ordering</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Business Information</h2>
                <p className="text-sm text-neutral-400">Your business details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="Your Business / Shop Name"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Business Address</h2>
                <p className="text-sm text-neutral-400">Where should orders be delivered?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Building, Street, Area"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="600001"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                  required
                >
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Connect to Manufacturer (Optional) */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Connect to Manufacturer</h2>
                <p className="text-sm text-neutral-400">Optional - You can do this later</p>
              </div>
            </div>

            {foundCompany ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-green-400">{foundCompany.company_name}</p>
                    <p className="text-sm text-neutral-400 mt-1">Code: {foundCompany.company_code}</p>
                    {foundCompany.description && (
                      <p className="text-sm text-neutral-500 mt-1">{foundCompany.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedCompany}
                    className="text-neutral-400 hover:text-white text-sm"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-green-400/70 mt-3">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  Will send connection request upon registration
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manufacturerCode}
                    onChange={(e) => setManufacturerCode(e.target.value.toUpperCase())}
                    placeholder="Enter manufacturer code (e.g., VENDOR001)"
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCompany}
                    disabled={searchingCompany || !manufacturerCode.trim()}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {searchingCompany ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  Ask your manufacturer for their company code, or skip this and discover companies later.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !validateForm()}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Completing Profile...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Complete Profile
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Help Text */}
          <p className="text-center text-sm text-neutral-500">
            Need help? Contact support at support@vendor.com
          </p>
        </form>
      </div>
    </div>
  );
};

export default RetailerOnboarding;
