"use client";
import React, { useState } from "react";
import { apiClient } from "@/utils/api";

const ConfigurationPage = () => {
  const [activeApp, setActiveApp] = useState("odoo"); // Default active app is Odoo
  const [formData, setFormData] = useState({
    db: "",
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeApp !== "odoo") {
      setMessage("Only Odoo is currently active.");
      return;
    }

    try {
      const response = await apiClient.post("/odoo/save-credentials/", formData);

      if (!response.error) {
        setMessage("Credentials saved successfully!");
        setFormData({ db: "", username: "", password: "" }); // Reset form
      } else {
        setMessage(response.error || "Failed to save credentials.");
      }
    } catch (error) {
      setMessage("An error occurred while saving credentials.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="text-xl font-bold">Third-Party App Configuration</div>
          </div>
        </header>

        {/* Navbar */}
        <nav className="p-4 border-b border-gray-800">
          <div className="flex space-x-4 max-w-[1600px] mx-auto">
            <button
              className={`px-4 py-2 rounded-lg ${
                activeApp === "odoo" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
              }`}
              onClick={() => setActiveApp("odoo")}
            >
              Odoo
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 cursor-not-allowed"
              onClick={() => setActiveApp("tally")}
            >
              Tally Prime (Coming Soon)
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 cursor-not-allowed"
              onClick={() => setActiveApp("zoho")}
            >
              Zoho Books (Coming Soon)
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-8 max-w-[1600px] mx-auto">
          <h2 className="text-xl font-bold mb-4">Configure {activeApp === "odoo" ? "Odoo" : "Third-Party App"}</h2>
          <div className="bg-gray-900 p-6 rounded-lg">
            {activeApp === "odoo" ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="db" className="block text-gray-400 mb-2">
                    Database Name
                  </label>
                  <input
                    type="text"
                    id="db"
                    name="db"
                    value={formData.db}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 text-white rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="username" className="block text-gray-400 mb-2">
                    Username (Email)
                  </label>
                  <input
                    type="email"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 text-white rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 text-white rounded-lg"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Credentials
                </button>
              </form>
            ) : (
              <p className="text-gray-400">Only Odoo is currently active. Please select Odoo to configure.</p>
            )}
            {message && <p className="mt-4 text-green-500">{message}</p>}
          </div>
        </main>
      </div>
    </>
  );
};

export default ConfigurationPage;