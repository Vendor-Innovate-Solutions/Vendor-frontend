"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../utils/api';
import { 
  User, 
  Lock, 
  Phone, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  Loader,
  Building2,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

interface AcceptInviteForm {
  full_name: string;
  password: string;
  confirm_password: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
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

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('code');
  const email = searchParams.get('email');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [inviteData, setInviteData] = useState<{
    company_name: string;
    email: string;
    message: string;
    expires_at: string;
  } | null>(null);
  
  const [formData, setFormData] = useState<AcceptInviteForm>({
    full_name: '',
    password: '',
    confirm_password: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: ''
  });

  useEffect(() => {
    if (!inviteCode) {
      setError('No invite code provided. Please use the link from your invitation email.');
      setVerifying(false);
      return;
    }
    verifyInviteCode();
  }, [inviteCode]);

  const verifyInviteCode = async () => {
    try {
      const response = await api(`/portal/verify-invite/?code=${inviteCode}`, {
        method: 'GET',
      }, false);

      if (response.error) {
        setError(response.error || 'Invalid or expired invite code');
      } else if (response.data) {
        setInviteData(response.data as {
          company_name: string;
          email: string;
          message: string;
          expires_at: string;
        });
      }
    } catch (error) {
      setError('Failed to verify invite code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
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
        invite_code: inviteCode,
        full_name: formData.full_name,
        password: formData.password
      };

      // Add optional fields if provided
      if (formData.phone) payload.phone = formData.phone;
      if (formData.address_line1) payload.address_line1 = formData.address_line1;
      if (formData.address_line2) payload.address_line2 = formData.address_line2;
      if (formData.city) payload.city = formData.city;
      if (formData.state) payload.state = formData.state;
      if (formData.pincode) payload.pincode = formData.pincode;

      const response = await api('/portal/accept-invite/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, false);

      if (response.error) {
        setError(response.error || 'Failed to accept invitation');
      } else {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/authentication');
        }, 2000);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-neutral-400">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!inviteCode || (!inviteData && error)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-neutral-900 rounded-xl border border-neutral-800 p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-neutral-400 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
          <button
            onClick={() => router.push('/authentication')}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
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
          <h1 className="text-3xl font-bold mb-2">Accept Invitation</h1>
          {inviteData && (
            <p className="text-neutral-400">
              You've been invited to join <span className="text-green-400 font-semibold">{inviteData.company_name}</span>
            </p>
          )}
        </div>

        {/* Invite Message */}
        {inviteData?.message && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-400">{inviteData.message}</p>
          </div>
        )}

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

        <form onSubmit={handleSubmit}>
          {/* Required Fields */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Account Details</h2>
                <p className="text-sm text-neutral-400">Create your login credentials</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email (readonly) */}
              {inviteData?.email && (
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteData.email}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-400 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 pr-12 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Minimum 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 pr-12 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Additional Details</h2>
                <p className="text-sm text-neutral-400">Optional information</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Phone Number
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
                    className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Address */}
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
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
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
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
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
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
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
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                >
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Accept Invitation & Create Account
              </>
            )}
          </button>

          <p className="text-center text-sm text-neutral-500 mt-4">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/authentication')}
              className="text-green-400 hover:text-green-300"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

const AcceptInvitePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-green-500" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
};

export default AcceptInvitePage;
