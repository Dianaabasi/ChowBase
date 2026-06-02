import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface HealthScoreBarProps {
  score: number; // 0 to 100
}

export function HealthScoreBar({ score }: HealthScoreBarProps) {
  const colors = useThemeColors();
  
  // Determine color based on score
  let barColor = colors.success;
  let gradientColors: readonly [string, string, ...string[]] = ['#22C55E', '#16A34A'];
  if (score < 40) {
    barColor = colors.error;
    gradientColors = ['#EF4444', '#DC2626'];
  } else if (score < 70) {
    barColor = colors.warning;
    gradientColors = ['#F59E0B', '#D97706'];
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Healthy Score</Text>
        <Text style={[styles.scoreText, { color: barColor }]}>{score}/100</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.borderSubtle }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.min(100, Math.max(0, score))}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
  },
  scoreText: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
