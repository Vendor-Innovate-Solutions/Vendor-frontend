import { apiClient } from '@/utils/api';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
}

export let PRODUCTS: Product[] = [];
export let ORDERS: Order[] = [];

export const fetchStockFromAPI = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Server-side rendering detected, skipping API call");
      return;
    }

    const response = await apiClient.get<any[]>("/portal/items/");

    if (response.error) {
      throw new Error(response.error);
    }

    const data = response.data;
    if (!data || !Array.isArray(data)) throw new Error("Invalid response format: expected an array");

    PRODUCTS = data.map((stockItem: any) => ({
      id: stockItem.product_id,
      name: stockItem.name,
      price: parseFloat(stockItem.price) || 100.0, // Default price if missing
      category: stockItem.category,
      stock: stockItem.available_quantity,
      image: "/api/placeholder/200/200", // Placeholder image
    }));

    console.log("Fetched stock:", PRODUCTS);
  } catch (error) {
    console.error("Failed to fetch stock from API:", error);
  }
};

export const fetchOrdersFromAPI = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Server-side rendering detected, skipping API call");
      return;
    }

    const response = await apiClient.get<{ results: any[] }>("/orders/");

    if (response.error) {
      throw new Error(response.error);
    }

    const data = response.data;
    if (!data?.results) throw new Error("Invalid response format: 'results' property is missing");

    ORDERS = data.results.map((order: any) => {
      const product = PRODUCTS.find((p) => p.id === order.product);
      return {
        id: `ORD-${order.order_id}`,
        date: new Date(order.order_date).toLocaleDateString("en-US"),
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        total: order.required_qty * (product?.price || 100.0), // Default price if not found
        items: order.required_qty,
      };
    });

    console.log("Fetched orders:", ORDERS);
  } catch (error) {
    console.error("Failed to fetch orders from API:", error);
  }
};

// First fetch stock, then fetch orders (only in browser environment)
if (typeof window !== 'undefined') {
  fetchStockFromAPI().then(() => {
    fetchOrdersFromAPI();
  });
}