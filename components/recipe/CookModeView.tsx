import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { X, CaretLeft, CaretRight, CheckCircle } from 'phosphor-react-native';
import { Recipe } from '../../types';

const { width } = Dimensions.get('window');

interface CookModeViewProps {
  recipe: Recipe;
  onClose: () => void;
}

function CookModeTimer({ timerSecs }: { timerSecs: number }) {
  const [timeLeft, setTimeLeft] = useState(timerSecs);
  const [isActive, setIsActive] = useState(false);
  const colors = useThemeColors();

  React.useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(timerSecs); };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={[styles.timerContainer, { borderColor: colors.borderSubtle, backgroundColor: colors.bgSecondary }]}>
      <Text style={[styles.timerText, { color: colors.brand.primary }]}>
        {formatTime(timeLeft)}
      </Text>
      <View style={styles.timerActions}>
        <TouchableOpacity onPress={toggleTimer} style={[styles.timerBtn, { backgroundColor: isActive ? colors.error : colors.brand.primary }]}>
          <Text style={styles.timerBtnText}>{isActive ? 'Pause' : 'Start Timer'}</Text>
        </TouchableOpacity>
        {timeLeft < timerSecs && (
          <TouchableOpacity onPress={resetTimer} style={[styles.timerBtn, { backgroundColor: colors.borderSubtle }]}>
            <Text style={[styles.timerBtnText, { color: colors.textPrimary }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function CookModeView({ recipe, onClose }: CookModeViewProps) {
  const colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps = [...(recipe.recipe_steps || [])].sort((a, b) => a.step_number - b.step_number);
  const currentStep = steps[currentIndex];

  const goNext = () => {
    if (currentIndex < steps.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (!steps || steps.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cook Mode</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: colors.textSecondary }}>No steps available for this recipe.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View>
          <Text style={[styles.recipeTitle, { color: colors.textSecondary }]} numberOfLines={1}>{recipe.title}</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Step {currentIndex + 1} of {steps.length}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={[styles.stepIndicatorContainer, { backgroundColor: colors.brand.primary + '20' }]}>
          <Text style={[styles.stepIndicatorText, { color: colors.brand.primary }]}>STEP {currentStep.step_number}</Text>
        </View>

        <Text style={[styles.instruction, { color: colors.textPrimary }]}>
          {currentStep.instruction}
        </Text>

        {currentStep.timer_secs && (
          <CookModeTimer timerSecs={currentStep.timer_secs} />
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.borderSubtle, backgroundColor: colors.bgPrimary }]}>
        <TouchableOpacity 
          style={[styles.navBtn, { opacity: currentIndex === 0 ? 0.3 : 1 }]} 
          onPress={goPrev}
          disabled={currentIndex === 0}
        >
          <CaretLeft size={24} color={colors.textPrimary} />
          <Text style={[styles.navText, { color: colors.textPrimary }]}>Previous</Text>
        </TouchableOpacity>

        {currentIndex === steps.length - 1 ? (
          <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary, { backgroundColor: colors.brand.primary }]} onPress={onClose}>
            <CheckCircle size={24} color="#FFF" weight="fill" />
            <Text style={[styles.navText, { color: '#FFF' }]}>Done!</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary, { backgroundColor: colors.brand.primary }]} onPress={goNext}>
            <Text style={[styles.navText, { color: '#FFF' }]}>Next Step</Text>
            <CaretRight size={24} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  recipeTitle: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 20,
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  stepIndicatorContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  stepIndicatorText: {
    fontFamily: 'Sora-Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  instruction: {
    fontFamily: 'DM-Sans',
    fontSize: 24,
    lineHeight: 36,
  },
  timerContainer: {
    marginTop: 40,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'Sora-Bold',
    fontSize: 48,
    marginBottom: 24,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  timerBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  timerBtnText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  navBtnPrimary: {
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navText: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
  },
});
