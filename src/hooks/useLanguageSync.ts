import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadUserLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.language_preference && profile.language_preference !== i18n.language) {
          await i18n.changeLanguage(profile.language_preference);
        }
      }
    };

    loadUserLanguage();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserLanguage();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [i18n]);

  return null;
};
