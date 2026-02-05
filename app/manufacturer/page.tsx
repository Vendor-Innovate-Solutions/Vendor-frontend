"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import mqtt from "mqtt";
import { apiClient } from "@/utils/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { DataTable } from "../../components/manufacturer/data-table";
import { columns } from "../../components/manufacturer/columns";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AlertCircle,
  BarChartIcon,
  ClockIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  StoreIcon,
  TableIcon,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
  WifiIcon,
  XIcon,
} from "lucide-react";

// Interfaces
interface OverviewCard {
  totalOrders: number;
  numStores: number;
  deliveryAgents: number;
  pendingOrders: number;
}

interface CountsResponse {
  orders_placed: number;
  pending_orders: number;
  employees_available: number;
  retailers_available: number;
}

interface AnalyticsData {
  dailyOrders: number;
  avgOrderValue: number;
  returningCustomers: number;
  conversionRate: number;
}

interface ReportData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  profit: number;
  customerSatisfaction: number;
}

interface Notification {
  id: number;
  message: string;
  date: string;
}

interface Shipment {
  shipment_id: number;
  shipment_date: string;
  status: string;
  order: number;
  employee: number;
}

interface ShipmentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Shipment[];
}

// Interface for anomaly notifications
interface AnomalyNotification {
  id: string;
  message: string;
  timestamp: Date;
}

// Hardcoded data for fallback
const testData: OverviewCard = {
  totalOrders: 0,
  numStores: 0,
  deliveryAgents: 0,
  pendingOrders: 0,
};

const analyticsData: AnalyticsData = {
  dailyOrders: 0,
  avgOrderValue: 0,
  returningCustomers: 0,
  conversionRate: 0,
};

const reportData: ReportData = {
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  profit: 0,
  customerSatisfaction: 0,
};

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
interface RawChartDataItem {
  month: string;
  product: string;
  count: number;
}

interface ChartDataEntry {
  month: string;
  [product: string]: string | number;
}

function formatChartData(rawData: RawChartDataItem[]): ChartDataEntry[] {
  // Get all unique products
  const products: string[] = Array.from(new Set(rawData.map(d => d.product)));
  // Get all months present in the year (or use MONTHS for all months)
  const months: string[] = MONTHS;

  // Build a lookup: {month: {product: count}}
  const lookup: { [month: string]: { [product: string]: number } } = {};
  rawData.forEach(({ month, product, count }) => {
    if (!lookup[month]) lookup[month] = {};
    lookup[month][product] = count;
  });

  // Build chart data: [{month, ProductA: count, ProductB: count, ...}, ...]
  return months.map(month => {
    const entry: ChartDataEntry = { month };
    products.forEach(product => {
      entry[product] = lookup[month]?.[product] || 0;
    });
    return entry;
  });
}
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const notifications: Notification[] = [];

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};



// MQTT Topics
const ANOMALY_TOPIC = "manufacturing/anomalies";
const RASPBERRY_PI_PRESENCE_TOPIC = "device/raspberry-pi/presence/raspberrypi";

const Dashboard: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewCard>(testData);
  const [analytics] = useState<AnalyticsData>(analyticsData);
  const [reports] = useState<ReportData>(reportData);
  const [notif] = useState<Notification[]>(notifications);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState<boolean>(true);
  const [shipmentsError, setShipmentsError] = useState<string | null>(null);
  const [allocateLoading, setAllocateLoading] = useState<boolean>(false);
  const [allocateError, setAllocateError] = useState<string | null>(null);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  const [raspberryPiConnected, setRaspberryPiConnected] = useState<boolean>(false);
  const [anomalyNotifications, setAnomalyNotifications] = useState<AnomalyNotification[]>([]);
  const lastRpiHeartbeatTime = useRef<number>(0);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [allocateLoadingId, setAllocateLoadingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
const [ordersLoading, setOrdersLoading] = useState(false);
const [ordersError, setOrdersError] = useState<string | null>(null);
const [approveLoadingId, setApproveLoadingId] = useState<number | null>(null);

  const fetchEmployeesForOrder = async (orderId: number) => {
  setEmployeeLoading(true);
  setSelectedOrderId(orderId);
  setShowEmployeeModal(true);
  try {
    const response = await apiClient.get<{ employees: any[] }>(`/workflow/employees/available/?order_id=${orderId}`);
    if (response.error) throw new Error(response.error);
    setEmployeeList(response.data?.employees || []);
  } catch (err) {
    setEmployeeList([]);
    console.error("Error fetching employees:", err);
  } finally {
    setEmployeeLoading(false);
  }
};

const allocateOrderToEmployee = async (orderId: number, employeeId: number) => {
  setAllocateLoadingId(employeeId);
  try {
    const response = await apiClient.post(`/workflow/orders/${orderId}/assign/`, {
      employee_id: employeeId,
    });
    if (response.error) {
      throw new Error(response.error || "Failed to allocate order");
    }
    alert("Order allocated successfully!");
    setShowEmployeeModal(false);
    fetchOrders(); // Refresh orders
    fetchShipments(); // Refresh shipments list to show updated employee assignment
  } catch (err) {
    alert((err as Error).message);
  } finally {
    setAllocateLoadingId(null);
  }
};

  // Define columns for the shipment data table
  const shipmentColumns = [
    {
      accessorKey: "shipment_id",
      header: "ID",
    },
    {
      accessorKey: "order_number",
      header: "Order ID",
      cell: ({ row }: { row: any }) => {
        return row.original.order_number || row.original.order || "N/A";
      },
    },
    {
      accessorKey: "employee",
      header: "Employee ID",
      cell: ({ row }: { row: any }) => {
      const employeeId = row.getValue("employee");
      const employeeName = row.original.employee_name ;
      if (employeeId && employeeName) {
        return (
          <span>{employeeName}
           <span className="text-xs text-blue-400">(ID: {employeeId})</span>
          </span>
        )
      }
      return <span className="italic text-gray-400">Not Allocated</span>;
    },
    },
    {
      accessorKey: "shipment_date",
      header: "Date",
      cell: ({ row }: { row: any }) => {
        const dateValue = row.getValue("shipment_date");
        if (!dateValue) return "N/A";

        const date = new Date(dateValue);
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.getValue("status") as string;
        let statusClass = "";

        switch (status?.toLowerCase()) {
          case "delivered":
            statusClass = "text-green-500";
            break;
          case "allocated":
            statusClass = "text-green-400";
            break;
          case "pending":
          case "pending allocation":
            statusClass = "text-yellow-500";
            break;
          case "processing":
            statusClass = "text-blue-500";
            break;
          default:
            statusClass = "text-gray-400";
        }

        return <span className={statusClass}>{status}</span>;
      },
    },
    {
    header: "Actions",
    id: "actions",
    cell: ({ row }: { row: any }) =>{
      const employee = row.original.employee;
      const isAllocated = !!employee;
       return (
      <Button
        className={isAllocated 
          ? "bg-gray-500 text-gray-300 px-3 py-1 rounded cursor-not-allowed opacity-50" 
          : "bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"}
        onClick={() => !isAllocated && fetchEmployeesForOrder(row.original.order)}
        disabled={isAllocated}
      >
        {isAllocated ? "Allocated" : "Allocate"}
      </Button>
    );
  },
},
  ];

  // Function to add a new anomaly notification
  const addAnomalyNotification = useCallback(() => {
    const newNotification: AnomalyNotification = {
      id: Date.now().toString(),
      message: "Anomaly Detected",
      timestamp: new Date(),
    };

    setAnomalyNotifications((prev) => [newNotification, ...prev]);

    // Auto-hide the toast notification after 5 seconds
    setTimeout(() => {
      setAnomalyNotifications((prev) =>
        prev.filter((notification) => notification.id !== newNotification.id)
      );
    }, 5000);
  }, []);
  
// Fetch orders using documented API endpoint
const fetchOrders = useCallback(async () => {
  try {
    setOrdersLoading(true);
    setOrdersError(null);
    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setOrdersError("No company selected");
      setOrdersLoading(false);
      return;
    }
    // Use documented endpoint: GET /api/orders/sales/
    const response = await apiClient.get<any[]>(`/orders/sales/`);
    if (response.error) throw new Error(response.error);
    setOrders(response.data || []);
  } catch (err) {
    setOrdersError((err as Error).message);
    setOrders([]);
  } finally {
    setOrdersLoading(false);
  }
}, []);

// Confirm/Approve order using documented API endpoint
const approveOrder = async (orderId: string) => {
  setApproveLoadingId(orderId as any);
  try {
    // Use documented endpoint: POST /api/orders/sales/{order_id}/confirm/
    const response = await apiClient.post(`/orders/sales/${orderId}/confirm/`);
    if (response.error) {
      throw new Error(response.error || "Failed to confirm order");
    }
    alert("Order confirmed successfully!");
    fetchOrders();
  } catch (err) {
    alert((err as Error).message);
  } finally {
    setApproveLoadingId(null);
  }
};

// Fetch orders on mount
useEffect(() => {
  fetchOrders();
}, [fetchOrders]);

  const [chartData, setChartData] = useState<any[]>([]);

// Fetch chart data - using accounting reports for revenue data
const fetchChartData = async () => {
  try {
    // For now, we'll use sample data since shipment-stats isn't documented
    // This could be replaced with /api/reports/ endpoints when available
    setChartData([]);
  } catch (err) {
    console.error("Error fetching chart data:", err);
    setChartData([]);
  }
};

useEffect(() => {
  fetchChartData();
}, []);

  // Fetch confirmed orders that need employee allocation for delivery
  const fetchShipments = useCallback(async () => {
    try {
      setShipmentsLoading(true);
      const companyId = localStorage.getItem("company_id");
      if (!companyId) {
        setShipmentsError("No company selected");
        setShipmentsLoading(false);
        return;
    }
      // Use orders API to get confirmed orders
      const response = await apiClient.get<any>(`/orders/sales/`);

      if (response.error) {
        throw new Error(response.error);
      }

      // Map orders to shipment format for the table
      const ordersData = response.data?.results || response.data || [];
      const shipmentData = ordersData
        .filter((order: any) => order.status === 'CONFIRMED' || order.status === 'PROCESSING')
        .map((order: any) => ({
          shipment_id: order.id,
          order: order.id,
          order_number: order.order_number,
          shipment_date: order.delivery_date || order.order_date,
          status: order.assigned_employee_id ? 'Allocated' : 'Pending Allocation',
          employee: order.assigned_employee_id || null,
          employee_name: order.assigned_employee_name || null,
        }));

      setShipments(shipmentData);
      setShipmentsError(null);
    } catch (err) {
      console.error("Error fetching orders for delivery:", err);
      setShipmentsError((err as Error).message);
    } finally {
      setShipmentsLoading(false);
    }
  }, []);

  // Fetch dashboard counts from orders and inventory
  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true);

      const companyId = localStorage.getItem("company_id");
      if (!companyId) {
        setError("No company selected");
        setLoading(false);
        return;
    }

    // Fetch orders to calculate counts
    const ordersResponse = await apiClient.get<any[]>(`/orders/sales/`);
    const orders = ordersResponse.data || [];
    
    // Calculate counts from orders
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: any) => o.status === "DRAFT" || o.status === "CONFIRMED").length;

    // Fetch parties to get customer/store count
    const partiesResponse = await apiClient.get<any[]>(`/party/parties/?party_type=CUSTOMER`);
    const numStores = partiesResponse.data?.length || 0;

    setOverviewData({
      totalOrders,
      numStores,
      deliveryAgents: 0, // Would need HR/employee endpoint
      pendingOrders,
    });

      setError(null);
    } catch (err) {
      console.error("Error fetching counts:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up polling with cleanup
  useEffect(() => {
    fetchCounts();
    fetchShipments();

    const countsIntervalId = setInterval(fetchCounts, 30000);
    const shipmentsIntervalId = setInterval(fetchShipments, 60000);

    return () => {
      clearInterval(countsIntervalId);
      clearInterval(shipmentsIntervalId);
    };
  }, [fetchCounts, fetchShipments]);

  // MQTT connection setup
  useEffect(() => {
    console.log("Attempting to connect to MQTT broker...");
    setMqttConnected(false);
    setRaspberryPiConnected(false);
  
    const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
      clientId: `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
      connectTimeout: 30000,
      reconnectPeriod: 5000,
    });
  
    client.on("connect", () => {
      console.log("MQTT connected successfully");
      setMqttConnected(true);
  
      // Subscribe to Raspberry Pi presence topic
      client.subscribe(RASPBERRY_PI_PRESENCE_TOPIC, { qos: 1 }, (err: Error | null) => {
        if (err) {
          console.error("Failed to subscribe to Raspberry Pi presence topic:", err);
        }
      });
  
      // Subscribe to anomaly topic
      client.subscribe(ANOMALY_TOPIC, { qos: 1 }, (err: Error | null) => {
        if (err) {
          console.error("Failed to subscribe to anomaly topic:", err);
        }
      });
    });
  
    client.on("message", (topic: string, message: Buffer) => {
      const messageStr = message.toString();
  
      if (topic === RASPBERRY_PI_PRESENCE_TOPIC) {
        console.log("Raspberry Pi presence detected:", messageStr);
        try {
          const payload = JSON.parse(messageStr);
          lastRpiHeartbeatTime.current = Date.now();
          setRaspberryPiConnected(payload.status === "online");
        } catch (err) {
          console.error("Failed to parse Raspberry Pi presence message:", err);
          setRaspberryPiConnected(false);
        }
        return;
      }
  
      if (topic === ANOMALY_TOPIC) {
        const payload = messageStr.trim().toLowerCase();
        console.log(`Received message on topic ${topic}: ${payload}`);
  
        if (payload === "anomaly detected: no qr code detected for over 10 seconds!") {
          console.log("Anomaly detected! Adding notification.");
          addAnomalyNotification();
        }
      }
    });
  
    client.on("error", (err: Error) => {
      console.error("MQTT connection error:", err);
      setMqttConnected(false);
      setRaspberryPiConnected(false);
    });
  
    client.on("close", () => {
      console.log("MQTT connection closed");
      setMqttConnected(false);
      setRaspberryPiConnected(false);
    });
  
    const rpiCheckTimer: NodeJS.Timeout = setInterval(() => {
      if (Date.now() - lastRpiHeartbeatTime.current > 30000) {
        if (raspberryPiConnected) {
          console.log("No recent heartbeat from Raspberry Pi, marking as disconnected");
          setRaspberryPiConnected(false);
        }
      }
    }, 10000);
  
    return () => {
      console.log("Cleaning up MQTT client");
      clearInterval(rpiCheckTimer);
      if (client) {
        client.unsubscribe(ANOMALY_TOPIC);
        client.unsubscribe(RASPBERRY_PI_PRESENCE_TOPIC);
        client.end(true);
      }
    };
  }, [addAnomalyNotification]);

  // Determine overall connection status
  const isFullyConnected = mqttConnected && raspberryPiConnected;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white p-6">
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-white px-3 py-2">Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Connection Status Icon */}
          {isFullyConnected ? (
            <div className="text-green-500 bg-green-900/20 p-2 rounded-full" title="Connected to Raspberry Pi and Backend">
              <WifiIcon className="w-5 h-5" />
            </div>
          ) : (
            <div className="text-red-500 bg-red-900/20 p-2 rounded-full" title="Disconnected">
              <WifiIcon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications for Anomalies */}
      {anomalyNotifications.length > 0 && (
        <div className="fixed top-6 right-6 z-50 max-w-md">
          {anomalyNotifications.slice(0, 1).map((notification) => (
            <div
              key={notification.id}
              className="mb-2 p-4 rounded-lg shadow-lg flex items-start gap-3 animate-slideIn transition-all duration-300 bg-yellow-900/90 border border-yellow-700"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-gray-300 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() =>
                  setAnomalyNotifications((prev) =>
                    prev.filter((n) => n.id !== notification.id)
                  )
                }
                className="text-gray-300 hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="Overview" className="w-full mb-6">
        <TabsList className="flex flex-wrap justify-center md:justify-evenly bg-gray-300 p-2 rounded-2xl shadow-lg w-full md:w-3/4 lg:w-1/2 mb-4 h-14 border border-gray-700">
          {["Overview", "Analytics", "Reports", "Notifications"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-5 py-2 text-black font-semibold text-sm rounded-xl md:px-6 transition-all duration-300
                data-[state=active]:bg-black data-[state=active]:text-white
                focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Overview">
          {error && error.includes("Authentication") && (
            <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {error && !error.includes("Authentication") && (
            <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 text-lg">Error: {error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 p-6 min-h-screen">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-start">
              <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-auto py-6 border border-gray-600">
                <h2 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-green-400" /> Total Orders
                </h2>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {overviewData.totalOrders}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Total Number of Orders placed
                </p>
              </Card>

              <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-auto py-6 border border-gray-600">
                <h2 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                  <StoreIcon className="w-5 h-5 text-white" /> Number of Stores
                </h2>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {overviewData.numStores}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Total operational stores in the region.
                </p>
              </Card>

              <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-auto py-6 border border-gray-600">
                <h2 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-white" /> Delivery Agents
                </h2>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {overviewData.deliveryAgents}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Total active delivery personnel.
                </p>
              </Card>

              <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-auto py-6 border border-gray-600">
                <h2 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-white" /> Pending Orders
                </h2>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {overviewData.pendingOrders}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Total number of pending customer orders.
                </p>
              </Card>
            </div>
            <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-auto py-6 border border-gray-600 mb-8">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-medium text-white flex items-center gap-2">
      <TableIcon className="w-5 h-5 text-blue-400" /> Order Details
    </h2>
  </div>
  {ordersLoading && <p className="text-blue-500">Loading orders...</p>}
  {ordersError && (
    <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-red-500" />
      <p className="text-red-500">Error: {ordersError}</p>
    </div>
  )}
  {!ordersLoading && !ordersError && (orders.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full text-white">
        <thead>
          <tr className="text-blue-400 text-sm">
            <th className="p-2 text-left">Order ID</th>
            <th className="p-2 text-left">Retailer</th>
            <th className="p-2 text-left">Product</th>
            
            
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-blue-500/20">
              <td className="p-2 text-left">{order.order_number || order.id}</td>
              <td className="p-2 text-left">{order.customer_name}</td>

              <td className="p-2 text-left">
                <span className="italic text-gray-400">
                  {order.item_count > 0 ? `${order.item_count} item(s)` : 'No products'}
                </span>
              </td>
              
              
              <td className="p-2 text-left uppercase">{order.status}</td>
              <td className="p-2 text-center">
                {order.status?.toUpperCase() === "DRAFT" ? (
                <Button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  disabled={approveLoadingId === order.id}
                  onClick={() => approveOrder(order.id)}
                >
                  {approveLoadingId === order.id ? "Confirming..." : "Confirm"}
                </Button>
                ) : (
                  <Button
                    className="bg-gray-600 text-white px-3 py-1 rounded"
                    disabled
                  >
                    {order.status === 'CONFIRMED' ? 'Confirmed' : order.status}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="text-center py-8">
      <p className="text-gray-400">No pending orders available.</p>
    </div>
  ))}
</Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow overflow-hidden mt-6">
              <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-full min-h-[500px] py-6 flex flex-col border border-gray-600">
                <h2 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                  <BarChartIcon className="w-5 h-5 text-green-400" /> Monthly Sales
                </h2>
                <div className="flex-grow w-full overflow-hidden">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <BarChart data={chartData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
  <YAxis hide />
  <ChartTooltip content={<ChartTooltipContent />} />
  {/* Dynamically render a Bar for each product */}
  {chartData.length > 0 &&
    Object.keys(chartData[0])
      .filter((key) => key !== "month")
      .map((product, idx) => (
        <Bar key={product} dataKey={product} fill={["#2563eb", "#60a5fa", "#f59e42", "#e11d48"][idx % 4]} radius={2} />
      ))}
</BarChart>
                  </ChartContainer>
                </div>
              </Card>

              <Card className="shadow-lg rounded-xl px-4 pt-4 transition-all duration-300 hover:shadow-xl h-auto py-6 border border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-blue-400" /> Shipment Details
                  </h2>
                  
                </div>
                {allocateError && (
                  <div className="bg-yellow-900/30 border border-yellow-600 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <p className="text-yellow-500">Warning: {allocateError}</p>
                  </div>
                )}
                {showEmployeeModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
    <div className="bg-neutral-900 rounded-lg p-8 max-w-lg w-full relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={() => setShowEmployeeModal(false)}
      >
        ×
      </button>
      <h2 className="text-xl font-bold mb-4 text-white">Available Employees</h2>
      {employeeLoading ? (
        <div className="text-white">Loading...</div>
      ) : employeeList.length === 0 ? (
        <div className="text-white">No employees available.</div>
      ) : (
        <ul className="space-y-3">
          {employeeList.map((emp: any) => (
            <li key={emp.id} className="flex justify-between items-center bg-neutral-800 p-3 rounded">
              <div>
                <div className="font-semibold text-white">{emp.name || "Employee"}</div>
                <div className="text-gray-400 text-sm">{emp.employee_code} - {emp.designation}</div>
                {emp.department && <div className="text-gray-400 text-sm">Dept: {emp.department}</div>}
              </div>
              <Button
                className="bg-green-600 text-white px-3 py-1 rounded"
                disabled={allocateLoadingId === emp.id}
                onClick={() => allocateOrderToEmployee(selectedOrderId!, emp.id)}
              >
                {allocateLoadingId === emp.id ? "Allocating..." : "Allocate"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)}
                {shipmentsLoading && (
                  <p className="text-blue-500">Loading transaction data...</p>
                )}

                {shipmentsError && (
                  <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-red-500">Error: {shipmentsError}</p>
                  </div>
                )}

                {!shipmentsLoading &&
                  !shipmentsError &&
                  (shipments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <DataTable columns={shipmentColumns} data={shipments} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No shipments created yet.</p>
                      <p className="text-sm text-gray-500 mt-2">Shipments will appear here once orders are confirmed and processed.</p>
                    </div>
                  ))}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Analytics">
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Card className="bg-transparent p-8 rounded-lg shadow-md border border-gray-600 flex flex-col items-center">
              <BarChartIcon className="w-12 h-12 text-blue-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2 text-blue-400">Analytics</h2>
              <p className="text-lg text-gray-300 mb-2">This section is under development.</p>
              <p className="text-sm text-gray-500">Stay tuned for powerful analytics and insights!</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="Reports">
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Card className="bg-transparent p-8 rounded-lg shadow-md border border-gray-600 flex flex-col items-center">
            <DollarSignIcon className="w-12 h-12 text-blue-400 mb-4" />
             <h2 className="text-2xl font-semibold mb-2 text-blue-400">Reports</h2>
             <p className="text-lg text-gray-300 mb-2">This section is under development.</p>
             <p className="text-sm text-gray-500">Stay tuned for detailed reports and insights!</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="Notifications">
          <div className="flex flex-col items-center justify-center min-h-[300px]">
           <Card className="bg-transparent p-8 rounded-lg shadow-md border border-gray-600 flex flex-col items-center">
             <AlertCircle className="w-12 h-12 text-blue-400 mb-4" />
               <h2 className="text-2xl font-semibold mb-2 text-blue-400">Notifications</h2>
               <p className="text-lg text-gray-300 mb-2">This section is under development.</p>
               <p className="text-sm text-gray-500">Stay tuned for real-time notifications and updates!</p>
           </Card>
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;