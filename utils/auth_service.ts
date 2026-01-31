/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { API_URL } from "./auth_fn";
import { LoginFormData, SignupFormData } from "@/lib/schemas/auth";

export interface LoginResponse {
  access: string;
  refresh: string;
  user_type: "RETAILER" | "COMPANY_USER";
  role?: string;
  detail?: string;
}

export interface SignupResponse {
  access?: string;
  refresh?: string;
  role?: string;
  detail?: string;
  status?: "PENDING" | "APPROVED";
}

export interface Company {
  id: string;
  name: string;
  description?: string;
}

/**
 * Login user
 */
export async function login(data: LoginFormData): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Login failed");
  }

  return result;
}

/**
 * Register new user
 */
export async function signup(data: SignupFormData): Promise<SignupResponse> {
  const response = await fetch(`${API_URL}/auth/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.detail || 
      result.email || 
      result.full_name || 
      "Registration failed"
    );
  }

  return result;
}

/**
 * Get list of companies for selection
 */
export async function getCompanies(): Promise<Company[]> {
  const response = await fetch(`${API_URL}/company/discover/`);

  if (!response.ok) {
    throw new Error("Failed to fetch companies");
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ access: string }> {
  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return result;
}

/**
 * Store authentication tokens
 */
export function storeTokens(access: string, refresh: string, companyId?: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  if (companyId) {
    localStorage.setItem("company_id", companyId);
  }
}

/**
 * Clear authentication tokens
 */
export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("company_id");
}

/**
 * Get stored tokens
 */
export function getTokens() {
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
    companyId: localStorage.getItem("company_id"),
  };
}
