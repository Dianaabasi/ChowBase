import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Comment } from '../types';

export function useComments(recipeId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', recipeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url, is_verified)')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!recipeId,
    staleTime: 0, // Always load fresh
  });

  useEffect(() => {
    if (!recipeId) return;

    const channel = supabase
      .channel(`comments_${recipeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `recipe_id=eq.${recipeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipeId, queryClient]);

  return query;
}
