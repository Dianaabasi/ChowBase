import React from 'react';
import { StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 60 }: GlassCardProps) {
  const colors = useThemeColors();
  const scheme = useColorScheme();

  return (
    <BlurView
      intensity={intensity}
      tint={scheme === 'dark' ? 'dark' : 'light'}
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
