"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Package, ShoppingCart, Building2 } from 'lucide-react';
import { RetailerNavbar } from '../../../components/retailer/nav_bar';
import { authStorage } from '../../../utils/localStorage';
import { fetchWithAuth, API_URL } from '../../../utils/auth_fn';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  company_name?: string;
  company_id?: number;
  description?: string;
}

interface Company {
  id: number;
  name: string;
  status: string;
}

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const [profileChecked, setProfileChecked] = useState(false);

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home', 'Sports'];

  // Check if retailer profile exists using context API
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const contextResponse = await fetchWithAuth(`${API_URL}/users/me/context/`);
        
        if (contextResponse.ok) {
          const context = await contextResponse.json();
          
          // If is_portal_user is false, profile not complete - redirect to setup
          if (!context.is_portal_user) {
            router.replace('/retailer/setup');
            return;
          }
        } else {
          router.replace('/retailer/setup');
          return;
        }
        
        setProfileChecked(true);
      } catch (error) {
        router.replace('/retailer/setup');
      }
    };

    checkProfile();
  }, [router]);

  useEffect(() => {
    if (!profileChecked) return;
    fetchConnectedCompanies();
    fetchProducts();
  }, [profileChecked]);

  const fetchConnectedCompanies = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/portal/companies/`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const connectedCompanies = data
            .filter((c: any) => c.status === 'APPROVED')
            .map((c: any) => ({
              id: c.company_id || c.id,
              company_name: c.company_name,
              status: c.status?.toLowerCase() || 'connected'
            }));
          setCompanies(connectedCompanies);
        }
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch products using Portal items API
      const response = await fetchWithAuth(`${API_URL}/portal/items/`);
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.results || []);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
    setLoading(false);
  };

  const addToCart = (productId: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = search === '' || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase()) ||
      (product.company_name && product.company_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    const matchesCompany = selectedCompany === '' || product.company_id?.toString() === selectedCompany;
    
    return matchesSearch && matchesCategory && matchesCompany;
  });

  const sortedProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'stock':
        return b.stock - a.stock;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = products.find(p => p.id === parseInt(productId));
    return sum + (product ? product.price * qty : 0);
  }, 0);

  // Don't render if profile check hasn't completed
  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Checking profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <RetailerNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Products</h1>
              <p className="text-neutral-400 mt-2">Browse products from your connected companies</p>
            </div>
            {totalCartItems > 0 && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-400" />
                  <span className="font-medium text-blue-300">
                    {totalCartItems} items • ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products, categories, companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-neutral-900 rounded-lg shadow border border-neutral-800">
          <div className="px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {filteredProducts.length} Products Available
              </h2>
              {companies.length === 0 && (
                <div className="text-orange-400 text-sm">
                  No companies connected. Join companies to see their products.
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
                <p className="text-neutral-400">
                  {companies.length === 0 
                    ? 'Connect to companies to see their products'
                    : search || selectedCategory || selectedCompany
                      ? 'Try adjusting your filters'
                      : 'No products available from connected companies'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map(product => (
                  <div key={product.id} className="border border-neutral-700 rounded-lg p-4 hover:shadow-lg hover:border-neutral-600 transition-all bg-neutral-800">
                    <img
                      src={product.image || '/api/placeholder/200/200'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-white line-clamp-2">{product.name}</h3>
                        {product.company_name && (
                          <div className="flex items-center gap-1 text-xs text-neutral-400 ml-2">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-20">{product.company_name}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-neutral-400 text-sm">{product.category}</p>
                      
                      {product.description && (
                        <p className="text-neutral-500 text-sm line-clamp-2">{product.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">${product.price.toFixed(2)}</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          product.stock > 10 ? 'bg-green-900/30 text-green-400' :
                          product.stock > 0 ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {cart[product.id] ? (
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="bg-neutral-700 text-neutral-300 px-3 py-1 rounded-lg hover:bg-neutral-600 transition-colors"
                            >
                              -
                            </button>
                            <span className="font-medium text-white">{cart[product.id]}</span>
                            <button
                              onClick={() => addToCart(product.id)}
                              disabled={cart[product.id] >= product.stock}
                              className="bg-neutral-700 text-neutral-300 px-3 py-1 rounded-lg hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(product.id)}
                            disabled={product.stock === 0}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;