import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../constants/theme';

interface NutritionRowProps {
  carbs: number;
  protein: number;
  fat: number;
}

export function NutritionRow({ carbs, protein, fat }: NutritionRowProps) {
  const colors = useThemeColors();

  const total = carbs + protein + fat || 1; // avoid div by zero
  const carbsPct = (carbs / total) * 100;
  const proteinPct = (protein / total) * 100;
  const fatPct = (fat / total) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{carbs}g</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Carbs</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
        <View style={styles.stat}>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{protein}g</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Protein</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
        <View style={styles.stat}>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{fat}g</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Fat</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.barSegment, { width: `${carbsPct}%`, backgroundColor: '#F59E0B' }]} />
        <View style={[styles.barSegment, { width: `${proteinPct}%`, backgroundColor: '#3B82F6' }]} />
        <View style={[styles.barSegment, { width: `${fatPct}%`, backgroundColor: '#EF4444' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  label: {
    fontFamily: 'DM-Sans',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 30,
  },
  barContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  barSegment: {
    height: '100%',
  },
});
