import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>About ChowBase</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/chowbase_logo.svg')} 
            style={styles.logoImage} 
            contentFit="contain"
          />
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>Version 1.0.8</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.missionTitle, { color: colors.textPrimary }]}>Our Mission</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ChowBase is built for culinary enthusiasts, home cooks, and professional chefs alike. 
            Our mission is to bring people together through the power of shared recipes, step-by-step cooking modes, and community interaction.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            With integrated AI features like ChowAI, we aim to make cooking more accessible, helping you adapt recipes on the fly and never wonder about ingredient substitutions again.
          </Text>
        </GlassCard>

        <Text style={[styles.copyright, { color: colors.textMuted }]}>
          © 2026 ChowBase Inc. All rights reserved.
        </Text>
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
  content: { padding: 16, paddingBottom: 60, alignItems: 'center' },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  appVersion: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    width: '100%',
  },
  missionTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    marginBottom: 12,
  },
  paragraph: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  copyright: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
    marginTop: 40,
  },
});
