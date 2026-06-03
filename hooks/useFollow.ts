import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useFollow(targetProfileId?: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: isFollowing = false, isLoading: isChecking } = useQuery({
    queryKey: ['follow', targetProfileId, user?.id],
    queryFn: async () => {
      if (!user || !targetProfileId || user.id === targetProfileId) return false;
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetProfileId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user && !!targetProfileId,
  });

  const { data: stats = { followers: 0, following: 0 } } = useQuery({
    queryKey: ['followStats', targetProfileId],
    queryFn: async () => {
      if (!targetProfileId) return { followers: 0, following: 0 };
      
      const [followersReq, followingReq] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetProfileId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetProfileId)
      ]);

      return {
        followers: followersReq.count || 0,
        following: followingReq.count || 0,
      };
    },
    enabled: !!targetProfileId,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !targetProfileId) throw new Error('Missing user or target');
      
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetProfileId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetProfileId });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['follow', targetProfileId, user?.id] });
      const prevFollow = queryClient.getQueryData(['follow', targetProfileId, user?.id]);
      
      queryClient.setQueryData(['follow', targetProfileId, user?.id], !isFollowing);
      
      // Optimistic stats update
      queryClient.setQueryData(['followStats', targetProfileId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          followers: old.followers + (isFollowing ? -1 : 1)
        };
      });

      return { prevFollow };
    },
    onError: (err, variables, context) => {
      if (context?.prevFollow !== undefined) {
        queryClient.setQueryData(['follow', targetProfileId, user?.id], context.prevFollow);
        // Revert stats
        queryClient.setQueryData(['followStats', targetProfileId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            followers: old.followers + (isFollowing ? 1 : -1) // Reverse optimistic
          };
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', targetProfileId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followStats', targetProfileId] });
    }
  });

  return {
    isFollowing,
    isChecking,
    followersCount: stats.followers,
    followingCount: stats.following,
    toggleFollow: () => toggleFollow.mutate(),
    isToggling: toggleFollow.isPending
  };
}
