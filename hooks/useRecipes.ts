import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRecipes(category?: string, feedFilter: 'all' | 'following' = 'all', userId?: string) {
  return useInfiniteQuery({
    queryKey: ["recipes", category, feedFilter, userId],
    queryFn: async ({ pageParam = 0 }) => {
      let followingIds: string[] = [];
      
      if (feedFilter === 'following' && userId) {
        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        
        if (followsError) throw followsError;
        followingIds = followsData.map(f => f.following_id);
        
        if (followingIds.length === 0) {
          return [];
        }
      }
      let query = supabase
        .from("recipes")
        .select("*, profiles!recipes_author_id_fkey(username, avatar_url, is_verified), likes(count), comments(count), recipe_steps(*)")
        .eq("status", "published");
      
      if (category) {
        query = query.eq("category", category);
      }
      
      if (feedFilter === 'following' && followingIds.length > 0) {
        query = query.in("author_id", followingIds);
      }
        
      const { data, error } = await query
        .range(pageParam, pageParam + 9)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length === 10 ? pages.length * 10 : undefined,
    initialPageParam: 0,
  });
}
