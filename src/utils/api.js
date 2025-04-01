import axios from 'axios';

// Use environment variables with fallbacks
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://techshelf-api.onrender.com/api').replace(/\/$/, '');
const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL || 'https://techshelf-api.onrender.com').replace(/\/$/, '');

// Use CORS proxy for production only
const isProduction = window.location.hostname !== 'localhost';

// Function to encode URL for CORS proxy
const encodeURL = (url) => {
  return encodeURIComponent(url.replace(/([^:]\/)\/+/g, "$1"));
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to handle CORS proxy
api.interceptors.request.use(request => {
  if (isProduction) {
    const fullUrl = `${request.baseURL}/${request.url}`.replace(/([^:]\/)\/+/g, "$1");
    request.baseURL = '';
    request.url = `https://api.allorigins.win/raw?url=${encodeURL(fullUrl)}`;
  }
  
  console.log('Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL
  });
  
  return request;
});

// Helper function to handle media URLs
export const getMediaUrl = (url) => {
  if (!url) return null;
  
  if (url.startsWith('http')) {
    return isProduction 
      ? `https://api.allorigins.win/raw?url=${encodeURL(url)}`
      : url;
  }
  
  const fullUrl = `${MEDIA_BASE_URL}/media/${url.replace(/^\/+/, '')}`;
  return isProduction
    ? `https://api.allorigins.win/raw?url=${encodeURL(fullUrl)}`
    : fullUrl;
};

// Update API interceptor to handle CORS issues
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle token refresh
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const refreshUrl = `${API_BASE_URL}users/token/refresh/`;
        const response = await axios.post(
          isProduction ? `https://api.allorigins.win/raw?url=${encodeURL(refreshUrl)}` : refreshUrl, 
          { refresh: refreshToken }
        );
        
        const { access } = response.data;
        
        localStorage.setItem('accessToken', access);
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;