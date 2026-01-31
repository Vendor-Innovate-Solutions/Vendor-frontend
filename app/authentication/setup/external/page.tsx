"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { Mail, Code } from "lucide-react";

const ExternalUserSetupPage = () => {
  const [step, setStep] = useState<"connection" | "invite" | "wait">("connection");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  // Connection form
  const [manufacturerInput, setManufacturerInput] = useState("");
  const [inputType, setInputType] = useState<"code" | "email">("code");
  const [hasManufacturer, setHasManufacturer] = useState<boolean | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("temp_user_email");
    const role = localStorage.getItem("temp_user_role");
    if (email) {
      setUserEmail(email);
    }
    if (role) {
      setUserRole(role);
    }
  }, []);

  const handleConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!manufacturerInput.trim()) {
      setError(`Please enter manufacturer ${inputType === "code" ? "code" : "email"}`);
      return;
    }

    setIsLoading(true);

    try {
      // Send connection request
      const connectionData = {
        manufacturer_identifier: manufacturerInput,
        identifier_type: inputType,
        user_role: userRole,
      };

      const response = await apiClient.post("/users/connect-to-manufacturer/", connectionData);

      if (!response.error) {
        setMessage("Connection request sent successfully!");
        setStep("wait");
      } else {
        setError(response.error || "Failed to send connection request");
      }
    } catch (err) {
      console.error("Connection Error:", err);
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipConnection = () => {
    setHasManufacturer(false);
    setStep("wait");
  };

  const handleWaitForInvite = async () => {
    // Clear temp data
    localStorage.removeItem("temp_user_email");
    localStorage.removeItem("temp_user_phone");
    localStorage.removeItem("temp_user_role");

    // Redirect to partner portal
    router.push("/retailer");
  };

  const getRoleDisplayName = () => {
    const roleMap: Record<string, string> = {
      RETAILER: "Retailer",
      WHOLESALER: "Wholesaler / Distributor",
      SUPPLIER: "Supplier",
      LOGISTICS: "Logistics / Transport",
      SERVICE: "Service / Auditor",
    };
    return roleMap[userRole] || userRole;
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black py-10")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full md:w-[600px]">
        {/* Step 1: Connection */}
        {step === "connection" && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">
                Connect with a Manufacturer
              </CardTitle>
              <CardDescription className="text-gray-400">
                You're registering as a <span className="text-blue-400">{getRoleDisplayName()}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
                  <p className="text-blue-200 text-sm">
                    Are you already working with a manufacturer on this platform?
                  </p>
                </div>

                {/* Yes Option */}
                <div>
                  <h3 className="font-semibold text-white mb-4">Yes, I have a manufacturer</h3>
                  <form onSubmit={handleConnectionSubmit} className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <Button
                        type="button"
                        onClick={() => setInputType("code")}
                        className={cn(
                          "flex-1",
                          inputType === "code"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-800 hover:bg-gray-700"
                        )}
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Company Code
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setInputType("email")}
                        className={cn(
                          "flex-1",
                          inputType === "email"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-800 hover:bg-gray-700"
                        )}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="manufacturer_input">
                        Manufacturer {inputType === "code" ? "Code" : "Email"}
                      </Label>
                      <Input
                        id="manufacturer_input"
                        type={inputType === "email" ? "email" : "text"}
                        placeholder={
                          inputType === "code" ? "e.g., VENDOR001" : "e.g., sales@vendor.com"
                        }
                        className="bg-gray-800 text-white border border-gray-700"
                        value={manufacturerInput}
                        onChange={(e) => setManufacturerInput(e.target.value)}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-900/20 border border-red-500 rounded p-3">
                        <p className="text-red-500 text-sm">{error}</p>
                      </div>
                    )}

                    {message && (
                      <div className="bg-green-900/20 border border-green-500 rounded p-3">
                        <p className="text-green-500 text-sm">{message}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Connecting..." : "Connect to Manufacturer"}
                    </Button>
                  </form>

                  <div className="mt-4 text-center">
                    <p className="text-gray-400 text-sm mb-3">OR</p>
                    <Button
                      type="button"
                      onClick={handleSkipConnection}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300"
                    >
                      I don't have a manufacturer yet
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Waiting for Invite */}
        {step === "wait" && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">
                {hasManufacturer === false ? "Waiting for Invite" : "Connection Request Sent"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Almost there! Complete the process below
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-6">
                {hasManufacturer === true ? (
                  <div className="bg-green-900/20 border border-green-500 rounded p-4">
                    <p className="text-green-200 text-sm">
                      ✓ Your connection request has been sent to the manufacturer. You'll gain access
                      once they approve it.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
                    <p className="text-blue-200 text-sm">
                      A manufacturer will need to invite you to collaborate. Once they do, you'll get
                      access to their portal.
                    </p>
                  </div>
                )}

                <div className="bg-gray-800 rounded p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-semibold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Account Created</p>
                      <p className="text-gray-400 text-sm">Your account is ready to use</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gray-400 text-sm font-semibold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Await Approval</p>
                      <p className="text-gray-400 text-sm">
                        {hasManufacturer === true
                          ? "Manufacturer approves your request"
                          : "Manufacturer sends you an invite"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gray-400 text-sm font-semibold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Partner Portal Access</p>
                      <p className="text-gray-400 text-sm">Manage orders, invoices & tracking</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleWaitForInvite}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Go to Partner Portal
                </Button>

                <p className="text-center text-gray-400 text-xs">
                  You can check your connection status anytime from your dashboard
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default ExternalUserSetupPage;
