import { useColorScheme } from 'react-native';

export const Colors = {
  brand: {
    primary:   '#15803D',
    secondary: '#22C55E',
    light:     '#DCFCE7',
    dark:      '#14532D',
  },
  light: {
    bgPrimary:    '#FFFFFF',
    bgSecondary:  '#F9FAFB',
    bgGlass:      'rgba(255,255,255,0.55)',
    textPrimary:  '#111827',
    textSecondary:'#6B7280',
    textMuted:    '#9CA3AF',
    borderGlass:  'rgba(255,255,255,0.30)',
    borderSubtle: '#E5E7EB',
  },
  dark: {
    bgPrimary:    '#121212',
    bgSecondary:  '#1E1E1E',
    bgGlass:      'rgba(30,30,30,0.60)',
    textPrimary:  '#F9FAFB',
    textSecondary:'#9CA3AF',
    textMuted:    '#6B7280',
    borderGlass:  'rgba(255,255,255,0.10)',
    borderSubtle: '#2A2A2A',
  },
  // Semantic
  error:   '#EF4444',
  warning: '#F59E0B',
  info:    '#3B82F6',
  success: '#22C55E',
};

export function useThemeColors() {
  const scheme = useColorScheme();
  const themeColors = scheme === 'dark' ? Colors.dark : Colors.light;
  return {
    ...themeColors,
    brand: Colors.brand,
    error: Colors.error,
    warning: Colors.warning,
    info: Colors.info,
    success: Colors.success,
  };
}
