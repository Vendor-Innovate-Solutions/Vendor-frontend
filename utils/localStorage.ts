/**
 * Safe localStorage utility functions that work in both client and server environments
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },

  clear: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }
};

// Helper functions for common auth-related localStorage operations
export const authStorage = {
  getAccessToken: (): string | null => safeLocalStorage.getItem("access_token"),
  setAccessToken: (token: string): void => safeLocalStorage.setItem("access_token", token),
  removeAccessToken: (): void => safeLocalStorage.removeItem("access_token"),

  getRefreshToken: (): string | null => safeLocalStorage.getItem("refresh_token"),
  setRefreshToken: (token: string): void => safeLocalStorage.setItem("refresh_token", token),
  removeRefreshToken: (): void => safeLocalStorage.removeItem("refresh_token"),

  getCompanyId: (): string | null => safeLocalStorage.getItem("company_id"),
  setCompanyId: (id: string): void => safeLocalStorage.setItem("company_id", id),
  removeCompanyId: (): void => safeLocalStorage.removeItem("company_id"),

  clearAll: (): void => {
    safeLocalStorage.removeItem("access_token");
    safeLocalStorage.removeItem("refresh_token");
    safeLocalStorage.removeItem("company_id");
  }
};
