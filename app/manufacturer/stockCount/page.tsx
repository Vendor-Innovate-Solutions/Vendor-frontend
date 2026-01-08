"use client";
import React, { useState, useEffect } from 'react';
import { API_URL, refreshAccessToken, getAuthToken } from '@/utils/auth_fn';
import { useStockData } from '@/components/manufacturer/stockcount/data';
import SidePanel from '@/components/manufacturer/stockcount/SidePanel';
import NavigationBar from '@/components/manufacturer/stockcount/NavigationBar';
import StockOverview from '@/components/manufacturer/stockcount/StockOverview';
import GodownManagement from '@/components/manufacturer/stockcount/GodownManagement';
import StockBalance from '@/components/manufacturer/stockcount/StockBalance';
import StockMovements from '@/components/manufacturer/stockcount/StockMovements';
import StockTransfer from '@/components/manufacturer/stockcount/StockTransfer';
import StockItems from '@/components/manufacturer/stockcount/StockItems';

const UQC_CHOICES = [
  { value: "BAG", label: "Bags" },
  { value: "BAL", label: "Bale" },
  { value: "BDL", label: "Bundles" },
  { value: "BKL", label: "Buckles" },
  { value: "BOU", label: "Billions of Units" },
  { value: "BOX", label: "Box" },
  { value: "BTL", label: "Bottles" },
  { value: "BUN", label: "Bunches" },
  { value: "CAN", label: "Cans" },
  { value: "CBM", label: "Cubic Meter" },
  { value: "CCM", label: "Cubic Centimeter" },
  { value: "CMS", label: "Centimeters" },
  { value: "CTN", label: "Cartons" },
  { value: "DOZ", label: "Dozens" },
  { value: "DRM", label: "Drums" },
  { value: "GGK", label: "Great Gross" },
  { value: "GMS", label: "Grams" },
  { value: "GRS", label: "Gross" },
  { value: "GYD", label: "Gross Yards" },
  { value: "KGS", label: "Kilograms" },
  { value: "KLR", label: "Kilolitre" },
  { value: "KME", label: "Kilometre" },
  { value: "LTR", label: "Litre" },
  { value: "MTR", label: "Meters" },
  { value: "MLT", label: "Millilitre" },
  { value: "MTS", label: "Metric Ton" },
  { value: "NOS", label: "Numbers" },
  { value: "PAC", label: "Packs" },
  { value: "PCS", label: "Pieces" },
  { value: "PRS", label: "Pairs" },
  { value: "QTL", label: "Quintal" },
  { value: "ROL", label: "Rolls" },
  { value: "SET", label: "Sets" },
  { value: "SQF", label: "Square Feet" },
  { value: "SQM", label: "Square Meter" },
  { value: "SQY", label: "Square Yards" },
  { value: "TBS", label: "Tablets" },
  { value: "TGM", label: "Ten Grams" },
  { value: "THD", label: "Thousands" },
  { value: "TON", label: "Tonne" },
  { value: "TUB", label: "Tubes" },
  { value: "UGS", label: "US Gallons" },
  { value: "UNT", label: "Units" },
  { value: "YDS", label: "Yards" },
];

export default function StockCountPage() {
  const [activeView, setActiveView] = useState<string>('table');
  const { stockData, loading, error } = useStockData();

  // Add Product Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
  name: "",
  category: "",
  available_quantity: "",
  price: "",
  company: "",
  unit: "",
  total_shipped: "",
  total_required_quantity: "",
  hsn_code: "",
  cgst_rate: "0",
  sgst_rate: "0",
  igst_rate: "0",
  cess_rate: "0",
  status: "sufficient",
});
  
  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: ""});
  const [categoryError, setCategoryError] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  // For unit search
  const [unitSearch, setUnitSearch] = useState("");
  const filteredUnits = UQC_CHOICES.filter(u =>
  u.label.toLowerCase().includes(unitSearch.toLowerCase()) ||
  u.value.toLowerCase().includes(unitSearch.toLowerCase())
  );
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [categories, setCategories] = useState<{category_id: number, name: string}[]>([]);

  // Fetch categories for dropdown
  useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (!token) return;
  fetch(`${API_URL}/api/catalog/categories/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      // If paginated, use data.results, else use data
      setCategories(Array.isArray(data) ? data : (data.results || []));
    })
    .catch(() => setCategories([]));
}, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    let token = await getAuthToken();
    if (!token) {
      setSubmitError("Not authenticated");
      return;
    }
    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setSubmitError("No company selected");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/catalog/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          company: Number(companyId), // always from localStorage
          category: form.category ? Number(form.category) : null,
          available_quantity: Number(form.available_quantity),
          unit: form.unit,
          total_shipped: Number(form.total_shipped),
          total_required_quantity: Number(form.total_required_quantity),
          price: Number(form.price),
          hsn_code: form.hsn_code,
          cgst_rate: Number(form.cgst_rate),
          sgst_rate: Number(form.sgst_rate),
          igst_rate: Number(form.igst_rate),
          cess_rate: Number(form.cess_rate),
          status: form.status,
        }),
      });
      // If unauthorized, try to refresh and retry once
      if (res.status === 401) {
        token = await refreshAccessToken();
        if (!token) {
          setSubmitError("Session expired. Please log in again.");
          return;
        }
        const retryRes = await fetch(`${API_URL}/api/catalog/products/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            company: Number(companyId),
            category: form.category ? Number(form.category) : null,
            available_quantity: Number(form.available_quantity),
            unit: form.unit,
            total_shipped: Number(form.total_shipped),
            total_required_quantity: Number(form.total_required_quantity),
            price: Number(form.price),
            hsn_code: form.hsn_code,
            cgst_rate: Number(form.cgst_rate),
            sgst_rate: Number(form.sgst_rate),
            igst_rate: Number(form.igst_rate),
            cess_rate: Number(form.cess_rate),
            status: form.status,
          }),
        });
        if (retryRes.ok) {
          setSubmitSuccess("Product added successfully!");
          setForm({
            name: "",
            category: "",
            available_quantity: "",
            price: "",
            company: "",
            unit: "",
            total_shipped: "",
            total_required_quantity: "",
            hsn_code: "",
            cgst_rate: "0",
            sgst_rate: "0",
            igst_rate: "0",
            cess_rate: "0",
            status: "sufficient",
          });
          setShowModal(false);
        } else {
          const data = await retryRes.json();
          setSubmitError(data.error || "Failed to add product.");
        }
        return;
      }
      if (res.ok) {
        setSubmitSuccess("Product added successfully!");
        setForm({
          name: "",
          category: "",
          available_quantity: "",
          price: "",
          company: "",
          unit: "",
          total_shipped: "",
          total_required_quantity: "",
          hsn_code: "",
          cgst_rate: "0",
          sgst_rate: "0",
          igst_rate: "0",
          cess_rate: "0",
          status: "sufficient",
        });
        setShowModal(false);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to add product.");
      }
    } catch {
      setSubmitError("Failed to add product.");
    }
  };

if (loading) return <p className="text-blue-300">Loading stock data...</p>;
if (error) return <p className="text-red-400">{error}</p>;

const renderView = () => {
  switch (activeView) {
    case 'table':
    case 'charts':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StockOverview activeView={activeView} stockData={stockData} />
          </div>
          <div className="space-y-6">
            <SidePanel stockData={stockData} />
          </div>
        </div>
      );
    case 'godowns':
      return <GodownManagement />;
    case 'balance':
      return <StockBalance />;
    case 'movements':
      return <StockMovements />;
    case 'transfers':
      return <StockTransfer />;
    case 'items':
      return <StockItems />;
    default:
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StockOverview activeView={activeView} stockData={stockData} />
          </div>
          <div className="space-y-6">
            <SidePanel stockData={stockData} />
          </div>
        </div>
      );
  }
};

return (
  <>
    <div className="relative p-6 bg-black text-blue-300 min-h-screen">
      <h1 className="text-xl font-semibold mb-6 text-blue-400 flex items-center justify-between">
        Stock Dashboard
        {(activeView === 'table' || activeView === 'charts') && (
          <button
            className="ml-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            onClick={() => setShowModal(true)}
          >
            + Add Product
          </button>
        )}
      </h1>
      <NavigationBar activeView={activeView} setActiveView={setActiveView} />
      {renderView()}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Add Product
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-blue-200">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                    onClick={() => setShowCategoryModal(true)}
                    title="Add Category"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Available Quantity
                </label>
                <input
                  type="number"
                  name="available_quantity"
                  value={form.available_quantity}
                  onChange={handleFormChange}
                  onWheel={(e) => {
                    (e.target as HTMLInputElement).blur();
                  }}
                  min={0}
                  required
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleFormChange}
                  onWheel={(e) => {
                    (e.target as HTMLInputElement).blur();
                  }}
                  min={0}
                  required
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>

              <div className="relative">
                <label className="block text-sm mb-1 text-blue-200">
                  Unit (UQC)
                </label>
                <input
                  type="text"
                  placeholder="Type to search unit..."
                  value={unitSearch}
                  onChange={(e) => {
                    setUnitSearch(e.target.value);
                    setShowUnitDropdown(true);
                  }}
                  onFocus={() => setShowUnitDropdown(true)}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 mb-2"
                  autoComplete="off"
                />
                {/* Custom dropdown - now positioned relative to this div */}
                {showUnitDropdown && filteredUnits.length > 0 && (
                  <div className="absolute left-0 right-0 bg-gray-900 border border-gray-700 rounded w-full max-h-48 overflow-y-auto z-50">
                    {filteredUnits.map((uqc) => (
                      <div
                        key={uqc.value}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-800"
                        onClick={() => {
                          setForm({ ...form, unit: uqc.value });
                          setUnitSearch(uqc.label + " (" + uqc.value + ")");
                          setShowUnitDropdown(false);
                        }}
                      >
                        {uqc.label} ({uqc.value})
                      </div>
                    ))}
                  </div>
                )}
                {/* Show the selected unit as a read-only field */}
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  readOnly
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-700 mt-2"
                  placeholder="Selected unit code"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Total Shipped
                </label>
                <input
                  type="number"
                  name="total_shipped"
                  value={form.total_shipped}
                  onChange={handleFormChange}
                  onWheel={(e) => {
                    (e.target as HTMLInputElement).blur();
                  }}
                  min={0}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Total Required Quantity
                </label>
                <input
                  type="number"
                  name="total_required_quantity"
                  value={form.total_required_quantity}
                  onChange={handleFormChange}
                  onWheel={(e) => {
                    (e.target as HTMLInputElement).blur();
                  }}
                  min={0}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  HSN Code
                </label>
                <input
                  type="text"
                  name="hsn_code"
                  value={form.hsn_code}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1 text-blue-200">
                    CGST Rate (%)
                  </label>
                  <input
                    type="number"
                    name="cgst_rate"
                    value={form.cgst_rate}
                    onChange={handleFormChange}
                    onWheel={(e) => {
                      (e.target as HTMLInputElement).blur();
                    }}
                    min={0}
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-blue-200">
                    SGST Rate (%)
                  </label>
                  <input
                    type="number"
                    name="sgst_rate"
                    value={form.sgst_rate}
                    onChange={handleFormChange}
                    onWheel={(e) => {
                      (e.target as HTMLInputElement).blur();
                    }}
                    min={0}
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1 text-blue-200">
                    IGST Rate (%)
                  </label>
                  <input
                    type="number"
                    name="igst_rate"
                    value={form.igst_rate}
                    onChange={handleFormChange}
                    onWheel={(e) => {
                      (e.target as HTMLInputElement).blur();
                    }}
                    min={0}
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-blue-200">
                    Cess Rate (%)
                  </label>
                  <input
                    type="number"
                    name="cess_rate"
                    value={form.cess_rate}
                    onChange={handleFormChange}
                    onWheel={(e) => {
                      (e.target as HTMLInputElement).blur();
                    }}
                    min={0}
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-blue-200">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
                >
                  <option value="sufficient">Sufficient</option>
                  <option value="low">Low</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              {submitError && <p className="text-red-400">{submitError}</p>}
              {submitSuccess && (
                <p className="text-green-400">{submitSuccess}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    {showCategoryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-sm border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Add Category
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCategoryError("");
              setCategoryLoading(true);
              const token = localStorage.getItem("access_token");
              const companyId = localStorage.getItem("company_id");
              if (!companyId) {
                setCategoryError("No company selected");
                setCategoryLoading(false);
                return;
              }
              try {
                const res = await fetch(`${API_URL}/api/catalog/categories/`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: categoryForm.name,
                    company: Number(companyId),
                  }),
                });
                if (res.ok) {
                  const newCat = await res.json();
                  setCategories((prev) => [...prev, newCat]);
                  setShowCategoryModal(false);
                  setCategoryForm({ name: "" });
                } else {
                  const data = await res.json();
                  setCategoryError(data.error || "Failed to add category.");
                }
              } catch {
                setCategoryError("Failed to add category.");
              } finally {
                setCategoryLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm mb-1 text-blue-200">
                Category Name
              </label>
              <input
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
              />
            </div>
            {categoryError && <p className="text-red-400">{categoryError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={categoryLoading}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded"
              >
                {categoryLoading ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
                onClick={() => setShowCategoryModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
);
}