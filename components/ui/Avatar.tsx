import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '../../constants/theme';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ url, name, size = 40 }: AvatarProps) {
  const colors = useThemeColors();
  
  if (url) {
    return (
      <Image
        source={url}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View 
      style={[
        styles.fallback, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: colors.brand.light
        }
      ]}
    >
      <Text style={[styles.text, { color: colors.brand.primary, fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Sora-Bold',
  },
});
