"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "@/utils/auth_fn";

type RetailerProfile = {
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
};

export default function RetailerProfileSetup() {
  const router = useRouter();
  const [profile, setProfile] = useState<RetailerProfile>({
    business_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Check if profile already exists
    const checkProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/authentication");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/portal/retailers/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setCanSkip(true);
        } else if (response.status === 404) {
          // No profile exists, stay on setup page
          setCanSkip(false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      }
    };

    checkProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portal/retailers/profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        // Profile created/updated successfully
        router.replace("/retailer/companies");
      } else {
        const data = await response.json();
        setError(data.error || data.detail || "Failed to save profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace("/retailer/companies");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <Card className="bg-gray-900 text-white border border-gray-700 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription className="text-gray-400">
            Fill in your business details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={profile.business_name}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Your business name"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="contact_person">
                  Contact Person <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={profile.contact_person}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Full name"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="+1234567890"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="business@example.com"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  value={profile.address_line1}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Street address"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="City"
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="State"
                />
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={profile.pincode}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="123456"
                />
              </div>

              {/* GSTIN (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="gstin">
                  GSTIN <span className="text-gray-500 text-xs">(Optional)</span>
                </Label>
                <Input
                  id="gstin"
                  name="gstin"
                  value={profile.gstin}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="GST Number"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </Button>
              {canSkip && (
                <Button
                  type="button"
                  onClick={handleSkip}
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Skip for Now
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
