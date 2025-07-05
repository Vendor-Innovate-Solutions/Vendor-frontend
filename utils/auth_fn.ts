
import { authStorage } from './localStorage';

const API_URL = "https://vendor-backendproduction.up.railway.app/api";

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

export { API_URL, getAuthToken, refreshAccessToken, fetchWithAuth };