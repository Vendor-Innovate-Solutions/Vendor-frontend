import { authStorage } from '../../../utils/localStorage';

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
    
    const token = authStorage.getAccessToken();
    if (!token) throw new Error("Authentication token not found. Please log in again.");

    const response = await fetch("http://127.0.0.1:8000/api/stock/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Stock API request failed with status ${response.status}`);

    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Invalid response format: expected an array");

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
    
    const token = authStorage.getAccessToken();
    if (!token) throw new Error("Authentication token not found. Please log in again.");

    const response = await fetch("http://127.0.0.1:8000/api/orders/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Orders API request failed with status ${response.status}`);

    const data = await response.json();

    if (!data.results) throw new Error("Invalid response format: 'results' property is missing");

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