import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment';
  actorName: string;
  actorAvatar?: string | null;
  actorUsername?: string;
  recipeId?: string;
  recipeTitle?: string;
  read: boolean;
  created_at: string;
}

export interface NotificationSettings {
  pushAll: boolean;
  newFollowers: boolean;
  recipeLikes: boolean;
  recipeComments: boolean;
}

interface NotificationState {
  userId: string | null;
  notifications: Notification[];
  settings: NotificationSettings;
  hasUnread: boolean;
  
  setUserId: (id: string | null) => Promise<void>;
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
}

const defaultSettings: NotificationSettings = {
  pushAll: true,
  newFollowers: true,
  recipeLikes: true,
  recipeComments: true,
};

const settingsKey = (userId: string) => `chowbase-notifications-settings-${userId}`;

const saveSettings = async (userId: string, settings: NotificationSettings) => {
  try {
    await AsyncStorage.setItem(settingsKey(userId), JSON.stringify(settings));
  } catch (_) {}
};

const loadSettings = async (userId: string): Promise<NotificationSettings> => {
  try {
    const raw = await AsyncStorage.getItem(settingsKey(userId));
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch (_) {
    return defaultSettings;
  }
};

const mapNotification = (dbNotif: any): Notification => ({
  id: dbNotif.id,
  type: dbNotif.type,
  actorName: dbNotif.profiles?.username || 'Someone',
  actorUsername: dbNotif.profiles?.username || undefined,
  actorAvatar: dbNotif.profiles?.avatar_url,
  recipeId: dbNotif.recipe_id,
  recipeTitle: dbNotif.recipe_title,
  read: dbNotif.read,
  created_at: dbNotif.created_at,
});

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  userId: null,
  notifications: [],
  settings: defaultSettings,
  hasUnread: false,

  setUserId: async (id) => {
    if (id) {
      const settings = await loadSettings(id);
      set({ userId: id, settings });
      // Load notifications from DB
      await get().loadNotifications();
    } else {
      set({ userId: null, notifications: [], settings: defaultSettings, hasUnread: false });
    }
  },

  loadNotifications: async () => {
    const { userId } = get();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          recipe_id,
          recipe_title,
          read,
          created_at,
          recipient_id,
          actor_id,
          profiles!notifications_actor_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(mapNotification);
      const hasUnread = mapped.some(n => !n.read);

      set({ notifications: mapped, hasUnread });
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  },

  addNotification: (newNotif) => {
    const { settings } = get();
    
    // Check settings before adding to UI state
    if (!settings.pushAll) return;
    if (newNotif.type === 'follow' && !settings.newFollowers) return;
    if (newNotif.type === 'like' && !settings.recipeLikes) return;
    if (newNotif.type === 'comment' && !settings.recipeComments) return;

    set((state) => {
      // Avoid duplicate realtime inserts in store
      if (state.notifications.some(n => n.id === newNotif.id)) return state;
      const updated = [newNotif, ...state.notifications];
      return { notifications: updated, hasUnread: true };
    });
  },

  markAllRead: async () => {
    const { userId, notifications } = get();
    if (!userId) return;

    // Optimistic UI update
    set({ 
      notifications: notifications.map(n => ({ ...n, read: true })), 
      hasUnread: false 
    });

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', userId)
        .eq('read', false);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  },

  clearAll: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ notifications: [], hasUnread: false });

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', userId);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  },

  deleteNotification: async (id) => {
    const { userId, notifications } = get();
    if (!userId) return;

    const updated = notifications.filter(n => n.id !== id);
    const hasUnread = updated.some(n => !n.read);
    set({ notifications: updated, hasUnread });

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  },

  updateSettings: async (newSettings) => {
    const { userId, settings } = get();
    if (!userId) return;

    const updated = { ...settings, ...newSettings };
    set({ settings: updated });
    await saveSettings(userId, updated);
  },
}));
