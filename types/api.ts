/**
 * API Response Type Definitions
 */

// User Context
export interface UserContext {
  is_portal_user: boolean;
  companies?: Array<{
    id: string;
    name: string;
  }>;
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

// Company - matches local CompanyDisplay interface
export interface ApiCompany {
  id: string;
  company_id?: string;
  company_name: string;
  name?: string;
  company?: {
    id: string;
    name: string;
  };
  retailer_name?: string;
  status: 'approved' | 'connected' | 'pending' | 'rejected' | 'suspended';
  connected_at?: string;
  credit_limit?: string;
}

// Public Company
export interface PublicCompany {
  id: string;
  name: string;
  company_name?: string;
  company_code?: string;
  description?: string;
  city?: string;
  state?: string;
  contact_email?: string;
}

// Company Code Data
export interface CompanyCodeData {
  company_code: string;
  company_name: string;
  company_id: string;
  message?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  results: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Join Company Response
export interface JoinCompanyResponse {
  message: string;
  company?: ApiCompany;
  status?: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_orders?: number;
  pending_orders?: number;
  total_invoices?: number;
  pending_amount?: string;
}
