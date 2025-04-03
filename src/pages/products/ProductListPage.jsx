/** @jsxRuntime classic */
/** @jsx React.createElement */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';


const SimpleButton = ({ onClick, disabled, children, type = "primary", fullWidth = false, size = "medium", className = "" }) => {
  let buttonClasses = "rounded font-medium transition-colors focus:outline-none";
  
  if (size === "small") {
    buttonClasses += " px-3 py-1 text-sm";
  } else if (size === "large") {
    buttonClasses += " px-6 py-3 text-base";
  } else {
    buttonClasses += " px-4 py-2 text-sm";
  }
  
  if (fullWidth) {
    buttonClasses += " w-full";
  }
  
  if (type === "primary") {
    buttonClasses += " bg-[#c5630c] hover:bg-[#b35500] text-white";
  } else if (type === "outline") {
    buttonClasses += " border border-[#c5630c] text-[#c5630c] hover:bg-[#c5630c] hover:text-white";
  } else if (type === "secondary") {
    buttonClasses += " bg-[#a47f6f] hover:bg-[#8c6b5d] text-white";
  } else if (type === "dark") {
    buttonClasses += " bg-[#33353a] hover:bg-[#1a1f24] text-white";
  }
  
  if (disabled) {
    buttonClasses += " opacity-50 cursor-not-allowed";
  }
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${buttonClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [addingToCart, setAddingToCart] = useState({});
  const [likingProduct, setLikingProduct] = useState({});
  
  const [localPriceFilters, setLocalPriceFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });
  const [priceFilterTimeout, setPriceFilterTimeout] = useState(null);
  
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = '/products/';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await api.get(url);
        setProducts(response.data.results || response.data);
        
        const uniqueCategories = new Set(
          (response.data.results || response.data || [])
          .filter(product => product?.category)
          .map(product => product.category)
        );
        setCategories(Array.from(uniqueCategories));
        
      } catch (err) {
        setError("Failed to load products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [search, category, sort, minPrice, maxPrice]);
  
  useEffect(() => {
    setLocalPriceFilters({
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    });
  }, [searchParams]);
  
  const updateFilters = (newFilters) => {
    const current = {};
    for (const [key, value] of searchParams.entries()) {
      current[key] = value;
    }
    
    setSearchParams({
      ...current,
      ...newFilters
    });
  };
  
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    
    setLocalPriceFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (priceFilterTimeout) {
      clearTimeout(priceFilterTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      if (name === 'minPrice' || name === 'maxPrice') {
        const updates = {};
        
        if (name === 'minPrice') {
          updates.minPrice = value || '';
        } else {
          updates.maxPrice = value || '';
        }
        
        updateFilters(updates);
      }
    }, 1400);
    
    setPriceFilterTimeout(timeoutId);
  };
  
  const handlePriceFilterSubmit = (e) => {
    e.preventDefault();
    
    if (priceFilterTimeout) {
      clearTimeout(priceFilterTimeout);
      setPriceFilterTimeout(null);
    }
    
    updateFilters({
      minPrice: localPriceFilters.minPrice || '',
      maxPrice: localPriceFilters.maxPrice || ''
    });
  };
  
  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      if (!isAuthenticated) {
        sessionStorage.setItem('redirectToCartAfterAuth', 'true');
      }
      await addToCart(productId, 1);
      
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  const handleLikeProduct = async (productId, isLiked) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterAuth', location.pathname);
      navigate('/login');
      return;
    }
    
    try {
      setLikingProduct(prev => ({ ...prev, [productId]: true }));
      
      if (isLiked) {
        await api.delete(`/products/${productId}/like/`);
        
        setProducts(products.map(product => 
          product.product_id === productId 
            ? { ...product, is_liked: false, like_count: Math.max(0, (product.like_count || 0) - 1) } 
            : product
        ));
      } else {
        await api.post(`/products/${productId}/like/`);
        
        setProducts(products.map(product => 
          product.product_id === productId 
            ? { ...product, is_liked: true, like_count: (product.like_count || 0) + 1 } 
            : product
        ));
      }
    } catch (err) {
      console.error('Failed to handle like operation:', err);
    } finally {
      setLikingProduct(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
          <div className="bg-white p-4 rounded shadow border-l-4 border-[#c5630c]">
            <h2 className="text-lg font-semibold mb-4 text-[#33353a]">Filters</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-[#33353a]">Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="all-categories"
                    name="category"
                    checked={!category}
                    onChange={() => updateFilters({ category: '' })}
                    className="mr-2 accent-[#c5630c]"
                  />
                  <label htmlFor="all-categories" className="text-gray-700">All Categories</label>
                </div>
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center">
                    <input
                      type="radio"
                      id={`category-${cat}`}
                      name="category"
                      checked={category === cat}
                      onChange={() => updateFilters({ category: cat })}
                      className="mr-2 accent-[#c5630c]"
                    />
                    <label htmlFor={`category-${cat}`} className="text-gray-700">{cat}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-[#33353a]">Price Range</h3>
              <form onSubmit={handlePriceFilterSubmit}>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="number"
                    placeholder="Min"
                    name="minPrice"
                    value={localPriceFilters.minPrice}
                    onChange={handlePriceChange}
                    className="w-1/2 px-2 py-1 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    name="maxPrice"
                    value={localPriceFilters.maxPrice}
                    onChange={handlePriceChange}
                    className="w-1/2 px-2 py-1 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    min="0"
                  />
                </div>
                <SimpleButton
                  type="submit"
                  size="small"
                  fullWidth
                >
                  Apply Price Filter
                </SimpleButton>
              </form>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-[#33353a]">Sort By</h3>
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          {search && (
            <div className="mb-4">
              <h2 className="text-xl">Search results for: "{search}"</h2>
            </div>
          )}
          
          {category && (
            <div className="mb-4">
              <h2 className="text-xl">Category: {category}</h2>
            </div>
          )}
          
          {products.length === 0 ? (
            <div className="bg-white p-6 rounded shadow text-center">
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-gray-500 mt-2">Try changing your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.product_id} className="group bg-white rounded-xl shadow-md overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-[#c5630c]/10 border border-gray-100 flex flex-col">
                  <Link to={`/products/${product.product_id}`} className="block overflow-hidden">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                        ${parseFloat(product.price).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-5 flex-grow flex flex-col">
                    <Link to={`/products/${product.product_id}`}>
                      <h3 className="font-semibold text-lg text-[#33353a] mb-1 hover:text-[#c5630c] line-clamp-1">{product.name}</h3>
                    </Link>
                    
                    {product.store_name && (
                      <p className="text-sm text-gray-600 mb-2 flex items-center">
                        <svg className="w-3 h-3 mr-1 text-[#a47f6f]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"></path>
                        </svg>
                        <Link to={`/stores/${product.store_subdomain || product.store}`} className="text-[#a47f6f] hover:underline">{product.store_name}</Link>
                      </p>
                    )}
                    
                    {product.like_count > 0 && (
                      <div className="text-sm text-gray-500 mb-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 text-red-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {product.like_count} {product.like_count === 1 ? 'person likes this' : 'people like this'}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Stock</span>
                          <span className={`text-sm font-medium ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {product.stock > 5 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <div className="flex-shrink-0 flex">
                          <button 
                            onClick={() => handleLikeProduct(product.product_id, product.is_liked)}
                            className="w-8 h-8 rounded-full p-1 bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200"
                            disabled={likingProduct[product.product_id]}
                          >
                            {likingProduct[product.product_id] ? (
                              <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                              </svg>
                            ) : (
                              <svg 
                                className={`w-5 h-5 ${product.is_liked ? 'text-red-500 fill-current' : 'text-gray-500'}`} 
                                fill={product.is_liked ? "currentColor" : "none"} 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <SimpleButton
                        onClick={() => handleAddToCart(product.product_id)}
                        disabled={product.stock <= 0 || addingToCart[product.product_id]}
                        fullWidth
                        className="py-3 rounded-lg shadow-sm group overflow-hidden relative"
                      >
                        <span className="absolute inset-0 w-0 bg-gradient-to-r from-[#c5630c] to-[#e17a1d] transition-all duration-300 group-hover:w-full"></span>
                        {addingToCart[product.product_id] ? (
                          <span className="flex items-center justify-center relative z-10">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </span>
                        ) : (
                          <span className="relative z-10 flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                          </span>
                        )}
                      </SimpleButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductListPage;
