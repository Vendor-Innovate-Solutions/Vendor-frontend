"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Check, Loader2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  legal_name?: string;
  gstin?: string;
  role?: string;
}

interface UserContext {
  role: string;
  companies: Company[];
  default_company_id?: string;
}

export default function SelectCompanyPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const context = await apiClient.get<UserContext>("/users/me/context/");
        
        if (context?.companies && context.companies.length > 0) {
          setCompanies(context.companies);
        } else {
          // No companies, redirect to appropriate setup
          if (context?.role === "MANUFACTURER") {
            router.replace("/authentication/setup/company");
          } else {
            router.replace("/retailer/companies");
          }
          return;
        }
        
        // If there's only one company, auto-select it
        if (context.companies.length === 1) {
          await selectCompany(context.companies[0].id);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        setError("Failed to load companies. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [router]);

  const selectCompany = async (companyId: string) => {
    setSelecting(companyId);
    setError(null);
    
    try {
      // Call switch-company API (auth endpoints are at root level, not under /api)
      const token = localStorage.getItem("access_token");
      await fetch("http://127.0.0.1:8000/auth/switch-company/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ company_id: companyId }),
      });
      
      // Store the selected company
      localStorage.setItem("company_id", companyId);
      
      // Get updated context to determine where to route
      const context = await apiClient.get<UserContext>("/users/me/context/");
      
      if (context?.role === "RETAILER") {
        router.replace("/retailer");
      } else if (context?.role === "MANUFACTURER" || context?.role === "ADMIN" || context?.role === "ACCOUNTANT") {
        router.replace("/manufacturer");
      } else if (context?.role === "EMPLOYEE") {
        router.replace("/employee");
      } else {
        router.replace("/manufacturer");
      }
    } catch (err: any) {
      console.error("Failed to select company:", err);
      // If the switch-company endpoint doesn't exist, just set locally and redirect
      localStorage.setItem("company_id", companyId);
      
      // Still try to redirect based on role
      try {
        const context = await apiClient.get<UserContext>("/users/me/context/");
        if (context?.role === "RETAILER") {
          router.replace("/retailer");
        } else {
          router.replace("/manufacturer");
        }
      } catch {
        router.replace("/manufacturer");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading companies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Select Company</CardTitle>
          <CardDescription className="text-gray-400">
            Choose which company you want to work with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {companies.map((company) => (
            <Button
              key={company.id}
              variant="outline"
              className={`w-full justify-start h-auto py-4 px-4 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 ${
                selecting === company.id ? "border-blue-500" : ""
              }`}
              onClick={() => selectCompany(company.id)}
              disabled={selecting !== null}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">
                  {selecting === company.id ? (
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-grow text-left">
                  <div className="font-medium text-white">{company.name}</div>
                  {company.legal_name && company.legal_name !== company.name && (
                    <div className="text-sm text-gray-400">{company.legal_name}</div>
                  )}
                  {company.gstin && (
                    <div className="text-xs text-gray-500">GSTIN: {company.gstin}</div>
                  )}
                  {company.role && (
                    <div className="text-xs text-blue-400 mt-1">{company.role}</div>
                  )}
                </div>
                {selecting === company.id && (
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                )}
              </div>
            </Button>
          ))}

          <div className="pt-4 border-t border-gray-800">
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              onClick={() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("company_id");
                router.replace("/authentication");
              }}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
