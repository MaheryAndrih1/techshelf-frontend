import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularStores, setPopularStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isSeller } = useAuth();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState({});
  const [likedProducts, setLikedProducts] = useState({});
  const [likingProduct, setLikingProduct] = useState({});
  const navigate = useNavigate(); // Add this line to get the navigate function

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const productsResponse = await api.get('/products/?sort=popularity&limit=8');
        setFeaturedProducts(productsResponse.data.results || productsResponse.data);
        
        const storesResponse = await api.get('/stores/?limit=4');
        setPopularStores(storesResponse.data.results || storesResponse.data);

        if (isAuthenticated) {
          try {
            const likedResponse = await api.get('/products/liked/');
            const userLikedProducts = {};
            (likedResponse.data.results || likedResponse.data).forEach(product => {
              userLikedProducts[product.product_id] = true;
            });
            setLikedProducts(userLikedProducts);
          } catch (err) {
            console.error('Failed to fetch liked products:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, [isAuthenticated]);

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleLikeProduct = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Store the current path for redirect after login
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      // Use navigate instead of window.location.href
      navigate('/login');
      return;
    }
    
    if (likingProduct[productId]) return;
    
    setLikingProduct(prev => ({ ...prev, [productId]: true }));
    try {
      if (likedProducts[productId]) {
        await api.delete(`/products/${productId}/unlike/`);
        setLikedProducts(prev => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      } else {
        await api.post(`/products/${productId}/like/`);
        setLikedProducts(prev => ({ ...prev, [productId]: true }));
      }
    } catch (err) {
      console.error('Failed to like/unlike product:', err);
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
      <div className="relative bg-[#1a1f24] text-white py-20 px-4 mb-16 rounded-3xl overflow-hidden shadow-2xl transform -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/tech-pattern.svg')] bg-repeat opacity-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5630c] rounded-full filter blur-3xl opacity-10 animate-pulse-slow"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#3b82f6] rounded-full filter blur-3xl opacity-10 animate-pulse-slow delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-16 lg:mb-0 relative">
              <div className="absolute -top-6 -left-6 w-16 h-16">
                <div className="absolute top-0 left-0 bg-[#c5630c] h-10 w-10 rounded-md opacity-30 animate-bounce"></div>
                <div className="absolute bottom-0 right-0 bg-[#c5630c] h-6 w-6 rounded-md opacity-20 animate-bounce-slow"></div>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-none tracking-tight">
                <span className="block text-white drop-shadow-xl pb-2">Discover</span>
                <span className="bg-gradient-to-r from-white via-orange-100 to-[#c5630c] bg-clip-text text-transparent pb-2">Amazing Tech</span>
              </h1>
              
              <div className="w-24 h-1 bg-gradient-to-r from-[#c5630c] to-transparent rounded-full mb-8"></div>
              
              <p className="text-xl sm:text-2xl mb-12 text-gray-300 max-w-xl leading-relaxed font-light">
                Shop the latest <span className="text-white font-medium">premium gadgets</span> and digital products from creators and stores around the world.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <SimpleButton size="large" className="px-8 py-4 transition-all hover:scale-105 text-lg relative overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#c5630c] to-[#e17a1d] "></span>
                    <span className="flex items-center relative z-10">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Browse Products
                    </span>
                  </SimpleButton>
                </Link>
                <Link to="/stores">
                  <SimpleButton type="secondary" size="large" className="px-8 py-3 text-lg backdrop-blur-sm bg-opacity-90 border border-white/10">
                    <span className="flex items-center">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Explore Stores
                    </span>
                  </SimpleButton>
                </Link>
              </div>
            </div>
            
            <div className="lg:w-1/2 flex justify-center relative">
              <div className="absolute -top-16 -right-16 w-32 h-32">
                <div className="absolute top-0 right-0 bg-[#c5630c] h-24 w-24 rounded-full opacity-20"></div>
                <div className="absolute bottom-0 left-0 bg-[#a47f6f] h-16 w-16 rounded-full opacity-10"></div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#c5630c]/20 to-[#3b82f6]/20 rounded-2xl transform rotate-6 scale-105 blur-xl"></div>
                <div className="bg-gradient-to-br from-gray-900 to-black p-4 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.3)] transform hover:rotate-0 transition-all duration-700 border border-white/10 relative backdrop-blur-sm">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-board.svg')] bg-no-repeat bg-cover opacity-10 mix-blend-overlay rounded-2xl"></div>
                  <div className="rounded-xl overflow-hidden border border-gray-800 relative">
                    <img 
                      src="/hero-devices.png" 
                      alt="Tech Devices" 
                      className="max-w-full h-auto object-cover z-10 relative"
                      style={{maxHeight: "450px"}}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
                  </div>
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="absolute -left-6 top-1/4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-xs font-medium text-white shadow-lg transform -rotate-6 animate-float">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Latest Features
                    </div>
                  </div>
                  <div className="absolute -right-8 bottom-1/3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-xs font-medium text-white shadow-lg transform rotate-3 animate-float-delayed">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Premium Quality
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <div className="flex justify-between items-center mb-10">
          <div className="relative">
            <h2 className="text-3xl font-bold text-[#33353a] relative z-10">Featured Products</h2>
            <div className="absolute -bottom-2 left-0 w-36 h-3 bg-[#c5630c]/10 rounded-full"></div>
          </div>
          <Link to="/products" className="group text-[#c5630c] font-medium flex items-center transition-all hover:text-[#b35500]">
            View All
            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {featuredProducts.slice(0, 8).map(product => (
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
                        onClick={(e) => handleLikeProduct(product.product_id, e)}
                        className="w-8 h-8 rounded-full p-1 bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200"
                        disabled={likingProduct[product.product_id]}
                      >
                        {likingProduct[product.product_id] ? (
                          <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                          </svg>
                        ) : (
                          <svg 
                            className={`w-5 h-5 ${likedProducts[product.product_id] ? 'text-red-500 fill-current' : 'text-gray-500'}`} 
                            fill={likedProducts[product.product_id] ? "currentColor" : "none"} 
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
      </div>

      <div className="mb-20">
        <div className="flex justify-between items-center mb-10">
          <div className="relative">
            <h2 className="text-3xl font-bold text-[#33353a] relative z-10">Popular Stores</h2>
            <div className="absolute -bottom-2 left-0 w-36 h-3 bg-[#a47f6f]/10 rounded-full"></div>
          </div>
          <Link to="/stores" className="group text-[#c5630c] font-medium flex items-center transition-all hover:text-[#b35500]">
            View All
            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {popularStores.map(store => (
            <Link 
              key={store.store_id} 
              to={`/stores/${store.subdomain_name}`}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-32 bg-gradient-to-r from-[#c5630c] to-[#a47f6f] relative">
                {store.theme?.banner_url && (
                  <img
                    src={store.theme.banner_url.startsWith('http') ? store.theme.banner_url : `/media/${store.theme.banner_url}`}
                    alt={`${store.store_name} banner`}
                    className="w-full h-full object-cover"
                    onError={(e) => {e.target.style.display = 'none'}}
                  />
                )}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className="w-16 h-16 rounded-full bg-white p-1">
                    {store.theme?.logo_url ? (
                      <img
                        src={store.theme.logo_url.startsWith('http') ? store.theme.logo_url : `/media/${store.theme.logo_url}`}
                        alt={`${store.store_name} logo`}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center bg-[#33353a] text-white text-xl font-bold">${store.store_name.charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-[#33353a] text-white text-xl font-bold">
                        {store.store_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 pt-12 text-center">
                <h3 className="font-semibold text-lg text-[#33353a] mb-1">{store.store_name}</h3>
                
                {store.average_rating ? (
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(store.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-sm text-gray-500">
                      ({store.rating_count || 0})
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">No ratings yet</p>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {store.description || 'Explore this store to discover amazing products.'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1f24] to-[#33353a] text-white rounded-2xl p-12 mb-16 shadow-xl">
        <div className="absolute inset-0 bg-[url('/tech-pattern.svg')] bg-repeat opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5630c] rounded-full filter blur-3xl opacity-10 animate-pulse-slow"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-xl bg-[#c5630c]/20 backdrop-blur-sm flex items-center justify-center mb-6 transform rotate-12">
              <svg className="w-8 h-8 text-[#c5630c]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd"></path>
                <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd"></path>
                <path fillRule="evenodd" d="M10 10a1 1 0 011 1c0 2.236-.46 4.368-1.29 6.304a1 1 0 01-1.838-.789A13.952 13.952 0 009 11a1 1 0 011-1z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">Start Your Tech Business <span className="text-[#c5630c]">Today</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#c5630c] to-transparent rounded-full mb-6"></div>
            <p className="text-xl mb-10 text-gray-300 max-w-xl">Join TechShelf as a seller and reach thousands of tech enthusiasts around the world.</p>
            
            <Link to={!isAuthenticated ? "/login" : isSeller ? "/seller/dashboard" : "/become-seller"}>
              <SimpleButton size="large" className="px-10 py-4 text-lg relative overflow-hidden group shadow-lg shadow-[#c5630c]/20">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#c5630c] to-[#e17a1d] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  {!isAuthenticated ? "Sign In to Start" : isSeller ? "Seller Dashboard" : "Become a Seller"}
                </span>
              </SimpleButton>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;