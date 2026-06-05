import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { GreenButton } from '../../components/ui/GreenButton';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'phosphor-react-native';
import { useModalStore } from '../../stores/modalStore';

const PREFERENCE_OPTIONS = [
  'Nigerian Local Soups',
  'Pastries & Snacks',
  'Quick Meals (Under 30m)',
  'Vegan / Plant-based',
  'Healthy & Low Calorie',
  'Rice Dishes',
  'Meat & Poultry',
];

export default function PreferencesScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  const togglePreference = (pref: string) => {
    setSelected(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleFinish = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username: user.username,
          preferences: selected
        });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { has_onboarded: true }
      });

      setUser({ ...user, has_onboarded: true });
      // Navigation is handled by the _layout.tsx guard based on user state
    } catch (e: any) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message || 'Failed to save preferences'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader title="Preferences" />
      
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>What do you like?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select the types of recipes you want to see more of in your feed.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {PREFERENCE_OPTIONS.map((pref) => {
            const isSelected = selected.includes(pref);
            return (
              <TouchableOpacity
                key={pref}
                onPress={() => togglePreference(pref)}
                activeOpacity={0.7}
                style={[
                  styles.optionPill,
                  { 
                    backgroundColor: isSelected ? colors.brand.primary : colors.bgSecondary,
                    borderColor: isSelected ? colors.brand.primary : colors.borderSubtle
                  }
                ]}
              >
                {isSelected && <Check size={16} color="#FFF" weight="bold" style={styles.checkIcon} />}
                <Text style={[
                  styles.optionText,
                  { color: isSelected ? '#FFF' : colors.textPrimary }
                ]}>
                  {pref}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: colors.bgPrimary }]}>
        <GreenButton 
          title={loading ? "Saving..." : "Finish Setup"} 
          onPress={handleFinish} 
          disabled={loading || selected.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  checkIcon: {
    marginRight: 6,
  },
  optionText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
