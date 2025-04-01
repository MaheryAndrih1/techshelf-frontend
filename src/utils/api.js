import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://techshelf-api.onrender.com/api';
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'https://techshelf-api.onrender.com';

console.log('API base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

export const getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return `${MEDIA_BASE_URL}/media/${cleanUrl}`;
};

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');
        
        const response = await axios.post(
          `${API_BASE_URL}/users/token/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true }
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

// Request interceptor to add auth header
api.interceptors.request.use(request => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

export default api;