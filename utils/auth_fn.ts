
import { authStorage } from './localStorage';

const API_URL = "https://vendor-backendproduction.up.railway.app/api";

/**
 * Authentication and Password Reset Utilities
 * 
 * This file contains utility functions for:
 * - User authentication (login/token refresh)
 * - Password reset flow (forgot password, OTP verification, password reset)
 * - Error handling for API responses
 */

const getAuthToken = (): string | null => {
  return authStorage.getAccessToken();
};

const getRefreshToken = (): string | null => {
  return authStorage.getRefreshToken();
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token");
      authStorage.clearAll();
      return null;
    }

    const data = await response.json();
    if (data.access) {
      authStorage.setAccessToken(data.access);
      return data.access;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
  }

  return null;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAuthToken();
  if (!token) throw new Error("Authentication token not found. Please log in again.");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (!token) throw new Error("Authentication token not found. Please log in again.");

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  return response;
};

// Utility function to handle API response errors
const handleApiResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle different HTTP status codes
    if (response.status === 400) {
      return { error: data.message || data.detail || 'Invalid request. Please check your input.' };
    } else if (response.status === 404) {
      return { error: 'User not found. Please check your username and email.' };
    } else if (response.status === 429) {
      return { error: 'Too many requests. Please try again later.' };
    } else if (response.status >= 500) {
      return { error: 'Server error. Please try again later.' };
    } else {
      return { error: data.message || data.detail || 'An error occurred. Please try again.' };
    }
  }
  
  return data;
};

// Password Reset API Functions
interface ForgotPasswordResponse {
  message?: string;
  error?: string;
}

interface VerifyOTPResponse {
  message?: string;
  error?: string;
}

interface ResetPasswordResponse {
  message?: string;
  error?: string;
}

interface ResendOTPResponse {
  message?: string;
  error?: string;
}

// 1. Forgot Password
const forgotPassword = async (username: string, email: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await fetch(`${API_URL}/forgot-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email })
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    return { error: 'Network error occurred. Please check your connection and try again.' };
  }
};

// 2. Verify OTP
const verifyOTP = async (username: string, otp: string): Promise<VerifyOTPResponse> => {
  try {
    const response = await fetch(`${API_URL}/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, otp })
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { error: 'Network error occurred. Please check your connection and try again.' };
  }
};

// 3. Reset Password
const resetPassword = async (
  username: string, 
  otp: string, 
  newPassword: string, 
  confirmPassword: string
): Promise<ResetPasswordResponse> => {
  try {
    const response = await fetch(`${API_URL}/reset-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        otp, 
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'Network error occurred. Please check your connection and try again.' };
  }
};

// 4. Resend OTP
const resendOTP = async (username: string): Promise<ResendOTPResponse> => {
  try {
    const response = await fetch(`${API_URL}/resend-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username })
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { error: 'Network error occurred. Please check your connection and try again.' };
  }
};

export { API_URL, getAuthToken, refreshAccessToken, fetchWithAuth, forgotPassword, verifyOTP, resetPassword, resendOTP };
