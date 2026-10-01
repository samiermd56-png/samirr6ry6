import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/index.ts';
import { api, getUserToken, setUserToken, removeUserToken, getAdminToken, setAdminToken, removeAdminToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  adminToken: string | null;
  isAdminLoggedIn: boolean;
  adminLogin: (password: string) => Promise<void>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminToken, setAdminTokenState] = useState<string | null>(getAdminToken());

  const refreshUser = useCallback(async () => {
    const token = getUserToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        removeUserToken();
        setUser(null);
      }
    } catch {
      removeUserToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await api.login({ usernameOrEmail, password });
    if (res.success && res.token && res.user) {
      setUserToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.register({ username, email, password });
    if (res.success && res.token && res.user) {
      setUserToken(res.token);
      setUser(res.user);
      return res.message;
    }
    return '';
  };

  const logout = () => {
    removeUserToken();
    setUser(null);
  };

  const adminLogin = async (password: string) => {
    const res = await api.adminLogin(password);
    if (res.success && res.token) {
      setAdminToken(res.token);
      setAdminTokenState(res.token);
    }
  };

  const adminLogout = () => {
    removeAdminToken();
    setAdminTokenState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        adminToken,
        isAdminLoggedIn: !!adminToken,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
