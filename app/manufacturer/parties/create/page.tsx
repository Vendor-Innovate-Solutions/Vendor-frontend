"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../../../components/manufacturer/nav_bar';
import { apiClient } from '../../../../utils/api';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  Plus
} from 'lucide-react';

interface PartyForm {
  name: string;
  party_type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  gstin: string;
  email: string;
  phone: string;
  state: string;
  contact_person: string;
  address_line1: string;
  address_line2: string;
  city: string;
  pincode: string;
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

const CreatePartyPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyType = searchParams.get('type') || 'CUSTOMER';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<PartyForm>({
    name: '',
    party_type: partyType as 'CUSTOMER' | 'SUPPLIER' | 'BOTH',
    gstin: '',
    email: '',
    phone: '',
    state: 'Tamil Nadu',
    contact_person: '',
    address_line1: '',
    address_line2: '',
    city: '',
    pincode: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.party_type) {
      setError('Party type is required');
      return false;
    }
    if (!formData.state) {
      setError('State is required');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      setError('Please enter a valid GSTIN');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, any> = {
        name: formData.name,
        party_type: formData.party_type,
        state: formData.state
      };

      // Add optional fields if provided
      if (formData.gstin) payload.gstin = formData.gstin;
      if (formData.email) payload.email = formData.email;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.contact_person) payload.contact_person = formData.contact_person;
      if (formData.address_line1) payload.address_line1 = formData.address_line1;
      if (formData.address_line2) payload.address_line2 = formData.address_line2;
      if (formData.city) payload.city = formData.city;
      if (formData.pincode) payload.pincode = formData.pincode;

      const response = await apiClient.post('/party/parties/', payload);

      if (response.error) {
        setError(response.error || 'Failed to create party');
      } else {
        setSuccess(`${formData.party_type === 'CUSTOMER' ? 'Retailer' : 'Supplier'} created successfully!`);
        setTimeout(() => {
          router.push('/manufacturer/connections');
        }, 1500);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold">
            Create {partyType === 'CUSTOMER' ? 'Retailer' : partyType === 'SUPPLIER' ? 'Supplier' : 'Party'}
          </h1>
          <p className="text-neutral-400 mt-2">
            Add a new {partyType === 'CUSTOMER' ? 'retailer/customer' : 'supplier'} to your network
          </p>
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

        <form onSubmit={handleSubmit} className="max-w-2xl">
          {/* Required Fields */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Required Information</h2>
                <p className="text-sm text-neutral-400">Basic details about the party</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter business name"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  required
                />
              </div>

              {/* Party Type */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Party Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="party_type"
                  value={formData.party_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  required
                >
                  <option value="CUSTOMER">Customer / Retailer</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="BOTH">Both (Customer & Supplier)</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  required
                >
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Optional Information</h2>
                <p className="text-sm text-neutral-400">Additional details (can be added later)</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* GSTIN */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange({
                    ...e,
                    target: { ...e.target, value: e.target.value.toUpperCase() }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  placeholder="e.g., 27AAPFU0939F1ZV"
                  maxLength={15}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                />
                <p className="text-xs text-neutral-500 mt-1">15-character GST Identification Number</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Email
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 py-3 bg-neutral-700 border border-r-0 border-neutral-700 rounded-l-lg">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="business@example.com"
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Phone
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 py-3 bg-neutral-700 border border-r-0 border-neutral-700 rounded-l-lg text-neutral-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Contact Person
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 py-3 bg-neutral-700 border border-r-0 border-neutral-700 rounded-l-lg">
                    <User className="h-5 w-5 text-neutral-400" />
                  </span>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    placeholder="Contact person name"
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Fields */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Address (Optional)</h2>
                <p className="text-sm text-neutral-400">Business address details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Building, Street name"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="Area, Landmark"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="600001"
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Create {partyType === 'CUSTOMER' ? 'Retailer' : 'Party'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreatePartyPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CreatePartyPageContent />
    </Suspense>
  );
};

export default CreatePartyPage;
