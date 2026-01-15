import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (sessionUser) {
        const {  profile } = await supabase
          .from('user_profiles')
          .select('preferred_language')
          .eq('id', sessionUser.id)
          .single();

        let lang = 'en';
        if (profile) {
          lang = profile.preferred_language || 'en';
        } else {
          await supabase
            .from('user_profiles')
            .insert({ id: sessionUser.id, preferred_language: 'en' });
        }

        setUser(sessionUser);
      }

      setLoading(false);

      const {  listener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const {  profile } = await supabase
              .from('user_profiles')
              .select('preferred_language')
              .eq('id', session.user.id)
              .single();

            setUser(session.user);
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        listener.subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = () => supabase.auth.signOut();

  const updatePreferredLanguage = async (lang: string) => {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ preferred_language: lang, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  };

  return { 
    user, 
    loading, 
    login, 
    signup, 
    logout, 
    preferredLanguage: user ? (async () => {
      const {  profile } = await supabase
        .from('user_profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single();
      return profile?.preferred_language || 'en';
    })() : 'en',
    updatePreferredLanguage 
  };
}
