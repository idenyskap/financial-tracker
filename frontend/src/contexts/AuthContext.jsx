import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { setToken, removeToken, getToken } from '../services/api';
import { AuthContext } from './contexts';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getProfile();
      setUser(response.data);
    } catch (error) {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);

      if (response.data.requiresTwoFactor) {
        setRequires2FA(true);
        return {
          success: false,
          requires2FA: true,
          tempCredentials: credentials
        };
      }

      if (response.data.token) {
        setToken(response.data.token);
      }

      await loadUser();

      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      let errorMessage = 'Login failed';

      if (data?.fieldErrors) {
        const firstError = Object.values(data.fieldErrors)[0];
        errorMessage = firstError || data.message;
      } else if (data?.message) {
        errorMessage = data.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);

      if (response.data.token) {
        setToken(response.data.token);
      }

      await loadUser();
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      let errorMessage = 'Registration failed';

      if (data?.fieldErrors) {
        const firstError = Object.values(data.fieldErrors)[0];
        errorMessage = firstError || data.message;
      } else if (data?.message) {
        errorMessage = data.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      setUser(null);
      setRequires2FA(false);
    }
  };

  const loginWithToken = async (token) => {
    setToken(token);
    await loadUser();
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    requires2FA,
    setRequires2FA,
    loadUser,
    loginWithToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
