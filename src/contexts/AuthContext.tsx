import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { isDemoMode } from '@/lib/appMode';
import {
  getDemoProfile,
  getDemoSession,
  registerDemoAccount,
  signInDemo,
  signOutDemo,
} from '@/lib/demoStore';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequestId = useRef(0);

  useEffect(() => {
    if (isDemoMode) {
      try {
        const demoUser = getDemoSession();
        setUser(demoUser);
        setSession(demoUser ? { user: demoUser } : null);
        setProfile(demoUser ? getDemoProfile(demoUser.id) : null);
      } catch (error) {
        console.error('Unable to restore the local demo session:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    let currentUserId: string | null = null;
    let profileTimeout: number | undefined;

    const loadProfile = async (userId: string, requestId: number) => {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (active && requestId === profileRequestId.current) setProfile(data);
      } catch (error) {
        console.error('Unable to load the signed-in user profile:', error);
        if (active && requestId === profileRequestId.current) setProfile(null);
      } finally {
        if (active && requestId === profileRequestId.current) setLoading(false);
      }
    };

    const { data: { subscription } } = client.auth.onAuthStateChange((event, supabaseSession) => {
      const nextUserId = supabaseSession?.user.id ?? null;
      const userChanged = nextUserId !== currentUserId;
      currentUserId = nextUserId;
      const authUser = supabaseSession?.user
        ? { id: supabaseSession.user.id, email: supabaseSession.user.email ?? '' }
        : null;
      setSession(authUser ? { user: authUser } : null);
      setUser(authUser);

      if (!supabaseSession) {
        profileRequestId.current += 1;
        setProfile(null);
        setLoading(false);
      } else if (userChanged || event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const requestId = ++profileRequestId.current;
        setProfile(null);
        setLoading(true);
        if (profileTimeout !== undefined) window.clearTimeout(profileTimeout);
        profileTimeout = window.setTimeout(() => {
          void loadProfile(supabaseSession.user.id, requestId);
        }, 0);
      }
    });

    return () => {
      active = false;
      profileRequestId.current += 1;
      if (profileTimeout !== undefined) window.clearTimeout(profileTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      const demoUser = await signInDemo(email, password);
      setUser(demoUser);
      setSession({ user: demoUser });
      setProfile(getDemoProfile(demoUser.id));
      return;
    }
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isDemoMode) {
      await registerDemoAccount(email, password, fullName);
      return;
    }
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'CITOYEN' } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isDemoMode) {
      signOutDemo();
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = profile?.role === 'ADMIN';
  const isAgent = profile?.role === 'AGENT' || profile?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, isAgent, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
