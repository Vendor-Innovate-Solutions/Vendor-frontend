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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/utils/auth_fn";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/schemas/auth";

type Company = {
  id: string;
  name: string;
};

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userType, setUserType] = useState<"RETAILER" | "COMPANY_USER">("RETAILER");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      user_type: "RETAILER",
    },
  });

  // Watch user_type to dynamically update form
  const selectedUserType = watch("user_type");

  // Fetch companies for retailer signup
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await fetch(`${API_URL}/portal/companies/discover/`);
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newUserType = value as "RETAILER" | "COMPANY_USER";
    setUserType(newUserType);
    setValue("user_type", newUserType);
    setError("");
    setMessage("");
  };

  const onSubmit = async (data: SignupFormData) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/portal/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (data.user_type === "RETAILER") {
          // Store tokens for retailer
          if (result.access) {
            localStorage.setItem("access_token", result.access);
            localStorage.setItem("refresh_token", result.refresh);
            // Redirect to profile setup
            router.replace("/retailer/setup");
          } else {
            setMessage(
              "Registration submitted successfully! You'll be notified after approval."
            );
            setTimeout(() => {
              router.replace("/authentication");
            }, 3000);
          }
        } else {
          // COMPANY_USER
          localStorage.setItem("access_token", result.access);
          localStorage.setItem("refresh_token", result.refresh);

          // First-time manufacturer - redirect to company creation
          router.replace("/manufacturer/company?first=true");
        }
      } else {
        setError(
          result.full_name ||
            result.email ||
            result.password ||
            result.user_type ||
            result.detail ||
            "Failed to register. Please try again."
        );
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError("Server error. Please check if the backend is running.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full md:w-[500px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription className="text-gray-400">
            Create a new account by selecting your user type
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs value={userType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="RETAILER">Retailer</TabsTrigger>
              <TabsTrigger value="COMPANY_USER">Company User</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                {/* Full Name */}
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-gray-900 text-white border border-gray-700"
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-sm">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="bg-gray-900 text-white border border-gray-700"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      className="bg-gray-900 text-white border border-gray-700 pr-10"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>

                {/* Phone (Optional) */}
                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-gray-500 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    className="bg-gray-900 text-white border border-gray-700"
                    {...register("phone")}
                  />
                </div>

                <TabsContent value="RETAILER" className="mt-0 space-y-6">
                  {/* Company Selector for Retailer */}
                  <div className="grid gap-2">
                    <Label htmlFor="company_id">
                      Select Supplier Company{" "}
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    </Label>
                    <select
                      id="company_id"
                      className="bg-gray-900 text-white border border-gray-700 w-full h-10 px-3 rounded-md focus:ring focus:ring-blue-500"
                      {...register("company_id")}
                      disabled={loadingCompanies}
                    >
                      <option value="">-- Select Company --</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Business Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="business_name">
                      Business Name{" "}
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    </Label>
                    <Input
                      id="business_name"
                      type="text"
                      placeholder="Your business name"
                      className="bg-gray-900 text-white border border-gray-700"
                      {...register("business_name")}
                    />
                  </div>

                  {/* GSTIN */}
                  <div className="grid gap-2">
                    <Label htmlFor="gstin">
                      GSTIN <span className="text-gray-500 text-xs">(Optional)</span>
                    </Label>
                    <Input
                      id="gstin"
                      type="text"
                      placeholder="GST Identification Number"
                      className="bg-gray-900 text-white border border-gray-700"
                      {...register("gstin")}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="COMPANY_USER" className="mt-0 space-y-6">
                  {/* Company Selector for Internal User */}
                  <div className="grid gap-2">
                    <Label htmlFor="company_id_internal">
                      Select Company{" "}
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    </Label>
                    <select
                      id="company_id_internal"
                      className="bg-gray-900 text-white border border-gray-700 w-full h-10 px-3 rounded-md focus:ring focus:ring-blue-500"
                      {...register("company_id")}
                      disabled={loadingCompanies}
                    >
                      <option value="">-- Select Company --</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </TabsContent>

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
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Signing up..."
                    : selectedUserType === "RETAILER"
                    ? "Submit Registration"
                    : "Create Account"}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/authentication"
                  className="text-blue-400 underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;