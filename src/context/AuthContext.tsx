import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, removeStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; target_role?: string; education?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  loginDemoUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err: any) {
      console.warn('Initial session check error:', err);
      // Only clear token if server explicitly rejected auth token (401/403)
      if (err.status === 401 || err.status === 403) {
        removeStoredToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    target_role?: string;
    education?: string;
  }) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updated });
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  // Demo user login for instant reviewer inspection
  const loginDemoUser = async () => {
    const demoEmail = 'alex.chen@berkeley.edu';
    const demoPassword = 'password123';

    try {
      await login(demoEmail, demoPassword);
    } catch (err: any) {
      // If user does not exist, register them and seed
      try {
        await register({
          email: demoEmail,
          password: demoPassword,
          full_name: 'Alex Chen',
          target_role: 'Software Engineer',
          education: 'UC Berkeley – B.S. in Computer Science',
        });
        await api.seedDemoData();
      } catch (regErr) {
        // If already registered, try login again
        await login(demoEmail, demoPassword);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        loginDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
