"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';
import { apiClient } from '../../../utils/api';
import { 
  Building2, 
  Plus, 
  CheckCircle, 
  Clock, 
  X, 
  Link as LinkIcon,
  Search,
  Loader,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { PublicCompany, UserContext, PaginatedResponse, JoinCompanyResponse } from '@/types/api';

interface Company {
  id: string;
  company_id?: string;
  company_name: string;
  name?: string;
  company?: {
    id: string;
    name: string;
  };
  status: 'approved' | 'connected' | 'pending' | 'rejected' | 'suspended';
  connected_at?: string;
  credit_limit?: string;
}

interface CompanyDisplay {
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

const CompaniesPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'connected' | 'discover' | 'join'>('connected');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [publicCompanies, setPublicCompanies] = useState<PublicCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Join by code
  const [inviteCode, setInviteCode] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);
  
  // Request approval
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  // Check if retailer profile exists using context API
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const contextResponse = await apiClient.get<UserContext>('/users/me/context/');
        
        if (contextResponse.data) {
          const context = contextResponse.data;
          
          // If is_portal_user is false, profile not complete - redirect to setup
          if (!context.is_portal_user) {
            router.replace('/retailer/setup');
            return;
          }
        } else {
          router.replace('/retailer/setup');
          return;
        }
        
        setProfileChecked(true);
      } catch (error) {
        router.replace('/retailer/setup');
      }
    };

    checkProfile();
  }, [router]);

  useEffect(() => {
    if (!profileChecked) return;
    fetchConnectedCompanies();
    fetchPublicCompanies();
  }, [profileChecked]);

  const fetchConnectedCompanies = async () => {
    setLoading(true);
    try {
      // Get companies from retailer connections API
      const response = await apiClient.get<Company[]>('/portal/companies/');
      if (response.data && Array.isArray(response.data)) {
        const companiesList = response.data.map((c) => ({
          id: c.id,
          company_id: c.company_id,
          company_name: c.company_name,
          status: (c.status?.toLowerCase() || 'pending') as Company['status'],
          connected_at: c.connected_at
        }));
        setCompanies(companiesList);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Failed to fetch connected companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicCompanies = async () => {
    try {
      // Use Portal companies discover API
      const response = await apiClient.get<PaginatedResponse<PublicCompany> | PublicCompany[]>('/portal/companies/discover/');
      if (response.data) {
        const publicList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as PaginatedResponse<PublicCompany>).results || [];
        // Map to expected format
        setPublicCompanies(publicList.map((c) => ({
          id: c.company_code || c.id,
          name: c.company_name || c.name,
          description: c.description,
          contact_email: c.contact_email
        })));
      }
    } catch (error) {
      console.error('Failed to fetch public companies:', error);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter a company code');
      return;
    }
    
    setJoiningByCode(true);
    setError('');
    setSuccess('');
    
    try {
      // Use new join-by-company-code API
      const response = await apiClient.post<JoinCompanyResponse>('/portal/join-by-company-code/', {
        company_code: inviteCode.toUpperCase()
      });
      
      if (response.data) {
        setSuccess(response.data.message || 'Successfully joined company!');
        setInviteCode('');
        setActiveTab('connected');
        // Refresh companies list
        fetchConnectedCompanies();
      } else if (response.error) {
        setError(response.error);
      }
    } catch (error: any) {
      console.error('Failed to join by code:', error);
      setError(error?.message || 'Failed to join company');
    } finally {
      setJoiningByCode(false);
    }
  };

  const handleRequestApproval = async (companyId: string) => {
    setRequestingApproval(true);
    setError('');
    setSuccess('');
    
    try {
      // Use complete-profile API with company_id to request connection
      const response = await apiClient.post('/portal/complete-profile/', {
        company_id: companyId
      });
      
      if (response.error) {
        setError(response.error || 'Failed to send request');
      } else {
        setSuccess('Connection request sent! Awaiting approval.');
        setSelectedCompany(null);
        setRequestMessage('');
        fetchConnectedCompanies();
      }
    } catch (error) {
      setError('Failed to send request. Please try again.');
    } finally {
      setRequestingApproval(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'connected':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'rejected':
        return 'bg-red-900/30 text-red-400';
      case 'suspended':
        return 'bg-orange-900/30 text-orange-400';
      default:
        return 'bg-neutral-700 text-neutral-400';
    }
  };

  const filteredPublicCompanies = publicCompanies.filter(company => {
    if (!searchQuery) return true;
    return company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (company.city?.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Check if already connected to a company
  const isConnected = (companyId: string) => {
    return companies.some(c => (c.company_id || c.id) === companyId);
  };

  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-neutral-400">Checking profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manufacturer Connections</h1>
          <p className="text-neutral-400 mt-1">Connect with manufacturers to order their products</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="h-5 w-5 text-red-400" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-400">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X className="h-5 w-5 text-green-400" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex border-b border-neutral-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('connected')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === 'connected'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Building2 className="h-5 w-5" />
              My Connections ({companies.filter(c => c.status === 'approved' || c.status === 'connected').length})
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === 'join'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LinkIcon className="h-5 w-5" />
              Join by Code
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === 'discover'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Search className="h-5 w-5" />
              Discover
            </button>
          </div>

          <div className="p-6">
            {/* Connected Companies Tab */}
            {activeTab === 'connected' && (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-neutral-400" />
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
                    <p className="text-neutral-400 mb-6">
                      Connect with manufacturers to start ordering their products
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setActiveTab('join')}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Join with Code
                      </button>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Discover Companies
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map(company => (
                      <div 
                        key={company.id}
                        className="bg-neutral-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-green-400" />
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(company.status)}`}>
                            {company.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {company.company_name || company.name || company.company?.name}
                        </h3>
                        {company.connected_at && (
                          <p className="text-sm text-neutral-400 mb-3">
                            Connected {new Date(company.connected_at).toLocaleDateString()}
                          </p>
                        )}
                        {company.credit_limit && (
                          <p className="text-sm text-neutral-400">
                            Credit Limit: ₹{parseFloat(company.credit_limit).toLocaleString()}
                          </p>
                        )}
                        {(company.status === 'approved' || company.status === 'connected') && (
                          <button
                            onClick={() => router.push('/retailer/Orders')}
                            className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            Place Order
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Join by Code Tab */}
            {activeTab === 'join' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <LinkIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Join with Manufacturer Code</h3>
                  <p className="text-neutral-400 text-sm">
                    Enter the invite code provided by the manufacturer to connect
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g., ABC123XYZ789"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    />
                  </div>
                  <button
                    onClick={handleJoinByCode}
                    disabled={joiningByCode || !inviteCode.trim()}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {joiningByCode ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Connect
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-sm text-neutral-500 mt-6">
                  Don't have a code? Ask your manufacturer contact for an invite code.
                </p>
              </div>
            )}

            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search manufacturers..."
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-neutral-500"
                    />
                  </div>
                </div>

                {filteredPublicCompanies.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No companies found</h3>
                    <p className="text-neutral-400">
                      {searchQuery ? 'Try a different search term' : 'No public companies available'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPublicCompanies.map(company => (
                      <div 
                        key={company.id}
                        className="bg-neutral-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-400" />
                          </div>
                          {isConnected(company.id) && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400">
                              Connected
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{company.name}</h3>
                        {company.city && (
                          <p className="text-sm text-neutral-400 mb-2">
                            {company.city}, {company.state}
                          </p>
                        )}
                        {company.description && (
                          <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                            {company.description}
                          </p>
                        )}
                        
                        {isConnected(company.id) ? (
                          <button
                            onClick={() => router.push('/retailer/Orders')}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Place Order
                          </button>
                        ) : selectedCompany === company.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              placeholder="Optional message to the company..."
                              rows={2}
                              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 text-sm resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedCompany(null)}
                                className="flex-1 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRequestApproval(company.id)}
                                disabled={requestingApproval}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                              >
                                {requestingApproval ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Send Request'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedCompany(company.id)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Request to Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
