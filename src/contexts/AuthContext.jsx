import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.js';
import apiService from '../services/api';
import studentService from '../services/student';
import toast from 'react-hot-toast';

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          const cachedRole = sessionStorage.getItem('tinylearn_last_role');
          const response = await apiService.getProfile(cachedRole);
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Invalid token, clear it
            apiService.removeToken();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          apiService.removeToken();
          if (error.status !== 401) {
            toast.error('Authentication error. Please login again.');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials, showToast = true, roleHint = null) => {
    try {
      setLoading(true);
      let response;

      if (roleHint === 'student') {
        response = await studentService.loginStudent(credentials, { silent: true });
      } else if (roleHint === 'parent') {
        response = await studentService.loginParent(credentials, { silent: true });
      } else {
        response = await apiService.login(credentials, roleHint);
      }
      
      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        if (userData.role) {
          sessionStorage.setItem('tinylearn_last_role', userData.role);
        }
        setUser(userData);
        
        // Only show toast if requested (to prevent duplicate notifications)
        if (showToast) {
          toast.success(`Welcome back, ${userData.firstName}!`);
        }
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.message || 'Login failed. Please try again.';
      
      // Always show error toasts
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (showToast = true) => {
    try {
      await apiService.logout();
      setUser(null);
      sessionStorage.removeItem('tinylearn_last_role');
      
      // Only show toast if requested (to prevent duplicate notifications)
      if (showToast) {
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
      
      // Only show toast if requested
      if (showToast) {
        toast.success('Logged out successfully');
      }
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.updateUser(user.id, userData);
      
      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Profile updated successfully');
        return { success: true, user: response.data };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRoleDashboardPath = (role = user?.role) => {
    switch (role) {
      case 'student':
        return '/student';
      case 'teacher':
        return '/teacher';
      case 'parent':
        return '/parent';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    getRoleDashboardPath,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
