"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth, API_URL } from '../../../utils/auth_fn';
import { Navbar } from '../../../components/manufacturer/nav_bar';
import { 
  Users, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX, 
  Copy, 
  Send,
  AlertCircle,
  Mail,
  Calendar
} from 'lucide-react';

interface RetailerRequest {
  id: number;
  retailer: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  company: {
    id: number;
    name: string;
    address: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: any | null;
}

interface Connection {
  id: number;
  company: {
    id: number;
    name: string;
    address: string;
  };
  retailer: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  status: 'approved' | 'suspended';
  connected_at: string;
  approved_by: any;
  approved_at: string;
  credit_limit: number;
  payment_terms: string;
}

interface Invitation {
  id: number;
  invite_code: string;
  company: {
    id: number;
    name: string;
    address: string;
  };
  invited_by: {
    id: number;
    username: string;
    email: string;
  };
  email: string;
  message: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  used_by: any | null;
}

const ConnectionsPage = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'connections' | 'invites'>('requests');
  
  // Requests
  const [requests, setRequests] = useState<RetailerRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Connections
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  
  // Invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  
  // Modals
  const [showGenerateInviteModal, setShowGenerateInviteModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RetailerRequest | null>(null);
  
  // Forms
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteExpireDays, setInviteExpireDays] = useState(7);
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'connections') {
      fetchConnections();
    } else if (activeTab === 'invites') {
      fetchInvitations();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      // Use portal/retailers endpoint with status filter for pending requests
      const response = await fetchWithAuth(`${API_URL}/portal/retailers/?status=PENDING`);
      if (response.ok) {
        const data = await response.json();
        const retailers = Array.isArray(data) ? data : data.results || [];
        // Map backend data to frontend format
        setRequests(retailers.map((r: any) => ({
          id: r.id,
          retailer: {
            id: r.user_id || r.id,
            username: r.user_email || r.email || '',
            email: r.user_email || r.email || '',
            first_name: r.user_name?.split(' ')[0] || '',
            last_name: r.user_name?.split(' ').slice(1).join(' ') || '',
          },
          company: {
            id: r.party_id || '',
            name: r.business_name || r.party_name || '',
            address: r.address || '',
          },
          status: (r.status || 'PENDING').toLowerCase(),
          message: r.notes || '',
          requested_at: r.created_at || new Date().toISOString(),
          reviewed_at: r.updated_at || null,
          reviewed_by: null,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchConnections = async () => {
    setConnectionsLoading(true);
    try {
      // Use portal/retailers endpoint with status filter for approved connections
      const response = await fetchWithAuth(`${API_URL}/portal/retailers/?status=APPROVED`);
      if (response.ok) {
        const data = await response.json();
        const retailers = Array.isArray(data) ? data : data.results || [];
        // Map backend data to frontend format
        setConnections(retailers.map((r: any) => ({
          id: r.id,
          company: {
            id: r.party_id || '',
            name: r.business_name || r.party_name || '',
            address: r.address || '',
          },
          retailer: {
            id: r.user_id || r.id,
            username: r.user_email || r.email || '',
            email: r.user_email || r.email || '',
            first_name: r.user_name?.split(' ')[0] || '',
            last_name: r.user_name?.split(' ').slice(1).join(' ') || '',
          },
          status: (r.status || 'APPROVED').toLowerCase(),
          connected_at: r.created_at || new Date().toISOString(),
          approved_by: null,
          approved_at: r.updated_at || r.created_at || new Date().toISOString(),
          credit_limit: r.credit_limit || 0,
          payment_terms: r.payment_terms || 'Net 30 days',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    try {
      // Use company/connection/generate-code to get company code (serves as invite)
      const response = await fetchWithAuth(`${API_URL}/company/connection/generate-code/`);
      if (response.ok) {
        const data = await response.json();
        // Company code acts as a permanent invite
        setInvitations([{
          id: 1,
          invite_code: data.company_code || '',
          company: {
            id: data.company_id || '',
            name: data.company_name || '',
            address: '',
          },
          invited_by: { id: 0, username: '', email: '' },
          email: '',
          message: data.message || 'Share this code with retailers',
          created_at: new Date().toISOString(),
          expires_at: '', // Company codes don't expire
          is_used: false,
          used_at: null,
          used_by: null,
        }]);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const generateInviteCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Use company/connection/generate-code endpoint
      const response = await fetchWithAuth(`${API_URL}/company/connection/generate-code/`);
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Company code: ${data.company_code} - Share this with retailers!`);
        setShowGenerateInviteModal(false);
        setInviteMessage('');
        setInviteExpireDays(7);
        fetchInvitations();
        
        // Copy to clipboard
        navigator.clipboard.writeText(data.company_code);
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.detail || 'Failed to get company code');
      }
    } catch (error) {
      setError('Failed to get company code');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: number | string, action: 'approve' | 'reject') => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Use portal/retailers/<id>/approve or /reject endpoint
      const endpoint = action === 'approve' 
        ? `${API_URL}/portal/retailers/${requestId}/approve/`
        : `${API_URL}/portal/retailers/${requestId}/reject/`;
      
      const payload: any = {};
      if (action === 'approve') {
        payload.credit_limit = parseFloat(creditLimit) || 0;
        payload.payment_terms = paymentTerms;
      }
      
      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || `Successfully ${action}d retailer`);
        setShowRequestModal(false);
        setSelectedRequest(null);
        setCreditLimit('');
        setPaymentTerms('Net 30 days');
        fetchRequests();
        fetchConnections();
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.detail || `Failed to ${action} request`);
      }
    } catch (error) {
      setError(`Failed to ${action} request`);
    } finally {
      setLoading(false);
    }
  };

  const updateConnectionStatus = async (connectionId: number, status: 'approved' | 'suspended') => {
    try {
      const response = await fetchWithAuth(`${API_URL}/company/update-connection/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          status
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        fetchConnections();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update connection');
      }
    } catch (error) {
      setError('Failed to update connection');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-neutral-950">
     
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Retailer Connections</h1>
            <p className="text-neutral-400 mt-2">Manage retailer relationships, invitations, and requests</p>
          </div>
          <button
            onClick={() => setShowGenerateInviteModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Generate Invite Code
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-400">{success}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800">
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium rounded-tl-lg transition-colors ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Requests ({pendingRequests.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'connections'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Connections ({connections.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-6 py-3 text-sm font-medium rounded-tr-lg transition-colors ${
                activeTab === 'invites'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Invites ({invitations.length})
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {requestsLoading ? (
                  <p className="text-neutral-400">Loading requests...</p>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No pending requests</p>
                    <p className="text-neutral-500 text-sm mt-2">
                      Retailers can request to join your company or use invite codes
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request.id} className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">
                              {request.retailer.first_name} {request.retailer.last_name}
                            </h3>
                            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">
                              Pending
                            </span>
                          </div>
                          <p className="text-neutral-400 text-sm">{request.retailer.email}</p>
                          <p className="text-neutral-300 mt-2">{request.message}</p>
                          <p className="text-neutral-500 text-xs mt-2">
                            Requested on {formatDate(request.requested_at)}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestModal(true);
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRequest(request.id, 'reject')}
                            disabled={loading}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === 'connections' && (
              <div className="space-y-4">
                {connectionsLoading ? (
                  <p className="text-neutral-400">Loading connections...</p>
                ) : connections.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No active connections</p>
                    <p className="text-neutral-500 text-sm mt-2">
                      Approved retailers will appear here
                    </p>
                  </div>
                ) : (
                  connections.map((connection) => (
                    <div key={connection.id} className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">
                              {connection.retailer.first_name} {connection.retailer.last_name}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              connection.status === 'approved' 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-red-900/30 text-red-400'
                            }`}>
                              {connection.status}
                            </span>
                          </div>
                          <p className="text-neutral-400 text-sm">{connection.retailer.email}</p>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-neutral-500 text-xs">Credit Limit</p>
                              <p className="text-neutral-300">${connection.credit_limit.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500 text-xs">Payment Terms</p>
                              <p className="text-neutral-300">{connection.payment_terms}</p>
                            </div>
                          </div>
                          <p className="text-neutral-500 text-xs mt-2">
                            Connected on {formatDate(connection.connected_at)}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {connection.status === 'approved' ? (
                            <button
                              onClick={() => updateConnectionStatus(connection.id, 'suspended')}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateConnectionStatus(connection.id, 'approved')}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <div className="space-y-4">
                {invitationsLoading ? (
                  <p className="text-neutral-400">Loading invitations...</p>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No invitations sent yet</p>
                    <p className="text-neutral-500 text-sm mt-2">
                      Generate invite codes to share with potential retailers
                    </p>
                  </div>
                ) : (
                  invitations.map((invite) => (
                    <div key={invite.id} className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="font-mono text-blue-400 bg-neutral-900 px-2 py-1 rounded">
                              {invite.invite_code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(invite.invite_code)}
                              className="text-neutral-400 hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              invite.is_used 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-yellow-900/30 text-yellow-400'
                            }`}>
                              {invite.is_used ? 'Used' : 'Active'}
                            </span>
                          </div>
                          
                          {invite.email && (
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-neutral-500" />
                              <p className="text-neutral-400 text-sm">{invite.email}</p>
                            </div>
                          )}
                          
                          <p className="text-neutral-300 text-sm">{invite.message}</p>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {formatDate(invite.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires {formatDate(invite.expires_at)}
                            </div>
                          </div>
                          
                          {invite.used_by && (
                            <p className="text-green-400 text-sm mt-2">
                              Used by {invite.used_by.email} on {formatDate(invite.used_at!)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Invite Modal */}
      {showGenerateInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Generate Invite Code</h3>
              <button
                onClick={() => setShowGenerateInviteModal(false)}
                className="text-neutral-400 hover:text-neutral-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Welcome to our network! Join us to access our products."
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Expires in (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={inviteExpireDays}
                  onChange={(e) => setInviteExpireDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <button
                onClick={generateInviteCode}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Request Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Approve Request</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-neutral-400 hover:text-neutral-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-800 p-3 rounded-lg">
                <p className="text-white font-medium">
                  {selectedRequest.retailer.first_name} {selectedRequest.retailer.last_name}
                </p>
                <p className="text-neutral-400 text-sm">{selectedRequest.retailer.email}</p>
                <p className="text-neutral-300 text-sm mt-2">{selectedRequest.message}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Credit Limit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Net 30 days"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequest(selectedRequest.id, 'approve')}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleRequest(selectedRequest.id, 'reject')}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsPage;
