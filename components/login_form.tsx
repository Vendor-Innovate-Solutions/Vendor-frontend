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
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { api, apiClient } from "@/utils/api";

interface LoginResponse {
  access: string;
  refresh: string;
}

interface ContextResponse {
  role?: string;
  role_selected?: boolean;
  has_company?: boolean;
  default_company_id?: string;
  default_company?: {
    id: string;
    name: string;
    code: string;
    role: string;
  };
  manufacturer_linked?: boolean;
  is_portal_user?: boolean;
  companies?: Array<{ id: string; name: string }>;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");

    try {
      // Login doesn't require auth (getting fresh token)
      // Auth endpoints are at root level, not under /api
      const loginResponse = await api<LoginResponse>("http://127.0.0.1:8000/auth/login/", {
        method: "POST",
        body: JSON.stringify(data),
      }, false);

      if (loginResponse.error) {
        setError(loginResponse.error);
        return;
      }

      const result = loginResponse.data;
      if (result?.access) {
        // Store tokens
        localStorage.setItem("access_token", result.access);
        localStorage.setItem("refresh_token", result.refresh);

        // Get user context to determine routing
        try {
          const contextResponse = await apiClient.get<ContextResponse>("/users/me/context/");

          if (contextResponse.data) {
            const context = contextResponse.data;

            // Route based on context
            // 1. Check if role is not selected
            if (!context.role || !context.role_selected) {
              router.replace("/authentication/setup/role");
              return;
            }

            // 2. Check if MANUFACTURER and no company
            if (context.role === "MANUFACTURER" && !context.has_company) {
              router.replace("/authentication/setup/company");
              return;
            }

            // 3. Handle RETAILER role
            if (context.role === "RETAILER") {
              // Check if retailer profile is complete using is_portal_user flag
              if (context.is_portal_user) {
                router.replace("/retailer");
              } else {
                router.replace("/retailer/setup");
              }
              return;
            }
            
            // Other external roles (WHOLESALER, SUPPLIER, etc.) need manufacturer link
            if (context.role !== "MANUFACTURER" && context.role !== "RETAILER" && !context.manufacturer_linked) {
              router.replace("/authentication/setup/external");
              return;
            }

            // 4. Multiple companies - show switcher
            if (context.companies && context.companies.length > 1 && !context.default_company_id) {
              router.replace("/select-company");
              return;
            }

            // 5. Set active company if available
            const companyId = context.default_company_id || context.default_company?.id;
            if (companyId) {
              localStorage.setItem("company_id", companyId);
            }

            // 6. Route to appropriate dashboard
            // Note: Retailers are already handled above, this is fallback
            if (context.role === "RETAILER") {
              router.replace("/retailer/setup");
            } else if (
              context.role === "MANUFACTURER" ||
              context.role === "ADMIN" ||
              context.role === "ACCOUNTANT"
            ) {
              router.replace("/manufacturer");
            } else if (context.role === "EMPLOYEE") {
              router.replace("/employee");
            } else {
              router.replace("/manufacturer");
            }
          } else {
            // If context fetch fails, route to role selection
            router.replace("/authentication/setup/role");
          }
        } catch (contextErr) {
          console.error("Context fetch error:", contextErr);
          router.replace("/authentication/setup/role");
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

              {/* Password Input */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
