"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forgotPassword, verifyOTP, resetPassword, resendOTP } from "@/utils/auth_fn";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "otp" | "reset">("verify");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Input validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number.";
    }
    return null;
  };

  // Clear messages after a timeout
  const clearMessages = () => {
    setTimeout(() => {
      setSuccessMessage("");
      setError("");
    }, 5000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      setError("Please enter both username and email.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await forgotPassword(username, email);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage("OTP sent successfully to your email!");
        setStep("otp");
        clearMessages();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await verifyOTP(username, otp);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage("OTP verified successfully!");
        setStep("reset");
        clearMessages();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await resetPassword(username, otp, newPassword, confirmPassword);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage("Password reset successful! Redirecting to login...");
        // Navigate to login page after successful password reset
        setTimeout(() => {
          router.push("/authentication");
        }, 2000);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await resendOTP(username);
      
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage("OTP resent successfully! Please check your email.");
        clearMessages();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="bg-black text-white border border-white-300 w-full md:w-96">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {step === "verify" && "Forgot Password"}
            {step === "otp" && "Verify OTP"}
            {step === "reset" && "Reset Password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "verify" && (
            <form onSubmit={handleVerify} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="bg-gray-900 text-white border border-gray-700"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-900 text-white border border-gray-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Get OTP"}
              </Button>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={handleOtpVerify} className="flex flex-col gap-6">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">
                  We've sent a OTP to your email address
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter your OTP"
                  className="bg-gray-900 text-white border border-gray-700 text-center text-lg tracking-widest"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800"
                  onClick={() => setStep("verify")}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-50"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Resend OTP"}
                </Button>
              </div>
            </form>
          )}
          {step === "reset" && (
            <form onSubmit={handleReset} className="flex flex-col gap-6">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">
                  Password must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  className="bg-gray-900 text-white border border-gray-700"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  className="bg-gray-900 text-white border border-gray-700"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-700 text-gray-400 hover:bg-gray-800"
                onClick={() => setStep("otp")}
                disabled={isLoading}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
