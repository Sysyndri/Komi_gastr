'use client';

/**
 * AuthContext — глобальное состояние сессии.
 * Хранит пользователя, токены в localStorage и операции входа/выхода.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { authApi } from '@/lib/auth.api';
import { clearTokens } from '@/lib/api-client';
import { LoginRequest, RegisterRequest, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const me = await authApi.me();
        if (mounted) {
          setUser(me);
          localStorage.setItem('gk_user_role', me.role);
        }
      } catch {
        clearTokens();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    if (typeof window !== 'undefined') {
      restoreSession();
    } else {
      setIsLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    const data = await authApi.login(input);
    localStorage.setItem('gk_user_role', data.user.role);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const register = useCallback(async (input: RegisterRequest) => {
    const data = await authApi.register(input);
    localStorage.setItem('gk_user_role', data.user.role);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      localStorage.removeItem('gk_user_role');
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      setUser,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}