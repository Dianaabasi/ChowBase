import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  const [settings, setSettings] = useState({
    pushAll: true,
    newFollowers: true,
    recipeLikes: true,
    recipeComments: true,
    emailDigest: false,
    promotions: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ title, settingKey, isLast = false }: { title: string, settingKey: keyof typeof settings, isLast?: boolean }) => (
    <View style={[styles.row, !isLast && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{title}</Text>
      <Switch 
        value={settings[settingKey]} 
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: colors.bgSecondary, true: colors.brand.primary }}
        thumbColor="#FFF"
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
        <GlassCard style={styles.card}>
          <SettingRow title="Allow Push Notifications" settingKey="pushAll" />
          <SettingRow title="New Followers" settingKey="newFollowers" />
          <SettingRow title="Recipe Likes" settingKey="recipeLikes" />
          <SettingRow title="Recipe Comments" settingKey="recipeComments" isLast />
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Email Notifications</Text>
        <GlassCard style={styles.card}>
          <SettingRow title="Weekly Digest" settingKey="emailDigest" />
          <SettingRow title="Promotions & Offers" settingKey="promotions" isLast />
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
