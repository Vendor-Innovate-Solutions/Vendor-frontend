import { API_URL,fetchWithAuth } from "@/utils/auth_fn";
import { useState, useEffect } from "react";


export interface StockItem {
  productName: string;
  category: number;
  available: number;
  sold: number;
  demanded: number;
}

export interface CategoryItem {
  category_id: number;
  name: string;
  product_count: number;
  fill: string;
}

export const useStockData = () => {
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const companyId = localStorage.getItem("company_id");
        if (!companyId) {
          console.error("No company_id in localStorage");
          setError("No company selected");
          setLoading(false);
          return;
        }
        console.log("Fetching products for company:", companyId);
        const response = await fetchWithAuth(`${API_URL}/api/catalog/products/`);
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch products:", errorText);
          throw new Error("Failed to fetch stock data");
        }

        const data = await response.json();
        console.log("Fetched stock data raw:", data);
        console.log("Products array:", data.products);
        console.log("Products count:", data.count);

        // Backend returns { products: [...], count: N }
        const products = data.products || [];
        console.log("Number of products:", products.length);
        
        const formattedData = products.map((item: any) => ({
          productName: item.name || "Unknown",
          category: item.category_id || 0,
          available: item.available_quantity || 0,
          sold: 0, // Not included in list view, need detail endpoint
          demanded: 0, // Not included in list view, need detail endpoint
        }));
        
        console.log("Formatted stock data:", formattedData);

        setStockData((prevStockData) =>
          JSON.stringify(prevStockData) === JSON.stringify(formattedData)
            ? prevStockData
            : formattedData
        );

        setError(null);
      } catch (error) {
        console.error("Error fetching stock data:", error);
        setError("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData(); // Initial fetch
    const interval = setInterval(fetchStockData, 5000); // Polling every 5 sec

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return { stockData, loading, error };
};

export const useCategoryData = () => {
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/catalog/categories/`);
        if (!response.ok) throw new Error("Failed to fetch category data");

        const result = await response.json();
        console.log("Fetched category data:", result);

        // Backend returns { categories: [...], count: N }
        const categories = result.categories || [];

        const formattedData: CategoryItem[] = categories.map(
          (
            category: {
              category_id: number;
              name: string;
              product_count: number;
            },
            index: number
          ) => ({
            category_id: category.category_id,
            name: category.name,
            product_count: category.product_count,
            fill: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28AFF"][
              index % 5
            ],
          })
        );

        setCategoryData((prevCategoryData) =>
          JSON.stringify(prevCategoryData) === JSON.stringify(formattedData)
            ? prevCategoryData
            : formattedData
        );

        setError(null);
      } catch (error) {
        console.error("Error fetching category data:", error);
        setError("Failed to load category data");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData(); // Initial fetch
    const interval = setInterval(fetchCategoryData, 5000); // Polling every 5 sec

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return { categoryData, loading, error };
};