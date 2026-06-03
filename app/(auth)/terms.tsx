import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last Updated: June 2026</Text>
        
        <GlassCard style={styles.card}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            By accessing and using ChowBase, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>2. User Generated Content</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            You retain all ownership rights to the images, videos, recipes, and text you upload to ChowBase. We do not claim ownership of your content. By uploading, you grant ChowBase a non-exclusive, royalty-free license to display and distribute your content on the platform. We reserve the right to remove any content that violates community guidelines.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>3. Privacy</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Your use of the ChowBase application is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>4. Service Modifications</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ChowBase reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
          </Text>
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
  lastUpdated: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  heading: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  paragraph: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
});
