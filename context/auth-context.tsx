'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

interface AuthContextType {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const bcRef = useRef<BroadcastChannel | null>(null);
  const mountedRef = useRef(true);

  // Flag per aggiornamento silenzioso
  const silentRefreshRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const checkAuth = useCallback(async (silent = false): Promise<void> => {
    if (silent) silentRefreshRef.current = true;
    setIsLoading(true);
    try {
      const { userId: newUserId, email: newEmail } = await auth();

      if (!mountedRef.current) return;

      // Aggiorna solo se cambia realmente
      setUserId(prev => prev !== newUserId ? newUserId : prev);
      setEmail(prev => prev !== newEmail ? newEmail : prev);
      setIsAuthenticated(prev => prev !== !!newUserId ? !!newUserId : prev);

    } catch {
      if (!mountedRef.current) return;

      setUserId(null);
      setEmail(null);
      setIsAuthenticated(false);

    } finally {
      if (mountedRef.current) setIsLoading(false);
      silentRefreshRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bcRef.current = new BroadcastChannel('auth');
        bcRef.current.onmessage = (ev) => {
          if (ev.data === 'signIn' || ev.data === 'refresh') {
            checkAuth(true); // silent refresh
          } else if (ev.data === 'signOut') {
            setUserId(null);
            setEmail(null);
            setIsAuthenticated(false);
            localStorage.setItem('passwordAuthorized', 'false');
            if (window.location.pathname !== '/sign-in') router.push('/sign-in');
          }
        };
      } catch (err) {
        console.error('[Auth] BroadcastChannel error:', err);
      }
    }

    // Controllo auth iniziale
    checkAuth();

    return () => { try { bcRef.current?.close(); } catch { } };
  }, [checkAuth, router]);

  const signIn = async (emailArg: string, password: string, redirectTo = '/') => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailArg, password }),
      });

      const data = await res.json().catch(() => null);

      if (data?.success) {
        await checkAuth();
        try { bcRef.current?.postMessage('signIn'); } catch {}
        localStorage.setItem('passwordAuthorized', 'true');
        router.push(redirectTo); // client routing, niente full reload
        return { success: true };
      }

      return { success: false, error: data?.error || 'Errore login' };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUserId(null);
      setEmail(null);
      setIsAuthenticated(false);
      localStorage.setItem('passwordAuthorized', 'false');
      try { bcRef.current?.postMessage('signOut'); } catch {}
      if (window.location.pathname !== '/sign-in') router.push('/sign-in');
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/refresh', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => null);

      if (data?.success) {
        // Silent checkAuth per evitare re-render e reload pagina
        await checkAuth(true);
        try { bcRef.current?.postMessage('refresh'); } catch {}
      } else {
        await signOut();
      }
    } catch (err) {
      await signOut();
    }
  }, [checkAuth]);

  // Refresh automatico ogni 10 minuti in background
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isLoading) {
        refreshSession();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, refreshSession]);

  return (
    <AuthContext.Provider value={{ userId, email, isAuthenticated, isLoading, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}