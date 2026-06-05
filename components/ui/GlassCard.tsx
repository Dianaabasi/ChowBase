import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../../constants/theme';
import { useThemeStore } from '../../stores/themeStore';
import { useColorScheme } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 60 }: GlassCardProps) {
  const colors = useThemeColors();
  const systemScheme = useColorScheme();
  const { themeMode } = useThemeStore();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  // Light mode: use a clean white card (BlurView renders as ugly grey on Android light mode)
  if (!isDark) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.borderSubtle,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Dark mode: use the glass blur effect
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[
        styles.container,
        {
          borderColor: colors.borderGlass,
          backgroundColor: colors.bgGlass,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
});
