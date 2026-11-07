import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initializationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;
    const client = getSupabaseClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setInitializationError(error.message);
      else setSession(data.session);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setInitializationError(error instanceof Error ? error.message : 'Impossible de restaurer la session.');
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    initializationError,
    signIn: async (email, password) => {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password, fullName) => {
      const { data, error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return { needsConfirmation: !data.session };
    },
    signOut: async () => {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
    },
  }), [session, loading, initializationError]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return c;
}
