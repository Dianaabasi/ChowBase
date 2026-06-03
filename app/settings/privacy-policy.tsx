import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last Updated: June 2026</Text>
        
        <GlassCard style={styles.card}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>1. Information We Collect</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We collect information you provide directly to us, such as when you create or modify your account, upload recipes, or communicate with us. This may include your name, email address, profile picture, and any dietary preferences you save.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>2. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We use the information we collect to provide, maintain, and improve our services. Your dietary preferences are used to tailor recipe recommendations and enhance ChowAI interactions.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>3. User Content & Media</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Any images, videos, or recipes you upload remain your intellectual property. We only process and store this media to provide the service to you and other users.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>4. Information Sharing</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We do not sell your personal data. We may share information with third-party vendors and service providers that perform services on our behalf, such as cloud storage.
          </Text>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>5. Data Security</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
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
