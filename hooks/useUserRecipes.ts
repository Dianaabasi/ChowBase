import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types';

export function useUserRecipes(userId?: string) {
  return useQuery({
    queryKey: ['userRecipes', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles!recipes_author_id_fkey(username, avatar_url, is_verified),
          likes(count),
          comments(count)
        `)
        .eq('author_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Recipe[];
    },
    enabled: !!userId,
  });
}
