import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, loginUser, getCurrentUser } from '../api/auth';
import { queryClient } from '../lib/queryClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('bookleaf_token');
      const savedUser = localStorage.getItem('bookleaf_user');

      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // ignore JSON parse error
          }
        }

        // Verify and refresh user data from server (self-healing for database re-seeds)
        try {
          const profile = await getCurrentUser();
          if (profile?.user) {
            setUser(profile.user);
            localStorage.setItem('bookleaf_user', JSON.stringify(profile.user));
          }
        } catch {
          // Stale or invalid token, clean up
          setToken(null);
          setUser(null);
          localStorage.removeItem('bookleaf_token');
          localStorage.removeItem('bookleaf_user');
          queryClient.clear();
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string = 'BookLeaf@123') => {
    queryClient.clear();
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('bookleaf_token', data.token);
    localStorage.setItem('bookleaf_user', JSON.stringify(data.user));
  };

  const logout = () => {
    queryClient.clear();
    setToken(null);
    setUser(null);
    localStorage.removeItem('bookleaf_token');
    localStorage.removeItem('bookleaf_user');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    isAuthor: user?.role === 'AUTHOR',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
