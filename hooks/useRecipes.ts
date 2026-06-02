import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRecipes(category?: string) {
  return useInfiniteQuery({
    queryKey: ["recipes", category],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("recipes")
        .select("*, profiles(username, avatar_url, is_verified), likes(count)")
        .eq("status", "published");
      
      if (category) {
        query = query.eq("category", category);
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
