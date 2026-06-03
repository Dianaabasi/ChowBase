import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, Check } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

export default function CookingPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  const [dietary, setDietary] = useState({
    vegan: false,
    vegetarian: false,
    glutenFree: true,
    keto: false,
    halal: false,
  });

  const [allergies, setAllergies] = useState({
    nuts: false,
    dairy: true,
    shellfish: false,
  });

  const toggleDietary = (key: keyof typeof dietary) => {
    setDietary(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllergy = (key: keyof typeof allergies) => {
    setAllergies(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Cooking Preferences</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          We'll use these preferences to personalize your recipe recommendations and ChowAI suggestions.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dietary Restrictions</Text>
        <GlassCard style={styles.card}>
          {Object.entries(dietary).map(([key, value], index, arr) => (
            <View key={key} style={[styles.row, index !== arr.length - 1 && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Switch 
                value={value} 
                onValueChange={() => toggleDietary(key as any)}
                trackColor={{ false: colors.bgSecondary, true: colors.brand.primary }}
                thumbColor="#FFF"
              />
            </View>
          ))}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Allergies & Avoidances</Text>
        <GlassCard style={styles.card}>
          {Object.entries(allergies).map(([key, value], index, arr) => (
            <View key={key} style={[styles.row, index !== arr.length - 1 && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Switch 
                value={value} 
                onValueChange={() => toggleAllergy(key as any)}
                trackColor={{ false: colors.bgSecondary, true: colors.error }}
                thumbColor="#FFF"
              />
            </View>
          ))}
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
  description: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
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
