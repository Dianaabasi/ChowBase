import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });
}
