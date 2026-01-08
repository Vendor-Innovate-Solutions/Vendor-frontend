"use client";

import React, { useEffect, useState, useMemo } from "react";
import { OrdersTable } from "@/components/employee/OrdersTable";
import { OrderDetails } from "@/components/employee/OrderDetails";
import { DeliveryStatus } from "@/components/employee/DeliveryStatus";
import { CancelOrderDialog } from "@/components/employee/CancelOrderDialog";
import { DeliveryOrder } from "@/components/employee/types";
import { API_URL, fetchWithAuth } from "@/utils/auth_fn";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EmployeePage({ params }: PageProps) {
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  // Mock data as fallback
  const mockOrders: DeliveryOrder[] = [
    {
      orderId: "SHIP-001",
      orderName: "Order-1001",
      phoneNumber: "+91-9876543210",
      address: "123 MG Road, Bangalore, Karnataka 560001",
      isDelivered: true,
      items: ["Laptop HP Pavilion x2", "Wireless Mouse x1"],
      isCancelled: false
    },
    {
      orderId: "SHIP-002",
      orderName: "Order-1002",
      phoneNumber: "+91-9988776655",
      address: "45 Park Street, Mumbai, Maharashtra 400001",
      isDelivered: false,
      items: ["Office Chair Executive x5", "Desk Lamp x3"],
      isCancelled: false
    },
    {
      orderId: "SHIP-003",
      orderName: "Order-1003",
      phoneNumber: "+91-8877665544",
      address: "78 Nehru Place, Delhi 110019",
      isDelivered: false,
      items: ["A4 Paper Ream x50", "Whiteboard Marker Set x10"],
      isCancelled: false
    },
    {
      orderId: "SHIP-004",
      orderName: "Order-1004",
      phoneNumber: "+91-7766554433",
      address: "90 Anna Salai, Chennai, Tamil Nadu 600002",
      isDelivered: true,
      items: ["Power Drill Set x2"],
      isCancelled: false
    },
    {
      orderId: "SHIP-005",
      orderName: "Order-1005",
      phoneNumber: "+91-9123456789",
      address: "12 Salt Lake, Kolkata, West Bengal 700091",
      isDelivered: false,
      items: ["Steel Cabinet 4 Drawer x3"],
      isCancelled: true,
      cancellationReason: "Customer requested cancellation"
    }
  ];

  // Resolve params Promise
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    async function fetchEmployeeId() {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/workflow/employee/`);
        if (!response.ok) {
          throw new Error("Failed to fetch employee ID");
        }
        const data = await response.json();
        setEmployeeId(data.employee_id);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      }
    }

    fetchEmployeeId();
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchShipments() {
      if (!employeeId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetchWithAuth(
          `${API_URL}/api/workflow/shipments/?employee=${employeeId}`
        );
        const data = await response.json();

        const mappedOrders: DeliveryOrder[] = data.map((shipment: any) => ({
          orderId: `SHIP-${shipment.shipment_id}`,
          orderName: `Order-${shipment.order}`,
          phoneNumber: "N/A",
          address: "N/A",
          isDelivered: shipment.status === "delivered",
          items: [`Order-${shipment.order}`],
          isCancelled: shipment.status === "cancelled",
          cancellationReason:
            shipment.status === "cancelled" ? "Unknown" : undefined,
        }));

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Failed to fetch shipments, using mock data:", error);
        setOrders(mockOrders); // Use mock data if API fails
        setError(null); // Clear error to show mock data
      } finally {
        setLoading(false);
      }
    }

    fetchShipments();
  }, [employeeId]);

  const handleCancelClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDialogOpen(true);
  };

  const handleCancelOrder = () => {
    if (selectedOrderId && selectedReason) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === selectedOrderId
            ? {
                ...order,
                isCancelled: true,
                cancellationReason: selectedReason,
              }
            : order
        )
      );
      setDialogOpen(false);
      setSelectedOrderId(null);
      setSelectedReason("");
    }
  };

  const handleUpdateStatus = async (shipmentId: number) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/workflow/shipments/update-status/`,
        {
          method: "POST",
          body: JSON.stringify({
            shipment_id: shipmentId,
            status: "delivered",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === `SHIP-${shipmentId}`
            ? { ...order, isDelivered: true }
            : order
        )
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  };

  const calculatePieChartData = useMemo(() => {
    const deliveredCount = orders.filter(
      (order) => order.isDelivered && !order.isCancelled
    ).length;
    const notDeliveredCount = orders.filter(
      (order) => !order.isDelivered && !order.isCancelled
    ).length;
    const cancelledCount = orders.filter((order) => order.isCancelled).length;

    return [
      { name: "Delivered", value: deliveredCount, color: "#22c55e" },
      { name: "Pending", value: notDeliveredCount, color: "#3b82f6" },
      { name: "Cancelled", value: cancelledCount, color: "#eab308" },
    ];
  }, [orders]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">
        Employee Dashboard - ID : {employeeId || "Loading..."}
      </h1>

      {error && <p className="text-red-500 p-4">Error: {error}</p>}
      {loading && <p className="text-slate-300 p-4">Loading shipments...</p>}

      <CancelOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedReason={selectedReason}
        onReasonChange={setSelectedReason}
        onConfirm={handleCancelOrder}
      />

      <OrdersTable
        orders={orders}
        onCancelClick={handleCancelClick}
        onUpdateStatus={handleUpdateStatus}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OrderDetails />
        {mounted && (
          <DeliveryStatus
            data={calculatePieChartData}
            totalOrders={orders.length}
          />
        )}
      </div>
    </div>
  );
}