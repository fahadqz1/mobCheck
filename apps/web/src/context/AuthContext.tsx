import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { api, SESSION_EXPIRED_EVENT } from '@/lib/client';

export type ClientUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: 'CUSTOMER' | 'SELLER' | 'SHOP_OWNER' | 'INSPECTOR' | 'SUPPORT' | 'OPS_ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
};

type AuthState = {
  user: ClientUser | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  setUser: (user: ClientUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const SYNC_KEY = 'mobcheck:auth-sync';

export function AuthProvider({ initialUser, children }: { initialUser?: ClientUser | null; children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<ClientUser | null>(initialUser ?? null);
  const [status, setStatus] = useState<AuthState['status']>(
    initialUser === undefined ? 'loading' : initialUser ? 'authenticated' : 'anonymous'
  );

  const setUser = useCallback((next: ClientUser | null) => {
    setUserState(next);
    setStatus(next ? 'authenticated' : 'anonymous');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: ClientUser | null }>('/api/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    }
  }, [setUser]);

  // Server-rendered pages hand over the user they already validated; keep context in step with them.
  useEffect(() => {
    if (initialUser !== undefined) setUser(initialUser);
  }, [initialUser, setUser]);

  useEffect(() => {
    if (initialUser === undefined) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    try {
      localStorage.setItem(SYNC_KEY, String(Date.now()));
    } catch {
      // storage unavailable
    }
    router.push('/');
  }, [router, setUser]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      const next = encodeURIComponent(router.asPath);
      router.push(`/auth/login?expired=1&next=${next}`);
    };
    // Another tab logged in or out: re-read the session from the server.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SYNC_KEY) refresh();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, [router, refresh, setUser]);

  const value = useMemo(() => ({ user, status, setUser, refresh, logout }), [user, status, setUser, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function notifyOtherTabs() {
  try {
    localStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch {
    // storage unavailable
  }
}

export const isAdmin = (role?: string) => role === 'SUPER_ADMIN' || role === 'OPS_ADMIN';
