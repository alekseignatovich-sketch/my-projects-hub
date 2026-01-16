// src/lib/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Language } from './useI18n';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const {  { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user;

      if (sessionUser) {
        const {  profile } = await supabase
          .from('user_profiles')
          .select('preferred_language')
          .eq('id', sessionUser.id)
          .single();

        if (!profile) {
          await supabase
            .from('user_profiles')
            .insert({ id: sessionUser.id, preferred_language: 'en' });
        }

        setUser(sessionUser);
      }

      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  // ... остальные методы ...

  // ✅ НОВЫЙ МЕТОД: мгновенное обновление языка
  const setLanguage = async (lang: Language) => {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ preferred_language: lang })
      .eq('id', user.id);
    return lang;
  };

  const getPreferredLanguage = async (): Promise<Language> => {
    if (!user) return 'en';
    const {  profile } = await supabase
      .from('user_profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();
    return (profile?.preferred_language as Language) || 'en';
  };

  return { 
    user, 
    loading, 
    login, 
    signup, 
    logout, 
    getPreferredLanguage,
    setLanguage // ← экспортируем
  };
}
