import axios from 'axios';

// Use environment variables with fallbacks for when env vars aren't available
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://techshelf-api.onrender.com/api').replace(/\/$/, '');
const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL || 'https://techshelf-api.onrender.com').replace(/\/$/, '');

// Use CORS proxy for deployment environment
const isProduction = window.location.hostname !== 'localhost';
const CORS_PROXY = isProduction ? 'https://api.allorigins.win/raw?url=' : '';

// Log to help debug
console.log('Environment:', {
  isProduction,
  API_BASE_URL,
  MEDIA_BASE_URL,
  CORS_PROXY
});

const api = axios.create({
  baseURL: API_BASE_URL + '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for production environment
api.interceptors.request.use((config) => {
  if (isProduction) {
    const originalUrl = config.url;
    config.url = `${CORS_PROXY}${encodeURIComponent(API_BASE_URL + '/' + originalUrl)}`;
    console.log('Making request to:', config.url);
  }
  return config;
});

// Helper function to handle media URLs
export const getMediaUrl = (url) => {
  if (!url) return null;
  
  if (url.startsWith('http')) {
    return isProduction ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
  }
  
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const fullUrl = `${MEDIA_BASE_URL}/media/${cleanUrl}`;
  return isProduction ? `${CORS_PROXY}${encodeURIComponent(fullUrl)}` : fullUrl;
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
          isProduction ? `${CORS_PROXY}${encodeURIComponent(refreshUrl)}` : refreshUrl, 
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