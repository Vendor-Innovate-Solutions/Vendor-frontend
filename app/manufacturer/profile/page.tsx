// filepath: c:\Users\91902\OneDrive - Amrita Vishwa Vidyapeetham\Documents\sony\SmartChainERP\frontend\app\manufacturer\profile\page.tsx
"use client";
import { API_URL } from '@/utils/auth_fn';
import React, { useState, useEffect } from 'react';

const ProfileTab = () => {
  const [userDetails, setUserDetails] = useState<{
    username: string;
    email: string;
    is_staff: boolean;
    groups: string[];
  }>({
    username: '',
    email: '',
    is_staff: false,
    groups: [],
  });

  const mockUserDetails = {
    username: 'manufacturer_admin',
    email: 'admin@democompany.com',
    is_staff: true,
    groups: ['Manufacturer', 'Admin'],
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.log('No token found, using mock profile data');
          setUserDetails(mockUserDetails);
          return;
        }

        const response = await fetch(`${API_URL}/api/auth/user/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.log('API request failed, using mock profile data');
          setUserDetails(mockUserDetails);
          return;
        }

        const data = await response.json();
        // Use mock data if response is empty
        if (!data.username || !data.email) {
          console.log('Empty API response, using mock profile data');
          setUserDetails(mockUserDetails);
        } else {
          setUserDetails(data);
        }
      } catch (error) {
        console.error('Failed to fetch user details from API, using mock data:', error);
        setUserDetails(mockUserDetails);
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="text-xl font-bold">Manufacturer Details</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 max-w-[1600px] mx-auto">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-gray-400 mb-2">Username</h3>
            <p className="text-white">{userDetails.username}</p>

            <h3 className="text-gray-400 mb-2 mt-4">Email</h3>
            <p className="text-white">{userDetails.email}</p>

            <h3 className="text-gray-400 mb-2 mt-4">Staff Status</h3>
            <p className="text-white">{userDetails.is_staff ? 'Yes' : 'No'}</p>

            <h3 className="text-gray-400 mb-2 mt-4">Groups</h3>
            <p className="text-white">{userDetails.groups.join(', ')}</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProfileTab;