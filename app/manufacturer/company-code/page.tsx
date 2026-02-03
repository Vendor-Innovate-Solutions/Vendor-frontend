"use client";
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api';
import { Copy, Check, Users, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { CompanyCodeData } from '@/types/api';

const CompanyCodePage = () => {
  const [codeData, setCodeData] = useState<CompanyCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCompanyCode();
  }, []);

  const fetchCompanyCode = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<CompanyCodeData>('/company/connection/generate-code/');
      if (response.data) {
        setCodeData(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (error: any) {
      console.error('Failed to fetch company code:', error);
      setError('Failed to load company code. Please make sure you have an active company.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (codeData) {
      navigator.clipboard.writeText(codeData.company_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-neutral-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto p-6">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Error</h2>
            </div>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Company Connection Code</h1>
            <p className="text-neutral-400">
              Share this code with retailers to allow them to connect to your company
            </p>
          </div>

          {/* Company Code Card */}
          {codeData && (
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <LinkIcon className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Your Company Code</h2>
              </div>

              <div className="bg-neutral-900/50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400 mb-2">Company Name</p>
                    <p className="text-xl font-semibold text-white mb-4">{codeData.company_name}</p>
                    
                    <p className="text-sm text-neutral-400 mb-2">Company Code</p>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold text-blue-400 tracking-wider">
                        {codeData.company_code}
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-5 w-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-5 w-5" />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>How it works:</strong> Retailers can use this code to instantly connect to your company. 
                  They simply need to enter this code in their Companies page to establish a connection.
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-neutral-400" />
              <h3 className="text-lg font-semibold text-white">Instructions for Retailers</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Navigate to Companies Page</p>
                  <p className="text-neutral-400 text-sm">
                    Retailers should go to their Companies page in the retailer portal
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Click "Join Company"</p>
                  <p className="text-neutral-400 text-sm">
                    Click the "Join Company" button to open the connection dialog
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Enter Company Code</p>
                  <p className="text-neutral-400 text-sm">
                    Select "Company Code" option and enter: <strong className="text-blue-400">{codeData?.company_code}</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Instant Connection</p>
                  <p className="text-neutral-400 text-sm">
                    The connection will be automatically approved, and they can start ordering immediately
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Additional Information</h3>
            <ul className="space-y-2 text-neutral-400 text-sm">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                This code is unique to your company and can be shared with multiple retailers
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                Connections using this code are automatically approved
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                You can view all connected retailers in the Connections page
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                You can manage retailer access and permissions from the Connections page
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCodePage;
