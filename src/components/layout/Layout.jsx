import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Layout = ({ children }) => {
  const { isAuthenticated, currentUser, isSeller, logout } = useAuth();
  const { cartItems = [], animateCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const prevCartCountRef = useRef(cartItems.length);
  const [showAddedIndicator, setShowAddedIndicator] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const currentCartCount = cartItems.length;
    if (prevCartCountRef.current < currentCartCount && prevCartCountRef.current !== 0) {
      setIsCartAnimating(true);
      setShowAddedIndicator(true);
      
      const timer = setTimeout(() => {
        setIsCartAnimating(false);
        setShowAddedIndicator(false);
      }, 700);
      
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = currentCartCount;
  }, [cartItems.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
      setIsProfileMenuOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = (e) => {
    e.stopPropagation();
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-[#1a1f24] text-white shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between h-16 ${isSearchFocused ? 'items-start pt-2' : 'items-center'}`}>
            <div className={`flex ${isSearchFocused ? 'hidden sm:flex' : ''}`}>
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-[#c5630c]">TechShelf</span>
              </Link>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  to="/products" 
                  className={`${location.pathname === '/products' ? 'border-[#c5630c] text-white' : 'border-transparent text-gray-300 hover:border-gray-400 hover:text-white'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Products
                </Link>
                <Link 
                  to="/stores" 
                  className={`${location.pathname === '/stores' ? 'border-[#c5630c] text-white' : 'border-transparent text-gray-300 hover:border-gray-400 hover:text-white'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Stores
                </Link>
                
                {isAuthenticated && (
                  <>
                    {isSeller ? (
                      <Link 
                        to="/seller/dashboard" 
                        className={`${location.pathname.startsWith('/seller') ? 'border-[#c5630c] text-white' : 'border-transparent text-gray-300 hover:border-gray-400 hover:text-white'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        Seller Dashboard
                      </Link>
                    ) : (
                      <Link 
                        to="/become-seller" 
                        className={`${location.pathname === '/become-seller' ? 'border-[#c5630c] text-white' : 'border-transparent text-gray-300 hover:border-gray-400 hover:text-white'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        Become a Seller
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </div>
            
            <div className={`flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end transition-all duration-200 ${
              isSearchFocused ? 'fixed sm:relative top-0 left-0 right-0 p-2 sm:p-0 bg-[#1a1f24] z-50' : ''
            }`}>
              <div className={`max-w-lg w-full lg:max-w-xs ${isSearchFocused ? 'max-w-full' : ''}`}>
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <input 
                      ref={searchRef}
                      id="search" 
                      name="search" 
                      type="text" 
                      placeholder="Search products..." 
                      className={`block w-full pl-10 pr-3 py-2 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white 
                        placeholder-gray-500 text-black focus:outline-none focus:placeholder-gray-400 
                        focus:ring-1 focus:ring-[#c5630c] focus:border-[#c5630c] sm:text-sm ${
                          isSearchFocused ? 'text-lg sm:text-sm py-3 sm:py-2' : ''
                        }`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className={`text-gray-400 ${isSearchFocused ? 'h-6 w-6 sm:h-5 sm:w-5' : 'h-5 w-5'}`} 
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                      </svg>
                    </div>
                    {isSearchFocused && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          searchRef.current?.blur();
                        }}
                        className="absolute right-0 inset-y-0 pr-3 flex items-center sm:hidden"
                      >
                        <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
            
            <div className={`flex items-center ${isSearchFocused ? 'hidden sm:flex' : ''}`}>
              <Link to="/cart" className="ml-4 flow-root text-gray-300 hover:text-white">
                <div className="cart-icon-container">
                  <svg 
                    className={`h-6 w-6 ${animateCart ? 'cart-pop-animation' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItems && cartItems.length > 0 && (
                    <>
                      <span className={`cart-item-count ${animateCart ? 'cart-badge-animation' : ''}`}>
                        {cartItems.length}
                      </span>
                    </>
                  )}
                </div>
              </Link>
              
              {isAuthenticated && (
                <Link to="/notifications" className="ml-4 flow-root text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </Link>
              )}
              
              {isAuthenticated ? (
                <div className="ml-4 relative">
                  <div>
                    <button onClick={toggleProfileMenu} className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-400 transition">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-[#c5630c] text-white flex items-center justify-center">
                        {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>
                  </div>
                  {isProfileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Your Profile
                      </Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Your Orders
                      </Link>
                      <Link to="/liked-products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Liked Products
                      </Link>

                      {isSeller && (
                        <>
                          <Link to="/seller/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Seller Dashboard
                          </Link>
                          <Link to="/seller/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Seller Orders
                          </Link>
                        </>
                      )}

                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Only show login/register buttons on desktop, hide on mobile
                <div className="ml-4 hidden md:flex md:items-center">
                  <div className="flex md:flex-row space-y-0 md:space-x-2">
                    <Link
                      to="/login"
                      className="text-sm px-4 py-2 border rounded text-white border-[#c5630c] hover:border-transparent hover:text-white hover:bg-[#c5630c] text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="text-sm px-4 py-2 rounded text-white bg-[#c5630c] hover:bg-[#e17a1d] text-center"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="flex items-center sm:hidden ml-4">
                <button onClick={toggleMenu} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/products" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                Products
              </Link>
              <Link to="/stores" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                Stores
              </Link>
              
              {isAuthenticated && (
                <>
                  {isSeller ? (
                    <Link to="/seller/dashboard" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                      Seller Dashboard
                    </Link>
                  ) : (
                    <Link to="/become-seller" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                      Become a Seller
                    </Link>
                  )}
                </>
              )}
            </div>
            
            {isAuthenticated ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-[#c5630c] text-white flex items-center justify-center">
                      {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{currentUser?.username}</div>
                    <div className="text-sm font-medium text-gray-500">{currentUser?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link to="/profile" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Your Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Your Orders
                  </Link>
                  <Link to="/liked-products" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Liked Products
                  </Link>
                  <Link to="/notifications" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Notifications
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex flex-col space-y-2 px-4">
                  <Link 
                    to="/login" 
                    className="block text-center py-2 px-4 rounded border border-[#c5630c] text-[#c5630c] hover:text-white hover:bg-[#c5630c]">
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block text-center py-2 px-4 rounded text-white bg-[#c5630c] hover:bg-[#e17a1d]">
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
      
      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <footer className="bg-[#33353a] text-white border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2 space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-300">
                &copy; 2025 TechShelf, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
