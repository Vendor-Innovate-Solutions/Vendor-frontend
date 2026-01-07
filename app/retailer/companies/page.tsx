"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL } from "@/utils/auth_fn";
import { Building, CheckCircle, Clock, XCircle } from "lucide-react";

type Company = {
  id: number;
  name: string;
  description?: string;
  city?: string;
  state?: string;
  created_at?: string;
};

type Connection = {
  id: number;
  company: number;
  company_name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  connected_at?: string;
  credit_limit?: string;
};

export default function RetailerCompaniesPage() {
  const router = useRouter();
  const [publicCompanies, setPublicCompanies] = useState<Company[]>([]);
  const [connectedCompanies, setConnectedCompanies] = useState<Connection[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("discover");

  useEffect(() => {
    fetchPublicCompanies();
    fetchConnectedCompanies();
  }, []);

  const fetchPublicCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/companies/public/`);
      if (response.ok) {
        const data = await response.json();
        setPublicCompanies(data);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const fetchConnectedCompanies = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/retailer/companies/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConnectedCompanies(data);
      }
    } catch (err) {
      console.error("Error fetching connected companies:", err);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/retailer/join-by-code/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Successfully joined company!");
        setInviteCode("");
        fetchConnectedCompanies();
        setActiveTab("connected");
      } else {
        setError(data.error || "Failed to join company");
      }
    } catch (err) {
      console.error("Error joining company:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async (companyId: number) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/retailer/request-approval/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_id: companyId,
          message: "I would like to connect with your company to order products.",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Request sent successfully!");
        fetchConnectedCompanies();
      } else {
        setError(data.error || "Failed to send request");
      }
    } catch (err) {
      console.error("Error requesting approval:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-500" size={20} />;
      case "pending":
        return <Clock className="text-yellow-500" size={20} />;
      case "rejected":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500 bg-green-900/20 border-green-500";
      case "pending":
        return "text-yellow-500 bg-yellow-900/20 border-yellow-500";
      case "rejected":
        return "text-red-500 bg-red-900/20 border-red-500";
      default:
        return "text-gray-500 bg-gray-900/20 border-gray-500";
    }
  };

  const handlePlaceOrder = (companyId: number) => {
    router.push(`/retailer/orders/new?company=${companyId}`);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Company Connections</h1>
          <p className="text-gray-400">Connect with suppliers to place orders</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500 rounded p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-900/20 border border-green-500 rounded p-3">
            <p className="text-green-500 text-sm">{success}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="discover">Discover Companies</TabsTrigger>
            <TabsTrigger value="connected">My Connections</TabsTrigger>
            <TabsTrigger value="invite">Join by Code</TabsTrigger>
          </TabsList>

          {/* Discover Companies Tab */}
          <TabsContent value="discover">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCompanies.map((company) => (
                <Card
                  key={company.id}
                  className="bg-gray-900 text-white border border-gray-700"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Building className="text-blue-500" size={24} />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm">
                          {company.city && company.state
                            ? `${company.city}, ${company.state}`
                            : "Location not specified"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {company.description && (
                      <p className="text-gray-400 text-sm mb-4">
                        {company.description}
                      </p>
                    )}
                    <Button
                      onClick={() => handleRequestApproval(company.id)}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Request to Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {publicCompanies.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Building className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No companies available</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Connected Companies Tab */}
          <TabsContent value="connected">
            <div className="space-y-4">
              {connectedCompanies.map((connection) => (
                <Card
                  key={connection.id}
                  className="bg-gray-900 text-white border border-gray-700"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Building className="text-blue-500" size={32} />
                        <div>
                          <h3 className="text-lg font-semibold">
                            {connection.company_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(connection.status)}
                            <span
                              className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                                connection.status
                              )}`}
                            >
                              {connection.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {connection.status === "approved" && (
                        <Button
                          onClick={() => handlePlaceOrder(connection.company)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Place Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {connectedCompanies.length === 0 && (
                <div className="text-center py-12">
                  <Building className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400 mb-4">No connections yet</p>
                  <Button
                    onClick={() => setActiveTab("discover")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Discover Companies
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Join by Code Tab */}
          <TabsContent value="invite">
            <Card className="bg-gray-900 text-white border border-gray-700 max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Join by Invite Code</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the invitation code provided by a company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="ABC123XYZ789"
                      className="bg-gray-800 border-gray-700 text-white uppercase"
                    />
                  </div>

                  <Button
                    onClick={handleJoinByCode}
                    disabled={loading || !inviteCode.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Joining..." : "Join Company"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
