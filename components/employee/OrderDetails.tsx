import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiClient } from "@/utils/api";

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
      const response = await apiClient.get<Order[]>("/employee_orders/");

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        throw new Error("Invalid data format from API");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
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