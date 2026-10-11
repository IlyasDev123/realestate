'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ApiUser } from '@/lib/api-types';

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  updateUser: (user: ApiUser) => void;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'haven_token';
const USER_KEY = 'haven_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, isLoading: true });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as ApiUser;
        setState({ user, token, isLoading: false });
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setState((s) => ({ ...s, isLoading: false }));
  }, []);

  const login = useCallback((token: string, user: ApiUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isLoading: false });
  }, []);

  const updateUser = useCallback((user: ApiUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState((s) => ({ ...s, user }));
  }, []);

  const role = state.user?.role ?? '';
  const isAdmin = role === 'super_admin' || role === 'manager';
  const isAgent = role === 'agent';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, isAdmin, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
