import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SealCheck } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';

interface BadgeProps {
  label?: string;
  variant: 'verified' | 'pro' | 'category';
  style?: ViewStyle | ViewStyle[];
}

export function Badge({ label, variant, style }: BadgeProps) {
  const colors = useThemeColors();

  if (variant === 'verified') {
    return (
      <View style={[styles.verifiedBadge, style]}>
        <SealCheck size={14} color="#FFF" weight="fill" />
        <Text style={styles.verifiedText}>Verified Chef</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }, style]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6', // Blue for verified
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: '#FFF',
    fontFamily: 'Sora-SemiBold',
    fontSize: 10,
  },
});
