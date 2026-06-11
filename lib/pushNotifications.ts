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



export async function registerGlobalPushNotifications(silent = false): Promise<string | null> {
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

    // Upsert into global device_push_tokens table
    const { error } = await supabase.from('device_push_tokens').upsert(
      { push_token: pushToken, is_active: true },
      { onConflict: 'push_token' }
    );

    if (error) throw error;
    
    // Save locally
    await setPushEnabledLocal(true);

    // Schedule daily local notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 11:00 AM — Morning reminder
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

    // 7:00 PM — Evening reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "What's for Dinner? 🍽️",
        body: "Need dinner inspiration? Browse recipes on ChowBase!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes ? Notifications.SchedulableTriggerInputTypes.DAILY : 'daily',
        hour: 19,
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

export async function unregisterGlobalPushNotifications(): Promise<void> {
  try {
    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch (err) {
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '1f0d0703-2484-4b7a-a723-f96aa2b5fcad';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId }).catch(() => null);
    
    if (tokenData?.data) {
      // Disable in global table
      await supabase.from('device_push_tokens').update({ 
        is_active: false 
      }).eq('push_token', tokenData.data);
    }

    await setPushEnabledLocal(false);

    if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    }
  } catch (e) {
    console.error('Error unregistering push notifications:', e);
  }
}

export async function syncPushStatus(): Promise<void> {
  try {
    const localVal = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
    if (localVal !== null) {
      const localPushEnabled = JSON.parse(localVal);
      if (localPushEnabled) {
        // Register token silently
        await registerGlobalPushNotifications(true);
      } else {
        // Unregister
        await unregisterGlobalPushNotifications();
      }
    }
  } catch (e) {
    console.error('Error syncing push status:', e);
  }
}

export async function linkDeviceTokenToProfile(userId: string): Promise<void> {
  try {
    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch (err) {
      return;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '1f0d0703-2484-4b7a-a723-f96aa2b5fcad';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId }).catch(() => null);
    
    if (tokenData?.data) {
      // Sync the global token to the user's profile so they receive personal notifications (likes, comments, etc)
      await supabase.from('profiles').update({ 
        expo_push_token: tokenData.data 
      }).eq('id', userId);
    }
  } catch (e) {
    console.error('Error linking device token to profile:', e);
  }
}
