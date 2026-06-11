import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { useNotificationStore, NotificationSettings } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useModalStore } from '../../stores/modalStore';
import { 
  getPushEnabledLocal, 
  setPushEnabledLocal, 
  registerGlobalPushNotifications, 
  unregisterGlobalPushNotifications
} from '../../lib/pushNotifications';

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [isPushEnabled, setIsPushEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const { settings, updateSettings } = useNotificationStore();

  React.useEffect(() => {
    async function loadPushState() {
      const localVal = await getPushEnabledLocal();
      setIsPushEnabled(localVal);
      setIsLoading(false);
    }
    loadPushState();
  }, []);

  const togglePushNotifications = async () => {
    const newValue = !isPushEnabled;
    
    // 1. Optimistic local update
    setIsPushEnabled(newValue);
    await setPushEnabledLocal(newValue);

    try {
      if (newValue) {
        await registerGlobalPushNotifications();
      } else {
        await unregisterGlobalPushNotifications();
      }
    } catch (e) {
      // Revert on error
      setIsPushEnabled(!newValue);
      await setPushEnabledLocal(!newValue);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const SettingRow = ({ title, settingKey, isLast = false, disabled = false, overrideValue }: { title: string, settingKey: keyof NotificationSettings, isLast?: boolean, disabled?: boolean, overrideValue?: boolean }) => (
    <View style={[styles.row, !isLast && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }, disabled && { opacity: 0.5 }]}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{title}</Text>
      <Switch 
        value={overrideValue !== undefined ? overrideValue : settings[settingKey]} 
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: colors.bgSecondary, true: colors.brand.primary }}
        thumbColor="#FFF"
        disabled={disabled}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Push Notifications</Text>
        <GlassCard style={[styles.card, { marginBottom: 24 }]}>
          <View style={[styles.row, { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Allow Push Notifications</Text>
            <Switch 
              value={isPushEnabled} 
              onValueChange={togglePushNotifications}
              disabled={isLoading}
              trackColor={{ false: colors.bgSecondary, true: colors.brand.primary }}
              thumbColor="#FFF"
            />
          </View>
          
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>In-App Notifications</Text>
        <GlassCard style={styles.card}>
          <SettingRow title="Allow Notifications" settingKey="pushAll" />
          <SettingRow title="New Followers" settingKey="newFollowers" disabled={!settings.pushAll} overrideValue={!settings.pushAll ? false : undefined} />
          <SettingRow title="Recipe Likes" settingKey="recipeLikes" disabled={!settings.pushAll} overrideValue={!settings.pushAll ? false : undefined} />
          <SettingRow title="Recipe Comments" settingKey="recipeComments" isLast disabled={!settings.pushAll} overrideValue={!settings.pushAll ? false : undefined} />
        </GlassCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 32 },
  title: { fontFamily: 'Sora-Bold', fontSize: 18 },
  content: { padding: 16, paddingBottom: 60 },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
  },
});
