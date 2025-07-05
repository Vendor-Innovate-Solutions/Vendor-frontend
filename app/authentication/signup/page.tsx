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
import Link from "next/link";
import { API_URL } from "@/utils/auth_fn";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    group_name: "",
  });
  const [groups, setGroups] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Fetch available groups from the backend
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups/`);
        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups); // Assuming the API returns { groups: ["Admin", "Employee", "Retailer"] }
        } else {
          setError("Failed to fetch groups.");
        }
      } catch (err) {
        setError("An error occurred while fetching groups.");
      }
    };

    fetchGroups();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setMessage("");

  // Ensure all fields are filled
  if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.group_name) {
    setError("All fields are required.");
    return;
  }

  // Check if passwords match
  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        group_name: formData.group_name,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store tokens in localStorage
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Redirect based on group/role
      if (formData.group_name.toLowerCase() === "manufacturer" ) {
        router.replace("/manufacturer/company?first=true");
        return;
      } else if (formData.group_name.toLowerCase() === "admin") {
        router.replace("/manufacturer");
      } 
        else if (formData.group_name.toLowerCase() === "employee") {
        router.replace("/employee");
      } else if (formData.group_name.toLowerCase() === "retailer") {
        router.replace("/retailer");
      } else {
        router.replace("/"); // fallback
      }
    } else {
      setError(
        data.username ||
        data.email ||
        data.password ||
        data.group_name ||
        data.detail ||
        "Failed to register user."
      );
    }
  } catch (err) {
    setError("An error occurred while registering the user.");
  }
};

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full md:w-96">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription className="text-gray-400 border-b border-gray-600 pb-2">
            Create a new account by filling in the details below
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Create a username"
                  required
                  className="bg-gray-900 text-white border border-gray-700"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="bg-gray-900 text-white border border-gray-700"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create your password"
                  required
                  className="bg-gray-900 text-white border border-gray-700"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  className="bg-gray-900 text-white border border-gray-700"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group_name">Select Group</Label>
                <select
                  id="group_name"
                  name="group_name"
                  required
                  className="bg-gray-900 text-white border border-gray-700"
                  value={formData.group_name}
                  onChange={handleInputChange}
                >
                  <option value="">-- Select a Group --</option>
                  {groups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign Up
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;