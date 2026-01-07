/**
 * Token Refresh Utility
 * Automatically refreshes access tokens before they expire
 */

import { authStorage } from './localStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vendor-backend-production-bd99.up.railway.app";

// Decode JWT to get expiration time
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Check if token is expired or will expire soon (within 5 minutes)
function isTokenExpiringSoon(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  const bufferTime = 5 * 60; // 5 minutes in seconds
  
  return decoded.exp - currentTime < bufferTime;
}

// Refresh the access token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    console.log('No refresh token available');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token, status:', response.status);
      // If refresh token is invalid, clear auth data
      if (response.status === 401) {
        authStorage.clearAll();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return false;
    }

    const data = await response.json();
    if (data.access) {
      authStorage.setAccessToken(data.access);
      console.log('Token refreshed successfully');
      return true;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }

  return false;
}

// Check and refresh token if needed
export async function checkAndRefreshToken(): Promise<void> {
  const accessToken = authStorage.getAccessToken();
  
  if (!accessToken) {
    console.log('No access token found');
    return;
  }

  if (isTokenExpiringSoon(accessToken)) {
    console.log('Access token expiring soon, refreshing...');
    await refreshAccessToken();
  }
}

// Start automatic token refresh check
export function startTokenRefreshCheck(): () => void {
  // Check immediately
  checkAndRefreshToken();
  
  // Check every 4 minutes
  const interval = setInterval(() => {
    checkAndRefreshToken();
  }, 4 * 60 * 1000);

  // Return cleanup function
  return () => clearInterval(interval);
}
