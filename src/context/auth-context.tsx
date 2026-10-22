'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/actions/auth';

interface AuthContextType {
  user: User | null;
  currentUser: User;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isAdminOptIn: boolean;
  setIsAdminOptIn: (optIn: boolean) => void;
  setRole: (role: UserRole) => void;
  availableUsers: User[];
  switchUser: (user: User) => void;
}

const GUEST_USER: User = {
  id: '',
  email: '',
  name: '',
  role: 'viewer',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Try reading synchronously from cookie on client mount to avoid layout shift
  const [user, setUser] = useState<User | null>(() => {
    if (typeof document !== 'undefined') {
      const cookieVal = getCookie('ultrix_session');
      if (cookieVal) {
        try {
          return JSON.parse(cookieVal) as User;
        } catch {}
      }
    }
    return null;
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isAdminOptIn, setIsAdminOptIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncSession = useCallback(async () => {
    try {
      const supabase = createClient();

      // 1. Fetch available staff users from DB
      const { data: dbUsers } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (dbUsers && dbUsers.length > 0) {
        setAvailableUsers(dbUsers as User[]);
      }

      // 2. Check Supabase Auth active session
      const { data: authData } = await supabase.auth.getSession();
      const authEmail = authData?.session?.user?.email;

      if (authEmail) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .ilike('email', authEmail)
          .maybeSingle();

        if (dbUser) {
          const matchedUser = dbUser as User;
          setUser(matchedUser);
          setCookie('ultrix_session', JSON.stringify(matchedUser));
          if (typeof window !== 'undefined') {
            localStorage.setItem('ultrix_session', JSON.stringify(matchedUser));
          }
          setIsLoading(false);
          return;
        }
      }

      // 3. Check cookie / localStorage session
      const rawCookie = getCookie('ultrix_session');
      const rawStorage = typeof window !== 'undefined' ? localStorage.getItem('ultrix_session') : null;
      const sessionStr = rawCookie || rawStorage;

      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr) as User;
          if (parsed && (parsed.id || parsed.email)) {
            // Re-validate against fresh users table
            let query = supabase.from('users').select('*');
            if (parsed.id) {
              query = query.eq('id', parsed.id);
            } else {
              query = query.ilike('email', parsed.email);
            }
            const { data: freshUser } = await query.maybeSingle();
            const activeUser = (freshUser as User) || parsed;

            setUser(activeUser);
            setCookie('ultrix_session', JSON.stringify(activeUser));
            if (typeof window !== 'undefined') {
              localStorage.setItem('ultrix_session', JSON.stringify(activeUser));
            }
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      // 4. No session found -> Do NOT set any mock default user
      setUser(null);
    } catch (err) {
      console.warn('Session sync note:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncSession();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .ilike('email', session.user.email)
          .maybeSingle();
        if (dbUser) {
          login(dbUser as User);
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    const handleAuthEvent = () => {
      syncSession();
    };
    window.addEventListener('ultrix-auth-change', handleAuthEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('ultrix-auth-change', handleAuthEvent);
    };
  }, [syncSession]);

  const login = (newUser: User) => {
    setUser(newUser);
    setCookie('ultrix_session', JSON.stringify(newUser));
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultrix_session', JSON.stringify(newUser));
      window.dispatchEvent(new CustomEvent('ultrix-auth-change'));
    }
    router.refresh();
  };

  const logout = async () => {
    setUser(null);
    deleteCookie('ultrix_session');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ultrix_session');
      window.dispatchEvent(new CustomEvent('ultrix-auth-change'));
    }
    try {
      await logoutUser();
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push('/login');
    router.refresh();
  };

  const switchUser = (newUser: User) => {
    login(newUser);
  };

  const setRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      login(updated);
    }
  };

  const currentUser = user || GUEST_USER;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        isLoading,
        login,
        logout,
        isAdminOptIn,
        setIsAdminOptIn,
        setRole,
        availableUsers,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
