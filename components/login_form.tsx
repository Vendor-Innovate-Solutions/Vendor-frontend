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
import { API_URL } from "@/utils/auth_fn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";

type Company = {
  id: string;
  name: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch companies for internal users
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

  const onSubmit = async (data: LoginFormData) => {
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.detail || "Invalid email or password");
        return;
      }

      if (result.access) {
        // Store tokens and company_id
        localStorage.setItem("access_token", result.access);
        localStorage.setItem("refresh_token", result.refresh);
        localStorage.setItem("company_id", data.company_id);

        // Redirect based on user role
        if (result.user_type === "RETAILER") {
          // Check if retailer has profile
          try {
            const profileRes = await fetch(`${API_URL}/retailer/profile/`, {
              headers: {
                Authorization: `Bearer ${result.access}`,
              },
            });
            
            if (profileRes.status === 404) {
              // No profile, redirect to profile setup
              router.replace("/retailer/setup");
            } else {
              router.replace("/retailer");
            }
          } catch {
            router.replace("/retailer/setup");
          }
        } else if (result.user_type === "COMPANY_USER") {
          // Check if company exists
          try {
            const companyRes = await fetch(`${API_URL}/company/`, {
              headers: {
                Authorization: `Bearer ${result.access}`,
              },
            });
            
            if (companyRes.ok) {
              const companies = await companyRes.json();
              if (companies.length === 0) {
                // No company, redirect to company creation
                router.replace("/manufacturer/company?first=true");
                return;
              }
            }
          } catch (err) {
            console.error("Error checking company:", err);
          }

          // Check role for internal users
          if (result.role === "ADMIN" || result.role === "ACCOUNTANT") {
            router.replace("/manufacturer");
          } else if (result.role === "EMPLOYEE") {
            router.replace("/employee");
          } else {
            router.replace("/manufacturer");
          }
        } else {
          router.replace("/manufacturer");
        }
      } else {
        setError("Unexpected error. Please try again.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server error. Please check if the backend is running.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-black text-white border border-white-300 w-full md:w-96">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* Email Input */}
              <div className="grid gap-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="your.email@example.com"
                  className="bg-gray-900 text-white border border-gray-700"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm">{errors.username.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-gray-900 text-white border-gray-700 pr-10"
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

              {/* Company Dropdown */}
              <div className="grid gap-2">
                <Label htmlFor="company_id">Select Company</Label>
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
                {errors.company_id && (
                  <p className="text-red-500 text-sm">{errors.company_id.message}</p>
                )}
              </div>

              <Link
                href="/authentication/forgot-password"
                className="inline-block text-sm text-blue-400 underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/authentication/signup"
                className="text-blue-400 underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
