"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';
import { authStorage } from '../../../utils/localStorage';
import { fetchWithAuth, API_URL } from '../../../utils/auth_fn';
import { User, Mail, Phone, MapPin, Building, Save, Edit3, Loader } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  company_name?: string;
}

const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  // Check if retailer profile exists using context API
  // Check if retailer profile exists using context API
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const contextResponse = await fetchWithAuth(`${API_URL}/users/me/context/`);
        
        if (contextResponse.ok) {
          const context = await contextResponse.json();
          
          // If is_portal_user is false, profile not complete - redirect to setup
          if (!context.is_portal_user) {
            router.replace('/retailer/setup');
            return;
          }
        } else {
          router.replace('/retailer/setup');
          return;
        }
        
        setProfileChecked(true);
      } catch (error) {
        router.replace('/retailer/setup');
      }
    };

    checkProfile();
  }, [router]);

  useEffect(() => {
    if (!profileChecked) return;
    fetchProfile();
  }, [profileChecked]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}/users/me/`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      const response = await fetchWithAuth(`${API_URL}/users/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone
        }),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  // Don't render if profile check hasn't completed
  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Checking profile...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <RetailerNavbar />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <RetailerNavbar />
        <div className="container mx-auto p-6">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400">Failed to load profile data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-900/30 p-3 rounded-full">
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <p className="text-neutral-400">Manage your account information and preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-neutral-600 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-4 bg-green-900/20 border border-green-700 rounded-lg p-4">
              <p className="text-green-400">{success}</p>
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-neutral-400" />
              <h2 className="text-lg font-semibold text-white">Personal Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.first_name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.last_name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Company Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.company_name || ''}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.company_name || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-neutral-400" />
              <h2 className="text-lg font-semibold text-white">Contact Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.phone || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-neutral-400" />
              <h2 className="text-lg font-semibold text-white">Address Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Street Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.address || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">State/Province</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.state || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.country || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Postal Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.postal_code || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;