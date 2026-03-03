/**
 * Application configuration
 * Uses environment variables with fallback to localhost for development
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const AUTH_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, '');
export const CFN_API_BASE_URL = process.env.NEXT_PUBLIC_CFN_API_URL || "http://localhost:8001";
