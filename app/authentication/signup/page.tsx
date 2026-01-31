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
import Link from "next/link";
import { api } from "@/utils/api";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/schemas/auth";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState("91"); // India as default
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const phone = watch("phone");

  // Send OTP to phone number
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");
    try {
      const fullPhone = "+" + countryCode + phone;
      const response = await api("/users/send-phone-otp/", {
        method: "POST",
        body: JSON.stringify({ phone: fullPhone }),
      }, false);

      if (!response.error) {
        setOtpSent(true);
        setMessage("OTP sent to your phone number");
      } else {
        setError(response.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      setError("Server error. Please try again.");
    }
  };

  // Verify OTP
  // Verify OTP
  const handleVerifyOTP = async (otp: string) => {
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }

    setError("");
    try {
      const fullPhone = "+" + countryCode + phone;
      const response = await api("/users/verify-phone-otp/", {
        method: "POST",
        body: JSON.stringify({ phone: fullPhone, otp }),
      }, false);

      if (!response.error) {
        setPhoneVerified(true);
        setMessage("Phone number verified successfully");
      } else {
        setError(response.error || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError("Server error. Please try again.");
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    // Check phone verification
    if (!phoneVerified) {
      setError("Please verify your phone number before signing up");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await api("/users/register/", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          phone: "+" + countryCode + data.phone,
          full_name: data.full_name,
        }),
      }, false);

      if (!response.error && response.data) {
        setMessage("Registration successful! Redirecting...");
        // Store the user info temporarily for the next step
        localStorage.setItem("temp_user_email", data.email);
        localStorage.setItem("temp_user_phone", data.phone);
        
        // Redirect to role selection after a brief delay
        setTimeout(() => {
          router.replace("/authentication/setup/role");
        }, 1500);
      } else {
        setError(response.error || "Failed to register. Please try again.");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError("Server error. Please check if the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full md:w-[500px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription className="text-gray-400">
            Join our platform to manage your business
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

            {/* Phone (Mandatory with OTP) */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={phoneVerified}
                >
                  <option value="91">🇮🇳 +91</option>
                  <option value="1">🇺🇸 +1</option>
                  <option value="44">🇬🇧 +44</option>
                  <option value="61">🇦🇺 +61</option>
                  <option value="86">🇨🇳 +86</option>
                  <option value="81">🇯🇵 +81</option>
                  <option value="33">🇫🇷 +33</option>
                  <option value="49">🇩🇪 +49</option>
                  <option value="39">🇮🇹 +39</option>
                  <option value="34">🇪🇸 +34</option>
                </select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  className="bg-gray-900 text-white border border-gray-700 flex-1"
                  {...register("phone")}
                  disabled={phoneVerified}
                />
                {!phoneVerified && (
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    disabled={!phone || phone.length < 10}
                  >
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                )}
                {phoneVerified && (
                  <div className="flex items-center justify-center text-green-500">
                    ✓ Verified
                  </div>
                )}
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* OTP Input */}
            {otpSent && !phoneVerified && (
              <div className="grid gap-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    className="bg-gray-900 text-white border border-gray-700"
                    {...register("otp")}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    onClick={() => handleVerifyOTP(watch("otp") || "")}
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            )}

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
              disabled={isSubmitting || !phoneVerified}
            >
              {isSubmitting
                ? "Creating Account..."
                : !phoneVerified
                ? "Verify Phone to Continue"
                : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/authentication"
              className="text-blue-400 underline underline-offset-4"
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;