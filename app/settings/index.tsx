import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, SignOut, Bell, Shield, Question, CookingPot, FileText, Info, CaretRight, Moon } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { useModalStore } from '../../stores/modalStore';
import { useProfile } from '../../hooks/useProfile';

const APP_VERSION = "1.0.0";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { themeMode, setThemeMode } = useThemeStore();
  const { user, clearUser } = useAuthStore();
  const { data: profile } = useProfile(user?.username || '');

  const handleLogout = () => {
    useModalStore.getState().showAlert({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      showCancel: true,
      isDestructive: true,
      onConfirm: () => {
        // Clear state and navigate instantly — signOut fires in background
        clearUser();
        router.replace('/(auth)/welcome');
        supabase.auth.signOut();
      }
    });
  };

  const SettingRow = ({ icon: Icon, title, subtitle, onPress, isLast = false }: any) => (
    <TouchableOpacity 
      style={[styles.row, !isLast && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.bgSecondary }]}>
          <Icon size={22} color={colors.textPrimary} />
        </View>
        <View style={styles.rowTextContainer}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <CaretRight size={20} color={colors.textMuted} weight="bold" />
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon: Icon, title, subtitle, value, onValueChange, isLast = false }: any) => (
    <View style={[styles.row, !isLast && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.bgSecondary }]}>
          <Icon size={22} color={colors.textPrimary} />
        </View>
        <View style={styles.rowTextContainer}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderSubtle, true: colors.brand.primary }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Account & Profile */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account & Profile</Text>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push(`/profile/${profile?.username || user?.username || 'edit'}`)}
        >
          <GlassCard style={styles.profileCard}>
            <Avatar url={profile?.avatar_url} name={profile?.username || user?.username || 'User'} size={56} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {profile?.full_name || profile?.username || user?.username || 'ChowBase Chef'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email || 'View Profile'}
              </Text>
            </View>
            <CaretRight size={20} color={colors.textMuted} weight="bold" />
          </GlassCard>
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
        <GlassCard style={styles.card}>
          <SettingRow 
            icon={CookingPot} 
            title="Cooking Preferences" 
            subtitle="Dietary restrictions, allergies" 
            onPress={() => router.push('/settings/cooking-preferences')}
          />
          <SettingRow 
            icon={Bell} 
            title="Notifications" 
            subtitle="Push notifications, email alerts" 
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingRow 
            icon={Shield} 
            title="Privacy & Security" 
            subtitle="Change password, delete account" 
            onPress={() => router.push('/settings/privacy')}
          />
          <ToggleRow 
            icon={Moon} 
            title="Dark Mode" 
            subtitle="Switch to dark theme" 
            value={themeMode === 'dark'}
            onValueChange={(val: boolean) => setThemeMode(val ? 'dark' : 'light')}
            isLast
          />
        </GlassCard>

        {/* Support */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <GlassCard style={styles.card}>
          <SettingRow 
            icon={Question} 
            title="Help & FAQs" 
            subtitle="Find answers to common questions" 
            onPress={() => router.push('/settings/help')}
          />
          <SettingRow 
            icon={Info} 
            title="About ChowBase" 
            subtitle="Learn more about our mission" 
            onPress={() => router.push('/settings/about')}
          />
          <SettingRow 
            icon={FileText} 
            title="Terms of Service" 
            subtitle="Rules and guidelines" 
            onPress={() => router.push('/settings/terms')}
          />
          <SettingRow 
            icon={Shield} 
            title="Privacy Policy" 
            subtitle="How we protect your data" 
            onPress={() => router.push('/settings/privacy-policy')}
            isLast
          />
        </GlassCard>

        {/* App Info & Logout */}
        <View style={styles.footerInfo}>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>
            ChowBase Version {APP_VERSION}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.error, backgroundColor: 'rgba(255, 59, 48, 0.05)' }]} 
          onPress={handleLogout}
        >
          <SignOut size={20} color={colors.error} weight="bold" />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

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
  backBtn: { 
    padding: 4,
    width: 32,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
  },
  rowSubtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
    marginTop: 2,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  appVersion: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
