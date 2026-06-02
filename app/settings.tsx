import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, SignOut, User, Bell, Shield, Question } from 'phosphor-react-native';
import { useThemeColors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { GlassCard } from '../components/ui/GlassCard';
import { useModalStore } from '../stores/modalStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const clearUser = useAuthStore((s) => s.clearUser);

  const handleLogout = async () => {
    useModalStore.getState().showAlert({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      showCancel: true,
      isDestructive: true,
      onConfirm: async () => {
        await supabase.auth.signOut();
        clearUser();
        router.replace('/(auth)/welcome');
      }
    });
  };

  const SettingRow = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.rowLeft}>
        <Icon size={24} color={colors.textSecondary} />
        <Text style={[styles.rowText, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.brand.primary }]}>Account</Text>
        <GlassCard style={styles.card}>
          <SettingRow icon={User} title="Edit Profile" />
          <SettingRow icon={Bell} title="Notifications" />
          <SettingRow icon={Shield} title="Privacy & Security" />
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.brand.primary }]}>Support</Text>
        <GlassCard style={styles.card}>
          <SettingRow icon={Question} title="Help Center" />
          <SettingRow icon={Question} title="About ChowBase" />
        </GlassCard>

        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.error, backgroundColor: 'rgba(255, 59, 48, 0.1)' }]} 
          onPress={handleLogout}
        >
          <SignOut size={20} color={colors.error} />
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
  backBtn: { padding: 4 },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
    marginLeft: 12,
  },
  arrow: {
    fontSize: 24,
    fontFamily: 'DM-Sans',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
  },
  logoutText: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
});
