import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from './supabase';
import { useModalStore } from '../stores/modalStore';

const PUSH_ENABLED_KEY = 'chowbase-push-enabled';

export async function getPushEnabledLocal(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
    return val !== null ? JSON.parse(val) : false;
  } catch (_) {
    return false;
  }
}

export async function setPushEnabledLocal(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_ENABLED_KEY, JSON.stringify(enabled));
  } catch (_) {}
}

export async function registerPushNotificationsLocalOnly(): Promise<void> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return;
  }
  try {
    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch (err) {
      return;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Cook! 👨‍🍳",
          body: "Hungry? Open ChowBase and try cooking something new today!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes ? Notifications.SchedulableTriggerInputTypes.DAILY : 'daily',
          hour: 11,
          minute: 0,
        },
      });
    }
  } catch (e) {
    console.warn('Failed to schedule local notifications:', e);
  }
}

export async function unregisterPushNotificationsLocalOnly(): Promise<void> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return;
  }
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {}
}

export async function registerPushNotificationsForUser(userId: string, silent = false): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      throw new Error('Must use physical device for Push Notifications');
    }
    
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      throw new Error('Push notifications are disabled in Expo Go. Use a development build.');
    }

    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch (err) {
      throw new Error('Push notifications failed to load.');
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      if (!silent) {
        useModalStore.getState().showAlert({
          title: 'Permission Denied',
          message: 'Please enable notifications in your phone settings to use this feature.',
        });
      }
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '1f0d0703-2484-4b7a-a723-f96aa2b5fcad';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;

    // Update DB profile
    const { error } = await supabase.from('profiles').update({ 
      push_enabled: true, 
      expo_push_token: pushToken 
    }).eq('id', userId);

    if (error) throw error;

    // Schedule local notification
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Cook! 👨‍🍳",
        body: "Hungry? Open ChowBase and try cooking something new today!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes ? Notifications.SchedulableTriggerInputTypes.DAILY : 'daily',
        hour: 11,
        minute: 0,
      },
    });

    return pushToken;
  } catch (e: any) {
    console.error('Error registering push notifications:', e);
    if (!silent) {
      const isFirebaseError = e.message?.includes('google-services') || e.message?.includes('FirebaseApp');
      const isSpecificError = e.message?.includes('Expo Go') || e.message?.includes('physical device') || e.message?.includes('failed to load') || e.message?.includes('Permission');
      const errorMessage = isFirebaseError 
        ? 'Firebase configuration is required to register for Push Notifications on Android standalone builds.'
        : isSpecificError
        ? e.message
        : 'Failed to update push notification settings. Please try again.';

      useModalStore.getState().showAlert({
        title: 'Push Setup Error',
        message: errorMessage,
      });
    }
    throw e;
  }
}

export async function unregisterPushNotificationsForUser(userId: string): Promise<void> {
  try {
    // Disable in Supabase
    await supabase.from('profiles').update({ 
      push_enabled: false,
      expo_push_token: null
    }).eq('id', userId);

    if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
      try {
        const Notifications = require('expo-notifications');
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (e) {}
    }
  } catch (e) {
    console.error('Error unregistering push notifications:', e);
  }
}

export async function syncPushStatus(userId: string | null): Promise<void> {
  if (!userId) return;

  try {
    const localVal = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
    if (localVal !== null) {
      const localPushEnabled = JSON.parse(localVal);
      if (localPushEnabled) {
        // Register token silently
        await registerPushNotificationsForUser(userId, true);
      } else {
        // Unregister
        await unregisterPushNotificationsForUser(userId);
      }
    } else {
      // First time checking settings. Let's see what DB profile has.
      const { data } = await supabase.from('profiles').select('push_enabled').eq('id', userId).single();
      if (data) {
        const dbPushEnabled = !!data.push_enabled;
        await AsyncStorage.setItem(PUSH_ENABLED_KEY, JSON.stringify(dbPushEnabled));
        if (dbPushEnabled) {
          await registerPushNotificationsForUser(userId, true);
        }
      }
    }
  } catch (e) {
    console.error('Error syncing push status:', e);
  }
}
