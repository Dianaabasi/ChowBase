import React, { useEffect } from 'react';
import { ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useThemeColors } from '../../constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  circle?: boolean;
}

export function Skeleton({ width, height, borderRadius = 8, style, circle }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const finalBorderRadius = circle ? (typeof width === 'number' ? width / 2 : 9999) : borderRadius;

  const baseStyle: ViewStyle = {
    width,
    height,
    borderRadius: finalBorderRadius,
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
  };

  return <Animated.View style={[baseStyle, animatedStyle, style]} />;
}
