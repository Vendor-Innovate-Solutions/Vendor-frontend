"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ShoppingCart, Truck, Users, Award } from "lucide-react";
import { apiClient } from "@/utils/api";

type UserRole = "MANUFACTURER" | "RETAILER" | "WHOLESALER" | "SUPPLIER" | "LOGISTICS" | "SERVICE";

interface ContextResponse {
  role?: string;
  company_id?: string;
  manufacturer_linked?: boolean;
  companies?: Array<{ id: string; name: string }>;
}

const roleOptions = [
  {
    id: "MANUFACTURER",
    title: "Manufacturer",
    description: "I own/manage a manufacturing company",
    icon: Building2,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "RETAILER",
    title: "Retailer",
    description: "I run a retail business",
    icon: ShoppingCart,
    color: "from-green-500 to-green-600",
  },
  {
    id: "WHOLESALER",
    title: "Wholesaler / Distributor",
    description: "I distribute products wholesale",
    icon: Truck,
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "SUPPLIER",
    title: "Supplier",
    description: "I supply materials or products",
    icon: Users,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "LOGISTICS",
    title: "Logistics / Transport",
    description: "I provide logistics or transport services",
    icon: Truck,
    color: "from-red-500 to-red-600",
  },
  {
    id: "SERVICE",
    title: "Service / Auditor",
    description: "I provide services or audit services",
    icon: Award,
    color: "from-indigo-500 to-indigo-600",
  },
];

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setIsLoading(true);
    setError("");

    try {
      // Call API to select role
      const roleResponse = await apiClient.post("/users/select-role/", { role });

      if (roleResponse.error) {
        setError(roleResponse.error);
        setIsLoading(false);
        return;
      }

      // Get updated context to determine next route
      const contextResponse = await apiClient.get<ContextResponse>("/users/me/context/");

      if (contextResponse.data) {
        const context = contextResponse.data;

        // Route based on role
        if (role === "MANUFACTURER") {
          // Manufacturer needs to create company
          if (!context.company_id) {
            router.replace("/authentication/setup/company");
          } else {
            router.replace("/manufacturer");
          }
        } else if (role === "RETAILER") {
          // Retailer goes directly to retailer setup
          // The setup page handles profile check and manufacturer connection
          router.replace("/retailer/setup");
        } else {
          // Other external roles (WHOLESALER, SUPPLIER, LOGISTICS, SERVICE)
          if (!context.manufacturer_linked) {
            router.replace("/authentication/setup/external");
          } else {
            router.replace("/retailer");
          }
        }
      } else {
        setError(contextResponse.error || "Failed to fetch updated context");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Role selection error:", err);
      setError("Failed to select role. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black py-10")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full md:w-[800px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold">How will you use this platform?</CardTitle>
          <CardDescription className="text-gray-400 text-base">
            Select your role to get started with your business setup
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleOptions.map((role) => {
              const IconComponent = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id as UserRole)}
                  disabled={isLoading}
                  className={cn(
                    "p-4 rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-all",
                    "bg-gray-800 hover:bg-gray-750 cursor-pointer group",
                    selectedRole === role.id && "border-blue-500 bg-blue-900/30",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg bg-gradient-to-br",
                      role.color,
                      "group-hover:scale-110 transition-transform"
                    )}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white text-lg">{role.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-gray-400">
            Want to change your mind?{" "}
            <Link
              href="/authentication"
              className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              Go back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelectionPage;
