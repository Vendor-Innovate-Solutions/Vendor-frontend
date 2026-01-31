// filepath: c:\Users\91902\OneDrive - Amrita Vishwa Vidyapeetham\Documents\sony\SmartChainERP\frontend\app\manufacturer\profile\page.tsx
"use client";
import { apiClient } from '@/utils/api';
import React, { useState, useEffect } from 'react';

interface UserDetails {
  username: string;
  email: string;
  is_staff: boolean;
  groups: string[];
}

const ProfileTab = () => {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    username: '',
    email: '',
    is_staff: false,
    groups: [],
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await apiClient.get<UserDetails>("/user_detail/");

        if (response.data) {
          setUserDetails(response.data);
        } else if (response.error) {
          console.error('Failed to fetch user details:', response.error);
        }
      } catch (error) {
        console.error('Failed to fetch user details from API:', error);
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