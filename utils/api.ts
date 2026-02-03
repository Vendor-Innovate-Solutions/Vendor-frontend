/**
 * Centralized API utility with automatic token refresh
 * Use this for all authenticated API calls in the application
 */

const API_BASE_URL = "http://127.0.0.1:8000/api";

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

interface RefreshResponse {
  access: string;
  refresh?: string;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  
  if (!refreshToken) {
    return null;
  }

  try {
    // Auth endpoints are at root level, not under /api
    const response = await fetch(`http://127.0.0.1:8000/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is also expired or invalid
      clearTokens();
      return null;
    }

    const data: RefreshResponse = await response.json();
    
    if (data.access) {
      localStorage.setItem("access_token", data.access);
      // Some APIs also return a new refresh token
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }
      return data.access;
    }

    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearTokens();
    return null;
  }
}

/**
 * Clear all auth tokens and redirect to login
 */
function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("company_id");
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/authentication";
  }
}

/**
 * Get authorization headers
 */
function getAuthHeaders(accessToken?: string): Record<string, string> {
  const token = accessToken || localStorage.getItem("access_token");
  const companyId = localStorage.getItem("company_id");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (companyId) {
    headers["X-Company-ID"] = companyId;
  }

  return headers;
}

/**
 * Main API function with automatic token refresh
 * @param endpoint - API endpoint (e.g., "/users/me/context/")
 * @param options - Fetch options (method, body, etc.)
 * @param requiresAuth - Whether the request requires authentication (default: true)
 */
export async function api<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Build headers object for fetch
  const headersInit: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("access_token");
    if (token) {
      headersInit["Authorization"] = `Bearer ${token}`;
    }
    
    // Add company ID header if available
    const companyId = localStorage.getItem("company_id");
    if (companyId) {
      headersInit["X-Company-ID"] = companyId;
    }
  }

  // Extract body from options
  const { headers: _, body, ...restOptions } = options;

  try {
    let response = await fetch(url, {
      ...restOptions,
      headers: headersInit,
      body,
      mode: "cors",
      credentials: "omit", // Don't send cookies for cross-origin requests
    });

    // If unauthorized and requires auth, try to refresh token
    if (response.status === 401 && requiresAuth) {
      console.log("Access token expired, attempting refresh...");
      
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry the request with new token
        const retryHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${newAccessToken}`,
        };
        
        // Add company ID header if available
        const companyId = localStorage.getItem("company_id");
        if (companyId) {
          retryHeaders["X-Company-ID"] = companyId;
        }

        response = await fetch(url, {
          ...restOptions,
          headers: retryHeaders,
          body,
          mode: "cors",
          credentials: "omit",
        });

        // If still unauthorized after refresh, redirect to login
        if (response.status === 401) {
          redirectToLogin();
          return {
            data: null,
            error: "Session expired. Please login again.",
            status: 401,
          };
        }
      } else {
        // Refresh failed, redirect to login
        redirectToLogin();
        return {
          data: null,
          error: "Session expired. Please login again.",
          status: 401,
        };
      }
    }

    // Parse response
    let data: T | null = null;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMessage = (data as Record<string, unknown>)?.detail || 
                          (data as Record<string, unknown>)?.error || 
                          (data as Record<string, unknown>)?.message ||
                          `Request failed with status ${response.status}`;
      return {
        data: null,
        error: errorMessage as string,
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error. Please check your connection.",
      status: 0,
    };
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const apiClient = {
  get: <T = unknown>(endpoint: string, requiresAuth: boolean = true) =>
    api<T>(endpoint, { method: "GET" }, requiresAuth),

  post: <T = unknown>(endpoint: string, body?: unknown, requiresAuth: boolean = true) =>
    api<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }, requiresAuth),

  put: <T = unknown>(endpoint: string, body?: unknown, requiresAuth: boolean = true) =>
    api<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, requiresAuth),

  patch: <T = unknown>(endpoint: string, body?: unknown, requiresAuth: boolean = true) =>
    api<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, requiresAuth),

  delete: <T = unknown>(endpoint: string, requiresAuth: boolean = true) =>
    api<T>(endpoint, { method: "DELETE" }, requiresAuth),
};

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("access_token");
}

/**
 * Logout user - clear tokens and redirect
 */
export function logout() {
  redirectToLogin();
}

export default api;
