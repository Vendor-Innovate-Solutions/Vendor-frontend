'use client';

import { useEffect } from 'react';
import { startTokenRefreshCheck } from '@/utils/tokenRefresh';

/**
 * Auth Provider Component
 * Handles automatic token refresh in the background
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the token refresh check
    const cleanup = startTokenRefreshCheck();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  return <>{children}</>;
}
