import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../constants/theme';

interface CategoryPillProps {
  title: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ title, isSelected = false, onPress }: CategoryPillProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        {
          backgroundColor: isSelected ? colors.brand.primary : colors.bgSecondary,
          borderColor: isSelected ? colors.brand.primary : colors.borderSubtle,
        }
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isSelected ? '#FFFFFF' : colors.textPrimary }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
});
