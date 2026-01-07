import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Order {
  order_id: number;
  required_qty: number;
  order_date: string;
  status: string;
  retailer: number;
  product: number;
}

export const OrderDetails = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      let token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      let response = await fetchOrdersWithToken(token);

      if (response.status === 401) {
        console.log("Access token expired. Trying to refresh...");
        const newToken = await refreshAccessToken();

        if (newToken) {
          localStorage.setItem("access_token", newToken);
          response = await fetchOrdersWithToken(newToken); // Retry with new token
        } else {
          throw new Error("Failed to refresh token");
        }
      }

      const data: Order[] = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format from API");

      setOrders(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersWithToken = async (token: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vendor-backend-production-bd99.up.railway.app";
    return fetch(`${API_URL}/api/portal/orders/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vendor-backend-production-bd99.up.railway.app";
      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        console.error("Failed to refresh token");
        return null;
      }

      const data = await response.json();
      return data.access; // Return the new access token
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl text-white">Orders Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-slate-300 p-4">Loading orders...</p>
          ) : error ? (
            <p className="text-red-500 p-4">Error: {error}</p>
          ) : orders.length === 0 ? (
            <p className="text-slate-300 p-4">No orders allocated.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 font-medium text-slate-300">
                    Order ID
                  </th>
                  <th className="text-left p-4 font-medium text-slate-300">
                    Required Quantity
                  </th>
                  <th className="text-left p-4 font-medium text-slate-300">
                    Order Date
                  </th>
                  <th className="text-left p-4 font-medium text-slate-300">
                    Retailer ID
                  </th>
                  <th className="text-left p-4 font-medium text-slate-300">
                    Product ID
                  </th>
                  <th className="text-left p-4 font-medium text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b border-slate-700"
                  >
                    <td className="p-4 text-slate-300">{order.order_id}</td>
                    <td className="p-4 text-slate-300">{order.required_qty}</td>
                    <td className="p-4 text-slate-300">
                      {new Date(order.order_date).toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-300">{order.retailer}</td>
                    <td className="p-4 text-slate-300">{order.product}</td>
                    <td className="p-4 text-slate-300">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};