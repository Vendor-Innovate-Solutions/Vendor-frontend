import { authStorage } from '../../../utils/localStorage';
import { API_URL } from '../../../utils/auth_fn';

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

// Default mock data as fallback
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Laptop HP Pavilion",
    price: 45000,
    category: "Electronics",
    stock: 50,
    image: "/api/placeholder/200/200"
  },
  {
    id: 2,
    name: "Office Chair Executive",
    price: 8500,
    category: "Furniture",
    stock: 25,
    image: "/api/placeholder/200/200"
  },
  {
    id: 3,
    name: "A4 Paper Ream",
    price: 250,
    category: "Stationery",
    stock: 500,
    image: "/api/placeholder/200/200"
  },
  {
    id: 4,
    name: "Wireless Mouse Logitech",
    price: 650,
    category: "Electronics",
    stock: 100,
    image: "/api/placeholder/200/200"
  },
  {
    id: 5,
    name: "Power Drill Set",
    price: 3200,
    category: "Hardware",
    stock: 30,
    image: "/api/placeholder/200/200"
  },
  {
    id: 6,
    name: "Desk Lamp LED",
    price: 1200,
    category: "Electronics",
    stock: 75,
    image: "/api/placeholder/200/200"
  },
  {
    id: 7,
    name: "Whiteboard Marker Set",
    price: 180,
    category: "Stationery",
    stock: 200,
    image: "/api/placeholder/200/200"
  },
  {
    id: 8,
    name: "Steel Cabinet 4 Drawer",
    price: 12000,
    category: "Furniture",
    stock: 15,
    image: "/api/placeholder/200/200"
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-001",
    date: new Date(2026, 0, 5).toLocaleDateString("en-US"),
    status: "Delivered",
    total: 135000,
    items: 3
  },
  {
    id: "ORD-002",
    date: new Date(2026, 0, 6).toLocaleDateString("en-US"),
    status: "Processing",
    total: 42500,
    items: 5
  },
  {
    id: "ORD-003",
    date: new Date(2026, 0, 7).toLocaleDateString("en-US"),
    status: "Shipped",
    total: 68000,
    items: 2
  },
  {
    id: "ORD-004",
    date: new Date(2026, 0, 8).toLocaleDateString("en-US"),
    status: "Pending",
    total: 25000,
    items: 10
  }
];

export let PRODUCTS: Product[] = [...DEFAULT_PRODUCTS];
export let ORDERS: Order[] = [...DEFAULT_ORDERS];

export const fetchStockFromAPI = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Server-side rendering detected, skipping API call");
      return;
    }
    
    const token = authStorage.getAccessToken();
    if (!token) throw new Error("Authentication token not found. Please log in again.");

    const response = await fetch(`${API_URL}/retailer/products/`, {
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
    console.error("Failed to fetch stock from API, using default data:", error);
    PRODUCTS = [...DEFAULT_PRODUCTS]; // Use default if API fails
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

    const response = await fetch(`${API_URL}/retailer/orders/`, {
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
    console.error("Failed to fetch orders from API, using default data:", error);
    ORDERS = [...DEFAULT_ORDERS]; // Use default if API fails
  }
};

// First fetch stock, then fetch orders (only in browser environment)
if (typeof window !== 'undefined') {
  fetchStockFromAPI().then(() => {
    fetchOrdersFromAPI();
  });
}