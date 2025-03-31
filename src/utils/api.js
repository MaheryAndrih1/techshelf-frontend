import axios from 'axios';

// Use environment variables with fallbacks for when env vars aren't available
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://techshelf-api.onrender.com/api/';
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'https://techshelf-api.onrender.com/';

// Use CORS proxy for deployment environment
const isProduction = window.location.hostname !== 'localhost';
const CORS_PROXY = isProduction ? 'https://corsproxy.io/?' : '';

// Log to help debug
console.log('API base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: isProduction ? `${CORS_PROXY}${API_BASE_URL}` : API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to handle media URLs
export const getMediaUrl = (url) => {
  if (!url) return null;
  
  // If the URL is already absolute (starts with http)
  if (url.startsWith('http')) {
    return isProduction ? `${CORS_PROXY}${url}` : url;
  }
  
  // If the URL starts with a slash, remove it to avoid double slashes
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  const mediaUrl = `${MEDIA_BASE_URL}media/${cleanUrl}`;
  return isProduction ? `${CORS_PROXY}${mediaUrl}` : mediaUrl;
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
          isProduction ? `${CORS_PROXY}${refreshUrl}` : refreshUrl, 
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