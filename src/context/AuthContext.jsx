import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (user && token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/users/profile/');
          const updatedUser = response.data;

          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        } catch (err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/users/login/', {
        email,
        password
      });
      
      const { user, access, refresh } = response.data;

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to login';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        password2: userData.confirmPassword
      };
      
      console.log('Sending registration data:', { ...registrationData, password: '***', password2: '***' });
      
      const response = await api.post('/users/register/', registrationData);
      
      if (response.data && response.data.user) {
        return login(userData.email, userData.password);
      } else {
        return login(userData.email, userData.password);
      }
    } catch (err) {
      console.error('Registration error full:', err);
      console.error('Registration error response:', err.response);
      console.error('Registration error data:', err.response?.data);
      
      // Extract detailed error messages
      let message = 'Registration failed. ';
      
      if (err.response?.data) {
        const errors = err.response.data;
        
        // Log all error fields for debugging
        console.log('All error fields:', Object.keys(errors));
        
        if (errors.username) {
          message += `Username: ${Array.isArray(errors.username) ? errors.username[0] : errors.username}. `;
        }
        if (errors.email) {
          message += `Email: ${Array.isArray(errors.email) ? errors.email[0] : errors.email}. `;
        }
        if (errors.password) {
          message += `Password: ${Array.isArray(errors.password) ? errors.password[0] : errors.password}. `;
        }
        if (errors.password2) {
          message += `Password confirmation: ${Array.isArray(errors.password2) ? errors.password2[0] : errors.password2}. `;
        }
        if (errors.error || errors.detail) {
          message = errors.error || errors.detail;
        }
        
        // Check for non_field_errors
        if (errors.non_field_errors) {
          message += `${Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors}. `;
        }
        
        // If no specific error was found, show all errors
        if (message === 'Registration failed. ') {
          message = 'Registration failed: ' + JSON.stringify(errors);
        }
      } else {
        message = 'Registration failed. Please check your information.';
      }
      
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/users/logout/', { refresh: refreshToken }).catch(() => {});
    }
  };

  const upgradeToSeller = async () => {
    setLoading(true);
    try {
      const response = await api.post('/users/upgrade-seller/');
      
      const updatedUser = { ...currentUser, role: 'SELLER' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to upgrade account';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile/', profileData);
      
      localStorage.setItem('user', JSON.stringify(response.data));
      setCurrentUser(response.data);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update profile';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser || !localStorage.getItem('accessToken')) {
      return null;
    }
    
    try {
      const response = await api.get('/users/profile/');
      return response.data;
    } catch (err) {
      return null;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    upgradeToSeller,
    updateProfile,
    isAuthenticated: !!currentUser,
    isSeller: currentUser?.role === 'SELLER',
    authChecked,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
