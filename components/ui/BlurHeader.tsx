import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { useRouter } from 'expo-router';

interface BlurHeaderProps {
  title?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  hideBack?: boolean;
  titleComponent?: React.ReactNode;
}

export function BlurHeader({ 
  title, 
  onBack, 
  rightComponent, 
  transparent = false,
  hideBack = false,
  titleComponent
}: BlurHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const content = (
    <View style={[styles.content, { paddingTop: insets.top || 16, paddingBottom: 16 }]}>
      <View style={styles.left}>
        {!hideBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <CaretLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.center}>
        {titleComponent ? titleComponent : (
          title && (
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
          )
        )}
      </View>

      <View style={styles.right}>
        {rightComponent}
      </View>
    </View>
  );

  if (transparent) {
    return (
      <View style={[styles.container, styles.transparent]}>
        {content}
      </View>
    );
  }

  return (
    <BlurView 
      intensity={80} 
      tint={colors.bgPrimary === '#FFFFFF' ? 'light' : 'dark'} 
      style={styles.container}
    >
      {content}
      <View style={[styles.borderBottom, { backgroundColor: colors.borderSubtle }]} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
  },
  borderBottom: {
    height: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.5,
  },
});
