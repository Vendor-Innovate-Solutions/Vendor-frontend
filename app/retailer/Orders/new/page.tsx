"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "@/utils/auth_fn";
import { Plus, Trash2, CheckCircle } from "lucide-react";

type Product = {
  product_id: number;
  name: string;
  price: string;
  available_quantity: number;
  unit: string;
};

type OrderItem = {
  product_id: number;
  name: string;
  quantity: number;
  unit_rate: string;
};

function NewOrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company");

  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      router.replace("/retailer/companies");
      return;
    }
    fetchProducts();
  }, [companyId, router]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portal/items/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products");
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      setError("Please select a product and enter a valid quantity");
      return;
    }

    const product = products.find((p) => p.product_id === selectedProduct);
    if (!product) return;

    if (quantity > product.available_quantity) {
      setError(`Only ${product.available_quantity} ${product.unit} available`);
      return;
    }

    const existingItemIndex = orderItems.findIndex(
      (item) => item.product_id === selectedProduct
    );

    if (existingItemIndex > -1) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: product.product_id,
          name: product.name,
          quantity,
          unit_rate: product.price,
        },
      ]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setError("");
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return orderItems
      .reduce((sum, item) => sum + parseFloat(item.unit_rate) * item.quantity, 0)
      .toFixed(2);
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    setLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
      return;
    }

    try {
      // First, create the sales order
      const orderResponse = await fetch(`${API_URL}/api/orders/sales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          party_id: companyId,
          currency_id: "INR",
          order_date: new Date().toISOString().split("T")[0],
          status: "DRAFT",
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.id;

      // Add items to the order
      for (const item of orderItems) {
        await fetch(`${API_URL}/api/orders/sales/${orderId}/add_item/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            item_id: item.product_id,
            quantity: item.quantity.toString(),
            override_rate: item.unit_rate,
          }),
        });
      }

      setSuccess(true);
      setCreatedOrderId(orderId);
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = () => {
    if (createdOrderId) {
      router.push(`/retailer/invoices/generate?order=${createdOrderId}`);
    }
  };

  const handleLater = () => {
    router.push("/retailer");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-gray-900 text-white border border-gray-700 max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <CardTitle className="text-center text-2xl">Order Submitted!</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Your order has been submitted and is awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateInvoice}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Generate Invoice
            </Button>
            <Button
              onClick={handleLater}
              variant="outline"
              className="w-full border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Do This Later
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Place New Order</h1>
          <p className="text-gray-400">Select products and create your order</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500 rounded p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <Card className="bg-gray-900 text-white border border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Product</Label>
                  <select
                    value={selectedProduct || ""}
                    onChange={(e) => setSelectedProduct(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 mt-1"
                  >
                    <option value="">-- Select a Product --</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name} - ${product.price} / {product.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>

                <Button
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-2" />
                  Add to Order
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-gray-900 text-white border border-gray-700">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No items added yet
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex justify-between items-center bg-gray-800 p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.quantity} x ${item.unit_rate}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveItem(item.product_id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitOrder}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Submitting..." : "Submit Order"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewOrderPageContent />
    </Suspense>
  );
}
