import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId) {
      if (!userId) {
        if (mounted) setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .eq('id', userId)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error('[AuthContext] gagal memuat profil:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      await loadProfile(data.session?.user?.id);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
      loadProfile(newSession?.user?.id);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
      isSuperAdmin: profile?.role === 'super_admin',
      loading,
      signIn: (email, password) =>
        supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}