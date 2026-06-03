import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useLike(recipeId: string, initialLikesCount: number = 0) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !recipeId) return;

    const checkLikeStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('likes')
          .select('*')
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setIsLiked(true);
        }
      } catch (e) {
        // Not liked
      } finally {
        setIsLoading(false);
      }
    };

    checkLikeStatus();
  }, [recipeId, user]);

  const toggleLike = async () => {
    if (!user) return; // Must be logged in

    const previousIsLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic UI
    setIsLiked(!previousIsLiked);
    setLikesCount(prev => prev + (previousIsLiked ? -1 : 1));

    try {
      if (previousIsLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ recipe_id: recipeId, user_id: user.id });
      }
    } catch (e) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousCount);
      console.error('Like toggle failed', e);
    }
  };

  return { isLiked, likesCount, toggleLike, isLoading };
}
