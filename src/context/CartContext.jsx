import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'techshelf_guest_cart';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser, authChecked } = useAuth();
  const [animateCart, setAnimateCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);  

  useEffect(() => {
    if (authChecked) {
      if (isAuthenticated) {
        fetchCart();
      } else {
        const guestCart = loadGuestCart();
        setCart(guestCart);
      }
    }
  }, [isAuthenticated, authChecked]); 

  // Add event listener for login
  useEffect(() => {
    const handleLogin = async () => {
      if (isAuthenticated) {
        await mergeCartsAfterLogin();
      }
    };

    window.addEventListener('userLoggedIn', handleLogin);

    return () => {
      window.removeEventListener('userLoggedIn', handleLogin);
    };
  }, [isAuthenticated]);

  const saveGuestCart = (cartData) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartData));
    return cartData;
  };

  const loadGuestCart = () => {
    try {
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (err) {
      // Silent error handling
    }
    return { items: [], total: 0, subtotal: 0 };
  };

  const mergeCartsAfterLogin = async () => {
    const guestCart = loadGuestCart();
    
    if (guestCart?.items?.length > 0) {
        try {
            setLoading(true);
            setError(null);
            
            // Use new endpoint to merge carts
            await api.post('/orders/cart/merge/', guestCart);
            
            // Clear guest cart after successful merge
            localStorage.removeItem(GUEST_CART_KEY);
            
            // Fetch the updated cart
            await fetchCart();
            
            console.log('Cart merged successfully');
        } catch (err) {
            setError('Failed to merge cart items');
            console.error('Cart merge error:', err);
        } finally {
            setLoading(false);
        }
    }
  };

  const fetchCart = async () => {
    if (!isAuthenticated || !localStorage.getItem('accessToken')) {
      const guestCart = loadGuestCart();
      setCart(guestCart);
      return guestCart;
    }
    
    setLoading(true);
    try {
      const response = await api.get('/orders/cart/');
      
      let cartData = response.data || { items: [] };
      if (!Array.isArray(cartData.items)) {
        cartData.items = [];
      }
      
      const updatedItems = await Promise.all(cartData.items.map(async (item) => {
        if (!item.product || !item.product.image) {
          try {
            const productResponse = await api.get(`/products/${item.product_id}/`);
            return {
              ...item,
              product: productResponse.data
            };
          } catch (err) {
            return {
              ...item,
              product: {
                name: `Product ${item.product_id.split('_')[1] || ''}`,
                price: item.price || 0,
                image: null,
                stock: 10
              }
            };
          }
        }
        return item;
      }));
      
      cartData.items = updatedItems;
      setCart(cartData);
      
      setCartCount(cartData.items.length);
    } catch (err) {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const response = await api.post('/orders/cart/add/', {
          product_id: productId,
          quantity,
        });
    
        triggerAnimation();
        
        await fetchCart();
        return response.data;
      } else {
        const productResponse = await api.get(`/products/${productId}/`);
        const product = productResponse.data;
        
        const guestCart = loadGuestCart();
        
        const existingItemIndex = guestCart.items.findIndex(item => 
          item.product_id === productId
        );
        
        if (existingItemIndex >= 0) {
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          guestCart.items.push({
            product_id: productId,
            quantity: quantity,
            price: product.price,
            product: product
          });
        }
        
        const subtotal = guestCart.items.reduce(
          (sum, item) => sum + (parseFloat(item.price) * item.quantity),
          0
        );
        
        guestCart.subtotal = subtotal;
        guestCart.total = subtotal; 
        
        triggerAnimation();
        
        const updatedCart = saveGuestCart(guestCart);
        setCart(updatedCart);
        setCartCount(updatedCart.items.length);
        
        return updatedCart;
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add item to cart';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnimation = () => {
    setAnimateCart(true);
    setTimeout(() => {
      setAnimateCart(false);
    }, 400);
  };

  const removeFromCart = async (productId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        const previousCart = { ...cart };
        const response = await api.delete(`/orders/cart/remove/${productId}/`);
        
        if (response.data && Array.isArray(response.data.items)) {
          const processedItems = response.data.items.map(item => {
            const previousItem = previousCart.items?.find(prevItem => 
              prevItem.product_id === item.product_id
            );
            
            if (previousItem && previousItem.product) {
              return {
                ...item,
                product: {
                  ...item.product,
                  ...previousItem.product
                }
              };
            }
            return item;
          });
          
          setCart({
            ...response.data,
            items: processedItems
          });
        } else {
          setCart(response.data);
        }
        
        return response.data;
      } else {
        const guestCart = loadGuestCart();
        
        const updatedItems = guestCart.items.filter(item => 
          item.product_id !== productId
        );
        
        const updatedCart = {
          ...guestCart,
          items: updatedItems,
          subtotal: updatedItems.reduce(
            (sum, item) => sum + (parseFloat(item.price) * item.quantity),
            0
          )
        };
        updatedCart.total = updatedCart.subtotal;
        
        saveGuestCart(updatedCart);
        setCart(updatedCart);
        return updatedCart;
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to remove item from cart';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    setError(null);
    
    if (quantity < 1) {
      return removeFromCart(productId);
    }
  
    if (isAuthenticated) {
      if (cart && cart.items) {
        const updatedItems = cart.items.map(item => {
          if (item.product_id === productId) {
            return {
              ...item,
              quantity,
              ...(item.total_price && { 
                total_price: (parseFloat(item.price || (item.total_price / item.quantity)) * quantity).toFixed(2) 
              })
            };
          }
          return item;
        });
        
        setCart({
          ...cart,
          items: updatedItems
        });
      }
      
      try {
        const response = await api.put(`/orders/cart/update/${productId}/`, { quantity });
        
        if (response?.data?.items) {
          const processedItems = response.data.items.map(item => {
            if (!item.product && item.product_name) {
              return {
                ...item,
                product: {
                  name: item.product_name,
                  price: parseFloat(item.total_price) / item.quantity,
                  image: cart?.items?.find(i => i.product_id === item.product_id)?.product?.image || null
                }
              };
            }
            return item;
          });
          
          setCart({
            ...response.data,
            items: processedItems
          });
        }
        
        return cart;
      } catch (err) {
        const message = err.response?.data?.error || 'Failed to update cart';
        setError(message);
        
        await fetchCart();
        throw new Error(message);
      }
    } else {
      const guestCart = loadGuestCart();
      
      const updatedItems = guestCart.items.map(item => {
        if (item.product_id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
      
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + (parseFloat(item.price) * item.quantity),
        0
      );
      
      const updatedCart = {
        ...guestCart,
        items: updatedItems,
        subtotal,
        total: subtotal
      };
      
      saveGuestCart(updatedCart);
      setCart(updatedCart);
      return updatedCart;
    }
  };

  const applyPromotion = async (discountCode) => {
    if (!isAuthenticated) {
      setError("Please log in to apply promotion codes");
      throw new Error("Login required to apply promotions");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/orders/promotions/apply/', {
        discount_code: discountCode,
      });
      
      await fetchCart();
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Invalid discount code';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (checkoutData) => {
    if (!isAuthenticated) {
      throw new Error("Login required for checkout");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/orders/checkout/', {
        ...checkoutData,
        save_card: checkoutData.save_card || false
      });
      
      setCart(null);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Checkout failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const clearGuestCart = () => {
    localStorage.removeItem(GUEST_CART_KEY);
    if (!isAuthenticated) {
      setCart({ items: [], total: 0, subtotal: 0 });
    }
  };

  const value = {
    cart,
    cartItems: cart?.items || [],  
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromotion,
    checkout,
    refreshCart: fetchCart,
    mergeCartsAfterLogin,
    clearGuestCart,
    isGuestCart: !isAuthenticated && cart?.items?.length > 0,
    itemCount: cartCount,
    cartTotal: cart?.total || 0,
    animateCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
