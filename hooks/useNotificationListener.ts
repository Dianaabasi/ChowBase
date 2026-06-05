import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

export function useNotificationListener() {
  const { user } = useAuthStore();
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    if (!user?.id) return;

    // Realtime channel for user's own notifications
    const channel = supabase.channel(`public:notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          // Fetch actor profile for display
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.actor_id)
            .single();

          if (profile) {
            addNotification({
              id: payload.new.id,
              type: payload.new.type,
              actorName: profile.username || 'Someone',
              actorUsername: profile.username || undefined,
              actorAvatar: profile.avatar_url,
              recipeId: payload.new.recipe_id,
              recipeTitle: payload.new.recipe_title,
              read: payload.new.read,
              created_at: payload.new.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addNotification]);
}
