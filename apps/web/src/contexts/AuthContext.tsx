'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken } from '../lib/api';

interface User {
  name: string;
  role: 'client' | 'barber' | 'shop_owner';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = (token: string, userData: User) => {
    setAccessToken(token); // Update interceptor
    setAccessTokenState(token); // Update React state
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      router.push('/login');
    }
  };

  // Initial silent refresh
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (mounted) {
          setAccessToken(data.accessToken);
          setAccessTokenState(data.accessToken);
          // Currently /refresh only returns accessToken. 
          // If we need user details, we should update /refresh to return user: {name, role}
          // Or we fetch /me. We will rely on /refresh for now.
          if (data.user) {
             setUser(data.user);
          }
        }
      } catch (e) {
        // No valid session, stay logged out
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for forced logouts from the interceptor
  useEffect(() => {
    const handleForcedLogout = () => {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, accessToken: accessTokenState, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
